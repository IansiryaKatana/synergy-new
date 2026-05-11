import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
} from 'react'
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
  type NewsletterSubmission,
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

export type AdminPage = 'dashboard' | 'branding' | 'smtp' | 'newsletter' | 'team' | 'services' | 'insights' | 'media' | 'careers'

type SidebarItem = {
  id: AdminPage
  label: string
  href: string
  icon: LucideIcon
}

type BrandingTab = 'identity' | 'hero' | 'sections' | 'footer' | 'media'
type JobsCsvPreviewRow = {
  rowNumber: number
  payload: Record<string, unknown>
  validationError: string
}

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
  { id: 'newsletter', label: 'Newsletter', href: '/backend/newsletter', icon: Users },
  { id: 'team', label: 'Team', href: '/backend/team', icon: Users },
  { id: 'services', label: 'Services', href: '/backend/services', icon: Briefcase },
  { id: 'insights', label: 'Insights', href: '/backend/insights', icon: ChartNoAxesColumn },
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
    fields: ['homepage_team_background_url', 'services_hero_background_url', 'about_hero_background_url', 'contact_hero_background_url', 'industries_hero_background_url'],
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
  'industries_hero_background_url',
])

const JOB_FIELD_OPTIONS: Record<string, string[]> = {
  department: [
    'Finance',
    'Development',
    'Sales',
    'Maintenance',
    'Supply Chain and Operations',
    'Marketing',
    'Compliance',
    'Human Resources',
    'Project Management',
    'Design',
    'Customer Service',
    'Information Technology',
    'Legal',
    'Administration',
  ],
  employment_type: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'],
  location_label: ['Dubai, UAE', 'Abu Dhabi, UAE', 'Remote - UAE', 'London, UK', 'Remote - UK'],
  workplace_type: ['On-site', 'Hybrid', 'Remote'],
}

const JOB_BULK_UPLOAD_FIELDS = [
  'id',
  'title',
  'department',
  'summary',
  'job_description_html',
  'notification_email',
  'location_label',
  'employment_type',
  'workplace_type',
  'apply_url',
  'sort_order',
  'is_active',
] as const

