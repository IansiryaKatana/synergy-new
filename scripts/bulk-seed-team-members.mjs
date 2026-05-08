import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const CSV_PATH = path.resolve(ROOT, process.argv[2] ?? 'team-members-seed-2026-05.csv')
const PHOTOS_DIR = path.resolve(ROOT, process.argv[3] ?? 'team-photos')

function parseDotEnv(content) {
  const entries = {}
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eqIndex = line.indexOf('=')
    if (eqIndex === -1) continue
    const key = line.slice(0, eqIndex).trim()
    let value = line.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    entries[key] = value
  }
  return entries
}

async function loadEnv() {
  const envPath = path.resolve(ROOT, '.env')
  let parsed = {}
  try {
    const raw = await fs.readFile(envPath, 'utf-8')
    parsed = parseDotEnv(raw)
  } catch {
    // keep process.env fallback
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? parsed.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? parsed.VITE_SUPABASE_ANON_KEY
  const bucket = process.env.VITE_SUPABASE_MEDIA_BUCKET ?? parsed.VITE_SUPABASE_MEDIA_BUCKET ?? 'media'

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env or process env.')
  }

  return { supabaseUrl, anonKey, bucket }
}

function parseCsvRows(csv) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i]
    const next = csv[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (!inQuotes && char === ',') {
      row.push(cell)
      cell = ''
      continue
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') i += 1
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      continue
    }

    cell += char
  }

  row.push(cell)
  rows.push(row)
  return rows
}

function csvToObjects(csv) {
  const rows = parseCsvRows(csv).filter((row) => row.some((cell) => String(cell).trim().length > 0))
  if (rows.length < 2) return []
  const headers = rows[0].map((h) => h.trim())
  return rows.slice(1).map((row) => {
    const obj = {}
    headers.forEach((header, i) => {
      obj[header] = row[i] ?? ''
    })
    return obj
  })
}

function toBoolean(value, fallback = true) {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized) return fallback
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true
  if (['false', '0', 'no', 'n'].includes(normalized)) return false
  return fallback
}

function escapeFileName(name) {
  return name
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

async function uploadPhoto({ supabaseUrl, anonKey, bucket, localPath, remotePath }) {
  const fileBuffer = await fs.readFile(localPath)
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURIComponent(remotePath).replace(/%2F/g, '/')}`
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: fileBuffer,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Upload failed for ${path.basename(localPath)} (${response.status}): ${text}`)
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${remotePath}`
}

async function upsertMember({ supabaseUrl, anonKey, member }) {
  const response = await fetch(`${supabaseUrl}/rest/v1/team_members`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(member),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Upsert failed for ${member.name} (${response.status}): ${text}`)
  }
}

async function run() {
  const { supabaseUrl, anonKey, bucket } = await loadEnv()
  const csvRaw = await fs.readFile(CSV_PATH, 'utf-8')
  const rows = csvToObjects(csvRaw)
  if (rows.length === 0) {
    throw new Error(`No data rows found in ${CSV_PATH}`)
  }

  const missingPhotos = []
  const errors = []
  let uploaded = 0
  let upserted = 0

  await fs.access(PHOTOS_DIR)

  for (const row of rows) {
    const name = String(row.name ?? '').trim()
    const role = String(row.role ?? '').trim()
    const photoNameFromCsv = String(row.photo_filename ?? '').trim()
    const defaultPhotoName = `${name} — ${role}.webp`
    const photoFileName = escapeFileName(photoNameFromCsv || defaultPhotoName)
    const localPhotoPath = path.resolve(PHOTOS_DIR, photoFileName)
    const sortOrder = Number.parseInt(String(row.sort_order ?? ''), 10) || 1

    try {
      await fs.access(localPhotoPath)
    } catch {
      missingPhotos.push(photoFileName)
      continue
    }

    try {
      const ext = path.extname(photoFileName) || '.webp'
      const remotePath = `team/${String(row.id).trim()}${ext.toLowerCase()}`
      const avatarUrl = await uploadPhoto({
        supabaseUrl,
        anonKey,
        bucket,
        localPath: localPhotoPath,
        remotePath,
      })
      uploaded += 1

      const payload = {
        id: String(row.id ?? '').trim(),
        initials: String(row.initials ?? '').trim(),
        name,
        role,
        bio: String(row.bio ?? '').trim(),
        email: String(row.email ?? '').trim(),
        number: String(row.number ?? '').trim(),
        avatar_url: avatarUrl,
        sort_order: sortOrder,
        is_active: toBoolean(row.is_active, true),
      }

      await upsertMember({ supabaseUrl, anonKey, member: payload })
      upserted += 1
      console.log(`OK: ${name}`)
    } catch (error) {
      errors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`)
      console.error(`ERROR: ${name}`)
    }
  }

  console.log('\nBulk seed complete.')
  console.log(`CSV rows: ${rows.length}`)
  console.log(`Photos uploaded: ${uploaded}`)
  console.log(`Members upserted: ${upserted}`)
  console.log(`Missing photos: ${missingPhotos.length}`)
  console.log(`Errors: ${errors.length}`)

  if (missingPhotos.length > 0) {
    console.log('\nMissing photo files:')
    for (const item of missingPhotos) console.log(`- ${item}`)
  }

  if (errors.length > 0) {
    console.log('\nErrors:')
    for (const item of errors) console.log(`- ${item}`)
    process.exitCode = 1
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
