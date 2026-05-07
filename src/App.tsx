import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type ComponentType,
  type FormEvent,
} from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import PhoneInputLib from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { AdminDashboard, type AdminPage } from './components/AdminDashboard'
import Noise from './components/Noise'
import { contentApi, type JobPost, type ServiceItem, type SiteContent, type TeamMember } from './lib/content'

gsap.registerPlugin(ScrollTrigger)

type DialogMode = 'none' | 'book'
type PhoneInputProps = {
  country?: string
  value?: string
  onChange?: (value: string) => void
  inputProps?: Record<string, unknown>
  placeholder?: string
  enableSearch?: boolean
  disableSearchIcon?: boolean
  countryCodeEditable?: boolean
  containerClass?: string
  buttonClass?: string
  inputClass?: string
  dropdownClass?: string
}
const PhoneInputComponent =
  ((PhoneInputLib as unknown as { default?: ComponentType<PhoneInputProps> }).default ??
    (PhoneInputLib as unknown as ComponentType<PhoneInputProps>))

function PlusGlyph() {
  return (
    <span className="plus-glyph" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </span>
  )
}

function UpRightArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 16L16 8M10 8h6v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function normalizeExternalLink(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function isVideoMediaSource(url: string) {
  const normalized = url.trim().toLowerCase()
  if (!normalized) return false
  if (normalized.startsWith('data:video/')) return true
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(normalized)
}

function sanitizeRichHtml(input?: string | null) {
  if (!input) return ''
  if (typeof window === 'undefined') return input
  const parser = new DOMParser()
  const doc = parser.parseFromString(input, 'text/html')
  doc.querySelectorAll('script,iframe,object,embed').forEach((node) => node.remove())
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const attrName = attr.name.toLowerCase()
      const attrValue = attr.value.trim().toLowerCase()
      if (attrName.startsWith('on')) el.removeAttribute(attr.name)
      if ((attrName === 'href' || attrName === 'src') && attrValue.startsWith('javascript:')) {
        el.removeAttribute(attr.name)
      }
    }
  })
  return doc.body.innerHTML
}

function sanitizeProjectHtml(input?: string | null) {
  const safe = sanitizeRichHtml(input)
  if (!safe) return ''
  if (typeof window === 'undefined') return safe.replace(/\sstyle="[^"]*"/gi, '')
  const parser = new DOMParser()
  const doc = parser.parseFromString(safe, 'text/html')
  doc.querySelectorAll('*').forEach((el) => {
    el.removeAttribute('style')
    el.removeAttribute('class')
    el.removeAttribute('id')
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.toLowerCase().startsWith('data-')) el.removeAttribute(attr.name)
    }
  })
  return doc.body.innerHTML
}

function stripHtml(input?: string | null) {
  if (!input) return ''
  if (typeof window === 'undefined') return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const parser = new DOMParser()
  const doc = parser.parseFromString(input, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function clampMetaDescription(input: string, max = 160) {
  const cleaned = input.replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1).trimEnd()}...`
}

function SocialIcon({ name }: { name: string }) {
  const normalized = name.toLowerCase()
  if (normalized.includes('instagram') || normalized === 'ig') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
      </svg>
    )
  }
  if (normalized.includes('linkedin') || normalized === 'in') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8.4 10.1v5.7M8.4 8.5h.01M11.8 15.8v-3.2c0-1.5.8-2.5 2.2-2.5s2 .9 2 2.5v3.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (normalized.includes('facebook') || normalized === 'f' || normalized === 'fb') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.5 8.2h2V5h-2.4c-2.7 0-4.3 1.6-4.3 4.5v2H8v3.1h1.8V19h3.3v-4.4h2.5l.4-3.1h-2.9V9.9c0-1 .4-1.7 1.4-1.7z" fill="currentColor" />
      </svg>
    )
  }
  if (normalized.includes('x') || normalized.includes('twitter')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 5h2.8l3.9 5.2L17.2 5H20l-6 7.1L20.3 19h-2.8l-4.2-5.6L8.5 19H5.7l6.3-7.5z" fill="currentColor" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function AboutTeamCardImage({ member }: { member: TeamMember }) {
  const avatarUrl = member.avatar_url?.trim() ?? ''
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setFailed(false)
    if (!avatarUrl) return

    let cancelled = false
    const probe = new Image()
    const timeoutId = window.setTimeout(() => {
      if (cancelled) return
      setFailed(true)
      setLoaded(false)
    }, 8000)

    probe.onload = () => {
      if (cancelled) return
      window.clearTimeout(timeoutId)
      setLoaded(true)
      setFailed(false)
    }

    probe.onerror = () => {
      if (cancelled) return
      window.clearTimeout(timeoutId)
      setFailed(true)
      setLoaded(false)
    }

    probe.src = avatarUrl

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      probe.onload = null
      probe.onerror = null
    }
  }, [avatarUrl, member.id])

  if (!avatarUrl || failed) {
    return <span className="about-team-card-fallback">{member.initials}</span>
  }

  return (
    <>
      {!loaded ? <span className="about-team-card-skeleton" aria-hidden="true" /> : null}
      <img
        src={avatarUrl}
        alt={member.name}
        className={`about-team-card-image ${loaded ? 'loaded' : ''}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setFailed(true)
          setLoaded(false)
        }}
      />
    </>
  )
}

function formatProjectTitle(title: string) {
  const firstLineRaw = title.includes('Hotel Apartment')
    ? title.replace('Hotel Apartment', '').trim()
    : title
  const firstLine = firstLineRaw.replace(/\s\+\s/, ' + ')
  const gPlusMatch = firstLine.match(/^G\s\+\s(\d+)$/i)
  const firstLineNode = gPlusMatch ? (
    <>
      G<sup>+</sup>{gPlusMatch[1]}
    </>
  ) : (
    firstLine
  )

  if (title.includes('Hotel Apartment')) {
    return (
      <>
        {firstLineNode}
        <br />
        Hotel Apartment
      </>
    )
  }
  return firstLineNode
}

function resolveServiceHref(service: ServiceItem) {
  const id = service.id.toLowerCase()
  const title = service.title.toLowerCase()
  const tag = String(service.tag ?? '').toLowerCase()

  if (id.includes('finance') || title.includes('finance') || tag.includes('finance')) return '/services/finance'
  if (id.includes('compliance') || title.includes('compliance') || tag.includes('compliance')) return '/services/compliance'
  if (
    id.includes('project') ||
    title.includes('project management') ||
    tag.includes('project management')
  ) {
    return '/services/project-management'
  }
  if (
    id === 'service-3' ||
    id.includes('hr') ||
    title.includes('human resources') ||
    title === 'hr department' ||
    tag.includes('human resources')
  ) {
    return '/services/hr'
  }
  return '/services/project-management'
}

function normalizeServiceDetailSections(service: ServiceItem) {
  const rawSections = Array.isArray(service.detail_sections) ? service.detail_sections : []
  return rawSections
    .map((section) => {
      const title = typeof section?.title === 'string' ? section.title.trim() : ''
      const legacyPoints = Array.isArray((section as { points?: unknown }).points)
        ? ((section as { points?: unknown }).points as unknown[])
            .filter((point): point is string => typeof point === 'string')
            .map((point) => point.trim())
            .filter(Boolean)
            .join(' ')
        : ''
      const description = typeof (section as { description?: unknown }).description === 'string'
        ? String((section as { description?: unknown }).description).trim()
        : legacyPoints
      if (!title && !description) return null
      return { title, description }
    })
    .filter((section): section is { title: string; description: string } => section !== null)
}

function resolveCurrentRoute() {
  if (typeof window === 'undefined') return '/home'
  const path = window.location.pathname.toLowerCase()
  if (path !== '/') return path
  const hash = window.location.hash.toLowerCase()
  return hash && hash !== '#' ? hash : '#home'
}

const ADMIN_USERNAME = 'Hello@iankatana.com'
const ADMIN_PASSWORD = 'B@zildog605'
const ADMIN_AUTH_STORAGE_KEY = 'synergy_backend_auth'

function NotFoundPage({ onGoHome }: { onGoHome: () => void }) {
  return (
    <main className="not-found-page">
      <section className="not-found-card">
        <p className="not-found-code">404</p>
        <h1>This page does not exist.</h1>
        <p>
          The link may be outdated or the page has moved. Use the button below to return to the Synergy homepage.
        </p>
        <button type="button" className="not-found-home-btn" onClick={onGoHome}>
          Back to homepage
        </button>
      </section>
    </main>
  )
}

