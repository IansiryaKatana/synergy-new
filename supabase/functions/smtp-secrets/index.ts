import { createClient } from 'npm:@supabase/supabase-js@2'

type SmtpSavePayload = {
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_pass?: string
  smtp_from: string
}

const allowedOrigins = new Set([
  'https://synergypm.ae',
  'https://www.synergypm.ae',
  'http://localhost:5173',
])

function getCorsHeaders(origin: string | null) {
  const resolvedOrigin = origin && allowedOrigins.has(origin) ? origin : 'https://synergypm.ae'
  return {
    'Access-Control-Allow-Origin': resolvedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    Vary: 'Origin',
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const candidate = error as {
      message?: unknown
      error?: unknown
      details?: unknown
      hint?: unknown
      code?: unknown
    }
    const parts = [candidate.code, candidate.message ?? candidate.error, candidate.details, candidate.hint]
      .filter((item) => typeof item === 'string' && item.trim().length > 0)
      .map((item) => String(item).trim())
    if (parts.length > 0) return parts.join(' | ')
  }
  return 'Unknown error'
}

Deno.serve(async (request) => {
  const corsHeaders = getCorsHeaders(request.headers.get('origin'))
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase service role environment variables.')
    }
    const client = createClient(supabaseUrl, serviceRoleKey)
    const body = (await request.json()) as { action?: string; payload?: SmtpSavePayload }
    const action = body.action

    if (action === 'get') {
      const { data, error } = await client
        .from('smtp_config')
        .select('smtp_host,smtp_port,smtp_user,smtp_from,smtp_pass')
        .eq('id', 'default')
        .maybeSingle()
      if (error) throw error
      const safe = {
        smtp_host: data?.smtp_host ?? '',
        smtp_port: data?.smtp_port ?? 587,
        smtp_user: data?.smtp_user ?? '',
        smtp_from: data?.smtp_from ?? '',
        has_password: Boolean(data?.smtp_pass),
      }
      return new Response(JSON.stringify({ ok: true, data: safe }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'save') {
      if (!body.payload) throw new Error('Missing payload.')
      const payload = body.payload
      const nextPort = Number(payload.smtp_port)
      if (!Number.isFinite(nextPort) || nextPort <= 0) {
        throw new Error('SMTP port must be a valid positive number.')
      }
      const { data: existing, error: existingError } = await client
        .from('smtp_config')
        .select('smtp_pass')
        .eq('id', 'default')
        .maybeSingle()
      if (existingError) throw existingError

      const nextPass = payload.smtp_pass && payload.smtp_pass.trim() ? payload.smtp_pass.trim() : existing?.smtp_pass ?? ''
      const { error } = await client
        .from('smtp_config')
        .upsert(
          {
            id: 'default',
            smtp_host: payload.smtp_host.trim(),
            smtp_port: Math.trunc(nextPort),
            smtp_user: payload.smtp_user.trim(),
            smtp_pass: nextPass,
            smtp_from: payload.smtp_from.trim(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        )
      if (error) throw error
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Unsupported action.')
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: errorMessage(error),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