const RECORD_UPLOAD_FIELDS: Record<EntityType, string[]> = {
  team_members: ['avatar_url'],
  services: ['image_url'],
  insights: ['image_url', 'hero_image_url'],
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
  const mediaUploadInputRef = useRef<HTMLInputElement | null>(null)
  const jobsBulkInputRef = useRef<HTMLInputElement | null>(null)
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
  const [mediaLibrarySearch, setMediaLibrarySearch] = useState('')
  const [isUploadDragActive, setIsUploadDragActive] = useState(false)
  const [actionRow, setActionRow] = useState<any | null>(null)
  const [detailRow, setDetailRow] = useState<any | null>(null)
  const [mediaView, setMediaView] = useState<'table' | 'grid'>('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [teamSearch, setTeamSearch] = useState('')
  const [teamVisibilityFilter, setTeamVisibilityFilter] = useState<'active' | 'inactive' | 'all'>('active')
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
  const [isBulkUploadingJobs, setIsBulkUploadingJobs] = useState(false)
  const [jobsCsvConfirmOpen, setJobsCsvConfirmOpen] = useState(false)
  const [jobsCsvFileName, setJobsCsvFileName] = useState('')
  const [jobsCsvPreviewRows, setJobsCsvPreviewRows] = useState<JobsCsvPreviewRow[]>([])
  const [newsletterRows, setNewsletterRows] = useState<NewsletterSubmission[]>([])
  const [newsletterSearch, setNewsletterSearch] = useState('')
  const [newsletterStartDate, setNewsletterStartDate] = useState('')
  const [newsletterEndDate, setNewsletterEndDate] = useState('')

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

  const filteredRows = useMemo(() => {
    if (entity !== 'team_members') return rows
    const visibilityFiltered = rows.filter((row: any) => {
      if (teamVisibilityFilter === 'all') return true
      if (teamVisibilityFilter === 'active') return Boolean(row.is_active)
      return !Boolean(row.is_active)
    })
    const query = teamSearch.trim().toLowerCase()
    if (!query) return visibilityFiltered
    return visibilityFiltered.filter((row: any) => {
      const haystack = [
        String(row.name ?? ''),
        String(row.role ?? ''),
        String(row.email ?? ''),
        String(row.initials ?? ''),
        String(row.id ?? ''),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [entity, rows, teamSearch, teamVisibilityFilter])

  const filteredMediaFiles = useMemo(() => {
    const query = mediaLibrarySearch.trim().toLowerCase()
    if (!query) return mediaFiles
    return mediaFiles.filter((item) => item.path.toLowerCase().includes(query) || item.publicUrl.toLowerCase().includes(query))
  }, [mediaFiles, mediaLibrarySearch])
  const filteredNewsletterRows = useMemo(() => {
    const query = newsletterSearch.trim().toLowerCase()
    const start = newsletterStartDate ? new Date(`${newsletterStartDate}T00:00:00`) : null
    const end = newsletterEndDate ? new Date(`${newsletterEndDate}T23:59:59.999`) : null
    return newsletterRows.filter((row) => {
      const submittedAt = new Date(row.submitted_at)
      if (Number.isNaN(submittedAt.getTime())) return false
      if (start && submittedAt < start) return false
      if (end && submittedAt > end) return false
      if (!query) return true
      return String(row.email ?? '').toLowerCase().includes(query)
    })
  }, [newsletterRows, newsletterSearch, newsletterStartDate, newsletterEndDate])

  const perPage = useMemo(() => {
    if (entity === 'team_members') return 10
    if (entity === 'media_items') return mediaView === 'grid' ? 20 : 12
    return 12
  }, [entity, mediaView])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / perPage))
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * perPage
    return filteredRows.slice(start, start + perPage)
  }, [filteredRows, currentPage, perPage])

  useEffect(() => {
    setEntity(PAGE_TO_ENTITY[props.page] ?? 'team_members')
    setSelectedIds([])
    setDetailRow(null)
    if (props.page === 'media') setMediaView('grid')
    setIsMobileSidebarOpen(false)
  }, [props.page])

  useEffect(() => {
    setCurrentPage(1)
  }, [entity, mediaView, rows.length, teamSearch, teamVisibilityFilter])

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
    if (mediaSheetOpen) return
    setPendingUploadFile(null)
    setPendingUploadPreviewUrl('')
    setUploadProgress(0)
    setSelectedMediaUrl('')
    setMediaLibrarySearch('')
    setMediaSheetTab('library')
    setIsUploadDragActive(false)
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
    const loadNewsletter = async () => {
      if (props.page !== 'newsletter') return
      try {
        const rows = await contentApi.getNewsletterSubmissions()
        setNewsletterRows(rows)
      } catch (err) {
        setStatus(err instanceof Error ? err.message : 'Failed to load newsletter submissions.')
      }
    }
    void loadNewsletter()
  }, [props.page])

  useEffect(() => {
    if (!isMobileSidebarOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileSidebarOpen])

  const openMediaPicker = (scope: 'record' | 'branding', field: string, tab: 'upload' | 'library' = 'library') => {
    setUploadTargetScope(scope)
    setTargetUploadField(field)
    setMediaSheetTab(tab)
    setMediaSheetOpen(true)
  }

  const pickMedia = (url: string) => {
    setSelectedMediaUrl(url)
  }

  const handlePendingUploadFile = (file: File | null) => {
    if (saving) return
    if (pendingUploadPreviewUrl) URL.revokeObjectURL(pendingUploadPreviewUrl)
    setPendingUploadFile(file)
    setUploadProgress(0)
    setPendingUploadPreviewUrl(file ? URL.createObjectURL(file) : '')
    if (file) {
      setMediaSheetTab('upload')
      void uploadMedia(file)
    }
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
      await refreshMedia()
      if (targetUploadField) {
        if (uploadTargetScope === 'branding') {
          const nextBrandingForm = {
            ...brandingForm,
            [targetUploadField]: uploaded.publicUrl,
          }
          setBrandingForm(nextBrandingForm)
          await persistBranding(nextBrandingForm)
        } else {
          setFormValues((prev) => ({ ...prev, [targetUploadField]: uploaded.publicUrl }))
        }
        await props.onRefresh()
        setSelectedMediaUrl('')
        setMediaSheetOpen(false)
        setStatus('Media uploaded and applied.')
      } else {
        await props.onRefresh()
        setSelectedMediaUrl(uploaded.publicUrl)
        setMediaSheetTab('library')
        setStatus('Media uploaded. Confirm with "Use this media".')
      }
      handlePendingUploadFile(null)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Upload failed.')
    }
    setSaving(false)
  }

  const saveBranding = async () => {
    setSaving(true)
    try {
      await persistBranding(brandingForm)
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

  const downloadJobsTemplate = () => {
    const csv = buildJobsTemplateCsv(props.jobs)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'job-posts-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setStatus('Downloaded jobs CSV template.')
  }

  const handleJobsBulkUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    event.currentTarget.value = ''
    if (!file) return

    try {
      const rawCsv = await file.text()
      const parseResult = parseJobsCsv(rawCsv)
      if (parseResult.error) {
        setStatus(parseResult.error)
        return
      }

      const rows = parseResult.rows
      if (rows.length === 0) {
        setStatus('No rows found in CSV. Add at least one job row and retry.')
        return
      }

      const previewRows = rows.map((row, index) => {
        const payload = mapCsvRowToJobPayload(row, index)
        const validationError = validatePayload('job_posts', payload)
        return {
          rowNumber: index + 2,
          payload,
          validationError,
        }
      })
      const validationFailures = previewRows.filter((row) => row.validationError)
      const validationSummary = validationFailures
        .slice(0, 4)
        .map((row) => `Row ${row.rowNumber}: ${row.validationError}`)
        .join(' | ')

      setJobsCsvPreviewRows(previewRows)
      setJobsCsvFileName(file.name)
      setJobsCsvConfirmOpen(true)
      setStatus(
        validationFailures.length > 0
          ? `CSV parsed with ${validationFailures.length} validation issue(s). ${validationSummary}${validationFailures.length > 4 ? ' | ...' : ''}`
          : `CSV parsed successfully. ${previewRows.length} row(s) ready to upload.`,
      )
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to process CSV upload.')
    }
  }

  const confirmJobsBulkUpload = async () => {
    if (jobsCsvPreviewRows.length === 0) {
      setStatus('No parsed CSV rows available. Please upload a CSV file again.')
      return
    }
    const invalidRows = jobsCsvPreviewRows.filter((row) => row.validationError)
    if (invalidRows.length > 0) {
      const summary = invalidRows
        .slice(0, 4)
        .map((row) => `Row ${row.rowNumber}: ${row.validationError}`)
        .join(' | ')
      setStatus(`Fix CSV errors before upload. ${summary}${invalidRows.length > 4 ? ' | ...' : ''}`)
      return
    }

    setIsBulkUploadingJobs(true)
    setSaving(true)
    try {
      const failures: string[] = []
      let successCount = 0
      for (const previewRow of jobsCsvPreviewRows) {
        try {
          await contentApi.upsertRow('job_posts', previewRow.payload)
          successCount += 1
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unable to upsert row.'
          failures.push(`Row ${previewRow.rowNumber}: ${message}`)
        }
      }

      if (successCount > 0) await props.onRefresh()
      if (failures.length === 0) {
        setStatus(`Uploaded ${successCount} job row(s) from CSV.`)
        setJobsCsvConfirmOpen(false)
        setJobsCsvPreviewRows([])
        setJobsCsvFileName('')
        return
      }
      const errorSummary = failures.slice(0, 4).join(' | ')
      setStatus(
        `Uploaded ${successCount} row(s), ${failures.length} failed. ${errorSummary}${failures.length > 4 ? ' | ...' : ''}`,
      )
    } finally {
      setSaving(false)
      setIsBulkUploadingJobs(false)
    }
  }

  const uploadAndRegisterMedia = async (file: File) => {
    const uploaded = await contentApi.uploadMedia(file, 'admin')
    await contentApi.upsertRow('media_items', {
      id: `asset-${Date.now()}`,
      kind: 'asset',
      label: file.name,
      value: uploaded.publicUrl,
      file_path: uploaded.path,
      file_url: uploaded.publicUrl,
      sort_order: Math.floor(Date.now() / 1000),
      is_active: true,
    })
    return uploaded.publicUrl
  }

  const exportNewsletterCsv = () => {
    if (filteredNewsletterRows.length === 0) {
      setStatus('No newsletter submissions match the current filters.')
      return
    }
    const header = ['id', 'email', 'source', 'status', 'submitted_at']
    const lines = filteredNewsletterRows.map((row) =>
      [row.id, row.email, row.source ?? '', row.status ?? '', row.submitted_at].map(escapeCsvCell).join(','),
    )
    const csv = `${header.join(',')}\n${lines.join('\n')}\n`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `newsletter-submissions-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setStatus(`Exported ${filteredNewsletterRows.length} newsletter submission(s) to CSV.`)
  }

  const uploadRecordFieldFile = async (field: string, file: File) => {
    setSaving(true)
    try {
      const publicUrl = await uploadAndRegisterMedia(file)
      setFormValues((prev) => ({ ...prev, [field]: publicUrl }))
      setStatus('Media uploaded and field updated.')
      await props.onRefresh()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setSaving(false)
    }
  }

  const uploadBrandingFieldFile = async (field: string, file: File) => {
    setSaving(true)
    try {
      const publicUrl = await uploadAndRegisterMedia(file)
      const nextBrandingForm = {
        ...brandingForm,
        [field]: publicUrl,
      }
      setBrandingForm(nextBrandingForm)
      await persistBranding(nextBrandingForm)
      setStatus('Media uploaded and branding field updated.')
      await props.onRefresh()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setSaving(false)
    }
  }

  const persistBranding = async (payload: Record<string, string | number | boolean>) => {
    try {
      await contentApi.upsertRow('branding_content', payload)
      return
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      const missingIndustriesColumn =
        message.includes('industries_hero_background_url') &&
        (message.toLowerCase().includes('column') || message.toLowerCase().includes('schema cache'))

      if (!missingIndustriesColumn) throw err

      const fallbackPayload = { ...payload }
      delete (fallbackPayload as Record<string, unknown>).industries_hero_background_url
      await contentApi.upsertRow('branding_content', fallbackPayload)
      setStatus(
        'Branding saved without Industries background. Run the latest Supabase migration to enable industries_hero_background_url.',
      )
    }
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
                              void uploadBrandingFieldFile(field, file)
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
                            openMediaPicker('branding', field, 'library')
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

        {props.page === 'newsletter' ? (
          <section className="admin-newsletter">
            <div className="admin-controls">
              <div className="admin-controls-top">
                <div className="admin-actions admin-actions-primary">
                  <button className="admin-btn admin-btn-primary" onClick={exportNewsletterCsv}>
                    Export CSV
                  </button>
                </div>
                <div className="admin-search-wrap">
                  <input
                    type="search"
                    className="admin-search-input"
                    value={newsletterSearch}
                    onChange={(event) => setNewsletterSearch(event.target.value)}
                    placeholder="Search by email..."
                    aria-label="Search newsletter submissions by email"
                  />
                  <input
                    type="date"
                    className="admin-search-input"
                    value={newsletterStartDate}
                    onChange={(event) => setNewsletterStartDate(event.target.value)}
                    aria-label="Filter newsletter submissions from date"
                  />
                  <input
                    type="date"
                    className="admin-search-input"
                    value={newsletterEndDate}
                    onChange={(event) => setNewsletterEndDate(event.target.value)}
                    aria-label="Filter newsletter submissions to date"
                  />
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => {
                      setNewsletterSearch('')
                      setNewsletterStartDate('')
                      setNewsletterEndDate('')
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              </div>
              {status ? <p className="admin-status">{status}</p> : null}
            </div>
            <section className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Submitted at</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNewsletterRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.email}</td>
                      <td>{row.source ?? 'footer'}</td>
                      <td>{row.status ?? 'new'}</td>
                      <td>{new Date(row.submitted_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {filteredNewsletterRows.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No newsletter submissions match the current filters.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </section>
          </section>
        ) : null}

        {props.page !== 'dashboard' && props.page !== 'branding' && props.page !== 'smtp' && props.page !== 'newsletter' ? (
          <>
            <section className="admin-controls">
              <div className="admin-controls-top">
                <div className="admin-actions admin-actions-primary">
                  <button className="admin-btn admin-btn-primary" disabled={saving} onClick={openCreate}>Create New</button>
                  <button className="admin-btn" disabled={saving || selectedIds.length === 0} onClick={() => bulkSetActive(true)}>Bulk activate</button>
                  <button className="admin-btn" disabled={saving || selectedIds.length === 0} onClick={() => bulkSetActive(false)}>Bulk deactivate</button>
                  <button className="admin-btn admin-btn-danger" disabled={saving || selectedIds.length === 0} onClick={bulkDelete}>Bulk delete</button>
                  {props.page === 'careers' ? (
                    <>
                      <button className="admin-btn" disabled={saving} onClick={downloadJobsTemplate}>
                        Download CSV template
                      </button>
                      <button
                        className="admin-btn"
                        disabled={saving || isBulkUploadingJobs}
                        onClick={() => jobsBulkInputRef.current?.click()}
                      >
                        {isBulkUploadingJobs ? 'Uploading CSV...' : 'Bulk upload CSV'}
                      </button>
                      <input
                        ref={jobsBulkInputRef}
                        type="file"
                        accept=".csv,text/csv"
                        className="admin-upload-input-hidden"
                        onChange={handleJobsBulkUpload}
                      />
                    </>
                  ) : null}
                </div>
                {props.page === 'team' ? (
                  <div className="admin-search-wrap">
                    <input
                      type="search"
                      className="admin-search-input"
                      value={teamSearch}
                      onChange={(event) => setTeamSearch(event.target.value)}
                      placeholder="Search team member by name, role, email..."
                      aria-label="Search team members"
                    />
                    <select
                      className="admin-search-input admin-team-visibility-filter"
                      value={teamVisibilityFilter}
                      onChange={(event) =>
                        setTeamVisibilityFilter(event.target.value as 'active' | 'inactive' | 'all')
                      }
                      aria-label="Filter team members by status"
                    >
                      <option value="active">Active only</option>
                      <option value="inactive">Inactive only</option>
                      <option value="all">All team members</option>
                    </select>
                  </div>
                ) : null}
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
            {filteredRows.length > perPage ? (
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
                    openMediaPicker('record', field, 'library')
                  }, uploadRecordFieldFile)
                : renderServiceDetailsEditor(formValues, setFormValues)}
            </>
          ) : (
            renderFields(entity, formValues, setFormValues, (field) => {
              openMediaPicker('record', field, 'library')
            }, uploadRecordFieldFile)
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
          <div className="admin-media-head-copy">
            <h3>Select Media</h3>
            {targetUploadField ? (
              <p>
                Updating: <strong>{formatFieldLabel(targetUploadField)}</strong>
              </p>
            ) : null}
          </div>
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
            <div
              className={`admin-upload-dropzone ${isUploadDragActive ? 'drag-active' : ''}`}
              onDragOver={(event) => {
                event.preventDefault()
                setIsUploadDragActive(true)
              }}
              onDragLeave={() => setIsUploadDragActive(false)}
              onDrop={(event) => {
                event.preventDefault()
                setIsUploadDragActive(false)
                const droppedFile = event.dataTransfer.files?.[0] ?? null
                handlePendingUploadFile(droppedFile)
              }}
            >
              <p>Drag and drop media here</p>
              <span>or</span>
              <button
                type="button"
                className="admin-btn"
                onClick={() => mediaUploadInputRef.current?.click()}
              >
                Browse files
              </button>
              <input
                ref={mediaUploadInputRef}
                type="file"
                accept="image/*,video/*"
                className="admin-upload-input-hidden"
                onChange={(event) => handlePendingUploadFile(event.target.files?.[0] ?? null)}
              />
            </div>
            <div className="admin-media-upload-actions">
              <span>{pendingUploadFile ? pendingUploadFile.name : 'No file selected'}</span>
              <span>{saving && pendingUploadFile ? 'Uploading automatically...' : 'Upload starts automatically'}</span>
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
        {mediaSheetTab === 'library' ? (
          <>
            <div className="admin-media-library-toolbar">
              <input
                type="search"
                className="admin-search-input"
                placeholder="Search media library..."
                value={mediaLibrarySearch}
                onChange={(event) => setMediaLibrarySearch(event.target.value)}
                aria-label="Search media library"
              />
            </div>
            <div className="admin-media-grid">
            {filteredMediaFiles.map((item) => (
              <button
                key={item.path}
                className={`admin-media-item ${selectedMediaUrl === item.publicUrl ? 'selected' : ''}`}
                onClick={() => pickMedia(item.publicUrl)}
              >
                <img src={item.publicUrl} alt={item.path} />
                <span>{item.path}</span>
              </button>
            ))}
            {filteredMediaFiles.length === 0 ? (
              <p className="admin-upload-target">No media files match your search.</p>
            ) : null}
            </div>
          </>
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

      <div
        className={`admin-editor-overlay ${jobsCsvConfirmOpen ? 'open' : ''}`}
        onClick={() => setJobsCsvConfirmOpen(false)}
      />
      <section className={`admin-record-sheet ${jobsCsvConfirmOpen ? 'open' : ''}`}>
        <div className="admin-editor-head">
          <h3>Confirm Jobs CSV Upload</h3>
          <button onClick={() => setJobsCsvConfirmOpen(false)}>Close</button>
        </div>
        <div className="admin-editor-body">
          <p className="admin-status">
            File: <strong>{jobsCsvFileName || 'N/A'}</strong> | Rows: <strong>{jobsCsvPreviewRows.length}</strong> | Issues:{' '}
            <strong>{jobsCsvPreviewRows.filter((row) => row.validationError).length}</strong>
          </p>
          <dl className="admin-record-details">
            {jobsCsvPreviewRows.slice(0, 40).map((row) => (
              <div key={`jobs-csv-row-${row.rowNumber}`}>
                <dt>
                  Row {row.rowNumber}: {String(row.payload.title ?? 'Untitled role')}
                </dt>
                <dd>
                  {row.validationError
                    ? `Error: ${row.validationError}`
                    : `Department: ${String(row.payload.department ?? '')} | Location: ${String(row.payload.location_label ?? '')} | Type: ${String(row.payload.employment_type ?? '')}`}
                </dd>
              </div>
            ))}
          </dl>
          {jobsCsvPreviewRows.length > 40 ? (
            <p className="admin-status">Showing first 40 rows in preview. Full file will be uploaded on confirm.</p>
          ) : null}
        </div>
        <div className="admin-editor-foot">
          <button className="admin-btn" onClick={() => setJobsCsvConfirmOpen(false)}>
            Cancel
          </button>
          <button
            className="admin-btn admin-btn-primary"
            disabled={saving || isBulkUploadingJobs || jobsCsvPreviewRows.some((row) => row.validationError)}
            onClick={confirmJobsBulkUpload}
          >
            {isBulkUploadingJobs ? 'Uploading...' : 'Confirm upload'}
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
  if (entity === 'insights') return { ...base, chip: '', date_label: '', title: '', project_description_html: '', alt_style: false, image_url: '', hero_image_url: '' }
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
  uploadFieldFile?: (field: string, file: File) => Promise<void>,
) {
  const fields: Record<EntityType, string[]> = {
    team_members: ['avatar_url', 'initials', 'name', 'role', 'bio', 'email', 'number', 'sort_order', 'is_active'],
    services: ['image_url', 'title', 'description', 'sort_order', 'is_active'],
    insights: ['image_url', 'hero_image_url', 'chip', 'date_label', 'title', 'project_description_html', 'alt_style', 'sort_order', 'is_active'],
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
        const isRichText = field === 'job_description_html' || field === 'project_description_html'
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
                            if (uploadFieldFile) {
                              void uploadFieldFile(field, file)
                            } else {
                              const reader = new FileReader()
                              reader.onload = () => {
                                const result = String(reader.result ?? '')
                                if (result) setFormValues((prev) => ({ ...prev, [field]: result }))
                              }
                              reader.readAsDataURL(file)
                            }
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
          'We define clear regulatory pathways for products and expansion by assessing approval requirements, risks, and timelines. This ensures efficient entry into markets while minimising delays and maintaining full compliance with regional standards.',
      },
      {
        title: 'Submissions & Authority Management',
        description:
          'We handle all regulatory submissions, approvals, renewals, and communications with governing bodies. Documentation is maintained accurately, ensuring products remain authorised and aligned with all applicable regulatory requirements.',
      },
    ]
  }

  if (id === 'service-3' || title.includes('human resources') || title.includes('hr')) {
    return [
      {
        title: 'Talent Acquisition & Workforce Planning',
        description:
          'We attract and recruit top talent across UAE and UK markets through structured hiring, compliant contracts, and effective onboarding. Workforce planning ensures the organisation scales efficiently with the right people in place.',
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
          'We define clear project scopes, timelines, and resource plans aligned with business objectives. This ensures every project begins with structured direction, minimising risks and setting a strong foundation for successful delivery.',
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
    if (command === 'formatBlock' && commandValue) {
      // Some browsers ignore <h2>/<h3> values; try plain tag first.
      const normalized = commandValue.replace(/[<>]/g, '').toUpperCase()
      const didApply = document.execCommand(command, false, normalized)
      if (!didApply) {
        document.execCommand(command, false, `<${normalized.toLowerCase()}>`)
      }
    } else {
      document.execCommand(command, false, commandValue)
    }
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

  const clearFormatting = () => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    if (!editor.contains(range.commonAncestorContainer)) return
    document.execCommand('removeFormat', false)
    document.execCommand('unlink', false)
    // Reset current block to paragraph without globally touching the document.
    document.execCommand('formatBlock', false, 'P')
    onChange(editor.innerHTML)
  }

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const editor = editorRef.current
    if (!editor) return
    const html = event.clipboardData.getData('text/html')
    const text = event.clipboardData.getData('text/plain')
    const candidate = html || text
    const looksLikeHtml = /<([a-z][\w-]*)(\s[^>]*)?>[\s\S]*<\/\1>|<([a-z][\w-]*)(\s[^>]*)?\/?>/i.test(candidate)

    if (!looksLikeHtml) return
    event.preventDefault()
    editor.focus()
    document.execCommand('insertHTML', false, candidate)
    onChange(editor.innerHTML)
  }

  return (
    <div className="admin-rich-editor">
      <div className="admin-rich-toolbar">
        <button type="button" className="admin-btn" {...toolbarAction('bold')}>Bold</button>
        <button type="button" className="admin-btn" {...toolbarAction('italic')}>Italic</button>
        <button type="button" className="admin-btn" {...toolbarAction('underline')}>Underline</button>
        <button type="button" className="admin-btn" {...toolbarAction('formatBlock', 'H2')}>H2</button>
        <button type="button" className="admin-btn" {...toolbarAction('formatBlock', 'H3')}>H3</button>
        <button type="button" className="admin-btn" {...toolbarAction('formatBlock', 'P')}>P</button>
        <button type="button" className="admin-btn" {...toolbarAction('insertUnorderedList')}>Bullets</button>
        <button type="button" className="admin-btn" {...toolbarAction('insertOrderedList')}>Numbered</button>
        <button type="button" className="admin-btn" onMouseDown={(event) => { event.preventDefault(); createLink() }}>Link</button>
        <button
          type="button"
          className="admin-btn"
          onMouseDown={(event) => {
            event.preventDefault()
            clearFormatting()
          }}
        >
          Clear
        </button>
      </div>
      <div
        ref={editorRef}
        className="admin-rich-surface"
        contentEditable
        suppressContentEditableWarning
        onPaste={handlePaste}
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
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
    project_description_html: 'Project Description',
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
    hero_image_url: 'Hero Image URL',
  }
  if (overrides[field]) return overrides[field]
  return field
    .replace(/_html$/, '')
    .replace(/_url$/, ' URL')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function buildJobsTemplateCsv(existingJobs: JobPost[]) {
  const header = JOB_BULK_UPLOAD_FIELDS.join(',')
  const jobs = existingJobs.length > 0 ? existingJobs : buildDefaultJobsTemplateRows()
  const body = jobs
    .map((job, index) =>
      JOB_BULK_UPLOAD_FIELDS.map((field) => {
        if (field === 'sort_order') return escapeCsvCell(String(Number(job.sort_order || index + 1)))
        if (field === 'is_active') return escapeCsvCell(job.is_active ? 'true' : 'false')
        return escapeCsvCell(String(job[field] ?? ''))
      }).join(','),
    )
    .join('\n')
  return `${header}\n${body}\n`
}

function buildDefaultJobsTemplateRows(): JobPost[] {
  return [
    {
      id: '',
      title: 'Finance Manager',
      department: 'Finance',
      summary: 'Lead budgeting, reporting, and financial planning for strategic projects.',
      job_description_html: '',
      notification_email: '',
      location_label: 'Dubai, UAE',
      employment_type: 'Full-time',
      workplace_type: 'On-site',
      apply_url: '',
      sort_order: 1,
      is_active: true,
    },
    {
      id: '',
      title: 'Compliance Officer',
      department: 'Compliance',
      summary: 'Drive regulatory readiness, policy alignment, and audit support across teams.',
      job_description_html: '',
      notification_email: '',
      location_label: 'Abu Dhabi, UAE',
      employment_type: 'Full-time',
      workplace_type: 'Hybrid',
      apply_url: '',
      sort_order: 2,
      is_active: true,
    },
    {
      id: '',
      title: 'HR Coordinator',
      department: 'Human Resources',
      summary: 'Support hiring, onboarding, and employee lifecycle operations.',
      job_description_html: '',
      notification_email: '',
      location_label: 'Remote - UAE',
      employment_type: 'Full-time',
      workplace_type: 'Remote',
      apply_url: '',
      sort_order: 3,
      is_active: true,
    },
  ]
}


function parseJobsCsv(input: string): { rows: Array<Record<string, string>>; error?: string } {
  const rows = parseCsvRows(input)
  if (rows.length < 2) {
    return { rows: [], error: 'CSV must include a header and at least one data row.' }
  }

  const headers = rows[0].map((cell) => cell.trim())
  const requiredHeaders = new Set(JOB_BULK_UPLOAD_FIELDS)
  const missingHeaders = Array.from(requiredHeaders).filter((header) => !headers.includes(header))
  if (missingHeaders.length > 0) {
    return { rows: [], error: `Missing required CSV columns: ${missingHeaders.join(', ')}` }
  }

  const records: Array<Record<string, string>> = []
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const cells = rows[rowIndex]
    if (cells.length === 1 && !cells[0]?.trim()) continue
    const record: Record<string, string> = {}
    headers.forEach((header, columnIndex) => {
      record[header] = cells[columnIndex] ?? ''
    })
    records.push(record)
  }

  return { rows: records }
}

function parseCsvRows(input: string) {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    const next = input[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentCell += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (!inQuotes && char === ',') {
      currentRow.push(currentCell)
      currentCell = ''
      continue
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') i += 1
      currentRow.push(currentCell)
      rows.push(currentRow)
      currentRow = []
      currentCell = ''
      continue
    }

    currentCell += char
  }

  currentRow.push(currentCell)
  rows.push(currentRow)
  return rows
}

function mapCsvRowToJobPayload(row: Record<string, string>, index: number): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: row.id.trim(),
    title: row.title.trim(),
    department: row.department.trim(),
    summary: row.summary.trim(),
    job_description_html: row.job_description_html ?? '',
    notification_email: row.notification_email.trim(),
    location_label: row.location_label.trim() || 'Dubai, UAE',
    employment_type: row.employment_type.trim() || 'Full-time',
    workplace_type: row.workplace_type.trim() || 'On-site',
    apply_url: row.apply_url.trim(),
    sort_order: Number.parseInt(row.sort_order, 10) || index + 1,
    is_active: parseBooleanCell(row.is_active, true),
  }

  if (!String(payload.id).trim()) {
    payload.id = buildRecordId('job_posts', payload)
  }

  return payload
}

function parseBooleanCell(value: string, fallback: boolean) {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized) return fallback
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true
  if (['false', '0', 'no', 'n'].includes(normalized)) return false
  return fallback
}

function escapeCsvCell(input: string) {
  const value = input ?? ''
  if (!/[",\n\r]/.test(value)) return value
  return `"${value.replace(/"/g, '""')}"`
}