function App() {
  const [dialogMode, setDialogMode] = useState<DialogMode>('none')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [heroProgress, setHeroProgress] = useState(0)
  const [thirdProgress, setThirdProgress] = useState(0)
  const [sixthProgress, setSixthProgress] = useState(0)
  const [footerProgress, setFooterProgress] = useState(0)
  const [showReturnHeader, setShowReturnHeader] = useState(false)
  const [insightsIndex, setInsightsIndex] = useState(0)
  const [isMobileViewport, setIsMobileViewport] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 680 : false,
  )
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [memberEmailCopied, setMemberEmailCopied] = useState(false)
  const [memberEmailLabel, setMemberEmailLabel] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false)
  const [isSubmittingContact, setIsSubmittingContact] = useState(false)
  const [contactSubmissionStatus, setContactSubmissionStatus] = useState('')
  const [jobApplicantName, setJobApplicantName] = useState('')
  const [jobApplicantEmail, setJobApplicantEmail] = useState('')
  const [jobApplicantPhone, setJobApplicantPhone] = useState('')
  const [jobApplicantNote, setJobApplicantNote] = useState('')
  const [jobApplicantCvFile, setJobApplicantCvFile] = useState<File | null>(null)
  const [jobApplicantCvUrl, setJobApplicantCvUrl] = useState('')
  const [isUploadingJobApplicantCv, setIsUploadingJobApplicantCv] = useState(false)
  const [jobCvUploadProgress, setJobCvUploadProgress] = useState(0)
  const [isSubmittingJobApplication, setIsSubmittingJobApplication] = useState(false)
  const [jobApplicationStatus, setJobApplicationStatus] = useState('')
  const [showCareersReturnHeader, setShowCareersReturnHeader] = useState(false)
  const [aboutTeamIndex, setAboutTeamIndex] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280,
  )
  const [activeRoute, setActiveRoute] = useState(resolveCurrentRoute)
  const [isBackendAuthenticated, setIsBackendAuthenticated] = useState(false)
  const [backendUsername, setBackendUsername] = useState('')
  const [backendPassword, setBackendPassword] = useState('')
  const [backendAuthError, setBackendAuthError] = useState('')
  const [showBackendPassword, setShowBackendPassword] = useState(false)
  const [hasLoadedContent, setHasLoadedContent] = useState(false)
  const [openServiceDetails, setOpenServiceDetails] = useState<Record<string, number>>({})
  const [siteContent, setSiteContent] = useState<SiteContent>(() => ({
    ...contentApi.fallback,
    team: [],
    services: [],
    insights: [],
    media: [],
    jobs: [],
  }))
  const heroSceneRef = useRef<HTMLElement | null>(null)
  const thirdSceneRef = useRef<HTMLElement | null>(null)
  const sixthSceneRef = useRef<HTMLElement | null>(null)
  const footerSceneRef = useRef<HTMLElement | null>(null)
  const industriesPageRef = useRef<HTMLElement | null>(null)
  const industriesAboutRef = useRef<HTMLElement | null>(null)
  const industriesListRef = useRef<HTMLElement | null>(null)
  const careerCvInputRef = useRef<HTMLInputElement | null>(null)
  const lastScrollYRef = useRef(0)
  const careersLastScrollRef = useRef(0)
  const jobNoteEditor = useEditor({
    extensions: [StarterKit],
    content: '<p></p>',
    editorProps: {
      attributes: {
        class: 'career-note-editor-content',
      },
    },
    onUpdate: ({ editor }) => {
      setJobApplicantNote(editor.getHTML())
    },
  })

  useEffect(() => {
    if (!jobNoteEditor) return
    const currentHtml = jobNoteEditor.getHTML()
    const nextHtml = jobApplicantNote || '<p></p>'
    if (currentHtml !== nextHtml) {
      jobNoteEditor.commands.setContent(nextHtml, { emitUpdate: false })
    }
  }, [jobNoteEditor, jobApplicantNote])

  const navigateWithTransition = useCallback(
    (target: string, options?: { replace?: boolean }) => {
      if (typeof window === 'undefined') return
      const nextUrl = new URL(target, window.location.origin)
      const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
      if (currentPath === nextPath) return

      const applyNavigation = () => {
        if (options?.replace) {
          window.history.replaceState({}, '', nextPath)
        } else {
          window.history.pushState({}, '', nextPath)
        }
        setActiveRoute(resolveCurrentRoute())
        setIsMobileMenuOpen(false)

        if (nextUrl.hash) {
          const hashTarget = document.querySelector(nextUrl.hash)
          if (hashTarget instanceof HTMLElement) {
            hashTarget.scrollIntoView({ block: 'start' })
            return
          }
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      }

      const docWithViewTransition = document as Document & {
        startViewTransition?: (update: () => void) => { finished: Promise<void> }
      }
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (docWithViewTransition.startViewTransition && !prefersReducedMotion) {
        docWithViewTransition.startViewTransition(() => {
          applyNavigation()
        })
        return
      }
      applyNavigation()
    },
    [],
  )

  const heroExit = Math.max(0, Math.min(1, heroProgress / 0.45))
  const expandProgress = Math.max(0, Math.min(1, (heroProgress - 0.45) / 0.27))
  const textReveal = Math.max(0, Math.min(1, (heroProgress - 0.72) / 0.22))
  const heroFade = 1 - heroExit
  const headerSwap = Math.max(0, Math.min(1, (expandProgress - 0.78) / 0.22))
  const lineExit = Math.max(0, Math.min(1, (thirdProgress - 0.32) / 0.28))
  const fourthReveal = Math.max(0, Math.min(1, (thirdProgress - 0.56) / 0.26))
  const leftZoom = Math.max(0, Math.min(1, (thirdProgress - 0.64) / 0.14))
  const rightReveal = Math.max(0, Math.min(1, (thirdProgress - 0.8) / 0.14))
  const serviceCards = useMemo(
    () =>
      siteContent.services.map((service) => ({
        ...service,
        href: resolveServiceHref(service),
      })),
    [siteContent.services],
  )
  const aboutTeamMembers = siteContent.team
  const aboutTeamVisibleCards = isMobileViewport ? 1 : viewportWidth >= 1440 ? 4 : viewportWidth >= 1024 ? 3 : 2
  const aboutTeamMaxSlideIndex = Math.max(0, aboutTeamMembers.length - aboutTeamVisibleCards)
  const aboutTeamVisualDotCount = 4
  const aboutTeamDotTargets = useMemo(
    () =>
      Array.from({ length: aboutTeamVisualDotCount }, (_, index) => {
        if (aboutTeamMaxSlideIndex === 0) return 0
        return Math.round((index / (aboutTeamVisualDotCount - 1)) * aboutTeamMaxSlideIndex)
      }),
    [aboutTeamMaxSlideIndex],
  )
  const aboutTeamActiveVisualDot = aboutTeamMaxSlideIndex === 0
    ? 0
    : Math.round((aboutTeamIndex / aboutTeamMaxSlideIndex) * (aboutTeamVisualDotCount - 1))
  const projectHeroItems = useMemo(
    () =>
      siteContent.insights.length > 0
        ? siteContent.insights
        : contentApi.fallback.insights,
    [siteContent.insights],
  )
  const activeProjectHero = projectHeroItems[Math.min(insightsIndex, Math.max(0, projectHeroItems.length - 1))] ?? null
  const homepageFeaturedServices = useMemo(() => serviceCards.slice(0, 3), [serviceCards])
  const homepageServicesHref = serviceCards[0]?.href ?? '/services/project-management'
  const servicesPageCards = useMemo(
    () =>
      serviceCards.length > 0
        ? serviceCards
        : contentApi.fallback.services.map((service) => ({
            ...service,
            href: resolveServiceHref(service),
          })),
    [serviceCards],
  )

  useEffect(() => {
    const computeProgress = (element: HTMLElement | null) => {
      if (!element) return 0
      const rect = element.getBoundingClientRect()
      const maxTravel = Math.max(1, rect.height - window.innerHeight)
      const raw = -rect.top / maxTravel
      return Math.min(1, Math.max(0, raw))
    }

    const computeFooterProgress = (element: HTMLElement | null) => {
      if (!element) return 0
      const rect = element.getBoundingClientRect()
      const end = -rect.height * 0.45
      const raw = -rect.top / Math.abs(end)
      return Math.min(1, Math.max(0, raw))
    }

    const onScroll = () => {
      const currentScrollY = window.scrollY || 0
      const nextHeroProgress = computeProgress(heroSceneRef.current)
      const nextFooterProgress = computeFooterProgress(footerSceneRef.current)
      const scrollingUp = currentScrollY < lastScrollYRef.current - 4
      const scrollingDown = currentScrollY > lastScrollYRef.current + 4
      const heroFullyPassed = nextHeroProgress > 0.98
      const returnHeaderEligible = currentScrollY > window.innerHeight + 40
      const footerActive = nextFooterProgress > 0.02

      setShowReturnHeader((previous) => {
        if (!heroFullyPassed || !returnHeaderEligible || footerActive) return false
        if (scrollingUp) return true
        if (scrollingDown) return false
        return previous
      })

      lastScrollYRef.current = currentScrollY

      setHeroProgress(nextHeroProgress)
      setThirdProgress(computeProgress(thirdSceneRef.current))
      setSixthProgress(computeProgress(sixthSceneRef.current))
      setFooterProgress(nextFooterProgress)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    const onLinkClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target as HTMLElement | null
      const link = target?.closest('a[href]') as HTMLAnchorElement | null
      if (!link) return
      if (link.target && link.target !== '_self') return
      if (link.hasAttribute('download')) return

      const href = link.getAttribute('href')
      if (!href || (!href.startsWith('/') && !href.startsWith('#'))) return

      event.preventDefault()
      navigateWithTransition(href)
    }

    document.addEventListener('click', onLinkClick)
    return () => document.removeEventListener('click', onLinkClick)
  }, [navigateWithTransition])

  useEffect(() => {
    setInsightsIndex((previous) => {
      if (projectHeroItems.length === 0) return 0
      return Math.min(previous, projectHeroItems.length - 1)
    })
  }, [projectHeroItems.length])

  useEffect(() => {
    setAboutTeamIndex((previous) => {
      if (aboutTeamMembers.length === 0) return 0
      return Math.min(previous, aboutTeamMaxSlideIndex)
    })
  }, [aboutTeamMaxSlideIndex, aboutTeamMembers.length])

  useEffect(() => {
    const onResize = () => {
      setIsMobileViewport(window.innerWidth <= 680)
      setViewportWidth(window.innerWidth)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const heroVars = {
    '--hero-progress': heroProgress,
    '--hero-fade': heroFade,
    '--expand-progress': expandProgress,
    '--text-reveal': textReveal,
  } as CSSProperties

  const headerBlendVars = {
    '--header-swap': headerSwap,
  } as CSSProperties

  const thirdVars = {
    '--line-exit': lineExit,
    '--fourth-reveal': fourthReveal,
    '--left-zoom': leftZoom,
    '--right-reveal': rightReveal,
  } as CSSProperties

  const sixthVars = {
    '--sixth-progress': sixthProgress,
  } as CSSProperties

  const footerVars = {
    '--footer-progress': footerProgress,
  } as CSSProperties

  const loadContent = async () => {
    try {
      const includeInactive =
        typeof window !== 'undefined' && window.location.pathname.toLowerCase().startsWith('/backend')
      const next = await contentApi.getSiteContent({ includeInactive })
      setSiteContent(next)
    } finally {
      setHasLoadedContent(true)
    }
  }

  useEffect(() => {
    void loadContent()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsBackendAuthenticated(window.sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === '1')
  }, [])

  useEffect(() => {
    const faviconUrl = siteContent.branding.favicon_url
    if (!faviconUrl) return
    let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = faviconUrl
  }, [siteContent.branding.favicon_url])

  useEffect(() => {
    const syncRoute = () => {
      setActiveRoute(resolveCurrentRoute())
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
    syncRoute()
    window.addEventListener('hashchange', syncRoute)
    window.addEventListener('popstate', syncRoute)
    return () => {
      window.removeEventListener('hashchange', syncRoute)
      window.removeEventListener('popstate', syncRoute)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const pathname = window.location.pathname.toLowerCase()
    if (!pathname.startsWith('/admin')) return
    window.history.replaceState({}, '', '/')
    setActiveRoute(resolveCurrentRoute())
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [activeRoute])

  useEffect(() => {
    if (!selectedMember) {
      setMemberEmailCopied(false)
      setMemberEmailLabel('')
      return
    }
    setMemberEmailCopied(false)
    setMemberEmailLabel(selectedMember.email)
  }, [selectedMember])

  useEffect(() => {
    setJobApplicationStatus('')
    setJobApplicantName('')
    setJobApplicantEmail('')
    setJobApplicantPhone('')
    setJobApplicantNote('')
    setJobApplicantCvFile(null)
  }, [activeRoute])

  const isBackendPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/backend')
  const adminPage: AdminPage = (() => {
    if (typeof window === 'undefined') return 'dashboard'
    const part = window.location.pathname.replace(/^\/backend\/?/, '').split('/')[0]
    if (!part) return 'dashboard'
    if (part === 'branding' || part === 'smtp' || part === 'team' || part === 'services' || part === 'insights' || part === 'media' || part === 'careers') return part
    return 'dashboard'
  })()
  const homepageTeam = siteContent.team.slice(0, 6)
  const teamCols = [
    homepageTeam.slice(0, 3),
    homepageTeam.slice(3, 6),
  ]

  const submitBackendLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (backendUsername === ADMIN_USERNAME && backendPassword === ADMIN_PASSWORD) {
      setIsBackendAuthenticated(true)
      setBackendAuthError('')
      setBackendPassword('')
      if (typeof window !== 'undefined') window.sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, '1')
      return
    }
    setBackendAuthError('Invalid credentials. Please use the provided admin username and password.')
  }

  if (isBackendPath) {
    if (!isBackendAuthenticated) {
      return (
        <main className="backend-login-page">
          <section className="backend-login-card">
            <p className="backend-login-kicker">Backend access</p>
            <h1>Admin login</h1>
            <p>Sign in with your admin username and password to access the backend.</p>
            <form className="backend-login-form" onSubmit={submitBackendLogin}>
              <label>
                Username
                <input
                  type="email"
                  value={backendUsername}
                  onChange={(event) => {
                    setBackendUsername(event.target.value)
                    if (backendAuthError) setBackendAuthError('')
                  }}
                  autoComplete="username"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type={showBackendPassword ? 'text' : 'password'}
                  value={backendPassword}
                  onChange={(event) => {
                    setBackendPassword(event.target.value)
                    if (backendAuthError) setBackendAuthError('')
                  }}
                  autoComplete="current-password"
                  required
                />
              </label>
              <label className="backend-login-toggle">
                <input
                  type="checkbox"
                  checked={showBackendPassword}
                  onChange={(event) => setShowBackendPassword(event.target.checked)}
                />
                Show password
              </label>
              {backendAuthError ? <p className="backend-login-error">{backendAuthError}</p> : null}
              <button type="submit" className="backend-login-submit">Login</button>
            </form>
          </section>
        </main>
      )
    }
    return (
      <AdminDashboard
        page={adminPage}
        branding={siteContent.branding}
        team={siteContent.team}
        services={siteContent.services}
        insights={siteContent.insights}
        media={siteContent.media}
        jobs={siteContent.jobs}
        onRefresh={loadContent}
      />
    )
  }

  const copyMemberEmail = async () => {
    if (!selectedMember) return
    const email = selectedMember.email
    try {
      await navigator.clipboard.writeText(email)
      setMemberEmailCopied(true)
      const copiedWord = 'Copied'
      setMemberEmailLabel('')
      copiedWord.split('').forEach((char, index) => {
        window.setTimeout(() => {
          setMemberEmailLabel((prev) => prev + char)
        }, index * 70)
      })
      window.setTimeout(() => {
        setMemberEmailCopied(false)
        setMemberEmailLabel(email)
      }, 1450)
    } catch {
      setMemberEmailCopied(false)
      setMemberEmailLabel(email)
    }
  }

  const navClass = (route: string) => (activeRoute === route ? 'active' : '')
  const normalizedActiveRoute = activeRoute.toLowerCase()
  const activePathname = normalizedActiveRoute.startsWith('/') ? normalizedActiveRoute : '/'
  const isHomeRoute = activePathname === '/' || activePathname === '/index.html'
  const isServicesRoute = activePathname.startsWith('/services')
  const isProjectsRoute = activePathname === '/projects' || activePathname.startsWith('/projects/')
  const isAboutRoute = activePathname === '/about-us' || activePathname.startsWith('/about-us/')
  const isIndustriesRoute = activePathname === '/industries' || activePathname.startsWith('/industries/')
  const isTermsRoute = activePathname === '/terms-of-use' || activePathname.startsWith('/terms-of-use/')
  const isPrivacyRoute = activePathname === '/privacy-policy' || activePathname.startsWith('/privacy-policy/')
  const isCookieRoute = activePathname === '/cookie-policy' || activePathname.startsWith('/cookie-policy/')
  const isCareersRoute =
    activePathname === '/careers' ||
    activePathname.startsWith('/careers/') ||
    activePathname === '/career' ||
    activePathname.startsWith('/career/')
  const isContactRoute = activePathname === '/contact-us' || activePathname.startsWith('/contact-us/')
  const serviceNavClass = () => (isServicesRoute ? 'active' : '')
  const aboutNavClass = () => (isAboutRoute ? 'active' : '')
  const industriesNavClass = () => (isIndustriesRoute ? 'active' : '')
  const careersNavClass = () => (isCareersRoute ? 'active' : '')
  const contactNavClass = () => (isContactRoute ? 'active' : '')
  const [careersDepartment, setCareersDepartment] = useState('View all')
  const visibleJobs = useMemo(() => {
    const jobs = siteContent.jobs
    if (careersDepartment === 'View all') return jobs
    return jobs.filter((job) => job.department === careersDepartment)
  }, [careersDepartment, siteContent.jobs])
  const careerDepartments = useMemo(() => {
    const uniqueDepartments = Array.from(new Set(siteContent.jobs.map((job) => job.department).filter(Boolean)))
    return ['View all', ...uniqueDepartments]
  }, [siteContent.jobs])
  const selectedCareerId = useMemo(() => {
    if (!isCareersRoute) return ''
    const pathWithoutQuery = activePathname.split('?')[0]
    const normalizedCareerPath = pathWithoutQuery.replace(/^\/careers?\/?/i, '')
    const [firstSegment = ''] = normalizedCareerPath.split('/').filter(Boolean)
    return firstSegment
  }, [activePathname, isCareersRoute])
  const selectedCareerJob = useMemo(
    () => siteContent.jobs.find((job) => job.id.toLowerCase() === selectedCareerId.toLowerCase()) ?? null,
    [selectedCareerId, siteContent.jobs],
  )
  const isCareerDetailRoute = isCareersRoute && selectedCareerId.length > 0
  const homepageHeroMediaSrc = siteContent.branding.homepage_hero_video_url?.trim() ?? ''
  const homepageHeroIsVideo = isVideoMediaSource(homepageHeroMediaSrc)
  const homepageHeroMediaStyle = homepageHeroMediaSrc
    ? ({
        background:
          'linear-gradient(to top, rgba(6, 14, 24, 0.36) 0%, rgba(6, 14, 24, 0.14) 55%, rgba(6, 14, 24, 0.04) 100%)',
      } as CSSProperties)
    : undefined
  const aboutHeroMediaStyle = siteContent.branding.about_hero_background_url
    ? ({
        backgroundImage:
          `linear-gradient(to top, rgba(6, 14, 24, 0.36) 0%, rgba(6, 14, 24, 0.14) 55%, rgba(6, 14, 24, 0.04) 100%), ` +
          `url("${siteContent.branding.about_hero_background_url}")`,
        backgroundSize: 'auto, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
      } as CSSProperties)
    : undefined
  const servicesHeroMediaStyle = siteContent.branding.services_hero_background_url
    ? ({
        backgroundImage:
          `linear-gradient(to top, rgba(6, 14, 24, 0.36) 0%, rgba(6, 14, 24, 0.14) 55%, rgba(6, 14, 24, 0.04) 100%), ` +
          `url("${siteContent.branding.services_hero_background_url}")`,
        backgroundSize: 'auto, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
      } as CSSProperties)
    : aboutHeroMediaStyle
  const contactHeroMediaStyle = siteContent.branding.contact_hero_background_url
    ? ({
        backgroundImage:
          `linear-gradient(to top, rgba(6, 14, 24, 0.36) 0%, rgba(6, 14, 24, 0.14) 55%, rgba(6, 14, 24, 0.04) 100%), ` +
          `url("${siteContent.branding.contact_hero_background_url}")`,
        backgroundSize: 'auto, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
      } as CSSProperties)
    : undefined
  const fallbackServiceCardImage =
    siteContent.branding.services_hero_background_url?.trim() ||
    siteContent.branding.about_hero_background_url?.trim() ||
    ''
  const industriesHeroImage =
    siteContent.branding.industries_hero_background_url?.trim() ||
    fallbackServiceCardImage ||
    '/SYNERGY logo.png'
  const industriesSectors = [
    {
      title: 'Product Distribution',
      description:
        'We operate a scalable distribution network built for speed, consistency, and market reach. From sourcing to last-mile delivery, we manage the full lifecycle of product movement, ensuring brands reach the right retailers efficiently. Our systems-driven approach provides real-time visibility, performance tracking, and reliable supply across regions.',
    },
    {
      title: 'Warehousing & Fulfilment',
      description:
        'We provide structured warehousing and fulfilment solutions designed for efficiency, accuracy, and scalable operations. From inventory management to order processing and distribution coordination, our systems-driven approach ensures reliable handling, streamlined workflows, and operational visibility across the supply chain.',
    },
    {
      title: 'Transport & Freight',
      description:
        'We manage transport and freight operations with a focus on reliability, coordination, and timely delivery. From regional distribution to logistics planning and movement oversight, we ensure efficient transportation processes that support consistent operations across multiple sectors.',
    },
    {
      title: 'Student Accommodation',
      description:
        'We develop and manage modern student living experiences designed for comfort, security, and long-term value. From property operations to booking systems and tenant engagement, we handle the full ecosystem. Our focus is on delivering seamless occupancy, strong retention, and a lifestyle that meets evolving student expectations.',
    },
    {
      title: 'Systems & Web Development',
      description:
        'We design and build powerful digital infrastructure that businesses rely on daily. From custom web platforms to CRMs and automation systems, our solutions are engineered for performance, scalability, and integration. Every system we create is tailored to streamline operations, improve visibility, and support growth.',
    },
    {
      title: 'Marketing',
      description:
        'We drive measurable growth through strategy, data-led marketing. Our approach combines performance campaigns, brand positioning, and customer journey optimization to generate consistent results. From awareness to conversion, we build marketing systems that scale alongside the business.',
    },
    {
      title: 'Design',
      description:
        'We create refined visual and digital experiences that elevate brands. Our design work spans UI/UX, brand identity, and high-end creative assets, all crafted with clarity and intention. Every output is aligned with business goals, ensuring aesthetics translate into real engagement and impact.',
    },
    {
      title: 'Retail',
      description:
        'We build and operate retail brands with a focus on product quality, positioning, and customer experience. From concept to market launch, we manage the full retail lifecycle, including sourcing, branding, and sales channels. Our goal is to create products that resonate and perform in competitive markets.',
    },
    {
      title: 'Industry Development & Operations',
      description:
        'Beyond individual sectors, we actively build, manage, and scale businesses across multiple industries. Our role extends from strategy and setup to execution and optimization, allowing us to create structured, high-performing operations in each vertical we enter.',
    },
    {
      title: 'Construction',
      description:
        'We oversee the planning and execution of construction projects with a focus on quality, efficiency, and long-term value. From initial concept through to delivery, we coordinate design, procurement, and build processes to ensure projects are completed on time and to specification. Our approach combines structured project management with trusted partnerships, enabling us to deliver spaces that meet both functional and investment objectives.',
    },
  ]
  const teamSectionStyle = siteContent.branding.homepage_team_background_url
    ? ({
        backgroundImage:
          `linear-gradient(to top, rgba(8, 39, 74, 0.42) 0%, rgba(8, 39, 74, 0.16) 58%), ` +
          `url("${siteContent.branding.homepage_team_background_url}")`,
        backgroundSize: 'auto, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
      } as CSSProperties)
    : undefined
  const socialMediaItems = useMemo(
    () =>
      siteContent.media
        .filter((item) => item.kind === 'social')
        .map((item) => {
          const candidate = item.link_url || item.value
          const href = normalizeExternalLink(candidate)
          const label = item.label || item.value || 'Social'
          return {
            id: item.id,
            label,
            href,
          }
        })
        .filter((item) => item.href.length > 0)
        .filter((item) => {
          const normalizedLabel = item.label.toLowerCase()
          return normalizedLabel.includes('linkedin') || normalizedLabel.includes('instagram')
        }),
    [siteContent.media],
  )
  const mobileConnectSection = (
    <div className="mobile-menu-social-bubble">
      <p>Connect with us</p>
      <div className="mobile-menu-social-icons">
        {socialMediaItems.map((item) => (
          <a key={`mobile-social-${item.id}`} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label}>
            <SocialIcon name={item.label} />
          </a>
        ))}
      </div>
    </div>
  )
  useEffect(() => {
    if (!isCareersRoute) {
      setShowCareersReturnHeader(false)
      return
    }
    const onCareersScroll = () => {
      const currentScrollY = window.scrollY || 0
      const scrollingUp = currentScrollY < careersLastScrollRef.current - 4
      const scrollingDown = currentScrollY > careersLastScrollRef.current + 4
      setShowCareersReturnHeader((previous) => {
        if (currentScrollY <= 24) return false
        if (scrollingUp) return true
        if (scrollingDown) return false
        return previous
      })
      careersLastScrollRef.current = currentScrollY
    }
    onCareersScroll()
    window.addEventListener('scroll', onCareersScroll, { passive: true })
    window.addEventListener('resize', onCareersScroll)
    return () => {
      window.removeEventListener('scroll', onCareersScroll)
      window.removeEventListener('resize', onCareersScroll)
    }
  }, [isCareersRoute])

  useEffect(() => {
    if (!isIndustriesRoute) return
    if (typeof window === 'undefined') return
    if (!industriesPageRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      const heroCard = industriesPageRef.current?.querySelector('.industries-hero-card')
      const heroHeadline = industriesPageRef.current?.querySelector('.industries-hero-headline')
      const heroHeadlineLines = industriesPageRef.current?.querySelectorAll('.industries-hero-headline h1 span')
      const heroLead = industriesPageRef.current?.querySelector('.industries-hero-headline p')
      const aboutKicker = industriesAboutRef.current?.querySelector('.industries-about-kicker')
      const aboutMain = industriesAboutRef.current?.querySelector('.industries-about-main')
      const aboutStats = industriesAboutRef.current?.querySelectorAll('.industries-about-stats > div')
      const listRows = industriesListRef.current?.querySelectorAll('.industries-list-row')

      if (heroCard && heroHeadline) {
        gsap.fromTo(
          [heroCard, heroHeadline],
          { y: 44, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out' },
        )
      }
      if (heroHeadlineLines && heroHeadlineLines.length > 0) {
        gsap.fromTo(
          heroHeadlineLines,
          { yPercent: 125, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.88, stagger: 0.1, ease: 'power4.out', delay: 0.15 },
        )
      }
      if (heroLead) {
        gsap.fromTo(
          heroLead,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75, ease: 'power2.out', delay: 0.26 },
        )
      }
      if (aboutKicker || aboutMain) {
        gsap.fromTo(
          [aboutKicker, aboutMain],
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.88,
            stagger: 0.14,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: industriesAboutRef.current,
              start: 'top 78%',
              once: true,
            },
          },
        )
      }
      if (aboutStats && aboutStats.length > 0) {
        gsap.fromTo(
          aboutStats,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.72,
            stagger: 0.12,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: industriesAboutRef.current,
              start: 'top 72%',
              once: true,
            },
          },
        )
      }
      if (listRows && listRows.length > 0) {
        listRows.forEach((row) => {
          gsap.fromTo(
            row,
            { y: 56, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.78,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: row,
                start: 'top 86%',
                once: true,
              },
            },
          )
        })
      }
    }, industriesPageRef)

    return () => {
      context.revert()
    }
  }, [isIndustriesRoute])
  const navigateToContact = () => {
    navigateWithTransition('/contact-us')
    setIsMobileMenuOpen(false)
  }
  const uploadJobApplicantCv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setJobApplicantCvFile(file)
    setJobApplicantCvUrl('')
    setJobCvUploadProgress(0)
    if (!file) return

    const maxCvFileSizeBytes = 10 * 1024 * 1024
    const allowedCvFormats = ['pdf', 'doc', 'docx']
    const selectedCvExt = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!allowedCvFormats.includes(selectedCvExt)) {
      setJobApplicantCvFile(null)
      setJobApplicationStatus('Please upload a CV in PDF, DOC, or DOCX format.')
      return
    }
    if (file.size > maxCvFileSizeBytes) {
      setJobApplicantCvFile(null)
      setJobApplicationStatus('CV file size must be 10MB or less.')
      return
    }

    setJobApplicationStatus('')
    setIsUploadingJobApplicantCv(true)
    try {
      const uploadedCv = await contentApi.uploadMedia(file, 'career-cv', (percent) => {
        setJobCvUploadProgress(percent)
      })
      setJobApplicantCvUrl(uploadedCv.publicUrl)
      setJobCvUploadProgress(100)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CV upload failed.'
      setJobApplicationStatus(message)
      setJobApplicantCvUrl('')
      setJobCvUploadProgress(0)
    } finally {
      setIsUploadingJobApplicantCv(false)
    }
  }

  const submitJobApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedCareerJob) return
    const coverNoteHtml = sanitizeRichHtml(jobApplicantNote).trim()
    const coverNoteText = stripHtml(coverNoteHtml)
    if (!coverNoteText) {
      setJobApplicationStatus('Please add a short note about why you are a great fit.')
      return
    }
    if (!jobApplicantCvFile) {
      setJobApplicationStatus('Please upload your CV before submitting.')
      return
    }
    if (isUploadingJobApplicantCv) {
      setJobApplicationStatus('CV upload is in progress. Please wait for it to finish.')
      return
    }
    if (!jobApplicantCvUrl) {
      setJobApplicationStatus('CV upload failed or is missing. Please re-upload your CV.')
      return
    }
    setIsSubmittingJobApplication(true)
    setJobApplicationStatus('')
    try {
      await contentApi.submitJobApplication({
        job_id: selectedCareerJob.id,
        job_title: selectedCareerJob.title,
        job_department: selectedCareerJob.department,
        notification_email: selectedCareerJob.notification_email ?? undefined,
        full_name: jobApplicantName.trim(),
        email: jobApplicantEmail.trim(),
        phone: jobApplicantPhone.trim(),
        cover_note: coverNoteHtml,
        cv_url: jobApplicantCvUrl,
      })
      setJobApplicationStatus('Application sent successfully. Our team will contact you shortly.')
      setJobApplicantName('')
      setJobApplicantEmail('')
      setJobApplicantPhone('')
      setJobApplicantNote('')
      setJobApplicantCvFile(null)
      setJobApplicantCvUrl('')
      setJobCvUploadProgress(0)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit application.'
      setJobApplicationStatus(message)
    } finally {
      setIsSubmittingJobApplication(false)
    }
  }
  const submitContactInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fullName = contactName.trim()
    const email = contactEmail.trim()
    const phone = contactPhone.trim()
    const message = contactMessage.trim()
    if (!fullName || !email || !phone || !message) {
      setContactSubmissionStatus('Please complete all contact fields before submitting.')
      return
    }
    setIsSubmittingContact(true)
    setContactSubmissionStatus('')
    try {
      await contentApi.submitContactInquiry({
        full_name: fullName,
        email,
        phone,
        message,
      })
      setContactSubmissionStatus('Message sent successfully. We will contact you shortly.')
      setContactName('')
      setContactEmail('')
      setContactPhone('')
      setContactMessage('')
      if (typeof window !== 'undefined' && window.innerWidth <= 680) {
        setIsContactSheetOpen(false)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send contact message.'
      setContactSubmissionStatus(message)
    } finally {
      setIsSubmittingContact(false)
    }
  }
  const activeServiceCard =
    serviceCards.find((service) => service.href.toLowerCase() === activePathname) ?? null

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return

    const defaultTitle = 'Synergy Project Management'
    const defaultDescription =
      'Synergy Project Management provides integrated project management, compliance, HR, and finance delivery services in Dubai and beyond.'
    const ogImage = '/og-image.webp'
    const currentPath = window.location.pathname || '/'
    const currentUrl = `${window.location.origin}${currentPath}`

    let pageTitle = defaultTitle
    let pageDescription = defaultDescription

    if (isServicesRoute) {
      if (activeServiceCard) {
        pageTitle = `${activeServiceCard.title} | Synergy Services`
        pageDescription = clampMetaDescription(
          `${activeServiceCard.description} Synergy Project Management delivers integrated execution, governance, and operational support.`,
        )
      } else {
        pageTitle = 'Services | Synergy Project Management'
        pageDescription = clampMetaDescription(
          'Explore Synergy services across project management, compliance, HR, and finance with one coordinated delivery model.',
        )
      }
    } else if (isProjectsRoute) {
      pageTitle = 'Projects | Synergy Project Management'
      pageDescription = clampMetaDescription(
        'View Synergy project outcomes and strategic execution highlights across finance, compliance, HR, and delivery operations.',
      )
    } else if (isAboutRoute) {
      pageTitle = 'About Us | Synergy Project Management'
      pageDescription = clampMetaDescription(
        'Learn about Synergy Project Management, our multidisciplinary team, and how we align departments into one growth-ready operating system.',
      )
    } else if (isIndustriesRoute) {
      pageTitle = 'Industries | Synergy Project Management'
      pageDescription = clampMetaDescription(
        'Explore Synergy industries across distribution, accommodation, digital systems, marketing, design, retail, operations, and construction.',
      )
    } else if (isTermsRoute) {
      pageTitle = 'Terms of Use | Synergy Project Management'
      pageDescription = clampMetaDescription(
        'Read the Terms of Use for accessing and using the Synergy Project Management website.',
      )
    } else if (isPrivacyRoute) {
      pageTitle = 'Privacy Policy | Synergy Project Management'
      pageDescription = clampMetaDescription(
        'Read how Synergy Project Management handles personal data and protects your privacy.',
      )
    } else if (isCookieRoute) {
      pageTitle = 'Cookie Policy | Synergy Project Management'
      pageDescription = clampMetaDescription(
        'Learn how Synergy Project Management uses cookies and related technologies on this website.',
      )
    } else if (isCareersRoute) {
      if (selectedCareerJob) {
        const detailSource = selectedCareerJob.job_description_html
          ? stripHtml(selectedCareerJob.job_description_html)
          : selectedCareerJob.summary
        pageTitle = `${selectedCareerJob.title} | Careers at Synergy`
        pageDescription = clampMetaDescription(
          `${detailSource || selectedCareerJob.title} Apply to join Synergy Project Management in ${selectedCareerJob.location_label || 'Dubai'}.`,
        )
      } else {
        pageTitle = 'Careers | Synergy Project Management'
        pageDescription = clampMetaDescription(
          'Explore open roles at Synergy Project Management and join our mission across project management, compliance, HR, and finance.',
        )
      }
    } else if (isContactRoute) {
      pageTitle = 'Contact Us | Synergy Project Management'
      pageDescription = clampMetaDescription(
        'Contact Synergy Project Management to discuss your project, compliance, HR, or finance requirements.',
      )
    } else if (isHomeRoute) {
      pageTitle = defaultTitle
      pageDescription = defaultDescription
    }

    if (currentPath.startsWith('/backend')) {
      pageTitle = 'Admin Backend | Synergy Project Management'
      pageDescription = 'Secure backend access for Synergy Project Management administrators.'
    }

    const ensureMetaByName = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    const ensureMetaByProperty = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('property', property)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    const ensureCanonical = (href: string) => {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        document.head.appendChild(link)
      }
      link.setAttribute('href', href)
    }

    document.title = pageTitle
    ensureMetaByName('description', pageDescription)
    ensureMetaByName('robots', currentPath.startsWith('/backend') ? 'noindex, nofollow' : 'index, follow')
    ensureMetaByProperty('og:type', 'website')
    ensureMetaByProperty('og:site_name', 'Synergy Project Management')
    ensureMetaByProperty('og:title', pageTitle)
    ensureMetaByProperty('og:description', pageDescription)
    ensureMetaByProperty('og:url', currentUrl)
    ensureMetaByProperty('og:image', ogImage)
    ensureMetaByProperty('og:image:alt', 'Synergy Project Management')
    ensureMetaByName('twitter:card', 'summary_large_image')
    ensureMetaByName('twitter:title', pageTitle)
    ensureMetaByName('twitter:description', pageDescription)
    ensureMetaByName('twitter:image', ogImage)
    ensureCanonical(currentUrl)
  }, [
    activeServiceCard,
    isAboutRoute,
    isIndustriesRoute,
    isCookieRoute,
    isCareersRoute,
    isContactRoute,
    isHomeRoute,
    isPrivacyRoute,
    isProjectsRoute,
    isServicesRoute,
    isTermsRoute,
    selectedCareerJob,
  ])

  useEffect(() => {
    if (activePathname === '/services/project-management' || activePathname === '/services/general') {
      navigateWithTransition('/services/', { replace: true })
    }
  }, [activePathname, navigateWithTransition])

  if (isServicesRoute && !activeServiceCard && !hasLoadedContent) {
    return <main className="services-page-shell" />
  }

  // Projects page intentionally retired; route now resolves to not found.
  if (isProjectsRoute) {
    return <NotFoundPage onGoHome={() => navigateWithTransition('/', { replace: true })} />
  }

  const sharedFooterSection = (
    <section ref={footerSceneRef} className="footer-scene" style={footerVars}>
      <div className="footer-sticky">
        <div className="footer-reference-shell">
          <div className="footer-reference-hero">
            <div>
              <p className="footer-reference-kicker">Get started</p>
              <h2>Reimagine What Your Business Can Achieve</h2>
            </div>
            <p>
              We help leaders navigate complexity, solve critical challenges, and build stronger,
              more resilient organizations for the future.
            </p>
          </div>
          <div className="footer-reference-newsletter-row">
            <form className="footer-reference-newsletter-card">
              <span>Sign up for updates</span>
              <input type="email" placeholder="name@email.com" />
              <button type="button">Subscribe</button>
            </form>
            <a href="/contact-us" className="footer-reference-start-card">
              <span>Get started</span>
              <span aria-hidden="true">
                <UpRightArrowIcon />
              </span>
            </a>
          </div>
          <div className="footer-reference-links-card">
            <div className="footer-reference-col">
              <p>Address</p>
              <span>Onyx Tower 1, The Greens{'\n'}Dubai, United Arab Emirates</span>
              <p>Connect with us</p>
              <div className="footer-reference-socials">
                {socialMediaItems.map((item) => (
                  <a key={`footer-social-${item.id}`} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label}>
                    <SocialIcon name={item.label} />
                    <span className="footer-social-label">{item.label}</span>
                  </a>
                ))}
              </div>
            </div>
            <div className="footer-reference-col">
              <p>Links</p>
              <a href="/">Home</a>
              <a href="/about-us">About</a>
              <a href="/services/project-management">Services</a>
              <a href="/industries">Industries</a>
              <a href="/contact-us">Contact</a>
            </div>
            <div className="footer-reference-col">
              <p>Legal</p>
              <a href="/privacy-policy">Privacy Policy</a>
              <a href="/terms-of-use">Terms of Use</a>
              <a href="/cookie-policy">Cookie Policy</a>
            </div>
          </div>
          <div className="footer-reference-bottom">
            <div className="footer-reference-bottom-left">
              <img src="/SYNERGY logo.png" alt={siteContent.branding.company_name} className="footer-reference-logo" />
              <span>Copyright © 2026</span>
            </div>
            <span>All rights reserved.</span>
          </div>
        </div>
      </div>
    </section>
  )

  if (isProjectsRoute) {
    const activeProjectHeroBackground = activeProjectHero?.hero_image_url?.trim()
      || activeProjectHero?.image_url?.trim()
      || fallbackServiceCardImage
    const activeProjectStatus = activeProjectHero?.chip?.replace(/^Status:\s*/i, '').trim() ?? ''
    const activeProjectLocation = activeProjectHero?.date_label?.replace(/^Location:\s*/i, '').trim() ?? ''
    const activeProjectDescriptionHtml = sanitizeProjectHtml(activeProjectHero?.project_description_html).trim()
    return (
      <>
        <main className="projects-page-shell">
          <section className="about-page-hero services-reimagined-hero projects-page-hero">
            <div className="about-page-hero-visual-frame" aria-hidden="true">
              <div
                className="about-page-hero-media projects-page-hero-media"
                style={{
                  backgroundImage: `url("${activeProjectHeroBackground}")`,
                }}
              />
            </div>
            <header className="top-nav about-page-header">
              <div className="nav-bubble">
                <a className="brand" href="/">
                  <img
                    src="/SYNERGY logo.png"
                    alt={siteContent.branding.company_name}
                    className="brand-wordmark-image about-brand-desktop"
                  />
                  <img
                    src="/SYNERGY logo.png"
                    alt={siteContent.branding.company_name}
                    className="brand-wordmark-image about-brand-mobile"
                  />
                </a>
                <nav className="menu">
                  <a href="/" className={navClass('#home')}>Home</a>
                  <a href="/services/project-management" className={serviceNavClass()}>Services</a>
                  <a href="/industries" className={industriesNavClass()}>Industries</a>
                  <a href="/about-us" className={aboutNavClass()}>About us</a>
                  <a href="/careers" className={careersNavClass()}>Careers</a>
                  <a href="/contact-us" className={contactNavClass()}>Contact us</a>
                </nav>
                <button
                  className="menu-toggle"
                  onClick={() => setIsMobileMenuOpen((open) => !open)}
                  aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-nav-drawer"
                >
                  {isMobileMenuOpen ? 'Close' : 'Menu'}
                </button>
              </div>
              <button className="call-btn" onClick={navigateToContact}>
                Get in touch
                <span className="call-btn-icon" aria-hidden="true">
                  <UpRightArrowIcon />
                </span>
              </button>
            </header>
            <div
              className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden={!isMobileMenuOpen}
            />
            <aside
              id="mobile-nav-drawer"
              className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}
              aria-hidden={!isMobileMenuOpen}
            >
              <div className="mobile-menu-header">
                <p className="mobile-menu-title">Menu</p>
                <button
                  type="button"
                  className="mobile-menu-close"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  ×
                </button>
              </div>
              <nav className="mobile-menu-links">
                <a href="/" className={navClass('#home')} onClick={() => setIsMobileMenuOpen(false)}>
                  Home
                </a>
                <a
                  href="/services/project-management"
                  className={serviceNavClass()}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Services
                </a>
                <a href="/industries" className={industriesNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                  Industries
                </a>
                <a href="/about-us" className={aboutNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                  About us
                </a>
                <a href="/careers" className={careersNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                  Careers
                </a>
                <a href="/contact-us" className={contactNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                  Contact us
                </a>
              </nav>
              {mobileConnectSection}
              <button
                className="mobile-menu-call"
                onClick={() => {
                  navigateToContact()
                }}
              >
                Get in touch
              </button>
            </aside>
            <div className="about-page-hero-content projects-page-hero-content">
              <div className="projects-page-hero-copy">
                <p className="eyebrow">Project info</p>
                <h1>{activeProjectHero ? formatProjectTitle(activeProjectHero.title) : 'Experience That Builds Outcomes.'}</h1>
                <p className="subtitle">{activeProjectStatus || 'Status details will appear here.'}</p>
                <p className="subtitle projects-page-hero-location">
                  {activeProjectLocation || 'Location details will appear here.'}
                </p>
              </div>
              <div className="projects-page-hero-thumbnails-wrap">
                <div className="projects-page-hero-thumbnails" role="tablist" aria-label="Project hero selector">
                  {projectHeroItems.map((project, index) => {
                    const thumbSrc = project.image_url?.trim() || project.hero_image_url?.trim() || ''
                    const isActive = index === Math.min(insightsIndex, Math.max(0, projectHeroItems.length - 1))
                    const projectTitleText = String(project.title ?? 'Project')
                    return (
                      <button
                        type="button"
                        key={`project-hero-thumb-${project.id}`}
                        className={`projects-page-hero-thumbnail ${isActive ? 'active' : ''}`}
                        onClick={() => setInsightsIndex(index)}
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`Show ${projectTitleText}`}
                      >
                        {thumbSrc ? <img src={thumbSrc} alt={projectTitleText} loading="lazy" /> : null}
                        <span>{formatProjectTitle(project.title)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
          {activeProjectDescriptionHtml ? (
            <section className="services-problem-section projects-problem-section" aria-label="Project description">
              <div className="services-problem-inner">
                <p className="services-problem-kicker">Project overview</p>
                <div
                  className="projects-problem-rich"
                  dangerouslySetInnerHTML={{ __html: activeProjectDescriptionHtml }}
                />
              </div>
            </section>
          ) : null}
        </main>
        {sharedFooterSection}
      </>
    )
  }

  if (isAboutRoute) {
    return (
      <>
        <main className="about-page-shell">
          <section className="about-page-hero">
          <div className="about-page-hero-visual-frame" aria-hidden="true">
            <div className="about-page-hero-media" style={aboutHeroMediaStyle} />
          </div>
          <header className="top-nav about-page-header">
            <div className="nav-bubble">
              <a className="brand" href="/">
                <img
                  src="/syngergy-logo.png"
                  alt={siteContent.branding.company_name}
                  className="brand-wordmark-image about-brand-desktop"
                />
                <img
                  src="/SYNERGY logo.png"
                  alt={siteContent.branding.company_name}
                  className="brand-wordmark-image about-brand-mobile"
                />
              </a>
              <nav className="menu">
                <a href="/" className={navClass('#home')}>Home</a>
                <a href="/services/project-management" className={serviceNavClass()}>Services</a>
                <a href="/industries" className={industriesNavClass()}>Industries</a>
                <a href="/about-us" className={aboutNavClass()}>About us</a>
                <a href="/careers" className={careersNavClass()}>Careers</a>
                <a href="/contact-us" className={contactNavClass()}>Contact us</a>
              </nav>
              <button
                className="menu-toggle"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-nav-drawer"
              >
                {isMobileMenuOpen ? 'Close' : 'Menu'}
              </button>
            </div>
            <button className="call-btn" onClick={navigateToContact}>
              Get in touch
              <span className="call-btn-icon" aria-hidden="true">
                <UpRightArrowIcon />
              </span>
            </button>
          </header>
          <div
            className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden={!isMobileMenuOpen}
          />
          <aside
            id="mobile-nav-drawer"
            className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}
            aria-hidden={!isMobileMenuOpen}
          >
            <div className="mobile-menu-header">
              <p className="mobile-menu-title">Menu</p>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <nav className="mobile-menu-links">
              <a href="/" className={navClass('#home')} onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </a>
              <a
                href="/services/project-management"
                className={serviceNavClass()}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Services
              </a>
              <a href="/industries" className={industriesNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                Industries
              </a>
              <a href="/about-us" className={aboutNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                About us
              </a>
              <a href="/careers" className={careersNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                Careers
              </a>
              <a href="/contact-us" className={contactNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                Contact us
              </a>
            </nav>
            {mobileConnectSection}
            <button
              className="mobile-menu-call"
              onClick={() => {
                navigateToContact()
              }}
            >
              Get in touch
            </button>
          </aside>
          <div className="about-page-hero-content">
            <p className="eyebrow">{siteContent.branding.hero_eyebrow}</p>
            <h1 className="services-hero-title">
              <span className="services-hero-title-primary">Experience</span>
              <span className="services-hero-title-secondary">That Builds Outcomes.</span>
            </h1>
            <p className="subtitle">
              {siteContent.branding.hero_subtitle}
            </p>
          </div>
        </section>
        <section className="home-services-section about-home-services-section" aria-label="Services showcase">
          <div className="home-services-header">
            <p>SERVICES</p>
            <div className="home-services-heading-row">
              <h2>Built for Real Business Outcomes</h2>
              <button
                type="button"
                className="home-services-view-all primary"
                onClick={() => navigateWithTransition(homepageServicesHref)}
              >
                View all services
                <span aria-hidden="true">
                  <UpRightArrowIcon />
                </span>
              </button>
            </div>
          </div>
          <div className="home-services-grid">
            {homepageFeaturedServices.map((service) => {
              const resolvedImage = typeof service.image_url === 'string' && service.image_url.trim().length > 0
                ? service.image_url.trim()
                : fallbackServiceCardImage
              return (
                <article key={`home-service-${service.id}`} className="home-services-item">
                  <a
                    href={service.href}
                    className="home-services-card"
                    onClick={(event) => {
                      event.preventDefault()
                      navigateWithTransition(service.href)
                    }}
                    style={
                      resolvedImage
                        ? ({
                            backgroundImage: `url("${resolvedImage}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          } as CSSProperties)
                        : undefined
                    }
                  >
                    <span className="home-services-card-arrow" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M8 16L16 8M10 8h6v6" />
                      </svg>
                    </span>
                    <h3>{service.title}</h3>
                  </a>
                  <p>{service.description}</p>
                </article>
              )
            })}
          </div>
        </section>
        <section className="about-team-section" aria-label="Our team">
          <header className="about-team-header">
            <div className="about-team-heading-row">
              <div className="about-team-heading-left">
                <h2>Our team</h2>
              </div>
              <div className="about-team-nav-arrows" aria-label="Team navigation">
                <button
                  type="button"
                  className="about-team-nav-arrow"
                  onClick={() => setAboutTeamIndex((index) => Math.max(0, index - 1))}
                  disabled={aboutTeamIndex <= 0}
                  aria-label="Previous team slide"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="about-team-nav-arrow"
                  onClick={() => setAboutTeamIndex((index) => Math.min(aboutTeamMaxSlideIndex, index + 1))}
                  disabled={aboutTeamIndex >= aboutTeamMaxSlideIndex}
                  aria-label="Next team slide"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>
            <p>
              We combine leadership, coordination, and specialist expertise to keep every program aligned, proactive,
              and consistently delivered to the highest standard.
            </p>
          </header>
          <div className="about-team-cards-viewport">
            <div
              className="about-team-cards-track"
              style={
                {
                  '--about-team-slide-offset': aboutTeamIndex,
                  '--about-team-visible-cards': aboutTeamVisibleCards,
                } as CSSProperties
              }
            >
              {aboutTeamMembers.map((member) => (
                <article
                  className="about-team-card"
                  key={member.id}
                >
                  <div className="about-team-card-media">
                    <AboutTeamCardImage member={member} />
                  </div>
                  <div className="about-team-card-meta">
                    <h3>{member.name}</h3>
                    <p>{member.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="about-team-dots" role="tablist" aria-label="Our team navigation">
            {aboutTeamDotTargets.map((targetIndex, index) => (
              <button
                key={`about-team-dot-${index}`}
                type="button"
                className={`about-team-dot ${aboutTeamActiveVisualDot === index ? 'active' : ''}`}
                onClick={() => setAboutTeamIndex(targetIndex)}
                aria-label={`Show team slide ${index + 1}`}
                aria-selected={aboutTeamActiveVisualDot === index}
              />
            ))}
          </div>
          </section>
        </main>
        {sharedFooterSection}
      </>
    )
  }

  if (isIndustriesRoute) {
    return (
      <>
        <main className="industries-page-shell" ref={industriesPageRef}>
          <section className="industries-hero">
            <header className="top-nav about-page-header">
              <div className="nav-bubble">
                <a className="brand" href="/">
                  <img
                    src="/SYNERGY logo.png"
                    alt={siteContent.branding.company_name}
                    className="brand-wordmark-image about-brand-desktop"
                  />
                  <img
                    src="/SYNERGY logo.png"
                    alt={siteContent.branding.company_name}
                    className="brand-wordmark-image about-brand-mobile"
                  />
                </a>
                <nav className="menu">
                  <a href="/" className={navClass('#home')}>Home</a>
                  <a href="/services/project-management" className={serviceNavClass()}>Services</a>
                  <a href="/industries" className={industriesNavClass()}>Industries</a>
                  <a href="/about-us" className={aboutNavClass()}>About us</a>
                  <a href="/careers" className={careersNavClass()}>Careers</a>
                  <a href="/contact-us" className={contactNavClass()}>Contact us</a>
                </nav>
                <button
                  className="menu-toggle"
                  onClick={() => setIsMobileMenuOpen((open) => !open)}
                  aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-nav-drawer"
                >
                  {isMobileMenuOpen ? 'Close' : 'Menu'}
                </button>
              </div>
              <button className="call-btn" onClick={navigateToContact}>
                Get in touch
                <span className="call-btn-icon" aria-hidden="true">
                  <UpRightArrowIcon />
                </span>
              </button>
            </header>
            <div
              className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden={!isMobileMenuOpen}
            />
            <aside
              id="mobile-nav-drawer"
              className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}
              aria-hidden={!isMobileMenuOpen}
            >
              <div className="mobile-menu-header">
                <p className="mobile-menu-title">Menu</p>
                <button
                  type="button"
                  className="mobile-menu-close"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  ×
                </button>
              </div>
              <nav className="mobile-menu-links">
                <a href="/" className={navClass('#home')} onClick={() => setIsMobileMenuOpen(false)}>
                  Home
                </a>
                <a
                  href="/services/project-management"
                  className={serviceNavClass()}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Services
                </a>
                <a href="/industries" className={industriesNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                  Industries
                </a>
                <a href="/about-us" className={aboutNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                  About us
                </a>
                <a href="/careers" className={careersNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                  Careers
                </a>
                <a href="/contact-us" className={contactNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                  Contact us
                </a>
              </nav>
              {mobileConnectSection}
              <button
                className="mobile-menu-call"
                onClick={() => {
                  navigateToContact()
                }}
              >
                Get in touch
              </button>
            </aside>
            <div className="industries-hero-content">
              <article className="industries-hero-card">
                <p className="industries-hero-card-kicker">Built Across Industries</p>
                <p>
                  We operate, build, and scale businesses across multiple sectors with systems that drive performance
                  and long-term value.
                </p>
                <a className="industries-hero-card-cta" href="/contact-us">
                  Get Started
                  <span aria-hidden="true">
                    <UpRightArrowIcon />
                  </span>
                </a>
              </article>
              <article className="industries-hero-headline">
                <h1>
                  <span>Operating At Scale</span>
                  <span>Delivering Impact</span>
                </h1>
                <p>
                  We build and operate businesses across multiple industries with focus, discipline, and a long-term
                  vision for growth.
                </p>
              </article>
            </div>
            <div className="industries-hero-image" style={{ backgroundImage: `url("${industriesHeroImage}")` }}>
              <div className="industries-hero-image-mark">
                <img src="/SYNERGY logo.png" alt={siteContent.branding.company_name} />
              </div>
            </div>
          </section>

          <section className="industries-about" ref={industriesAboutRef}>
            <div className="industries-about-kicker">// ABOUT US //</div>
            <div className="industries-about-main">
              <h2>
                We are a diversified operations company committed to building and managing businesses across multiple
                industries.
              </h2>
              <p>
                With over 14 years of experience, we bring strategy, systems, and execution together to create
                scalable, sustainable, and high-performing operations.
              </p>
              <div className="industries-about-stats">
                <div>
                  <strong>14 YRS</strong>
                  <span>Of cross-industry experience</span>
                </div>
                <div>
                  <strong>50+</strong>
                  <span>Businesses built and managed</span>
                </div>
              </div>
            </div>
          </section>

          <section className="industries-list" aria-label="Industries" ref={industriesListRef}>
            {industriesSectors.map((sector) => (
              <article key={sector.title} className="industries-list-row">
                <h3>{sector.title}</h3>
                <p>{sector.description}</p>
              </article>
            ))}
          </section>
        </main>
        {sharedFooterSection}
      </>
    )
  }

  if (isContactRoute) {
    const contactForm = (extraClassName = '') => (
      <form
        className={`contact-page-form ${extraClassName}`.trim()}
        onSubmit={submitContactInquiry}
      >
        <input
          type="text"
          value={contactName}
          onChange={(event) => setContactName(event.target.value)}
          placeholder="Your Name"
          required
        />
        <input
          type="email"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          placeholder="Your email Address"
          required
        />
        <PhoneInputComponent
          country="ae"
          value={contactPhone}
          onChange={(value) => setContactPhone(value)}
          inputProps={{
            required: true,
            name: 'phone',
          }}
          placeholder="Your Phone Number"
          enableSearch
          disableSearchIcon
          countryCodeEditable={false}
          containerClass="contact-phone-input-container"
          buttonClass="contact-phone-input-button"
          inputClass="contact-phone-input-field"
          dropdownClass="contact-phone-input-dropdown"
        />
        <textarea
          value={contactMessage}
          onChange={(event) => setContactMessage(event.target.value)}
          placeholder="Your Message"
          rows={6}
          required
        />
        <button type="submit" className="contact-page-form-submit" disabled={isSubmittingContact}>
          <span>{isSubmittingContact ? 'Sending...' : 'Send message'}</span>
          <span className="call-btn-icon" aria-hidden="true">
            <UpRightArrowIcon />
          </span>
        </button>
        {contactSubmissionStatus ? <p className="career-apply-status">{contactSubmissionStatus}</p> : null}
      </form>
    )

    return (
      <main className="contact-page-shell">
        <section className="contact-page-hero">
          <div className="contact-page-hero-visual-frame" aria-hidden="true">
            <div className="contact-page-hero-media" style={contactHeroMediaStyle} />
          </div>
          <header className="top-nav contact-page-header">
            <div className="nav-bubble">
              <a className="brand" href="/">
                <img
                  src="/syngergy-logo.png"
                  alt={siteContent.branding.company_name}
                  className="brand-wordmark-image contact-brand-desktop"
                />
                <img
                  src="/SYNERGY logo.png"
                  alt={siteContent.branding.company_name}
                  className="brand-wordmark-image contact-brand-mobile"
                />
              </a>
              <nav className="menu">
                <a href="/" className={navClass('#home')}>Home</a>
                <a href="/services/project-management" className={serviceNavClass()}>Services</a>
                <a href="/industries" className={industriesNavClass()}>Industries</a>
                <a href="/about-us" className={aboutNavClass()}>About us</a>
                <a href="/careers" className={careersNavClass()}>Careers</a>
                <a href="/contact-us" className={contactNavClass()}>Contact us</a>
              </nav>
              <button
                className="menu-toggle"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-nav-drawer"
              >
                {isMobileMenuOpen ? 'Close' : 'Menu'}
              </button>
            </div>
            <button className="call-btn" onClick={navigateToContact}>
              Get in touch
              <span className="call-btn-icon" aria-hidden="true">
                <UpRightArrowIcon />
              </span>
            </button>
          </header>
          <div
            className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden={!isMobileMenuOpen}
          />
          <aside
            id="mobile-nav-drawer"
            className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}
            aria-hidden={!isMobileMenuOpen}
          >
            <div className="mobile-menu-header">
              <p className="mobile-menu-title">Menu</p>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <nav className="mobile-menu-links">
              <a href="/" className={navClass('#home')} onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </a>
              <a
                href="/services/project-management"
                className={serviceNavClass()}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Services
              </a>
              <a href="/industries" className={industriesNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                Industries
              </a>
              <a href="/about-us" className={aboutNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                About us
              </a>
              <a href="/careers" className={careersNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                Careers
              </a>
              <a href="/contact-us" className={contactNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                Contact us
              </a>
            </nav>
            {mobileConnectSection}
            <button className="mobile-menu-call" onClick={navigateToContact}>
              Get in touch
            </button>
          </aside>
          <div className="contact-page-hero-content">
            <div className="contact-page-hero-main">
              <p className="eyebrow">{siteContent.branding.hero_eyebrow}</p>
              <h1>{siteContent.branding.hero_title}</h1>
              <p className="subtitle">
                {siteContent.branding.hero_subtitle}
              </p>
              <div className="cta-row">
                <a className="primary contact-hero-primary" href="/about-us">
                  Learn More
                  <span className="call-btn-icon" aria-hidden="true">
                    <UpRightArrowIcon />
                  </span>
                </a>
              </div>
              <button
                type="button"
                className="contact-mobile-message-trigger"
                onClick={() => setIsContactSheetOpen(true)}
              >
                Send us a message
              </button>
            </div>
            <aside className="contact-page-phone-panel" aria-label="Contact phone">
              {contactForm()}
            </aside>
          </div>
          <div
            className={`contact-sheet-overlay ${isContactSheetOpen ? 'open' : ''}`}
            onClick={() => setIsContactSheetOpen(false)}
            aria-hidden={!isContactSheetOpen}
          />
          <aside
            className={`contact-sheet ${isContactSheetOpen ? 'open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Send us a message"
          >
            <div className="contact-sheet-header">
              <h2>Send us a message</h2>
              <button
                type="button"
                className="contact-sheet-close"
                onClick={() => setIsContactSheetOpen(false)}
                aria-label="Close message form"
              >
                ×
              </button>
            </div>
            {contactForm('contact-sheet-form')}
          </aside>
        </section>
      </main>
    )
  }

  if (isTermsRoute || isPrivacyRoute || isCookieRoute) {
    const policyTitle = isTermsRoute ? 'Terms of Use' : isPrivacyRoute ? 'Privacy Policy' : 'Cookie Policy'
    return (
      <>
        <header className="top-nav top-nav-global return-visible returning-header policy-header">
          <div className="nav-bubble">
            <a className="brand" href="/">
              <img src="/SYNERGY logo.png" alt="Synergy Project Management" className="brand-wordmark-image" />
            </a>
            <nav className="menu">
              <a href="/" className={navClass('#home')}>Home</a>
              <a href="/services/project-management" className={serviceNavClass()}>Services</a>
              <a href="/industries" className={industriesNavClass()}>Industries</a>
              <a href="/about-us" className={aboutNavClass()}>About us</a>
              <a href="/careers" className={careersNavClass()}>Careers</a>
              <a href="/contact-us" className={contactNavClass()}>Contact us</a>
            </nav>
            <button
              className="menu-toggle"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              {isMobileMenuOpen ? 'Close' : 'Menu'}
            </button>
            <button className="call-btn" onClick={navigateToContact}>
              Get in touch
              <span className="call-btn-icon" aria-hidden="true">
                <UpRightArrowIcon />
              </span>
            </button>
          </div>
        </header>
        <div
          className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden={!isMobileMenuOpen}
        />
        <aside
          id="mobile-nav-drawer"
          className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="mobile-menu-header">
            <p className="mobile-menu-title">Menu</p>
            <button
              type="button"
              className="mobile-menu-close"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
          <nav className="mobile-menu-links">
            <a href="/" className={navClass('#home')} onClick={() => setIsMobileMenuOpen(false)}>
              Home
            </a>
            <a
              href="/services/project-management"
              className={serviceNavClass()}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Services
            </a>
            <a href="/about-us" className={aboutNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
              About us
            </a>
            <a href="/careers" className={careersNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
              Careers
            </a>
            <a href="/contact-us" className={contactNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
              Contact us
            </a>
          </nav>
          {mobileConnectSection}
          <button
            className="mobile-menu-call"
            onClick={() => {
              navigateToContact()
            }}
          >
            Get in touch
          </button>
        </aside>
        <main className="policy-page-shell">
          <section className="policy-page-card">
            <p className="policy-eyebrow">Legal</p>
            <h1>{policyTitle}</h1>
            {isTermsRoute ? (
              <div className="policy-content">
                <section>
                  <h2>1. Introduction</h2>
                  <p>
                    These Terms of Use, together with the documents referred to in them, set out the terms on which
                    you may use the website operated by Synergy Project Management LLC (&quot;Synergy&quot;, &quot;we&quot;,
                    &quot;us&quot;, or &quot;our&quot;).
                  </p>
                  <p>Use of our website includes accessing, browsing, or using any part of the website.</p>
                  <p>
                    By using our website, you confirm that you accept these Terms of Use and agree to comply with
                    them. If you do not agree to these Terms of Use, you must not use our website.
                  </p>
                  <p>These Terms of Use should be read together with our Privacy Policy and Cookie Policy.</p>
                </section>
                <section>
                  <h2>2. Information About Us</h2>
                  <p>
                    This website is operated by Synergy Project Management LLC, a company incorporated in Dubai, United
                    Arab Emirates, with its registered office at:
                  </p>
                  <p>
                    AL KHABEESI BUILDING
                    <br />
                    OFFICE NO. 9/142
                    <br />
                    Al Khabeesi
                    <br />
                    Dubai, United Arab Emirates
                  </p>
                </section>
                <section>
                  <h2>3. Changes to These Terms and Our Website</h2>
                  <p>
                    We may revise these Terms of Use at any time by updating this page. Please check this page from
                    time to time, as any changes will be binding on you.
                  </p>
                  <p>
                    We may update our website from time to time and may change the content at any time. However, we
                    are under no obligation to update the website, and any content on the website may be out of date
                    at any given time.
                  </p>
                  <p>We do not guarantee that our website, or any content on it, will be free from errors or omissions.</p>
                </section>
                <section>
                  <h2>4. Access to Our Website</h2>
                  <p>Our website is made available free of charge.</p>
                  <p>
                    We do not guarantee that our website, or any content on it, will always be available or
                    uninterrupted. Access to the website is permitted on a temporary basis.
                  </p>
                  <p>
                    We may suspend, withdraw, discontinue, or change all or any part of the website without notice. We
                    will not be liable if, for any reason, the website is unavailable at any time or for any period.
                  </p>
                  <p>
                    You are responsible for making all arrangements necessary for you to have access to our website.
                    You are also responsible for ensuring that any person who accesses our website through your internet
                    connection is aware of these Terms of Use and complies with them.
                  </p>
                </section>
                <section>
                  <h2>5. Intellectual Property Rights</h2>
                  <p>
                    We are the owner or licensee of all intellectual property rights in our website and in the material
                    published on it. Those works are protected by applicable copyright, trademark, and intellectual
                    property laws. All such rights are reserved.
                  </p>
                  <p>
                    You may print or download extracts from our website for your personal use, and you may draw the
                    attention of others within your organisation to content posted on our website.
                  </p>
                  <p>You must not:</p>
                  <ul>
                    <li>modify any paper or digital copies of materials you have printed or downloaded from our website;</li>
                    <li>use any illustrations, photographs, graphics, video, or other materials separately from any accompanying text;</li>
                    <li>use any part of the content on our website for commercial purposes without obtaining our prior written consent;</li>
                    <li>reproduce, copy, distribute, or otherwise exploit any content from our website except as permitted by these Terms of Use.</li>
                  </ul>
                  <p>
                    Our status, and that of any identified contributors, as the authors of content on our website must
                    always be acknowledged.
                  </p>
                  <p>
                    If you print, copy, or download any part of our website in breach of these Terms of Use, your right
                    to use the website will cease immediately and you must, at our option, return or destroy any copies
                    of the materials you have made.
                  </p>
                </section>
                <section>
                  <h2>6. No Reliance on Information</h2>
                  <p>The content on our website is provided for general information purposes only.</p>
                  <p>
                    It is not intended to amount to professional, legal, engineering, construction, project management,
                    advisory, or other specialist advice on which you should rely.
                  </p>
                  <p>
                    You must obtain professional or specialist advice before taking, or refraining from taking, any
                    action on the basis of content on our website.
                  </p>
                  <p>
                    Although we make reasonable efforts to update the information on our website, we make no
                    representations, warranties, or guarantees, whether express or implied, that the content on our
                    website is accurate, complete, or up to date.
                  </p>
                </section>
                <section>
                  <h2>7. Professional Services Disclaimer</h2>
                  <p>Any services described on our website are subject to separate written agreements.</p>
                  <p>Nothing on our website constitutes:</p>
                  <ul>
                    <li>an offer to provide services;</li>
                    <li>a binding commitment by Synergy;</li>
                    <li>a guarantee of project outcome, cost, timing, approval, completion, or performance.</li>
                  </ul>
                  <p>
                    All project-related obligations, scope of services, deliverables, timelines, fees, responsibilities,
                    and liabilities are governed exclusively by the relevant written agreement entered into between
                    Synergy and its client.
                  </p>
                  <p>
                    No website content shall amend, override, or form part of any contract unless expressly agreed in
                    writing by Synergy.
                  </p>
                </section>
                <section>
                  <h2>8. Limitation of Liability</h2>
                  <p>The content on our website is provided on an &quot;as is&quot; and &quot;as available&quot; basis.</p>
                  <p>
                    To the fullest extent permitted by applicable law, we exclude all conditions, warranties,
                    representations, or other terms which may apply to our website or any content on it, whether express
                    or implied.
                  </p>
                  <p>We assume no responsibility for:</p>
                  <ul>
                    <li>the accuracy, completeness, or validity of any content on our website;</li>
                    <li>any errors or omissions in the content;</li>
                    <li>any reliance placed on the content by you or any third party;</li>
                    <li>any loss or damage arising from use of, or inability to use, our website;</li>
                    <li>any loss or damage arising from reliance on any content displayed on our website.</li>
                  </ul>
                  <p>
                    To the fullest extent permitted by applicable law, we shall not be liable for any loss or damage,
                    whether in contract, tort, negligence, breach of statutory duty, or otherwise, arising under or in
                    connection with:
                  </p>
                  <ul>
                    <li>use of, or inability to use, our website;</li>
                    <li>use of, or reliance on, any content displayed on our website;</li>
                    <li>any website linked to or from our website;</li>
                    <li>
                      any virus, distributed denial-of-service attack, or other technologically harmful material
                      affecting your computer equipment, software, data, or other proprietary material.
                    </li>
                  </ul>
                  <p>
                    This includes, without limitation, any indirect or consequential loss, loss of profit, loss of
                    business, loss of revenue, loss of goodwill, loss of opportunity, loss of anticipated savings, or
                    business interruption.
                  </p>
                  <p>
                    Nothing in these Terms of Use excludes or limits liability where such liability cannot be excluded
                    or limited under applicable law.
                  </p>
                </section>
                <section>
                  <h2>9. Indemnity</h2>
                  <p>
                    You agree to indemnify and hold harmless Synergy from any claims, liabilities, damages, or expenses
                    arising out of your misuse of the website or breach of these Terms.
                  </p>
                </section>
                <section>
                  <h2>10. Changes to These Terms</h2>
                  <p>We may update these Terms at any time.</p>
                  <p>
                    Any changes will be effective immediately upon posting on this website. You are responsible for
                    reviewing these Terms periodically.
                  </p>
                </section>
                <section>
                  <h2>11. Governing Law and Jurisdiction</h2>
                  <p>These Terms are governed by the laws of the United Arab Emirates.</p>
                  <p>
                    Any disputes arising in connection with these Terms shall be subject to the exclusive jurisdiction
                    of the courts of Dubai, UAE.
                  </p>
                </section>
                <section>
                  <h2>12. Contact</h2>
                  <p>If you have any questions about these Terms, please contact us at:</p>
                  <p>
                    <a href="mailto:info@synergypm.ae">info@synergypm.ae</a>
                  </p>
                </section>
              </div>
            ) : isCookieRoute ? (
              <div className="policy-content">
                <section>
                  <h2>Last Update: 04/05/2026</h2>
                </section>
                <section>
                  <h2>Introduction</h2>
                  <p>
                    This Cookie Policy explains how Synergy Project Management LLC uses cookies and similar
                    technologies on our Website. It should be read together with our Website Privacy Policy.
                  </p>
                </section>
                <section>
                  <h2>What are cookies and similar technologies</h2>
                  <p>
                    Cookies are small text files placed on your device when you visit a website. We also use similar
                    technologies, such as pixels, tags, and local storage, to recognize your device, remember
                    preferences, and understand how the site is used.
                  </p>
                </section>
                <section>
                  <h2>How we use cookies</h2>
                  <p>We use:</p>
                  <ul>
                    <li>
                      Strictly necessary cookies to enable core site functionality, security, and network management.
                      These do not require consent.
                    </li>
                    <li>
                      Performance/analytics cookies (for example, analytics tools such as Google Analytics) to
                      understand how visitors use our Website, improve content and navigation, and diagnose issues.
                      These require your consent in the UK, EU/EEA, Ireland, and where otherwise required.
                    </li>
                    <li>
                      Preference/functionality cookies to remember choices (for example, language), which may require
                      consent depending on jurisdiction.
                    </li>
                  </ul>
                  <p>
                    The specific cookies we use, their purposes, and lifespans may be presented in a cookie banner or
                    settings panel available on our Website. Analytics cookies are set only after you provide consent
                    via the cookie banner/settings, where required.
                  </p>
                </section>
                <section>
                  <h2>Legal basis</h2>
                  <p>
                    We rely on your consent for non-essential cookies in jurisdictions where consent is required. We
                    rely on legitimate interests or equivalent local bases for strictly necessary cookies to operate
                    the Website.
                  </p>
                </section>
                <section>
                  <h2>Third-party cookies</h2>
                  <p>
                    Some cookies may be set by third parties that provide services to us (such as analytics) or that
                    appear on pages linking to their content. These third parties have their own privacy and cookie
                    policies. We do not control third-party cookies.
                  </p>
                </section>
                <section>
                  <h2>Data collected via cookies</h2>
                  <p>
                    Cookies may collect device identifiers, IP address, browser type, pages viewed, time spent, and
                    other usage information. We use this information in aggregated or pseudonymous form where possible.
                    For details on how we handle personal data collected via cookies, see our Website Privacy Policy.
                  </p>
                </section>
                <section>
                  <h2>Retention</h2>
                  <p>
                    Cookie lifespans vary by type and purpose. Details are available in the cookie settings panel.
                    Personal data derived from cookies is retained only as long as necessary for the purposes described
                    or as required by law.
                  </p>
                </section>
                <section>
                  <h2>Updates to this Cookie Policy</h2>
                  <p>
                    We may update this Cookie Policy from time to time. The &quot;Last updated&quot; date indicates
                    the most recent revision.
                  </p>
                </section>
                <section>
                  <h2>Contact</h2>
                  <p>For questions about this Cookie Policy or our use of cookies, please contact us at:</p>
                  <p>
                    <a href="mailto:info@synergypm.ae">info@synergypm.ae</a>
                  </p>
                </section>
              </div>
            ) : isPrivacyRoute ? (
              <div className="policy-content">
                <section>
                  <h2>1. Introduction</h2>
                  <p>
                    This Privacy Policy explains how Synergy Project Management LLC (&quot;Synergy&quot;, &quot;we&quot;,
                    &quot;us&quot;, or &quot;our&quot;) collects, uses, and protects personal data through our
                    website.
                  </p>
                  <p>This Privacy Policy should be read together with our Cookie Policy.</p>
                </section>
                <section>
                  <h2>2. Information We Collect</h2>
                  <h3>2.1 Information You Provide</h3>
                  <p>We may collect personal information that you provide to us, including:</p>
                  <ul>
                    <li>name, title and company details;</li>
                    <li>contact information (email address, telephone number);</li>
                    <li>any information submitted through contact forms or correspondence.</li>
                  </ul>
                  <h3>2.2 Information We Collect Automatically</h3>
                  <p>We may collect information about your visit to our website, including:</p>
                  <ul>
                    <li>IP address, browser type and version, operating system;</li>
                    <li>pages visited, time spent on pages, and navigation paths;</li>
                    <li>technical and diagnostic data relating to website performance.</li>
                  </ul>
                </section>
                <section>
                  <h2>3. How We Use Your Information</h2>
                  <p>We may use your personal data for the following purposes:</p>
                  <ul>
                    <li>to respond to enquiries and provide requested information;</li>
                    <li>to carry out obligations arising from communications or potential engagements;</li>
                    <li>to improve and optimise our website, including analytics and performance monitoring;</li>
                    <li>to ensure the security and proper functioning of our website;</li>
                    <li>to comply with legal and regulatory obligations.</li>
                  </ul>
                </section>
                <section>
                  <h2>4. Disclosure of Your Information</h2>
                  <p>We may share your personal data with:</p>
                  <ul>
                    <li>service providers supporting our website and IT systems;</li>
                    <li>professional advisers and consultants;</li>
                    <li>authorities or regulators where required by law;</li>
                    <li>third parties in connection with a business transfer, merger, or restructuring.</li>
                  </ul>
                  <p>We do not sell or rent your personal data.</p>
                </section>
                <section>
                  <h2>5. Legal Basis for Processing</h2>
                  <p>We process personal data where necessary:</p>
                  <ul>
                    <li>for the performance of a contract or to take steps prior to entering into a contract;</li>
                    <li>to comply with legal obligations;</li>
                    <li>for our legitimate business interests, including improving our website and services;</li>
                    <li>where you have provided consent.</li>
                  </ul>
                </section>
                <section>
                  <h2>6. Data Security</h2>
                  <p>We implement appropriate technical and organisational measures to protect personal data.</p>
                  <p>
                    However, transmission of information via the internet is not completely secure, and any
                    transmission is at your own risk.
                  </p>
                </section>
                <section>
                  <h2>7. Data Retention</h2>
                  <p>We retain personal data only for as long as necessary:</p>
                  <ul>
                    <li>to fulfil the purposes for which it was collected;</li>
                    <li>to comply with legal and regulatory obligations;</li>
                    <li>for legitimate business purposes.</li>
                  </ul>
                </section>
                <section>
                  <h2>8. International Transfers</h2>
                  <p>
                    Your personal data may be processed outside the United Arab Emirates where necessary for
                    operational or technical purposes.
                  </p>
                  <p>
                    We take reasonable steps to ensure that such data is handled securely and in accordance with this
                    Privacy Policy.
                  </p>
                </section>
                <section>
                  <h2>9. Your Rights</h2>
                  <p>Subject to applicable law, you may have the right to:</p>
                  <ul>
                    <li>request access to personal data held about you;</li>
                    <li>request correction of inaccurate data;</li>
                    <li>request deletion of your data;</li>
                    <li>restrict or object to certain processing;</li>
                    <li>request transfer of your data to another organisation.</li>
                  </ul>
                  <p>Requests can be made using the contact details below.</p>
                </section>
                <section>
                  <h2>10. Third-Party Links</h2>
                  <p>Our website may contain links to third-party websites.</p>
                  <p>We are not responsible for the privacy practices of those websites.</p>
                </section>
                <section>
                  <h2>11. Changes to This Policy</h2>
                  <p>We may update this Privacy Policy from time to time.</p>
                  <p>Any changes will be posted on this page.</p>
                </section>
                <section>
                  <h2>12. Contact</h2>
                  <p>
                    If you have any questions about this Privacy Policy or how we handle your data, please contact us
                    at:
                  </p>
                  <p>
                    <a href="mailto:info@synergypm.ae">info@synergypm.ae</a>
                  </p>
                </section>
              </div>
            ) : (
              <div className="policy-content">
                <section>
                  <h2>{policyTitle}</h2>
                  <p>Content for this page is being prepared and will be published shortly.</p>
                </section>
              </div>
            )}
          </section>
        </main>
        {sharedFooterSection}
      </>
    )
  }

  if (isCareersRoute) {
    const careersHeroJobs = visibleJobs.length > 0 ? visibleJobs : siteContent.jobs
    return (
      <main className="careers-page-shell">
        <header className={`top-nav top-nav-global return-visible returning-header careers-return-header ${showCareersReturnHeader ? '' : 'scroll-hidden'}`}>
          <div className="nav-bubble">
            <a className="brand" href="/">
              <img src="/SYNERGY logo.png" alt="Synergy Project Management" className="brand-wordmark-image" />
            </a>
            <nav className="menu">
              <a href="/" className={navClass('#home')}>Home</a>
              <a href="/services/project-management" className={serviceNavClass()}>Services</a>
              <a href="/industries" className={industriesNavClass()}>Industries</a>
              <a href="/about-us" className={aboutNavClass()}>About us</a>
              <a href="/careers" className={careersNavClass()}>Careers</a>
              <a href="/contact-us" className={contactNavClass()}>Contact us</a>
            </nav>
            <button
              className="menu-toggle"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              {isMobileMenuOpen ? 'Close' : 'Menu'}
            </button>
            <button className="call-btn" onClick={navigateToContact}>
              Get in touch
              <span className="call-btn-icon" aria-hidden="true">
                <UpRightArrowIcon />
              </span>
            </button>
          </div>
        </header>
        <header className="top-nav careers-page-header">
          <div className="nav-bubble">
            <a className="brand" href="/">
              <img
                src="/SYNERGY logo.png"
                alt={siteContent.branding.company_name}
                className="brand-wordmark-image careers-brand-desktop"
              />
              <img
                src="/SYNERGY logo.png"
                alt={siteContent.branding.company_name}
                className="brand-wordmark-image careers-brand-mobile"
              />
            </a>
            <nav className="menu">
              <a href="/" className={navClass('#home')}>Home</a>
              <a href="/services/project-management" className={serviceNavClass()}>Services</a>
              <a href="/industries" className={industriesNavClass()}>Industries</a>
              <a href="/about-us" className={aboutNavClass()}>About us</a>
              <a href="/careers" className={careersNavClass()}>Careers</a>
              <a href="/contact-us" className={contactNavClass()}>Contact us</a>
            </nav>
            <button
              className="menu-toggle"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              {isMobileMenuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
          <button className="call-btn" onClick={navigateToContact}>
            Get in touch
            <span className="call-btn-icon" aria-hidden="true">
              <UpRightArrowIcon />
            </span>
          </button>
        </header>
        <section className="careers-page-panel">
          <div
            className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden={!isMobileMenuOpen}
          />
          <aside
            id="mobile-nav-drawer"
            className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}
            aria-hidden={!isMobileMenuOpen}
          >
            <div className="mobile-menu-header">
              <p className="mobile-menu-title">Menu</p>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <nav className="mobile-menu-links">
              <a href="/" className={navClass('#home')} onClick={() => setIsMobileMenuOpen(false)}>Home</a>
              <a href="/services/project-management" className={serviceNavClass()} onClick={() => setIsMobileMenuOpen(false)}>Services</a>
              <a href="/industries" className={industriesNavClass()} onClick={() => setIsMobileMenuOpen(false)}>Industries</a>
              <a href="/about-us" className={aboutNavClass()} onClick={() => setIsMobileMenuOpen(false)}>About us</a>
              <a href="/careers" className={careersNavClass()} onClick={() => setIsMobileMenuOpen(false)}>Careers</a>
              <a href="/contact-us" className={contactNavClass()} onClick={() => setIsMobileMenuOpen(false)}>Contact us</a>
            </nav>
            {mobileConnectSection}
            <button className="mobile-menu-call" onClick={navigateToContact}>Get in touch</button>
          </aside>

          <div className="careers-page-content">
            {isCareerDetailRoute && selectedCareerJob ? (
              <section className="career-detail-shell">
                <div className="career-detail-layout">
                  <div className="career-detail-content">
                    <div className="career-detail-top-row">
                      <a className="career-back-link entrance-seq entrance-1" href="/careers">
                        <span className="career-back-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path d="M16 16L8 8M14 8H8v6" />
                          </svg>
                        </span>
                        Back to careers
                      </a>
                      <p className="careers-hiring-pill entrance-seq entrance-2">{selectedCareerJob.department}</p>
                    </div>
                    <h1 className="entrance-seq entrance-2">{selectedCareerJob.title}</h1>
                    {selectedCareerJob.job_description_html ? (
                      <div
                        className="career-job-description-html entrance-seq entrance-3"
                        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(selectedCareerJob.job_description_html) }}
                      />
                    ) : (
                      <p className="entrance-seq entrance-3">{selectedCareerJob.summary}</p>
                    )}
                    <div className="career-job-meta entrance-seq entrance-3">
                      <span className="career-meta-pill career-meta-pill-location">
                        {selectedCareerJob.location_label || selectedCareerJob.workplace_type || 'Remote'}
                      </span>
                      <span
                        className={`career-meta-pill career-meta-pill-employment ${
                          (selectedCareerJob.employment_type || '').toLowerCase().includes('full-time') ? 'is-fulltime' : ''
                        }`}
                      >
                        {selectedCareerJob.employment_type || 'Full-time'}
                      </span>
                    </div>
                  </div>
                  <div className="career-detail-form-column">
                    <form className="career-apply-form entrance-seq entrance-4" onSubmit={submitJobApplication}>
                      <h2>Apply for this role</h2>
                      <div className="career-apply-grid">
                        <input
                          type="text"
                          placeholder="Full name"
                          value={jobApplicantName}
                          onChange={(event) => setJobApplicantName(event.target.value)}
                          required
                        />
                        <input
                          type="email"
                          placeholder="Email address"
                          value={jobApplicantEmail}
                          onChange={(event) => setJobApplicantEmail(event.target.value)}
                          required
                        />
                        <input
                          className="career-apply-input-full"
                          type="tel"
                          placeholder="Phone number"
                          value={jobApplicantPhone}
                          onChange={(event) => setJobApplicantPhone(event.target.value)}
                        />
                        <label className={`career-file-upload ${jobApplicantCvUrl ? 'is-uploaded' : ''}`}>
                          <div className="career-file-upload-main">
                            <div className="career-file-upload-meta">
                              <span className="career-file-upload-name">
                                {isUploadingJobApplicantCv && jobApplicantCvFile
                                  ? `Uploading ${jobApplicantCvFile.name} (${Math.max(0, Math.min(100, jobCvUploadProgress))}%)`
                                  : jobApplicantCvFile && jobApplicantCvUrl
                                    ? `${jobApplicantCvFile.name}`
                                    : jobApplicantCvFile
                                      ? `${jobApplicantCvFile.name}`
                                      : 'Upload CV (PDF or DOCX)'}
                              </span>
                              <small>PDF, DOC, DOCX up to 10MB</small>
                            </div>
                            <button
                              type="button"
                              className="career-file-upload-btn"
                              onClick={() => careerCvInputRef.current?.click()}
                              disabled={isSubmittingJobApplication || isUploadingJobApplicantCv}
                            >
                              {jobApplicantCvUrl ? 'Replace file' : 'Choose file'}
                            </button>
                          </div>
                          {isUploadingJobApplicantCv ? (
                            <div className="career-upload-progress-inline" aria-live="polite">
                              Uploading... {Math.max(0, Math.min(100, jobCvUploadProgress))}%
                            </div>
                          ) : null}
                          <input
                            ref={careerCvInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={uploadJobApplicantCv}
                            onClick={(event) => {
                              event.currentTarget.value = ''
                            }}
                            disabled={isSubmittingJobApplication || isUploadingJobApplicantCv}
                          />
                          {isUploadingJobApplicantCv ? (
                            <div className="career-upload-progress-field" aria-live="polite">
                              <span
                                className="career-upload-progress-fill"
                                style={{ width: `${Math.max(0, Math.min(100, jobCvUploadProgress))}%` }}
                              />
                            </div>
                          ) : null}
                          {jobApplicantCvUrl ? (
                            <div className="career-upload-success-row" aria-live="polite">
                              <span className="career-upload-badge">Uploaded</span>
                            </div>
                          ) : null}
                        </label>
                        <div className="career-note-editor" aria-label="Tell us why you're a great fit">
                          <div className="career-note-editor-toolbar">
                            <button
                              type="button"
                              className={jobNoteEditor?.isActive('bold') ? 'is-active' : ''}
                              onClick={() => jobNoteEditor?.chain().focus().toggleBold().run()}
                              aria-label="Bold"
                            >
                              B
                            </button>
                            <button
                              type="button"
                              className={jobNoteEditor?.isActive('italic') ? 'is-active' : ''}
                              onClick={() => jobNoteEditor?.chain().focus().toggleItalic().run()}
                              aria-label="Italic"
                            >
                              I
                            </button>
                            <button
                              type="button"
                              className={jobNoteEditor?.isActive('bulletList') ? 'is-active' : ''}
                              onClick={() => jobNoteEditor?.chain().focus().toggleBulletList().run()}
                              aria-label="Bullet list"
                            >
                              List
                            </button>
                          </div>
                          <EditorContent editor={jobNoteEditor} />
                        </div>
                      </div>
                      {jobApplicationStatus ? <p className="career-apply-status">{jobApplicationStatus}</p> : null}
                      <button
                        className="career-apply-submit"
                        type="submit"
                        disabled={isSubmittingJobApplication || isUploadingJobApplicantCv}
                      >
                        {isSubmittingJobApplication ? 'Submitting...' : 'Submit application'}
                        <span className="call-btn-icon" aria-hidden="true">
                          <UpRightArrowIcon />
                        </span>
                      </button>
                    </form>
                  </div>
                </div>
              </section>
            ) : (
              <>
                <p className="careers-hiring-pill entrance-seq entrance-1">We&apos;re hiring!</p>
                <h1 className="entrance-seq entrance-2">Be part of our mission</h1>
                <p className="entrance-seq entrance-3">
                  We&apos;re looking for passionate people to join us on our mission. We value flat hierarchies, clear
                  communication, and full ownership and responsibility.
                </p>
                <div className="careers-filter-row entrance-seq entrance-3" role="tablist" aria-label="Careers departments">
                  {careerDepartments.map((department) => (
                    <button
                      key={department}
                      type="button"
                      className={`careers-filter-chip ${careersDepartment === department ? 'active' : ''}`}
                      onClick={() => setCareersDepartment(department)}
                      aria-selected={careersDepartment === department}
                    >
                      {department}
                    </button>
                  ))}
                </div>
                <section className="careers-list" aria-label="Open roles">
                  {careersHeroJobs.map((job: JobPost, index: number) => {
                    const jobHref = `/careers/${job.id}`
                    const openJobDetails = () => {
                      window.location.href = jobHref
                    }
                    return (
                      <article
                        key={job.id}
                        className="career-job-card entrance-seq"
                        style={{ '--seq': index + 4 } as CSSProperties}
                        role="link"
                        tabIndex={0}
                        aria-label={`Open ${job.title} role details`}
                        onClick={openJobDetails}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openJobDetails()
                          }
                        }}
                      >
                        <div className="career-job-main">
                          <h2>{job.title}</h2>
                          <p>{job.summary}</p>
                          <div className="career-job-meta">
                            <span className="career-meta-pill career-meta-pill-location">
                              {job.location_label || job.workplace_type || 'Remote'}
                            </span>
                            <span
                              className={`career-meta-pill career-meta-pill-employment ${
                                (job.employment_type || '').toLowerCase().includes('full-time') ? 'is-fulltime' : ''
                              }`}
                            >
                              {job.employment_type || 'Full-time'}
                            </span>
                          </div>
                        </div>
                        <a className="career-apply-link" href={jobHref}>
                          Apply <UpRightArrowIcon />
                        </a>
                      </article>
                    )
                  })}
                </section>
              </>
            )}
          </div>
        </section>
      </main>
    )
  }

  if (isServicesRoute) {
    return (
      <main className="services-page-shell services-reimagined-page">
        <section className="about-page-hero services-reimagined-hero">
          <div className="about-page-hero-visual-frame" aria-hidden="true">
            <div className="about-page-hero-media" style={servicesHeroMediaStyle} />
          </div>
          <header className="top-nav about-page-header">
            <div className="nav-bubble">
              <a className="brand" href="/">
                <img
                  src="/syngergy-logo.png"
                  alt={siteContent.branding.company_name}
                  className="brand-wordmark-image about-brand-desktop"
                />
                <img
                  src="/SYNERGY logo.png"
                  alt={siteContent.branding.company_name}
                  className="brand-wordmark-image about-brand-mobile"
                />
              </a>
              <nav className="menu">
                <a href="/" className={navClass('#home')}>Home</a>
                <a href="/services/project-management" className={serviceNavClass()}>Services</a>
                <a href="/industries" className={industriesNavClass()}>Industries</a>
                <a href="/about-us" className={aboutNavClass()}>About us</a>
                <a href="/careers" className={careersNavClass()}>Careers</a>
                <a href="/contact-us" className={contactNavClass()}>Contact us</a>
              </nav>
              <button
                className="menu-toggle"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-nav-drawer"
              >
                {isMobileMenuOpen ? 'Close' : 'Menu'}
              </button>
            </div>
            <button className="call-btn" onClick={navigateToContact}>
              Get in touch
              <span className="call-btn-icon" aria-hidden="true">
                <UpRightArrowIcon />
              </span>
            </button>
          </header>
          <div
            className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden={!isMobileMenuOpen}
          />
          <aside
            id="mobile-nav-drawer"
            className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}
            aria-hidden={!isMobileMenuOpen}
          >
            <div className="mobile-menu-header">
              <p className="mobile-menu-title">Menu</p>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <nav className="mobile-menu-links">
              <a href="/" className={navClass('#home')} onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </a>
              <a
                href="/services/project-management"
                className={serviceNavClass()}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Services
              </a>
              <a href="/industries" className={industriesNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                Industries
              </a>
              <a href="/about-us" className={aboutNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                About us
              </a>
              <a href="/careers" className={careersNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                Careers
              </a>
              <a href="/contact-us" className={contactNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                Contact us
              </a>
            </nav>
            {mobileConnectSection}
            <button
              className="mobile-menu-call"
              onClick={() => {
                navigateToContact()
              }}
            >
              Get in touch
            </button>
          </aside>
          <div className="about-page-hero-content">
            <p className="eyebrow">{siteContent.branding.hero_eyebrow}</p>
            <h1 className="services-hero-title">
              <span className="services-hero-title-primary">Experience</span>
              <span className="services-hero-title-secondary">That Builds Outcomes.</span>
            </h1>
            <p className="subtitle">
              {siteContent.branding.hero_subtitle}
            </p>
          </div>
        </section>

        <section className="services-problem-section" aria-label="The problem we solve">
          <div className="services-problem-inner">
            <p className="services-problem-kicker">The problem we solve</p>
            <h2 className="services-problem-reveal">
              <p className="services-problem-text">
                <span className="services-problem-hook">
                  Most companies get stuck not because they lack talent, but
                </span>{' '}
                <span className="services-problem-support">
                  because they lack direction. When priorities shift weekly and decisions are reactive,
                  teams lose alignment, energy, and momentum.
                </span>
              </p>
            </h2>
            <h2 className="services-problem-reveal">
              <p className="services-problem-text">
                <span className="services-problem-support">
                  Our Business Strategy service replaces uncertainty with clarity - giving you a plan and a
                  confident path forward.
                </span>
              </p>
            </h2>
          </div>
        </section>

        <section className="services-data-sections" aria-label="Services by department">
          {servicesPageCards.map((service, serviceIndex) => {
            const detailSections = normalizeServiceDetailSections(service)
            const activeDetailIndex = Math.min(
              openServiceDetails[service.id] ?? 0,
              Math.max(0, detailSections.length - 1),
            )
            const resolvedServiceImage = typeof service.image_url === 'string' && service.image_url.trim().length > 0
              ? service.image_url.trim()
              : fallbackServiceCardImage
            const hasServiceImage = resolvedServiceImage.length > 0
            return (
              <article
                key={`services-page-row-${service.id}`}
                className={`services-data-row ${serviceIndex % 2 === 1 ? 'is-reversed' : ''}`}
              >
                <div
                  className="services-data-image"
                  aria-hidden="true"
                >
                  {hasServiceImage ? (
                    <img
                      src={resolvedServiceImage}
                      alt=""
                      className="services-data-image-media"
                      loading="lazy"
                    />
                  ) : null}
                  <Noise
                    className="services-data-image-noise"
                    patternSize={250}
                    patternScaleX={2}
                    patternScaleY={2}
                    patternRefreshInterval={2}
                    patternAlpha={15}
                  />
                  <div className="services-data-image-gradient" />
                </div>
                <div className="services-data-content">
                  <p className="services-data-kicker">Our Approach</p>
                  <h2>{service.title}</h2>
                  <p className="services-data-summary">{service.description}</p>

                  <div className="services-data-accordion" role="list">
                    {detailSections.map((detail, detailIndex) => {
                      const isOpen = detailIndex === activeDetailIndex
                      return (
                        <section key={`${service.id}-detail-${detailIndex}`} className={`services-data-item ${isOpen ? 'open' : ''}`} role="listitem">
                          <button
                            type="button"
                            className="services-data-item-trigger"
                            onClick={() =>
                              setOpenServiceDetails((prev) => ({
                                ...prev,
                                [service.id]: detailIndex,
                              }))
                            }
                          >
                            <span>{detail.title}</span>
                            <span>{detailIndex + 1}</span>
                          </button>
                          <div className="services-data-item-panel">
                            <p>{detail.description}</p>
                          </div>
                        </section>
                      )
                    })}
                  </div>
                </div>
              </article>
            )
          })}
        </section>
        {sharedFooterSection}
      </main>
    )
  }

  const isUnknownServiceRoute = isServicesRoute && !activeServiceCard && hasLoadedContent
  const isKnownStaticRoute =
    isHomeRoute ||
    isProjectsRoute ||
    isAboutRoute ||
    isCareersRoute ||
    isContactRoute ||
    isTermsRoute ||
    isPrivacyRoute ||
    isCookieRoute
  if (isUnknownServiceRoute || !isKnownStaticRoute) {
    return <NotFoundPage onGoHome={() => navigateWithTransition('/', { replace: true })} />
  }

  return (
    <>
      {showReturnHeader ? (
        <header className="top-nav top-nav-global return-visible returning-header">
          <div className="nav-bubble">
            <a className="brand" href="/">
              <img src="/SYNERGY logo.png" alt="Synergy Project Management" className="brand-wordmark-image" />
            </a>
            <nav className="menu">
              <a href="/" className={navClass('#home')}>Home</a>
              <a href="/services/project-management" className={serviceNavClass()}>Services</a>
              <a href="/industries" className={industriesNavClass()}>Industries</a>
              <a href="/about-us" className={aboutNavClass()}>About us</a>
              <a href="/careers" className={careersNavClass()}>Careers</a>
              <a href="/contact-us" className={contactNavClass()}>Contact us</a>
            </nav>
            <button
              className="menu-toggle"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              {isMobileMenuOpen ? 'Close' : 'Menu'}
            </button>
            <button className="call-btn" onClick={navigateToContact}>
              Get in touch
              <span className="call-btn-icon" aria-hidden="true">
                <UpRightArrowIcon />
              </span>
            </button>
          </div>
        </header>
      ) : null}

      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden={!isMobileMenuOpen}
      />
      <aside
        id="mobile-nav-drawer"
        className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="mobile-menu-header">
          <p className="mobile-menu-title">Menu</p>
          <button
            type="button"
            className="mobile-menu-close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        <nav className="mobile-menu-links">
          <a href="/" className={navClass('#home')} onClick={() => setIsMobileMenuOpen(false)}>
            Home
          </a>
          <a
            href="/services/project-management"
            className={serviceNavClass()}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Services
          </a>
          <a href="/industries" className={industriesNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
            Industries
          </a>
          <a href="/about-us" className={aboutNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
            About us
          </a>
          <a href="/careers" className={careersNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
            Careers
          </a>
          <a href="/contact-us" className={contactNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
            Contact us
          </a>
        </nav>
        {mobileConnectSection}
        <button
          className="mobile-menu-call"
          onClick={() => {
            navigateToContact()
          }}
        >
          Get in touch
        </button>
      </aside>

      <main id="home" className="page">
        <section ref={heroSceneRef} className="scroll-scene hero-scene">
          <div className="hero-container hero-stage" style={heroVars}>
            <div className="hero-visual-frame" aria-hidden="true">
              <div className="hero-media" style={homepageHeroMediaStyle} />
              {homepageHeroMediaSrc ? (
                homepageHeroIsVideo ? (
                  <video
                    className="sticky-blue-wash-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                  >
                    <source src={homepageHeroMediaSrc} />
                  </video>
                ) : (
                  <img src={homepageHeroMediaSrc} alt="" className="sticky-blue-wash-video" loading="eager" />
                )
              ) : null}
            </div>
            <header className="top-nav top-nav-hero" style={headerBlendVars}>
              <div className="nav-bubble">
                <a className="brand" href="/">
                  <img src="/syngergy-logo.png" alt={siteContent.branding.company_name} className="brand-wordmark-image" />
                </a>
                <nav className="menu">
                  <a href="/" className={navClass('#home')}>Home</a>
                  <a href="/services/project-management" className={serviceNavClass()}>Services</a>
                  <a href="/industries" className={industriesNavClass()}>Industries</a>
                  <a href="/about-us" className={aboutNavClass()}>About us</a>
                  <a href="/careers" className={careersNavClass()}>Careers</a>
                  <a href="/contact-us" className={contactNavClass()}>Contact us</a>
                </nav>
                <button
                  className="menu-toggle"
                  onClick={() => setIsMobileMenuOpen((open) => !open)}
                  aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-nav-drawer"
                >
                  {isMobileMenuOpen ? 'Close' : 'Menu'}
                </button>
              </div>
              <button className="call-btn" onClick={navigateToContact}>
                Get in touch
                <span className="call-btn-icon" aria-hidden="true">
                  <UpRightArrowIcon />
                </span>
              </button>
            </header>
            <div className="hero-scroll-content">
              <div className="hero-scroll-body">
                <div className="hero-content">
                  <p className="eyebrow">{siteContent.branding.hero_eyebrow}</p>
                  <h1>{siteContent.branding.hero_title}</h1>
                  <p className="subtitle">
                    {siteContent.branding.hero_subtitle}
                  </p>
                  <div className="cta-row">
                    <a className="primary home-hero-primary" href="/services/project-management">
                      Our Services
                      <span className="call-btn-icon" aria-hidden="true">
                        <UpRightArrowIcon />
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="trust-row">
              <span>Trusted by 50+ companies</span>
            </div>

            <div className="hero-reveal-content">
              <p className="eyebrow sticky-eyebrow">Synergy Project Management</p>
              <h2 className="sticky-title">14+ years of experience</h2>
              <p className="sticky-text">
                We are a dynamic and fast-growing business, with experience in building and managing operations
                across industries including distribution, accommodation, systems, marketing, design, retail, and
                construction.
              </p>
            </div>
          </div>
        </section>

        <div
          className={`dialog-overlay ${dialogMode === 'book' ? 'open' : ''}`}
          onClick={() => setDialogMode('none')}
          aria-hidden={dialogMode === 'none'}
        />
        <section
          className={`dialog-shell ${dialogMode === 'book' ? 'open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Book a call"
        >
          <button
            className="dialog-close top-close"
            onClick={() => setDialogMode('none')}
            aria-label="Close dialog"
          >
            x
          </button>
          <h2>Book a strategy call</h2>
          <p>Tell us what your team is trying to achieve in the next quarter.</p>
          <form className="dialog-form">
            <label>
              Full name
              <input required type="text" placeholder="Jane Smith" />
            </label>
            <label>
              Work email
              <input required type="email" placeholder="jane@company.com" />
            </label>
            <label>
              Team size
              <input required type="number" min={1} placeholder="25" />
            </label>
            <button type="submit" className="primary">
              Submit Request
              <span className="call-btn-icon" aria-hidden="true">
                <UpRightArrowIcon />
              </span>
            </button>
          </form>
          <button
            className="dialog-close bottom-close"
            onClick={() => setDialogMode('none')}
            aria-label="Close dialog"
          >
            Close
          </button>
        </section>
      </main>

      <section ref={thirdSceneRef} className="third-scene" style={thirdVars}>
        <div className="third-sticky">
          <p className="third-line third-line-one">What changes when</p>
          <p className="third-line third-line-two">you work with us.</p>
        </div>

        <div className="fourth-sticky">
          <section className="fourth-section">
            <article className="value-card value-card-before">
              <p className="card-label">Before</p>
              <h3>Working Without Clear Structure</h3>
              <ul>
                <li>Expanding into industries without clear systems.</li>
                <li>Operations that run but lack visibility and control.</li>
                <li>Decisions based on assumptions, not real data.</li>
                <li>Growth that resets instead of compounding.</li>
              </ul>
            </article>

            <article className="value-card value-card-after">
              <p className="card-label">After</p>
              <h3>Operating With Clear Structure In Place</h3>
              <ul>
                <li>Every operation built on clear, scalable systems.</li>
                <li>Full visibility across performance and execution.</li>
                <li>Decisions driven by real-time data and insights.</li>
                <li>Compounding growth, industry by industry.</li>
              </ul>
            </article>
          </section>
        </div>
      </section>

      <section className="home-services-section" aria-label="Services showcase">
        <div className="home-services-header">
          <p>SERVICES</p>
          <div className="home-services-heading-row">
            <h2>Built for Real Business Outcomes</h2>
            <button
              type="button"
              className="home-services-view-all primary"
              onClick={() => navigateWithTransition(homepageServicesHref)}
            >
              View all services
              <span aria-hidden="true">
                <UpRightArrowIcon />
              </span>
            </button>
          </div>
        </div>
        <div className="home-services-grid">
          {homepageFeaturedServices.map((service) => {
            const resolvedImage = typeof service.image_url === 'string' && service.image_url.trim().length > 0
              ? service.image_url.trim()
              : fallbackServiceCardImage
            return (
              <article key={`home-service-${service.id}`} className="home-services-item">
                <a
                  href={service.href}
                  className="home-services-card"
                  onClick={(event) => {
                    event.preventDefault()
                    navigateWithTransition(service.href)
                  }}
                  style={
                    resolvedImage
                      ? ({
                          backgroundImage: `url("${resolvedImage}")`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        } as CSSProperties)
                      : undefined
                  }
                >
                  <span className="home-services-card-arrow" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M8 16L16 8M10 8h6v6" />
                    </svg>
                  </span>
                  <h3>{service.title}</h3>
                </a>
                <p>{service.description}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section ref={sixthSceneRef} className="sixth-section" style={sixthVars}>
        <div className="sixth-inner" style={teamSectionStyle}>
          <header className="sixth-header">
            <p className="sixth-kicker">Synergy Project Management</p>
            <h2>{siteContent.branding.team_title}</h2>
          </header>

          <div className="sixth-grid">
            {teamCols.map((col, colIdx) => (
              <div className="sixth-col" key={`col-${colIdx}`}>
                {col.map((member, memberIdx) => (
                  <article
                    key={member.id}
                    className={`member-row ${selectedMember?.id === member.id ? 'member-row-highlight' : ''} ${
                      'member-row-scroll-reveal'
                    }`}
                    style={
                      {
                        '--member-start': 0.12 + (colIdx * 3 + memberIdx) * 0.11,
                      } as CSSProperties
                    }
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="member-meta">
                      <span className="member-avatar">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.name} className="member-avatar-image" />
                        ) : (
                          member.initials
                        )}
                      </span>
                      <div>
                        <h3>{member.name}</h3>
                        <p>{member.role}</p>
                      </div>
                    </div>
                    <div className="member-tail">
                      <span>{member.number}</span>
                      <button aria-label={`Open ${member.name} profile`}>
                        <PlusGlyph />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {sharedFooterSection}

      <div
        className={`member-overlay ${selectedMember ? 'open' : ''}`}
        onClick={() => setSelectedMember(null)}
        aria-hidden={!selectedMember}
      />
      <section
        className={`member-dialog ${selectedMember ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Team member profile"
      >
        {selectedMember && (
          <>
            <div className="member-dialog-media">
              {selectedMember.avatar_url ? (
                <img src={selectedMember.avatar_url} alt={selectedMember.name} className="member-dialog-image" />
              ) : (
                <span>{selectedMember.initials}</span>
              )}
            </div>
            <div className="member-dialog-body">
              <button
                className="member-dialog-close"
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setSelectedMember(null)
                }}
                aria-label="Close profile dialog"
              >
                ×
              </button>
              <p className="member-role">{selectedMember.role}</p>
              <h3>{selectedMember.name}</h3>
              <p className="member-bio">{selectedMember.bio}</p>
              <div className="member-links">
                <div className="member-socials">
                  <span>x</span>
                  <span>in</span>
                  <span>ig</span>
                  <span>f</span>
                </div>
                <button
                  type="button"
                  className={`member-email-row ${memberEmailCopied ? 'copied' : ''}`}
                  onClick={copyMemberEmail}
                  aria-label="Copy team member email"
                  title={memberEmailCopied ? 'Copied' : 'Copy email'}
                >
                  <div>
                    <strong>{memberEmailLabel}</strong>
                  </div>
                  <span className="copy-email-icon" aria-hidden="true">
                    <span className="copy-icon" />
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  )
}

export default App
