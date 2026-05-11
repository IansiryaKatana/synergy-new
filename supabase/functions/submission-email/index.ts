import { createClient } from 'npm:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6.9.16'

type SubmissionType = 'job_application' | 'contact_inquiry'

type JobApplicationPayload = {
  job_id: string
  job_title?: string
  job_department?: string
  notification_email?: string
  full_name: string
  email: string
  phone?: string
  cover_note?: string
  cv_url?: string
}

type ContactInquiryPayload = {
  full_name: string
  email: string
  phone: string
  message: string
}

type SubmissionRequest =
  | { type: 'job_application'; payload: JobApplicationPayload }
  | { type: 'contact_inquiry'; payload: ContactInquiryPayload }

const allowedOrigins = new Set(['https://synergypm.ae', 'https://www.synergypm.ae'])

function isAllowedDevOrigin(origin: string) {
  try {
    const parsed = new URL(origin)
    return parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
  } catch {
    return false
  }
}

function getCorsHeaders(origin: string | null) {
  const resolvedOrigin =
    origin && (allowedOrigins.has(origin) || isAllowedDevOrigin(origin)) ? origin : 'https://synergypm.ae'
  return {
    'Access-Control-Allow-Origin': resolvedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    Vary: 'Origin',
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function baseTemplate(title: string, subtitle: string, content: string) {
  return `
    <div style="background:#f4f6fa;padding:24px;font-family:Arial,sans-serif;">
      <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:10px;padding:24px;border:1px solid #e6e8ee;">
        <h1 style="margin:0 0 8px;font-size:24px;color:#0f172a;">${title}</h1>
        <p style="margin:0 0 24px;color:#475569;line-height:1.5;">${subtitle}</p>
        ${content}
        <hr style="border:none;border-top:1px solid #e6e8ee;margin:28px 0 16px;" />
        <p style="margin:0;color:#64748b;font-size:12px;">Synergy Project Management</p>
      </div>
    </div>
  `
}

function jobApplicantTemplate(payload: JobApplicationPayload, jobTitle: string) {
  return baseTemplate(
    'Application received',
    `Thank you for applying for ${escapeHtml(jobTitle)}. Your application has been received successfully.`,
    `
      <p style="margin:0 0 12px;color:#0f172a;">Dear ${escapeHtml(payload.full_name)},</p>
      <p style="margin:0 0 12px;color:#334155;line-height:1.6;">
        We appreciate your interest in joining our team. Our hiring team will review your profile and contact you on next steps.
      </p>
      <p style="margin:0;color:#334155;line-height:1.6;">
        For any updates, please reply to this email.
      </p>
    `,
  )
}

function jobInternalTemplate(payload: JobApplicationPayload, jobTitle: string, jobDepartment: string) {
  return baseTemplate(
    `New application: ${escapeHtml(jobTitle)}`,
    'A new candidate has submitted a job application.',
    `
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;border:1px solid #e6e8ee;"><strong>Name</strong></td><td style="padding:8px;border:1px solid #e6e8ee;">${escapeHtml(payload.full_name)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e6e8ee;"><strong>Email</strong></td><td style="padding:8px;border:1px solid #e6e8ee;">${escapeHtml(payload.email)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e6e8ee;"><strong>Phone</strong></td><td style="padding:8px;border:1px solid #e6e8ee;">${escapeHtml(payload.phone ?? '-')}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e6e8ee;"><strong>Department</strong></td><td style="padding:8px;border:1px solid #e6e8ee;">${escapeHtml(jobDepartment || '-')}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e6e8ee;"><strong>Role</strong></td><td style="padding:8px;border:1px solid #e6e8ee;">${escapeHtml(jobTitle)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e6e8ee;"><strong>CV URL</strong></td><td style="padding:8px;border:1px solid #e6e8ee;">${payload.cv_url ? `<a href="${escapeHtml(payload.cv_url)}">Open CV</a>` : '-'}</td></tr>
      </table>
      <p style="margin:12px 0 0;color:#334155;white-space:pre-wrap;"><strong>Cover note:</strong><br/>${escapeHtml(payload.cover_note ?? '-')}</p>
    `,
  )
}

function contactApplicantTemplate(payload: ContactInquiryPayload) {
  return baseTemplate(
    'We received your message',
    'Thank you for contacting Synergy Project Management.',
    `
      <p style="margin:0 0 12px;color:#0f172a;">Dear ${escapeHtml(payload.full_name)},</p>
      <p style="margin:0 0 12px;color:#334155;line-height:1.6;">
        Your message was received, and a team member will get back to you as soon as possible.
      </p>
      <p style="margin:0;color:#334155;line-height:1.6;">
        We appreciate your interest in working with us.
      </p>
    `,
  )
}

function contactInternalTemplate(payload: ContactInquiryPayload) {
  return baseTemplate(
    'New contact inquiry received',
    'A visitor submitted the contact form.',
    `
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;border:1px solid #e6e8ee;"><strong>Name</strong></td><td style="padding:8px;border:1px solid #e6e8ee;">${escapeHtml(payload.full_name)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e6e8ee;"><strong>Email</strong></td><td style="padding:8px;border:1px solid #e6e8ee;">${escapeHtml(payload.email)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e6e8ee;"><strong>Phone</strong></td><td style="padding:8px;border:1px solid #e6e8ee;">${escapeHtml(payload.phone)}</td></tr>
      </table>
      <p style="margin:12px 0 0;color:#334155;white-space:pre-wrap;"><strong>Message:</strong><br/>${escapeHtml(payload.message)}</p>
    `,
  )
}

Deno.serve(async (request) => {
  const corsHeaders = getCorsHeaders(request.headers.get('origin'))
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase service environment variables.')

    const submission = (await request.json()) as SubmissionRequest
    const client = createClient(supabaseUrl, serviceRoleKey)

    const { data: smtpRow } = await client
      .from('smtp_config')
      .select('smtp_host,smtp_port,smtp_user,smtp_pass,smtp_from')
      .eq('id', 'default')
      .maybeSingle()

    const smtpHost = smtpRow?.smtp_host?.trim() || Deno.env.get('RACKSPACE_SMTP_HOST')
    const smtpPort = Number(smtpRow?.smtp_port ?? Deno.env.get('RACKSPACE_SMTP_PORT') ?? '587')
    const smtpUser = smtpRow?.smtp_user?.trim() || Deno.env.get('RACKSPACE_SMTP_USER')
    const smtpPass = smtpRow?.smtp_pass?.trim() || Deno.env.get('RACKSPACE_SMTP_PASS')
    const senderFrom = smtpRow?.smtp_from?.trim() || Deno.env.get('RACKSPACE_SMTP_FROM') || smtpUser
    if (!smtpHost || !smtpUser || !smtpPass || !senderFrom) throw new Error('SMTP config is incomplete.')

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    const { data: brandingRow } = await client
      .from('branding_content')
      .select('company_name,footer_email')
      .eq('id', 'default')
      .maybeSingle()

    const companyName = brandingRow?.company_name || 'Synergy Project Management'
    const brandingRecipientEmail = brandingRow?.footer_email || smtpUser

    if (submission.type === 'job_application') {
      const payload = submission.payload
      const { data: jobRow } = await client
        .from('job_posts')
        .select('title,department,notification_email')
        .eq('id', payload.job_id)
        .maybeSingle()

      const jobTitle = payload.job_title || jobRow?.title || 'this role'
      const jobDepartment = payload.job_department || jobRow?.department || ''
      const internalRecipient =
        payload.notification_email || jobRow?.notification_email || brandingRecipientEmail || smtpUser

      await Promise.all([
        transporter.sendMail({
          from: senderFrom,
          to: payload.email,
          subject: `Application received - ${jobTitle}`,
          html: jobApplicantTemplate(payload, jobTitle),
          replyTo: internalRecipient,
        }),
        transporter.sendMail({
          from: senderFrom,
          to: internalRecipient,
          subject: `New applicant receipt - ${jobTitle}`,
          html: jobInternalTemplate(payload, jobTitle, jobDepartment),
          replyTo: payload.email,
        }),
      ])
    } else if (submission.type === 'contact_inquiry') {
      const payload = submission.payload
      await Promise.all([
        transporter.sendMail({
          from: senderFrom,
          to: payload.email,
          subject: `${companyName} - We received your message`,
          html: contactApplicantTemplate(payload),
          replyTo: brandingRecipientEmail,
        }),
        transporter.sendMail({
          from: senderFrom,
          to: brandingRecipientEmail,
          subject: `New contact message receipt - ${payload.full_name}`,
          html: contactInternalTemplate(payload),
          replyTo: payload.email,
        }),
      ])
    } else {
      throw new Error('Unsupported submission type.')
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown function error.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
