-- Apply 4-row accordion service content to existing rows as well.
-- This migration updates existing service-1..service-4 records.

insert into services (id, tag, title, description, quote, image_url, detail_sections, sort_order, is_active) values
('service-1','Finance Department','Finance Department','A Structured Approach to Financial Control & Growth','A Structured Approach to Financial Control & Growth',null,$$[
  {"title":"Financial Strategy & Planning","description":"We align financial direction with business goals through structured planning, forecasting, and budgeting. This ensures resources are allocated efficiently, supporting sustainable growth, profitability, and confident decision-making across UAE and wider GCC operations."},
  {"title":"Board Reporting & Insights","description":"We deliver clear, data-driven financial reporting including monthly statements, KPI tracking, and variance analysis. Leadership gains actionable insights and scenario planning to make informed strategic decisions backed by accurate financial intelligence."},
  {"title":"Regulatory Compliance & Governance","description":"We ensure full compliance with UAE regulations including Corporate Tax, VAT, IFRS standards, and statutory filings. All submissions are accurate, timely, and aligned with evolving legal frameworks to protect the business from financial risk."},
  {"title":"Audit & Internal Controls","description":"We implement strong internal control frameworks and manage audits end-to-end. Risks are identified early, processes are strengthened, and corrective actions are applied to maintain financial integrity, transparency, and operational accountability."}
]$$::jsonb,1,true),
('service-2','Compliance Department','Compliance Department','Ensuring Market Readiness & Regulatory Confidence','Ensuring Market Readiness & Regulatory Confidence',null,$$[
  {"title":"Regulatory Strategy & Market Entry","description":"We define clear regulatory pathways for products and expansion by assessing approval requirements, risks, and timelines. This ensures efficient entry into markets while minimising delays and maintaining full compliance with regional standards."},
  {"title":"Submissions & Authority Management","description":"We handle all regulatory submissions, approvals, renewals, and communications with governing bodies. Documentation is maintained accurately, ensuring products remain authorised and aligned with all applicable regulatory requirements."},
  {"title":"Compliance Oversight & Risk Control","description":"We continuously monitor regulations, industry standards, and internal compliance. Risks are identified early with mitigation strategies implemented, ensuring uninterrupted operations and protection against regulatory or reputational exposure."},
  {"title":"Regulatory Intelligence & Advisory","description":"We track global regulatory changes and provide strategic guidance across departments. This ensures the business stays ahead of evolving laws while supporting product development, marketing, and operational decisions with compliant direction."}
]$$::jsonb,2,true),
('service-3','Human Resources','Human Resources','Building & Managing High-Performance Teams','Building & Managing High-Performance Teams',null,$$[
  {"title":"Talent Acquisition & Workforce Planning","description":"We attract and recruit top talent across UAE and UK markets through structured hiring, compliant contracts, and effective onboarding. Workforce planning ensures the organisation scales efficiently with the right people in place."},
  {"title":"Employee Lifecycle Management","description":"We manage the full employee journey including onboarding, performance tracking, promotions, and exits. Processes are structured, transparent, and compliant, ensuring consistency and clarity across both UAE and UK operations."},
  {"title":"Payroll, Benefits & Legal Compliance","description":"We administer salaries, benefits, and compensation structures aligned with UAE and UK regulations. All payroll processes are accurate and compliant, ensuring employees are paid fairly while minimising legal and financial risk."},
  {"title":"Performance, Engagement & Development","description":"We drive employee performance through structured appraisals, training programmes, and engagement initiatives. This builds a motivated, skilled workforce aligned with company goals and fosters a strong, consistent organisational culture."}
]$$::jsonb,3,true),
('service-4','Project Management','Project Management','Delivering Projects with Precision & Control','Delivering Projects with Precision & Control',null,$$[
  {"title":"Project Planning & Strategy","description":"We define clear project scopes, timelines, and resource plans aligned with business objectives. This ensures every project begins with structured direction, minimising risks and setting a strong foundation for successful delivery."},
  {"title":"Execution & Coordination","description":"We manage day-to-day project execution, coordinating teams, stakeholders, and resources. Communication remains clear and consistent, ensuring all parties stay aligned and projects progress efficiently without unnecessary delays."},
  {"title":"Monitoring & Performance Control","description":"We track progress through milestones, KPIs, and reporting frameworks. Issues are identified early, adjustments are made proactively, and performance is continuously optimised to keep projects on schedule and within scope."},
  {"title":"Delivery & Continuous Improvement","description":"We ensure successful project completion with quality assurance and post-delivery evaluation. Learnings are documented and applied to future projects, driving continuous improvement and higher efficiency across all operations."}
]$$::jsonb,4,true)
on conflict (id) do update set
  tag = excluded.tag,
  title = excluded.title,
  description = excluded.description,
  quote = excluded.quote,
  image_url = excluded.image_url,
  detail_sections = excluded.detail_sections,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
