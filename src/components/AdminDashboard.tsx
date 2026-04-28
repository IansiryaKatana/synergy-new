import { useEffect, useMemo, useRef, useState, type Dispatch, type MouseEvent, type SetStateAction } from 'react'
import {
  Briefcase,
  ChartNoAxesColumn,
  GalleryVerticalEnd,
  Globe,
  LayoutGrid,
  Menu,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  contentApi,
  type BrandingContent,
  type InsightItem,
  type JobPost,
  type MediaItem,
  type ServiceItem,
  type SmtpSettings,
  type TeamMember,
} from '../lib/content'

type EntityType = 'team_members' | 'services' | 'insights' | 'media_items' | 'job_posts'

type AdminProps = {
  page: AdminPage
  branding: BrandingContent
  team: TeamMember[]
  services: ServiceItem[]
  insights: InsightItem[]
  media: MediaItem[]
  jobs: JobPost[]
  onRefresh: () => Promise<void>
}

export type AdminPage = 'dashboard' | 'branding' | 'smtp' | 'team' | 'services' | 'insights' | 'media' | 'careers'

type SidebarItem = {
  id: AdminPage
  label: string
  href: string
  icon: LucideIcon
}

type BrandingTab = 'identity' | 'hero' | 'sections' | 'footer' | 'media'

const PAGE_TO_ENTITY: Partial<Record<AdminPage, EntityType>> = {
  team: 'team_members',
  services: 'services',
  insights: 'insights',
  media: 'media_items',
  careers: 'job_posts',
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/backend', icon: LayoutGrid },
  { id: 'branding', label: 'Branding', href: '/backend/branding', icon: Palette },
  { id: 'smtp', label: 'SMTP Secrets', href: '/backend/smtp', icon: Globe },
  { id: 'team', label: 'Team', href: '/backend/team', icon: Users },
  { id: 'services', label: 'Services', href: '/backend/services', icon: Briefcase },
  { id: 'insights', label: 'Projects', href: '/backend/insights', icon: ChartNoAxesColumn },
  { id: 'careers', label: 'Careers', href: '/backend/careers', icon: Briefcase },
  { id: 'media', label: 'Media', href: '/backend/media', icon: GalleryVerticalEnd },
]

const BRANDING_FIELD_GROUPS: Array<{ id: BrandingTab; label: string; fields: string[] }> = [
  { id: 'identity', label: 'Identity', fields: ['id', 'company_name', 'logo_url', 'favicon_url'] },
  { id: 'hero', label: 'Hero', fields: ['hero_eyebrow', 'hero_title', 'hero_subtitle', 'homepage_hero_video_url'] },
  {
    id: 'sections',
    label: 'Sections',
    fields: ['services_title', 'services_description', 'team_title', 'insights_title', 'insights_description'],
  },
  {
    id: 'footer',
    label: 'Footer',
    fields: ['footer_address', 'footer_newsletter_title', 'footer_pitch', 'footer_wordmark', 'footer_email'],
  },
  {
    id: 'media',
    label: 'Backgrounds',
    fields: ['homepage_team_background_url', 'services_hero_background_url', 'about_hero_background_url', 'contact_hero_background_url'],
  },
]

const BRANDING_MEDIA_FIELDS = new Set([
  'logo_url',
  'favicon_url',
  'homepage_hero_video_url',
  'homepage_team_background_url',
  'services_hero_background_url',
  'about_hero_background_url',
  'contact_hero_background_url',
])

const JOB_FIELD_OPTIONS: Record<string, string[]> = {
  department: ['Finance', 'Compliance', 'Human Resources', 'Operations', 'Project Management'],
  employment_type: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'],
  location_label: ['Dubai, UAE', 'Abu Dhabi, UAE', 'Remote - UAE', 'London, UK', 'Remote - UK'],
  workplace_type: ['On-site', 'Hybrid', 'Remote'],
}

const RECORD_UPLOAD_FIELDS: Record<EntityType, string[]> = {
  team_members: ['avatar_url'],
  services: ['image_url'],
  insights: ['image_url'],
  job_posts: [],
  media_items: ['value', 'file_url'],
}

const ENTITY_EDITOR_LABELS: Record<EntityType, string> = {
  team_members: 'Team Member',
  services: 'Service',
  insights: 'Project',
  job_posts: 'Job Post',
  media_items: 'Media Item',
}

