import type { JobPost } from './content'

/** Lowercase hyphenated segment for `/careers/:slug` (no spaces, URL-safe). */
export function slugifyCareerPathSegment(raw: string): string {
  let s = String(raw ?? '').trim()
  if (!s) return 'role'
  try {
    s = decodeURIComponent(s.replace(/\+/g, ' '))
  } catch {
    s = s.replace(/\+/g, ' ')
  }
  const normalized = s.normalize('NFKD').replace(/\p{M}+/gu, '')
  const slug = normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .slice(0, 96)
  return slug || 'role'
}

/** Stable slug per job id; disambiguates duplicate titles with `-2`, `-3`, … */
export function buildCareerSlugByJobId(jobs: JobPost[]): Record<string, string> {
  const byId: Record<string, string> = {}
  const baseCount = new Map<string, number>()
  const ordered = [...jobs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  for (const job of ordered) {
    const base = slugifyCareerPathSegment(job.title || job.id)
    const n = (baseCount.get(base) ?? 0) + 1
    baseCount.set(base, n)
    byId[job.id] = n === 1 ? base : `${base}-${n}`
  }
  return byId
}

function decodePathSegment(segment: string): string {
  let s = segment
  try {
    s = decodeURIComponent(s.replace(/\+/g, ' '))
  } catch {
    s = s.replace(/\+/g, ' ')
  }
  return s.trim()
}

/** Resolve a job from the first path segment after `/careers` or `/career` (supports legacy id/title URLs). */
export function resolveJobFromCareerPathSegment(
  segment: string,
  jobs: JobPost[],
  slugByJobId: Record<string, string>,
): JobPost | null {
  if (!segment) return null
  const decoded = decodePathSegment(segment)
  const lower = decoded.toLowerCase()
  const slugLower = slugifyCareerPathSegment(decoded).toLowerCase()

  for (const job of jobs) {
    const slug = slugByJobId[job.id]
    if (slug && slug.toLowerCase() === lower) return job
  }
  for (const job of jobs) {
    if (job.id.toLowerCase() === lower) return job
  }
  for (const job of jobs) {
    const idDecoded = decodePathSegment(job.id).toLowerCase()
    if (idDecoded === lower) return job
  }
  for (const job of jobs) {
    if (slugifyCareerPathSegment(job.id) === slugLower) return job
  }
  for (const job of jobs) {
    if (slugifyCareerPathSegment(job.title) === slugLower) return job
  }
  return null
}

/** SEO `<title>`: `Synergy PM - {title}.` with sensible length clamp. */
export function formatCareerSeoTitle(jobTitle: string, maxLen = 64): string {
  const prefix = 'Synergy PM - '
  const suffix = '.'
  const body = String(jobTitle ?? '').trim() || 'Role'
  let full = `${prefix}${body}${suffix}`
  if (full.length <= maxLen) return full
  const reserved = prefix.length + suffix.length + 1
  const maxBody = Math.max(8, maxLen - reserved)
  const trimmed = body.slice(0, maxBody).trimEnd()
  return `${prefix}${trimmed}…${suffix}`
}
