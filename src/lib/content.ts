import { supabaseRest } from './supabase'

export type TeamMember = {
  id: string
  initials: string
  name: string
  role: string
  bio: string
  email: string
  number: string
  avatar_url?: string | null
  sort_order: number
  is_active: boolean
}

export type ServiceItem = {
  id: string
  tag?: string
  title: string
  description: string
  quote?: string
  detail_sections?: Array<{
    title: string
    description: string
  }>
  image_url?: string | null
  sort_order: number
  is_active: boolean
}

export type InsightItem = {
  id: string
  chip: string
  date_label: string
  title: string
  hero_image_url?: string | null
  image_url?: string | null
  alt_style: boolean
  sort_order: number
  is_active: boolean
}

export type MediaItem = {
  id: string
  kind: 'trust' | 'social' | 'asset'
  label: string
  value: string
  link_url?: string | null
  file_path?: string | null
  file_url?: string | null
  sort_order: number
  is_active: boolean
}

export type JobPost = {
  id: string
  title: string
  department: string
  summary: string
  job_description_html?: string | null
  notification_email?: string | null
  location_label: string
  employment_type: string
  workplace_type: string
  apply_url?: string | null
  sort_order: number
  is_active: boolean
}

export type JobApplicationInput = {
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

export type ContactInquiryInput = {
  full_name: string
  email: string
  phone: string
  message: string
}

export type SmtpSettings = {
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_from: string
  smtp_pass?: string
  has_password?: boolean
}

export type BrandingContent = {
  id: string
  company_name: string
  hero_eyebrow: string
  hero_title: string
  hero_subtitle: string
  services_title: string
  services_description: string
  team_title: string
  insights_title: string
  insights_description: string
  footer_address: string
  footer_newsletter_title: string
  footer_pitch: string
  footer_wordmark: string
  footer_email: string
  logo_url?: string | null
  favicon_url?: string | null
  homepage_hero_video_url?: string | null
  homepage_team_background_url?: string | null
  services_hero_background_url?: string | null
  about_hero_background_url?: string | null
  contact_hero_background_url?: string | null
}

export type SiteContent = {
  branding: BrandingContent
  team: TeamMember[]
  services: ServiceItem[]
  insights: InsightItem[]
  media: MediaItem[]
  jobs: JobPost[]
}

const fallback: SiteContent = {
  branding: {
    id: 'default',
    company_name: 'Synergy Project Management',
    hero_eyebrow: 'Synergy Project Management',
    hero_title: 'Your growth partner for companies ready to scale.',
    hero_subtitle:
      'Synergy Project Management helps corporate teams align strategy, delivery, and operational clarity.',
    services_title: 'Services',
    services_description:
      'Department-focused delivery across Finance, Compliance, HR, and integrated Project Management.',
    team_title: 'Meet the team behind the growth.',
    insights_title: 'Projects.',
    insights_description:
      'We are a leading Project Management Company providing an International proactive, hands-on approach to managing projects.',
    footer_address: '287 Mission Street\nSan Francisco, CA 94110',
    footer_newsletter_title: 'Subscribe to our newsletter.',
    footer_pitch:
      "Stalled revenue, leaky funnels, stretched leadership. Whatever is holding you back, let's solve it.",
    footer_wordmark: 'synergy',
    footer_email: 'Info@synergypm.ae',
    logo_url: null,
    favicon_url: null,
    homepage_hero_video_url: null,
    homepage_team_background_url: null,
    services_hero_background_url: null,
    about_hero_background_url: null,
    contact_hero_background_url: null,
  },
  team: [
    { id: 'anish-vettuvelil', initials: 'AN', name: 'Anish Vettuvelil', role: 'Chief Financial Officer', number: '01', email: 'anish.vettuvelil@synergypm.com', bio: 'Leads financial planning, budgeting, and controls to support sustainable project growth.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 1, is_active: true },
    { id: 'yan-thappa', initials: 'YT', name: 'Yan Thappa', role: 'Project Manager', number: '02', email: 'yan.thappa@synergypm.com', bio: 'Coordinates project execution plans, milestones, and delivery timelines across teams.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 2, is_active: true },
    { id: 'sidhiq-ahemedkunhi', initials: 'SA', name: 'Sidhiq Ahemedkunhi', role: 'Project Financial Officer (Uae)', number: '03', email: 'sidhiq.ahemedkunhi@synergypm.com', bio: 'Manages UAE project financial operations, controls, and reporting requirements.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 3, is_active: true },
    { id: 'rajesh-sebastain', initials: 'RS', name: 'Rajesh Sebastain', role: 'Project Financial Officer (Uk)', number: '04', email: 'rajesh.sebastain@synergypm.com', bio: 'Oversees UK project budgets, compliance, and financial performance reporting.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 4, is_active: true },
    { id: 'vishnu-balachnadran', initials: 'VB', name: 'Vishnu Balachnadran', role: 'Financial Auditor', number: '05', email: 'vishnu.balachnadran@synergypm.com', bio: 'Reviews financial records, validates controls, and highlights risk exposure.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 5, is_active: true },
    { id: 'saira', initials: 'SA', name: 'Saira', role: 'Human Resource Manager', number: '06', email: 'saira@synergypm.com', bio: 'Leads recruitment, people operations, and employee engagement initiatives.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 6, is_active: true },
    { id: 'divya-velikkath', initials: 'DV', name: 'Divya Velikkath', role: 'Hr Coordinator', number: '07', email: 'divya.velikkath@synergypm.com', bio: 'Supports HR workflows, onboarding, and employee lifecycle coordination.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 7, is_active: true },
    { id: 'rituja-shahane', initials: 'RS', name: 'Rituja Shahane', role: 'Social Media Specialist', number: '08', email: 'rituja.shahane@synergypm.com', bio: 'Plans and executes social campaigns to improve brand reach and engagement.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 8, is_active: true },
    { id: 'rohan-smith', initials: 'RS', name: 'Rohan Smith', role: 'Paralegal', number: '09', email: 'rohan.smith@synergypm.com', bio: 'Supports legal documentation, case preparation, and compliance follow-through.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 9, is_active: true },
    { id: 'ankita-ananad-acharya', initials: 'AA', name: 'Ankita Ananad Acharya', role: 'Compliance Officer', number: '10', email: 'ankita.ananad.acharya@synergypm.com', bio: 'Maintains compliance programs, audits controls, and enforces policy standards.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 10, is_active: true },
    { id: 'adeeb-noor-mahomed', initials: 'AN', name: 'Adeeb Noor Mahomed', role: 'Compliance Officer', number: '11', email: 'adeeb.noor.mahomed@synergypm.com', bio: 'Monitors regulatory requirements and supports audit-ready compliance operations.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 11, is_active: true },
    { id: 'natalia-anna-gosciniak', initials: 'NG', name: 'Natalia Anna Gosciniak', role: 'Marketing Director', number: '12', email: 'natalia.anna.gosciniak@synergypm.com', bio: 'Leads marketing strategy, positioning, and growth initiatives across channels.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 12, is_active: true },
    { id: 'raina-ezechiel', initials: 'RE', name: 'Raina Ezechiel', role: 'Marketing Manager', number: '13', email: 'raina.ezechiel@synergypm.com', bio: 'Drives campaign planning, execution, and performance optimization.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 13, is_active: true },
    { id: 'shibila-hakeem', initials: 'SH', name: 'Shibila Hakeem', role: 'Senior Marketing Executive', number: '14', email: 'shibila.hakeem@synergypm.com', bio: 'Executes channel programs and tracks marketing conversion outcomes.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 14, is_active: true },
    { id: 'devapriya-venugopal', initials: 'DV', name: 'Devapriya Venugopal', role: 'Marketing Assistant', number: '15', email: 'devapriya.venugopal@synergypm.com', bio: 'Supports campaign operations, content scheduling, and reporting workflows.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 15, is_active: true },
    { id: 'dhanashree-vishwanath', initials: 'DV', name: 'Dhanashree Vishwanath', role: 'Senior Graphic Designer', number: '16', email: 'dhanashree.vishwanath@synergypm.com', bio: 'Designs visual assets and ensures brand consistency across outputs.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 16, is_active: true },
    { id: 'muhammed-jadeer', initials: 'MJ', name: 'Muhammed Jadeer', role: 'Senior Graphic Designer', number: '17', email: 'muhammed.jadeer@synergypm.com', bio: 'Creates high-impact graphics for campaigns, web, and production deliverables.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 17, is_active: true },
    { id: 'harold-garcia-perez', initials: 'HP', name: 'Harold Garcia Perez', role: 'Production Manager', number: '18', email: 'harold.garcia.perez@synergypm.com', bio: 'Leads production schedules, quality checks, and delivery coordination.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 18, is_active: true },
    { id: 'john-benedick-amo', initials: 'JA', name: 'John Benedick Amo', role: 'Production Coordinator', number: '19', email: 'john.benedick.amo@synergypm.com', bio: 'Coordinates production tasks, handoffs, and team communication.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 19, is_active: true },
    { id: 'misba-naz-saikalgar', initials: 'MS', name: 'Misba Naz Saikalgar', role: 'Sales Coordinator', number: '20', email: 'misba.naz.saikalgar@synergypm.com', bio: 'Supports sales operations, lead workflows, and follow-up execution.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 20, is_active: true },
    { id: 'wasim-iqbal', initials: 'WI', name: 'Wasim Iqbal', role: 'Sales Manager', number: '21', email: 'wasim.iqbal@synergypm.com', bio: 'Leads sales strategy, pipeline growth, and team performance tracking.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 21, is_active: true },
    { id: 'rajgopalan-vasudevan', initials: 'RV', name: 'Rajgopalan Vasudevan', role: 'Head of Operations', number: '22', email: 'rajgopalan.vasudevan@synergypm.com', bio: 'Oversees operational systems, delivery governance, and process optimization.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 22, is_active: true },
    { id: 'carmichael-galbis-anacin', initials: 'CA', name: 'Carmichael Galbis Anacin', role: 'Shopify Developer', number: '23', email: 'carmichael.galbis.anacin@synergypm.com', bio: 'Builds and maintains Shopify storefront features and integrations.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 23, is_active: true },
    { id: 'marvin-osei', initials: 'MO', name: 'Marvin Osei', role: 'Media Manager', number: '24', email: 'marvin.osei@synergypm.com', bio: 'Manages media planning, production assets, and distribution quality.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 24, is_active: true },
    { id: 'ian-sirya-katana', initials: 'IK', name: 'Ian Sirya Katana', role: 'Lead Software Developer', number: '25', email: 'ian.sirya.katana@synergypm.com', bio: 'Leads software architecture, implementation quality, and technical delivery.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 25, is_active: true },
    { id: 'theophilus-aidoo', initials: 'TA', name: 'Theophilus Aidoo', role: 'Graphic Designer', number: '26', email: 'theophilus.aidoo@synergypm.com', bio: 'Designs creative assets for digital, print, and campaign touchpoints.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 26, is_active: true },
    { id: 'yasmin-azzawi', initials: 'YA', name: 'Yasmin Azzawi', role: 'Marketing Manager', number: '27', email: 'yasmin.azzawi@synergypm.com', bio: 'Leads campaign execution and channel performance for market growth.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 27, is_active: true },
    { id: 'may-zin-htwe', initials: 'MH', name: 'May Zin Htwe', role: 'CRM Assistant', number: '28', email: 'may.zin.htwe@synergypm.com', bio: 'Maintains CRM records, customer lifecycle updates, and reporting accuracy.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 28, is_active: true },
    { id: 'anjelica-bergonia-verosil', initials: 'AV', name: 'Anjelica Bergonia Verosil', role: 'Personal Assistant', number: '29', email: 'anjelica.bergonia.verosil@synergypm.com', bio: 'Provides executive coordination, scheduling, and administrative support.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 29, is_active: true },
    { id: 'mohammed-rafiq-amanji', initials: 'MA', name: 'Mohammed Rafiq Amanji', role: 'Executive Assistant for CEO', number: '30', email: 'mohammed.rafiq.amanji@synergypm.com', bio: 'Supports CEO priorities through planning, communication, and follow-through.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 30, is_active: true },
    { id: 'zohra-zoulati', initials: 'ZZ', name: 'Zohra Zoulati', role: 'Front office Executive', number: '31', email: 'zohra.zoulati@synergypm.com', bio: 'Manages front office operations, visitor experience, and communication flow.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 31, is_active: true },
  ],
  services: [
    {
      id: 'service-1',
      title: 'Finance Department',
      description: 'A Structured Approach to Financial Control & Growth',
      detail_sections: [
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
        {
          title: 'Regulatory Compliance & Governance',
          description:
            'We ensure full compliance with UAE regulations including Corporate Tax, VAT, IFRS standards, and statutory filings. All submissions are accurate, timely, and aligned with evolving legal frameworks to protect the business from financial risk.',
        },
        {
          title: 'Audit & Internal Controls',
          description:
            'We implement strong internal control frameworks and manage audits end-to-end. Risks are identified early, processes are strengthened, and corrective actions are applied to maintain financial integrity, transparency, and operational accountability.',
        },
      ],
      sort_order: 1,
      is_active: true,
    },
    {
      id: 'service-2',
      title: 'Compliance Department',
      description: 'Ensuring Market Readiness & Regulatory Confidence',
      detail_sections: [
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
        {
          title: 'Compliance Oversight & Risk Control',
          description:
            'We continuously monitor regulations, industry standards, and internal compliance. Risks are identified early with mitigation strategies implemented, ensuring uninterrupted operations and protection against regulatory or reputational exposure.',
        },
        {
          title: 'Regulatory Intelligence & Advisory',
          description:
            'We track global regulatory changes and provide strategic guidance across departments. This ensures the business stays ahead of evolving laws while supporting product development, marketing, and operational decisions with compliant direction.',
        },
      ],
      sort_order: 2,
      is_active: true,
    },
    {
      id: 'service-3',
      title: 'Human Resources',
      description: 'Building & Managing High-Performance Teams',
      detail_sections: [
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
        {
          title: 'Payroll, Benefits & Legal Compliance',
          description:
            'We administer salaries, benefits, and compensation structures aligned with UAE and UK regulations. All payroll processes are accurate and compliant, ensuring employees are paid fairly while minimizing legal and financial risk.',
        },
        {
          title: 'Performance, Engagement & Development',
          description:
            'We drive employee performance through structured appraisals, training programs, and engagement initiatives. This builds a motivated, skilled workforce aligned with company goals and fosters a strong, consistent organizational culture.',
        },
      ],
      sort_order: 3,
      is_active: true,
    },
    {
      id: 'service-4',
      title: 'Project Management',
      description: 'Delivering Projects with Precision & Control',
      detail_sections: [
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
        {
          title: 'Monitoring & Performance Control',
          description:
            'We track progress through milestones, KPIs, and reporting frameworks. Issues are identified early, adjustments are made proactively, and performance is continuously optimized to keep projects on schedule and within scope.',
        },
        {
          title: 'Delivery & Continuous Improvement',
          description:
            'We ensure successful project completion with quality assurance and post-delivery evaluation. Learnings are documented and applied to future projects, driving continuous improvement and higher efficiency across all operations.',
        },
      ],
      sort_order: 4,
      is_active: true,
    },
  ],
  insights: [
    { id: 'insight-1', chip: 'Status: Completed, December 2020', date_label: 'Location: Jumeirah Village Circle, Dubai', title: 'G + 14 Hotel Apartment', alt_style: false, sort_order: 1, is_active: true },
    { id: 'insight-2', chip: 'Status: Completed, 2016', date_label: 'Location: Dubai Sports City, Dubai', title: 'G + 20 Hotel Apartment', alt_style: true, sort_order: 2, is_active: true },
    { id: 'insight-3', chip: 'Status: Under Construction', date_label: 'Location: Jumeirah Village Circle, Dubai', title: 'G + 11 Hotel Apartment', alt_style: false, sort_order: 3, is_active: true },
    { id: 'insight-4', chip: 'Status: Ongoing', date_label: 'Location: UAE', title: 'Major Hospital Project', alt_style: true, sort_order: 4, is_active: true },
  ],
  media: [
    { id: 'trust-1', kind: 'trust', label: 'Venice', value: 'Venice', sort_order: 1, is_active: true },
    { id: 'trust-2', kind: 'trust', label: 'Lightspeed', value: 'Lightspeed', sort_order: 2, is_active: true },
    { id: 'trust-3', kind: 'trust', label: 'Sitemark', value: 'Sitemark', sort_order: 3, is_active: true },
    { id: 'trust-4', kind: 'trust', label: 'Hamilton', value: 'Hamilton', sort_order: 4, is_active: true },
    { id: 'social-1', kind: 'social', label: 'X', value: 'X', link_url: 'https://x.com', sort_order: 1, is_active: true },
    { id: 'social-2', kind: 'social', label: 'LinkedIn', value: 'LinkedIn', link_url: 'https://linkedin.com', sort_order: 2, is_active: true },
    { id: 'social-3', kind: 'social', label: 'Instagram', value: 'Instagram', link_url: 'https://instagram.com', sort_order: 3, is_active: true },
    { id: 'social-4', kind: 'social', label: 'Facebook', value: 'Facebook', link_url: 'https://facebook.com', sort_order: 4, is_active: true },
  ],
  jobs: [
    {
      id: 'job-product-designer',
      title: 'Product Designer',
      department: 'Design',
      summary: 'We are looking for a mid-level product designer to join our team.',
      job_description_html: '',
      notification_email: null,
      location_label: '100% remote',
      employment_type: 'Full-time',
      workplace_type: 'Remote',
      apply_url: '#',
      sort_order: 1,
      is_active: true,
    },
    {
      id: 'job-engineering-manager',
      title: 'Engineering Manager',
      department: 'Development',
      summary: 'We are looking for an experienced engineering manager to join our team.',
      job_description_html: '',
      notification_email: null,
      location_label: '100% remote',
      employment_type: 'Full-time',
      workplace_type: 'Remote',
      apply_url: '#',
      sort_order: 2,
      is_active: true,
    },
    {
      id: 'job-customer-success-manager',
      title: 'Customer Success Manager',
      department: 'Customer Service',
      summary: 'We are looking for a customer success manager to join our team.',
      job_description_html: '',
      notification_email: null,
      location_label: '100% remote',
      employment_type: 'Full-time',
      workplace_type: 'Remote',
      apply_url: '#',
      sort_order: 3,
      is_active: true,
    },
  ],
}

const orderBy = <T extends { sort_order: number }>(items: T[]) =>
  [...items].sort((a, b) => a.sort_order - b.sort_order)

export const contentApi = {
  fallback,
  async getSiteContent(): Promise<SiteContent> {
    try {
      const [branding, team, services, insights, media, jobs] = await Promise.all([
        supabaseRest.selectOne<BrandingContent>('branding_content'),
        supabaseRest.select<TeamMember>('team_members'),
        supabaseRest.select<ServiceItem>('services'),
        supabaseRest.select<InsightItem>('insights'),
        supabaseRest.select<MediaItem>('media_items'),
        supabaseRest.select<JobPost>('job_posts'),
      ])
      return {
        branding: branding ?? fallback.branding,
        team: orderBy(team).filter((x) => x.is_active),
        services: orderBy(services).filter((x) => x.is_active),
        insights: orderBy(insights).filter((x) => x.is_active),
        media: orderBy(media).filter((x) => x.is_active),
        jobs: orderBy(jobs).filter((x) => x.is_active),
      }
    } catch {
      return {
        branding: fallback.branding,
        team: [],
        services: [],
        insights: [],
        media: [],
        jobs: [],
      }
    }
  },
  async bulkDelete(table: string, ids: string[]) {
    await supabaseRest.deleteByIds(table, ids)
  },
  async bulkSetActive(table: string, ids: string[], is_active: boolean) {
    await supabaseRest.patchByIds(table, ids, { is_active })
  },
  async upsertRow(table: string, payload: Record<string, unknown>) {
    await supabaseRest.upsert(table, payload)
  },
  async submitJobApplication(payload: JobApplicationInput) {
    await supabaseRest.upsert('job_applications', {
      job_id: payload.job_id,
      full_name: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      cover_note: payload.cover_note,
      cv_url: payload.cv_url,
      submitted_at: new Date().toISOString(),
      status: 'new',
    })
    await supabaseRest.callFunction<{ ok: boolean }>('submission-email', {
      type: 'job_application',
      payload,
    })
  },
  async submitContactInquiry(payload: ContactInquiryInput) {
    await supabaseRest.upsert('contact_submissions', {
      full_name: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      message: payload.message,
      submitted_at: new Date().toISOString(),
      status: 'new',
    })
    await supabaseRest.callFunction<{ ok: boolean }>('submission-email', {
      type: 'contact_inquiry',
      payload,
    })
  },
  async getSmtpSettings(): Promise<SmtpSettings> {
    const response = await supabaseRest.callFunction<{ ok: boolean; data: SmtpSettings }>('smtp-secrets', {
      action: 'get',
    })
    return response.data
  },
  async saveSmtpSettings(payload: SmtpSettings) {
    await supabaseRest.callFunction<{ ok: boolean }>('smtp-secrets', {
      action: 'save',
      payload,
    })
  },
  async uploadMedia(file: File, folder?: string, onProgress?: (percent: number) => void) {
    return supabaseRest.uploadMedia(file, folder, undefined, onProgress)
  },
  async listMediaFiles() {
    const [storageResult, assetsResult] = await Promise.allSettled([
      supabaseRest.listMedia(),
      supabaseRest.select<MediaItem>('media_items'),
    ])

    const storageItems =
      storageResult.status === 'fulfilled'
        ? storageResult.value.map((entry) => ({
            path: entry.name,
            publicUrl: supabaseRest.getPublicMediaUrl(entry.name),
          }))
        : []

    const assetItems =
      assetsResult.status === 'fulfilled'
        ? assetsResult.value
            .filter((item) => item.kind === 'asset' && Boolean(item.file_url || item.value))
            .map((item) => ({
              path: item.file_path ?? item.label ?? item.id,
              publicUrl: item.file_url ?? item.value,
            }))
        : []

    const merged = [...storageItems, ...assetItems].filter(
      (item) => typeof item.publicUrl === 'string' && /^https?:\/\//i.test(item.publicUrl),
    )

    const deduped = new Map<string, { path: string; publicUrl: string }>()
    for (const item of merged) {
      if (!deduped.has(item.publicUrl)) deduped.set(item.publicUrl, item)
    }
    return Array.from(deduped.values())
  },
}