export function AdminDashboard(props: AdminProps) {
  const mainScrollRef = useRef<HTMLElement | null>(null)
  const [entity, setEntity] = useState<EntityType>(PAGE_TO_ENTITY[props.page] ?? 'team_members')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [mediaSheetOpen, setMediaSheetOpen] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<Array<{ path: string; publicUrl: string }>>([])
  const [targetUploadField, setTargetUploadField] = useState('')
  const [uploadTargetScope, setUploadTargetScope] = useState<'record' | 'branding'>('record')
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null)
  const [pendingUploadPreviewUrl, setPendingUploadPreviewUrl] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedMediaUrl, setSelectedMediaUrl] = useState('')
  const [mediaSheetTab, setMediaSheetTab] = useState<'upload' | 'library'>('library')
  const [actionRow, setActionRow] = useState<any | null>(null)
  const [detailRow, setDetailRow] = useState<any | null>(null)
  const [mediaView, setMediaView] = useState<'table' | 'grid'>('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [formValues, setFormValues] = useState<Record<string, unknown>>({})
  const [serviceEditorTab, setServiceEditorTab] = useState<'general' | 'details'>('general')
  const [brandingForm, setBrandingForm] = useState<Record<string, string | number | boolean>>(
    props.branding as unknown as Record<string, string | number | boolean>,
  )
  const [brandingTab, setBrandingTab] = useState<BrandingTab>('identity')
  const [smtpForm, setSmtpForm] = useState<SmtpSettings>({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_from: '',
    smtp_pass: '',
    has_password: false,
  })
  const [smtpStatus, setSmtpStatus] = useState('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const rows = useMemo(() => {
    if (entity === 'team_members') return props.team
    if (entity === 'services') return props.services
    if (entity === 'insights') return props.insights
    if (entity === 'job_posts') return props.jobs
    return props.media
  }, [entity, props])
  const currentPageLabel = useMemo(
    () => SIDEBAR_ITEMS.find((item) => item.id === props.page)?.label ?? 'Dashboard',
    [props.page],
  )
  const activeBrandingFields = useMemo(
    () => BRANDING_FIELD_GROUPS.find((group) => group.id === brandingTab)?.fields ?? BRANDING_FIELD_GROUPS[0].fields,
    [brandingTab],
  )
  const editorHeading = useMemo(() => {
    const hasId = Boolean(String(formValues.id ?? '').trim())
    const noun = ENTITY_EDITOR_LABELS[entity] ?? 'Record'
    return hasId ? `Edit ${noun}` : `Create ${noun}`
  }, [entity, formValues.id])

  const perPage = useMemo(() => {
    if (entity === 'media_items') return mediaView === 'grid' ? 20 : 12
    return 12
  }, [entity, mediaView])

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage))
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * perPage
    return rows.slice(start, start + perPage)
  }, [rows, currentPage, perPage])

  useEffect(() => {
    setEntity(PAGE_TO_ENTITY[props.page] ?? 'team_members')
    setSelectedIds([])
    setDetailRow(null)
    if (props.page === 'media') setMediaView('grid')
    setIsMobileSidebarOpen(false)
  }, [props.page])

  useEffect(() => {
    setCurrentPage(1)
  }, [entity, mediaView, rows.length])

  useEffect(() => {
    const onScroll = () => {
      const container = mainScrollRef.current
      if (!container) {
        setScrollProgress(0)
        return
      }
      const max = Math.max(1, container.scrollHeight - container.clientHeight)
      const progress = Math.min(1, Math.max(0, container.scrollTop / max))
      setScrollProgress(progress)
    }
    onScroll()
    const container = mainScrollRef.current
    container?.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      container?.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [props.page])

  const toggle = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    )

  const allSelected = pagedRows.length > 0 && pagedRows.every((x: any) => selectedIds.includes(x.id))
  const toggleAll = () =>
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !pagedRows.some((row: any) => row.id === id))
        : [...new Set([...current, ...pagedRows.map((x: any) => x.id)])],
    )

  const openCreate = () => {
    if (entity === 'media_items') {
      setUploadTargetScope('record')
      setTargetUploadField('file_url')
      setMediaSheetTab('upload')
      setMediaSheetOpen(true)
      return
    }
    setFormValues(defaultForm(entity))
    if (entity === 'services') setServiceEditorTab('general')
    setEditorOpen(true)
  }

  const openEdit = (row: any) => {
    if (entity === 'services') {
      const existingSections = sanitizeDetailSections(row.detail_sections)
      setFormValues({
        ...row,
        detail_sections: existingSections.length > 0 ? existingSections : getDefaultServiceDetailSections(row),
      })
      setServiceEditorTab('general')
      setEditorOpen(true)
      return
    }
    setFormValues({ ...row })
    setEditorOpen(true)
  }

  const openRowEdit = (event: MouseEvent<HTMLTableRowElement>, row: any) => {
    const target = event.target as HTMLElement | null
    if (target?.closest('button, input, a, label')) return
    openEdit(row)
  }

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return
    setSaving(true)
    let error: string | null = null
    try {
      await contentApi.bulkDelete(entity, selectedIds)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unable to delete rows.'
    }
    setSaving(false)
    setStatus(error ?? `Deleted ${selectedIds.length} row(s).`)
    setSelectedIds([])
    await props.onRefresh()
  }

  const deleteSingle = async (id: string) => {
    setSaving(true)
    let error: string | null = null
    try {
      await contentApi.bulkDelete(entity, [id])
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unable to delete row.'
    }
    setSaving(false)
    setStatus(error ?? 'Record deleted.')
    setSelectedIds((current) => current.filter((item) => item !== id))
    await props.onRefresh()
  }

  const bulkSetActive = async (isActive: boolean) => {
    if (selectedIds.length === 0) return
    setSaving(true)
    let error: string | null = null
    try {
      await contentApi.bulkSetActive(entity, selectedIds, isActive)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unable to update rows.'
    }
    setSaving(false)
    setStatus(error ?? `Updated ${selectedIds.length} row(s).`)
    await props.onRefresh()
  }

  const saveRow = async () => {
    setSaving(true)
    const payload = normalizePayload(entity, formValues)
    if (!String(payload.id ?? '').trim()) {
      payload.id = buildRecordId(entity, payload)
    }
    const validation = validatePayload(entity, payload)
    if (validation) {
      setSaving(false)
      setStatus(validation)
      return
    }
    let error: string | null = null
    try {
      await contentApi.upsertRow(entity, payload)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unable to save row.'
    }
    setSaving(false)
    setStatus(error ?? 'Row saved.')
    setEditorOpen(false)
    await props.onRefresh()
  }

  const refreshMedia = async () => {
    try {
      setMediaFiles(await contentApi.listMediaFiles())
    } catch {
      setStatus('Unable to fetch media files. Check storage bucket permissions.')
    }
  }

  useEffect(() => {
    if (mediaSheetOpen) void refreshMedia()
  }, [mediaSheetOpen])

  useEffect(() => {
    return () => {
      if (pendingUploadPreviewUrl) URL.revokeObjectURL(pendingUploadPreviewUrl)
    }
  }, [pendingUploadPreviewUrl])

  useEffect(() => {
    setBrandingForm(props.branding as unknown as Record<string, string | number | boolean>)
  }, [props.branding])

  useEffect(() => {
    const loadSmtp = async () => {
      if (props.page !== 'smtp') return
      try {
        const next = await contentApi.getSmtpSettings()
        setSmtpForm({
          smtp_host: next.smtp_host ?? '',
          smtp_port: Number(next.smtp_port ?? 587),
          smtp_user: next.smtp_user ?? '',
          smtp_from: next.smtp_from ?? '',
          smtp_pass: '',
          has_password: Boolean(next.has_password),
        })
        setSmtpStatus('')
      } catch (err) {
        setSmtpStatus(err instanceof Error ? err.message : 'Failed to load SMTP settings.')
      }
    }
    void loadSmtp()
  }, [props.page])

  useEffect(() => {
    if (!isMobileSidebarOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileSidebarOpen])

  const pickMedia = (url: string) => {
    setSelectedMediaUrl(url)
  }

  const applySelectedMedia = () => {
    if (!selectedMediaUrl) return
    if (uploadTargetScope === 'branding') {
      setBrandingForm((prev) => ({ ...prev, [targetUploadField]: selectedMediaUrl }))
    } else {
      setFormValues((prev) => ({ ...prev, [targetUploadField]: selectedMediaUrl }))
    }
    setSelectedMediaUrl('')
    setMediaSheetOpen(false)
  }

  const uploadMedia = async (file: File) => {
    setSaving(true)
    setUploadProgress(0)
    try {
      const uploaded = await contentApi.uploadMedia(file, 'admin', (percent) => setUploadProgress(percent))
      setStatus('Media uploaded.')
      const mediaPayload = {
        id: `asset-${Date.now()}`,
        kind: 'asset',
        label: file.name,
        value: uploaded.publicUrl,
        file_path: uploaded.path,
        file_url: uploaded.publicUrl,
        sort_order: Math.floor(Date.now() / 1000),
        is_active: true,
      }
      await contentApi.upsertRow('media_items', mediaPayload)
      if (targetUploadField && uploadTargetScope === 'branding') {
        setBrandingForm((prev) => ({ ...prev, [targetUploadField]: uploaded.publicUrl }))
      }
      if (targetUploadField && uploadTargetScope === 'record') {
        setFormValues((prev) => ({ ...prev, [targetUploadField]: uploaded.publicUrl }))
      }
      await refreshMedia()
      await props.onRefresh()
      setPendingUploadFile(null)
      setPendingUploadPreviewUrl('')
      setUploadProgress(0)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Upload failed.')
    }
    setSaving(false)
  }

  const saveBranding = async () => {
    setSaving(true)
    try {
      await contentApi.upsertRow('branding_content', brandingForm)
      setStatus('Branding content saved.')
      await props.onRefresh()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to save branding.')
    }
    setSaving(false)
  }

  const saveSmtp = async () => {
    setSaving(true)
    try {
      await contentApi.saveSmtpSettings({
        smtp_host: String(smtpForm.smtp_host ?? '').trim(),
        smtp_port: Number(smtpForm.smtp_port ?? 587),
        smtp_user: String(smtpForm.smtp_user ?? '').trim(),
        smtp_from: String(smtpForm.smtp_from ?? '').trim(),
        smtp_pass: String(smtpForm.smtp_pass ?? '').trim(),
      })
      setSmtpForm((prev) => ({ ...prev, smtp_pass: '', has_password: true }))
      setSmtpStatus('SMTP settings saved.')
    } catch (err) {
      setSmtpStatus(err instanceof Error ? err.message : 'Failed to save SMTP settings.')
    }
    setSaving(false)
  }

  return (
    <main className="admin-page">
      <div
        className={`admin-sidebar-overlay ${isMobileSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />
      <div className="admin-shell">
        <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileSidebarOpen ? 'open' : ''}`}>
          <div className="admin-sidebar-head">
            <div className="admin-sidebar-head-block" aria-hidden="true" />
          </div>
          <nav className="admin-sidebar-nav" aria-label="Admin navigation">
            {SIDEBAR_ITEMS.map((item) => (
              <a key={item.id} className={props.page === item.id ? 'active' : ''} href={item.href}>
                <span className="admin-nav-icon" aria-hidden="true">
                  <item.icon strokeWidth={1.15} />
                </span>
                <span className="admin-sidebar-label">{item.label}</span>
              </a>
            ))}
          </nav>
          <a className="admin-back-link" href="/" aria-label="Back to website">
            <span className="admin-nav-icon" aria-hidden="true">
              <Globe strokeWidth={1.2} />
            </span>
            <span className="admin-sidebar-label">Back to website</span>
          </a>
        </aside>

        <section ref={mainScrollRef} className="admin-main">
        <header className="admin-head">
          <div className="admin-mobile-topbar">
            <a className="admin-mobile-brand" href="/backend">
              <span className="admin-nav-icon" aria-hidden="true">
                <LayoutGrid strokeWidth={1.2} />
              </span>
              <span>ManageOn</span>
            </a>
            <button
              type="button"
              className="admin-mobile-sidebar-btn"
              aria-label={isMobileSidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileSidebarOpen}
              onClick={() => setIsMobileSidebarOpen((current) => !current)}
            >
              {isMobileSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
          <div className="admin-head-top">
            <div className="admin-head-title-row">
              <button
                type="button"
                className="admin-head-collapse-btn"
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                onClick={() => setIsSidebarCollapsed((current) => !current)}
              >
                {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
              <p>{currentPageLabel}</p>
            </div>
            <div className="admin-head-right">
              <a className="admin-web-link" href="/" aria-label="Back to website">
                <Globe strokeWidth={1.45} />
              </a>
              <span className="admin-user-placeholder">Logged in user</span>
            </div>
          </div>
          <div className="admin-scroll-progress" aria-hidden="true">
            <span style={{ width: `${scrollProgress * 100}%` }} />
          </div>
        </header>

        {props.page === 'dashboard' ? (
          <section className="admin-dashboard-grid">
            <article><p>Team</p><strong>{props.team.length}</strong><a href="/backend/team">Manage</a></article>
            <article><p>Services</p><strong>{props.services.length}</strong><a href="/backend/services">Manage</a></article>
            <article><p>Projects</p><strong>{props.insights.length}</strong><a href="/backend/insights">Manage</a></article>
            <article><p>Careers</p><strong>{props.jobs.length}</strong><a href="/backend/careers">Manage</a></article>
            <article><p>Media</p><strong>{props.media.length}</strong><a href="/backend/media">Manage</a></article>
          </section>
        ) : null}

        {props.page === 'branding' ? (
          <section className="admin-branding">
            <div className="admin-tabs admin-branding-tabs">
              {BRANDING_FIELD_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={brandingTab === group.id ? 'active' : ''}
                  onClick={() => setBrandingTab(group.id)}
                >
                  {group.label}
                </button>
              ))}
            </div>
            <div className="admin-form-grid">
              {activeBrandingFields.map((field) => (
                <label key={field}>
                  {formatFieldLabel(field)}
                  <div className="admin-field-with-browse">
                    <input
                      value={String(brandingForm[field] ?? '')}
                      onChange={(event) =>
                        setBrandingForm((prev) => ({ ...prev, [field]: event.target.value }))
                      }
                    />
                    {BRANDING_MEDIA_FIELDS.has(field) ? (
                      <div className="admin-upload-actions-inline">
                        <label className="admin-inline-upload" title="Upload file">
                          <input
                            type="file"
                            accept={field === 'homepage_hero_video_url' ? 'image/*,video/*' : 'image/*'}
                            onChange={(event) => {
                              const file = event.target.files?.[0]
                              if (!file) return
                              const reader = new FileReader()
                              reader.onload = () => {
                                const result = String(reader.result ?? '')
                                if (result) setBrandingForm((prev) => ({ ...prev, [field]: result }))
                              }
                              reader.readAsDataURL(file)
                              event.currentTarget.value = ''
                            }}
                          />
                          <span aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          </span>
                        </label>
                        <button
                          type="button"
                          className="admin-browse-icon"
                          onClick={() => {
                            setUploadTargetScope('branding')
                            setTargetUploadField(field)
                            setMediaSheetTab('library')
                            setMediaSheetOpen(true)
                          }}
                          title="Browse media library"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 7.5h16M4 12h16M4 16.5h16" />
                          </svg>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </label>
              ))}
              <button className="admin-btn admin-btn-primary" disabled={saving} onClick={saveBranding}>Save Branding</button>
            </div>
          </section>
        ) : null}

        {props.page === 'smtp' ? (
          <section className="admin-branding">
            <div className="admin-form-grid">
              <label>
                {formatFieldLabel('smtp_host')}
                <input
                  value={String(smtpForm.smtp_host ?? '')}
                  onChange={(event) => setSmtpForm((prev) => ({ ...prev, smtp_host: event.target.value }))}
                  placeholder="secure.emailsrvr.com"
                />
              </label>
              <label>
                {formatFieldLabel('smtp_port')}
                <input
                  type="number"
                  value={Number(smtpForm.smtp_port ?? 587)}
                  onChange={(event) =>
                    setSmtpForm((prev) => ({ ...prev, smtp_port: Number(event.target.value || 587) }))
                  }
                />
              </label>
              <label>
                {formatFieldLabel('smtp_user')}
                <input
                  value={String(smtpForm.smtp_user ?? '')}
                  onChange={(event) => setSmtpForm((prev) => ({ ...prev, smtp_user: event.target.value }))}
                  placeholder="careers@yourdomain.com"
                />
              </label>
              <label>
                {formatFieldLabel('smtp_from')}
                <input
                  value={String(smtpForm.smtp_from ?? '')}
                  onChange={(event) => setSmtpForm((prev) => ({ ...prev, smtp_from: event.target.value }))}
                  placeholder="careers@yourdomain.com"
                />
              </label>
              <label>
                {formatFieldLabel('smtp_pass')}
                <input
                  type="password"
                  value={String(smtpForm.smtp_pass ?? '')}
                  onChange={(event) => setSmtpForm((prev) => ({ ...prev, smtp_pass: event.target.value }))}
                  placeholder={smtpForm.has_password ? 'Saved (leave blank to keep unchanged)' : 'Enter SMTP password'}
                />
              </label>
              <button className="admin-btn admin-btn-primary" disabled={saving} onClick={saveSmtp}>
                Save SMTP Settings
              </button>
              {smtpStatus ? <p className="admin-status">{smtpStatus}</p> : null}
            </div>
          </section>
        ) : null}

        {props.page !== 'dashboard' && props.page !== 'branding' && props.page !== 'smtp' ? (
          <>
            <section className="admin-controls">
              <div className="admin-controls-top">
                <div className="admin-actions admin-actions-primary">
                  <button className="admin-btn admin-btn-primary" disabled={saving} onClick={openCreate}>Create New</button>
                  <button className="admin-btn" disabled={saving || selectedIds.length === 0} onClick={() => bulkSetActive(true)}>Bulk activate</button>
                  <button className="admin-btn" disabled={saving || selectedIds.length === 0} onClick={() => bulkSetActive(false)}>Bulk deactivate</button>
                  <button className="admin-btn admin-btn-danger" disabled={saving || selectedIds.length === 0} onClick={bulkDelete}>Bulk delete</button>
                </div>
                {props.page === 'media' ? (
                  <div className="admin-actions admin-actions-secondary">
                    <button className={`admin-btn ${mediaView === 'table' ? 'admin-btn-primary' : ''}`} onClick={() => setMediaView('table')}>
                      Table view
                    </button>
                    <button className={`admin-btn ${mediaView === 'grid' ? 'admin-btn-primary' : ''}`} onClick={() => setMediaView('grid')}>
                      Grid view
                    </button>
                  </div>
                ) : null}
              </div>
              {status ? <p className="admin-status">{status}</p> : null}
            </section>
            {props.page === 'media' && mediaView === 'grid' ? (
              <section className="admin-media-grid-page">
                {pagedRows.map((row: any) => (
                  <button
                    className="admin-media-card admin-media-card-simple"
                    key={row.id}
                    onClick={() => setDetailRow(row)}
                  >
                    <div className="admin-media-card-preview">
                      {typeof row.value === 'string' && row.value.startsWith('http') ? (
                        <img src={row.value} alt={row.label ?? row.id} />
                      ) : (
                        <span>{row.label ?? row.id}</span>
                      )}
                    </div>
                  </button>
                ))}
              </section>
            ) : (
              <section className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
                      {props.page === 'team' || props.page === 'insights' ? <th>Image</th> : null}
                      <th>ID</th>
                      <th>Label</th>
                      <th>Order</th>
                      <th>Active</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.map((row: any) => (
                      <tr key={row.id} onClick={(event) => openRowEdit(event, row)}>
                        <td><input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggle(row.id)} /></td>
                        {props.page === 'team' || props.page === 'insights' ? (
                          <td>
                            <span className="admin-team-preview-avatar">
                              {(row.avatar_url || row.image_url) ? (
                                <img src={row.avatar_url ?? row.image_url} alt={row.name ?? row.title ?? row.id} />
                              ) : (
                                (row.initials ?? 'NA')
                              )}
                            </span>
                          </td>
                        ) : null}
                        <td>{row.id}</td>
                        <td>{row.name ?? row.title ?? row.label}</td>
                        <td>{row.sort_order}</td>
                        <td>{row.is_active ? 'Yes' : 'No'}</td>
                        <td><button className="admin-btn" onClick={() => setActionRow(row)}>Actions</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
            {rows.length > perPage ? (
              <div className="admin-pagination">
                <button
                  className="admin-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="admin-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        ) : null}
        </section>
      </div>

      <div className={`admin-editor-overlay ${editorOpen ? 'open' : ''}`} onClick={() => setEditorOpen(false)} />
      <section className={`admin-editor-sheet ${editorOpen ? 'open' : ''}`}>
        <div className="admin-editor-head">
          <h3>{editorHeading}</h3>
          <button onClick={() => setEditorOpen(false)}>Close</button>
        </div>
        <div className="admin-editor-body">
          {entity === 'services' ? (
            <>
              <div className="admin-service-editor-tabs">
                <button
                  type="button"
                  className={`admin-btn ${serviceEditorTab === 'general' ? 'admin-btn-primary' : ''}`}
                  onClick={() => setServiceEditorTab('general')}
                >
                  General
                </button>
                <button
                  type="button"
                  className={`admin-btn ${serviceEditorTab === 'details' ? 'admin-btn-primary' : ''}`}
                  onClick={() => setServiceEditorTab('details')}
                >
                  Details
                </button>
              </div>
              {serviceEditorTab === 'general'
                ? renderFields(entity, formValues, setFormValues, (field) => {
                    setUploadTargetScope('record')
                    setTargetUploadField(field)
                    setMediaSheetTab('library')
                    setMediaSheetOpen(true)
                  })
                : renderServiceDetailsEditor(formValues, setFormValues)}
            </>
          ) : (
            renderFields(entity, formValues, setFormValues, (field) => {
              setUploadTargetScope('record')
              setTargetUploadField(field)
              setMediaSheetTab('library')
              setMediaSheetOpen(true)
            })
          )}
        </div>
        <div className="admin-editor-foot">
          <button className="admin-save-btn" disabled={saving} onClick={saveRow}>
            Save
          </button>
        </div>
      </section>

      <div className={`admin-editor-overlay ${mediaSheetOpen ? 'open' : ''}`} onClick={() => setMediaSheetOpen(false)} />
      <section className={`admin-media-sheet ${mediaSheetOpen ? 'open' : ''}`}>
        <div className="admin-editor-head">
          <h3>Media Library</h3>
          <button onClick={() => setMediaSheetOpen(false)}>Close</button>
        </div>
        <div className="admin-media-tabs">
          <button
            className={`admin-btn ${mediaSheetTab === 'upload' ? 'admin-btn-primary' : ''}`}
            onClick={() => setMediaSheetTab('upload')}
          >
            Upload
          </button>
          <button
            className={`admin-btn ${mediaSheetTab === 'library' ? 'admin-btn-primary' : ''}`}
            onClick={() => setMediaSheetTab('library')}
          >
            Library
          </button>
        </div>
        {mediaSheetTab === 'upload' ? (
          <>
            <label className="admin-upload">
              Upload file
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  setPendingUploadFile(file ?? null)
                  setUploadProgress(0)
                  if (file) {
                    setPendingUploadPreviewUrl(URL.createObjectURL(file))
                  } else {
                    setPendingUploadPreviewUrl('')
                  }
                }}
              />
            </label>
            <div className="admin-media-upload-actions">
              <span>{pendingUploadFile ? pendingUploadFile.name : 'No file selected'}</span>
              <button
                className="admin-btn admin-btn-primary"
                disabled={!pendingUploadFile || saving}
                onClick={() => {
                  if (pendingUploadFile) void uploadMedia(pendingUploadFile)
                }}
              >
                Upload selected file
              </button>
            </div>
            {pendingUploadFile ? (
              <div className="admin-upload-preview-sheet">
                <p>Ready to upload: {pendingUploadFile.name}</p>
                {pendingUploadPreviewUrl ? <img src={pendingUploadPreviewUrl} alt={pendingUploadFile.name} /> : null}
                <div className="admin-upload-progress">
                  <div className="admin-upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                </div>
                <small>{saving ? `Uploading... ${uploadProgress}%` : `${uploadProgress}%`}</small>
              </div>
            ) : null}
          </>
        ) : null}
        {targetUploadField ? (
          <p className="admin-upload-target">
            Target field: <strong>{formatFieldLabel(targetUploadField)}</strong>
          </p>
        ) : null}
        {mediaSheetTab === 'library' ? (
          <div className="admin-media-grid">
            {mediaFiles.map((item) => (
              <button
                key={item.path}
                className={`admin-media-item ${selectedMediaUrl === item.publicUrl ? 'selected' : ''}`}
                onClick={() => pickMedia(item.publicUrl)}
              >
                <img src={item.publicUrl} alt={item.path} />
                <span>{item.path}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="admin-editor-foot">
          <button className="admin-btn" onClick={() => setMediaSheetOpen(false)}>Cancel</button>
          <button
            className="admin-btn admin-btn-primary"
            disabled={!selectedMediaUrl}
            onClick={applySelectedMedia}
          >
            Use selected media
          </button>
        </div>
      </section>

      <div className={`admin-editor-overlay ${actionRow ? 'open' : ''}`} onClick={() => setActionRow(null)} />
      <section className={`admin-action-sheet ${actionRow ? 'open' : ''}`}>
        <div className="admin-editor-head">
          <h3>Record actions</h3>
          <button onClick={() => setActionRow(null)}>Close</button>
        </div>
        <div className="admin-action-list">
          <button
            className="admin-btn"
            onClick={() => {
              if (!actionRow) return
              openEdit(actionRow)
              setActionRow(null)
            }}
          >
            Edit record
          </button>
          <button
            className="admin-btn admin-btn-danger"
            disabled={saving}
            onClick={() => {
              if (!actionRow) return
              void deleteSingle(actionRow.id)
              setActionRow(null)
            }}
          >
            Delete record
          </button>
        </div>
      </section>

      <div className={`admin-editor-overlay ${detailRow ? 'open' : ''}`} onClick={() => setDetailRow(null)} />
      <section className={`admin-record-sheet ${detailRow ? 'open' : ''}`}>
        <div className="admin-editor-head">
          <h3>Record details</h3>
          <button onClick={() => setDetailRow(null)}>Close</button>
        </div>
        <div className="admin-editor-body">
          {detailRow ? (
            <dl className="admin-record-details">
              {Object.entries(detailRow).map(([key, value]) => (
                <div key={key}>
                  <dt>{formatFieldLabel(key)}</dt>
                  <dd>{String(value ?? '')}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        <div className="admin-editor-foot">
          <button className="admin-btn" onClick={() => setDetailRow(null)}>Close</button>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => {
              if (!detailRow) return
              openEdit(detailRow)
              setDetailRow(null)
            }}
          >
            Edit record
          </button>
        </div>
      </section>
    </main>
  )
}

function defaultForm(entity: EntityType): Record<string, unknown> {
  const base = { id: '', sort_order: 1, is_active: true }
  if (entity === 'team_members') return { ...base, initials: '', name: '', role: '', bio: '', email: '', number: '', avatar_url: '' }
  if (entity === 'services') return { ...base, title: '', description: '', quote: '', image_url: '', detail_sections: '[]' }
  if (entity === 'insights') return { ...base, chip: '', date_label: '', title: '', alt_style: false, image_url: '' }
  if (entity === 'job_posts') return { ...base, title: '', department: '', summary: '', job_description_html: '', notification_email: '', location_label: '', employment_type: '', workplace_type: '', apply_url: '' }
  return { ...base, kind: 'asset', label: '', value: '', link_url: '', file_path: '', file_url: '' }
}

function normalizePayload(entity: EntityType, form: Record<string, unknown>) {
  const payload: Record<string, unknown> = { ...form }
  if (entity === 'media_items' && payload.file_url) payload.value = payload.file_url
  if (entity === 'media_items') {
    const kind = String(payload.kind ?? '').toLowerCase()
    const value = String(payload.value ?? '')
    const linkUrl = String(payload.link_url ?? '')
    if (kind === 'social' && !linkUrl && /^https?:\/\//i.test(value)) {
      payload.link_url = value
    }
  }
  if (entity === 'services') {
    payload.detail_sections = sanitizeDetailSections(payload.detail_sections)
    const title = String(payload.title ?? '').trim()
    const description = String(payload.description ?? '').trim()
    if (!String(payload.tag ?? '').trim()) payload.tag = title || 'Service'
    if (!String(payload.quote ?? '').trim()) payload.quote = description || title || 'Service detail'
  }
  return payload
}

function validatePayload(entity: EntityType, payload: Record<string, unknown>) {
  const requiredMap: Record<EntityType, string[]> = {
    team_members: ['id', 'name', 'role', 'email'],
    services: ['id', 'title', 'description'],
    insights: ['id', 'chip', 'date_label', 'title'],
    job_posts: ['id', 'title', 'department', 'summary'],
    media_items: ['id', 'kind', 'label', 'value'],
  }
  const missing = requiredMap[entity].filter((key) => !payload[key])
  if (
    entity === 'services' &&
    payload.detail_sections !== undefined &&
    !Array.isArray(payload.detail_sections)
  ) {
    return 'detail_sections must be a JSON array of { title, description } objects.'
  }
  return missing.length > 0 ? `Missing required fields: ${missing.join(', ')}` : ''
}

function renderFields(
  entity: EntityType,
  formValues: Record<string, unknown>,
  setFormValues: Dispatch<SetStateAction<Record<string, unknown>>>,
  openMedia: (field: string) => void,
) {
  const fields: Record<EntityType, string[]> = {
    team_members: ['avatar_url', 'initials', 'name', 'role', 'bio', 'email', 'number', 'sort_order', 'is_active'],
    services: ['image_url', 'title', 'description', 'sort_order', 'is_active'],
    insights: ['image_url', 'chip', 'date_label', 'title', 'alt_style', 'sort_order', 'is_active'],
    job_posts: ['title', 'department', 'summary', 'job_description_html', 'notification_email', 'location_label', 'employment_type', 'workplace_type', 'apply_url', 'sort_order', 'is_active'],
    media_items: ['value', 'link_url', 'kind', 'label', 'file_path', 'file_url', 'sort_order', 'is_active'],
  }
  return (
    <div className="admin-form-grid">
      {fields[entity].map((field) => {
        const value = formValues[field]
        const isBool = typeof value === 'boolean'
        const isUpload = RECORD_UPLOAD_FIELDS[entity].includes(field)
        const isJsonField = field === 'detail_sections'
        const isRichText = field === 'job_description_html'
        const isJobSelect =
          entity === 'job_posts' &&
          (field === 'department' ||
            field === 'employment_type' ||
            field === 'location_label' ||
            field === 'workplace_type')
        const jobOptions = JOB_FIELD_OPTIONS[field] ?? []
        const fieldLabel = formatFieldLabel(field)
        if (isRichText) {
          return (
            <div key={field} className="admin-rich-field">
              <span>{fieldLabel}</span>
              <RichTextEditor
                value={String(value ?? '')}
                onChange={(nextValue) => setFormValues((prev) => ({ ...prev, [field]: nextValue }))}
              />
            </div>
          )
        }
        return (
          <label key={field}>
            {fieldLabel}
            {isBool ? (
              <span className="admin-toggle-row">
                <span className="admin-toggle-copy">{Boolean(value) ? 'Active and visible' : 'Inactive and hidden'}</span>
                <span className="admin-toggle-switch">
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, [field]: event.target.checked }))}
                  />
                  <span className="admin-toggle-slider" aria-hidden="true" />
                </span>
              </span>
            ) : (
              <>
                <div className="admin-field-with-browse">
                  {isJobSelect ? (
                    <select
                      value={String(value ?? '')}
                      onChange={(event) => setFormValues((prev) => ({ ...prev, [field]: event.target.value }))}
                    >
                      <option value="">Select {fieldLabel}</option>
                      {jobOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : isJsonField ? (
                    <textarea
                      value={String(value ?? '')}
                      onChange={(event) => setFormValues((prev) => ({ ...prev, [field]: event.target.value }))}
                      rows={10}
                    />
                  ) : (
                    <input
                      value={String(value ?? '')}
                      onChange={(event) => setFormValues((prev) => ({ ...prev, [field]: event.target.value }))}
                    />
                  )}
                  {isUpload ? (
                    <div className="admin-upload-actions-inline">
                      <label className="admin-inline-upload" title="Upload file">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (!file) return
                            const reader = new FileReader()
                            reader.onload = () => {
                              const result = String(reader.result ?? '')
                              if (result) setFormValues((prev) => ({ ...prev, [field]: result }))
                            }
                            reader.readAsDataURL(file)
                            event.currentTarget.value = ''
                          }}
                        />
                        <span aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </span>
                      </label>
                      <button type="button" className="admin-browse-icon" onClick={() => openMedia(field)} title="Browse media library">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 7.5h16M4 12h16M4 16.5h16" />
                        </svg>
                      </button>
                    </div>
                  ) : null}
                </div>
                {isUpload && typeof value === 'string' && value ? (
                  <div className="admin-upload-preview">
                    <span>Selected media preview</span>
                    <img src={value} alt="Selected media preview" />
                  </div>
                ) : isUpload ? (
                  <div className="admin-upload-placeholder">
                    <span>No file selected</span>
                    <small>Upload an image or choose one from library.</small>
                  </div>
                ) : null}
              </>
            )}
          </label>
        )
      })}
    </div>
  )
}

function sanitizeDetailSections(
  input: unknown,
): Array<{
  title: string
  description: string
}> {
  if (!Array.isArray(input)) return []
  return input
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const section = item as { title?: unknown; description?: unknown; points?: unknown }
      const title = typeof section.title === 'string' ? section.title : ''
      const description = typeof section.description === 'string'
        ? section.description
        : Array.isArray(section.points)
          ? section.points.filter((point): point is string => typeof point === 'string').join(' ')
          : ''
      return { title, description }
    })
    .filter((x): x is { title: string; description: string } => x !== null)
}

function getDefaultServiceDetailSections(
  row: Record<string, unknown>,
): Array<{
  title: string
  description: string
}> {
  const id = String(row.id ?? '').toLowerCase()
  const title = String(row.title ?? '').toLowerCase()

  if (id === 'service-1' || title.includes('finance')) {
    return [
      {
        title: 'Financial Strategy & Planning',
        description:
          'We align financial direction with business goals through structured planning, forecasting, and budgeting. This ensures resources are allocated efficiently, supporting sustainable growth, profitability, and confident decision-making across UAE and wider GCC operations.',
      },
      {
        title: 'Board Reporting & Insights',
        description:
          'We deliver clear, data-driven financial reporting including monthly statements, KPI tracking, and variance analysis. Leadership gains actionable insights and scenario planning to make informed strategic decisions backed by accurate financial intelligence.',
      },
    ]
  }

  if (id === 'service-2' || title.includes('compliance')) {
    return [
      {
        title: 'Regulatory Strategy & Market Entry',
        description:
          'We define clear regulatory pathways for products and expansion by assessing approval requirements, risks, and timelines. This ensures efficient entry into markets while minimizing delays and maintaining full compliance with regional standards.',
      },
      {
        title: 'Submissions & Authority Management',
        description:
          'We handle all regulatory submissions, approvals, renewals, and communications with governing bodies. Documentation is maintained accurately, ensuring products remain authorized and aligned with all applicable regulatory requirements.',
      },
    ]
  }

  if (id === 'service-3' || title.includes('human resources') || title.includes('hr')) {
    return [
      {
        title: 'Talent Acquisition & Workforce Planning',
        description:
          'We attract and recruit top talent across UAE and UK markets through structured hiring, compliant contracts, and effective onboarding. Workforce planning ensures the organization scales efficiently with the right people in place.',
      },
      {
        title: 'Employee Lifecycle Management',
        description:
          'We manage the full employee journey including onboarding, performance tracking, promotions, and exits. Processes are structured, transparent, and compliant, ensuring consistency and clarity across both UAE and UK operations.',
      },
    ]
  }

  if (id === 'service-4' || title.includes('project management')) {
    return [
      {
        title: 'Project Planning & Strategy',
        description:
          'We define clear project scopes, timelines, and resource plans aligned with business objectives. This ensures every project begins with structured direction, minimizing risks and setting a strong foundation for successful delivery.',
      },
      {
        title: 'Execution & Coordination',
        description:
          'We manage day-to-day project execution, coordinating teams, stakeholders, and resources. Communication remains clear and consistent, ensuring all parties stay aligned and projects progress efficiently without unnecessary delays.',
      },
    ]
  }

  return []
}

function renderServiceDetailsEditor(
  formValues: Record<string, unknown>,
  setFormValues: Dispatch<SetStateAction<Record<string, unknown>>>,
) {
  const sections = sanitizeDetailSections(formValues.detail_sections)

  const updateSections = (next: Array<{ title: string; description: string }>) => {
    setFormValues((prev) => ({ ...prev, detail_sections: next }))
  }

  return (
    <div className="admin-service-details-editor">
      <p className="admin-service-details-help">
        Build accordion rows. Each row uses an accordion title and description.
      </p>
      {sections.map((section, sectionIndex) => (
        <article key={`section-${sectionIndex}`} className="admin-service-detail-section-card">
          <label className="admin-service-field">
            <span>Section title</span>
            <input
              value={section.title}
              placeholder={`Section ${sectionIndex + 1}`}
              onChange={(event) => {
                const next = [...sections]
                next[sectionIndex] = { ...next[sectionIndex], title: event.target.value }
                updateSections(next)
              }}
            />
          </label>

          <label className="admin-service-field">
            <span>Accordion description</span>
            <textarea
              value={section.description}
              rows={5}
              placeholder="Add accordion description"
              onChange={(event) => {
                const next = [...sections]
                next[sectionIndex] = { ...next[sectionIndex], description: event.target.value }
                updateSections(next)
              }}
            />
          </label>

          <div className="admin-service-detail-actions">
            <button
              type="button"
              className="admin-btn admin-btn-danger"
              onClick={() => {
                updateSections(sections.filter((_, idx) => idx !== sectionIndex))
              }}
            >
              Remove section
            </button>
          </div>
        </article>
      ))}

      <button
        type="button"
        className="admin-btn admin-btn-primary"
        onClick={() => {
          updateSections([...sections, { title: '', description: '' }])
        }}
      >
        Add accordion row
      </button>
    </div>
  )
}

function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    if (document.activeElement === editor) return
    if (editor.innerHTML !== value) editor.innerHTML = value || ''
  }, [value])

  const run = (command: string, commandValue?: string) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    document.execCommand(command, false, commandValue)
    onChange(editor.innerHTML)
  }

  const toolbarAction = (command: string, commandValue?: string) => ({
    onMouseDown: (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      run(command, commandValue)
    },
  })

  const createLink = () => {
    const href = window.prompt('Enter link URL')
    if (!href) return
    run('createLink', href.trim())
  }

  return (
    <div className="admin-rich-editor">
      <div className="admin-rich-toolbar">
        <button type="button" className="admin-btn" {...toolbarAction('bold')}>Bold</button>
        <button type="button" className="admin-btn" {...toolbarAction('italic')}>Italic</button>
        <button type="button" className="admin-btn" {...toolbarAction('underline')}>Underline</button>
        <button type="button" className="admin-btn" {...toolbarAction('formatBlock', '<h2>')}>H2</button>
        <button type="button" className="admin-btn" {...toolbarAction('formatBlock', '<h3>')}>H3</button>
        <button type="button" className="admin-btn" {...toolbarAction('formatBlock', '<p>')}>P</button>
        <button type="button" className="admin-btn" {...toolbarAction('insertUnorderedList')}>Bullets</button>
        <button type="button" className="admin-btn" {...toolbarAction('insertOrderedList')}>Numbered</button>
        <button type="button" className="admin-btn" onMouseDown={(event) => { event.preventDefault(); createLink() }}>Link</button>
        <button type="button" className="admin-btn" {...toolbarAction('removeFormat')}>Clear</button>
      </div>
      <div
        ref={editorRef}
        className="admin-rich-surface"
        contentEditable
        suppressContentEditableWarning
        onInput={() => undefined}
        onBlur={(event) => onChange(event.currentTarget.innerHTML)}
      />
    </div>
  )
}

function buildRecordId(entity: EntityType, payload: Record<string, unknown>) {
  const prefixMap: Record<EntityType, string> = {
    team_members: 'team',
    services: 'service',
    insights: 'project',
    job_posts: 'career',
    media_items: 'media',
  }
  const source =
    String(payload.title ?? '').trim() ||
    String(payload.name ?? '').trim() ||
    String(payload.label ?? '').trim() ||
    prefixMap[entity]
  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || prefixMap[entity]
  return `${slug}-${Date.now().toString(36)}`
}

function formatFieldLabel(field: string) {
  const overrides: Record<string, string> = {
    is_active: 'Record Status',
    sort_order: 'Display Order',
    job_description_html: 'Job Description',
    apply_url: 'Application Link',
    location_label: 'Location',
    workplace_type: 'Workplace Type',
    smtp_host: 'SMTP Host',
    smtp_port: 'SMTP Port',
    smtp_user: 'SMTP Username',
    smtp_from: 'From Email',
    smtp_pass: 'SMTP Password',
    logo_url: 'Logo URL',
    favicon_url: 'Favicon URL',
    file_url: 'File URL',
    link_url: 'Link URL',
    avatar_url: 'Avatar URL',
    image_url: 'Image URL',
  }
  if (overrides[field]) return overrides[field]
  return field
    .replace(/_html$/, '')
    .replace(/_url$/, ' URL')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
