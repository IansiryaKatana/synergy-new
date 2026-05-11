create extension if not exists pgcrypto;

create table if not exists branding_content (
  id text primary key,
  company_name text not null,
  hero_eyebrow text not null,
  hero_title text not null,
  hero_subtitle text not null,
  services_title text not null,
  services_description text not null,
  team_title text not null,
  insights_title text not null,
  insights_description text not null,
  footer_address text not null,
  footer_newsletter_title text not null,
  footer_pitch text not null,
  footer_wordmark text not null,
  footer_email text not null,
  logo_url text,
  favicon_url text,
  homepage_hero_video_url text,
  homepage_team_background_url text,
  services_hero_background_url text,
  about_hero_background_url text,
  contact_hero_background_url text
);

create table if not exists team_members (
  id text primary key,
  initials text not null,
  name text not null,
  role text not null,
  bio text not null,
  email text not null,
  number text not null,
  avatar_url text,
  sort_order int not null default 1,
  is_active boolean not null default true
);

create table if not exists services (
  id text primary key,
  tag text not null,
  title text not null,
  description text not null,
  quote text not null,
  image_url text,
  detail_sections jsonb not null default '[]'::jsonb,
  sort_order int not null default 1,
  is_active boolean not null default true
);

create table if not exists insights (
  id text primary key,
  chip text not null,
  date_label text not null,
  title text not null,
  image_url text,
  alt_style boolean not null default false,
  sort_order int not null default 1,
  is_active boolean not null default true
);

create table if not exists media_items (
  id text primary key,
  kind text not null check (kind in ('trust','social','asset')),
  label text not null,
  value text not null,
  link_url text,
  file_path text,
  file_url text,
  sort_order int not null default 1,
  is_active boolean not null default true
);

create table if not exists job_posts (
  id text primary key,
  title text not null,
  department text not null,
  summary text not null,
  location_label text not null default '100% remote',
  employment_type text not null default 'Full-time',
  workplace_type text not null default 'Remote',
  apply_url text,
  sort_order int not null default 1,
  is_active boolean not null default true
);

create table if not exists job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references job_posts(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  cover_note text,
  cv_url text,
  status text not null default 'new',
  submitted_at timestamptz not null default now()
);

alter table job_applications add column if not exists cv_url text;

alter table media_items drop constraint if exists media_items_kind_check;
alter table media_items
  add constraint media_items_kind_check
  check (kind in ('trust','social','asset'));

alter table team_members add column if not exists avatar_url text;
alter table services add column if not exists image_url text;
alter table services add column if not exists detail_sections jsonb not null default '[]'::jsonb;
alter table insights add column if not exists image_url text;
alter table media_items add column if not exists file_path text;
alter table media_items add column if not exists file_url text;
alter table media_items add column if not exists link_url text;

alter table branding_content add column if not exists logo_url text;
alter table branding_content add column if not exists favicon_url text;
alter table branding_content add column if not exists homepage_hero_video_url text;
alter table branding_content add column if not exists homepage_team_background_url text;
alter table branding_content add column if not exists services_hero_background_url text;
alter table branding_content add column if not exists about_hero_background_url text;
alter table branding_content add column if not exists contact_hero_background_url text;
alter table branding_content add column if not exists industries_hero_background_url text;

insert into branding_content (
  id, company_name, hero_eyebrow, hero_title, hero_subtitle, services_title,
  services_description, team_title, insights_title, insights_description,
  footer_address, footer_newsletter_title, footer_pitch, footer_wordmark, footer_email, logo_url, favicon_url,
  homepage_hero_video_url, homepage_team_background_url, services_hero_background_url, about_hero_background_url, contact_hero_background_url, industries_hero_background_url
) values (
  'default', 'Synergy Project Management', 'Synergy Project Management',
  'Your growth partner for companies ready to scale.',
  'Synergy Project Management helps corporate teams align strategy, delivery, and operational clarity.',
  'Services',
  'Department-focused delivery across Finance, Compliance, HR, and integrated Project Management.',
  'Meet the team behind the growth.',
  'Projects.',
  'We are a leading project management company providing an international, proactive, hands-on approach to managing projects.',
  E'287 Mission Street\nSan Francisco, CA 94110',
  'Subscribe to our newsletter.',
  'Stalled revenue, leaky funnels, stretched leadership. Whatever is holding you back, let''s solve it.',
  'synergy',
  'Info@synergypm.ae',
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null
) on conflict (id) do update set
  company_name = excluded.company_name,
  hero_eyebrow = excluded.hero_eyebrow,
  hero_title = excluded.hero_title,
  hero_subtitle = excluded.hero_subtitle,
  services_title = excluded.services_title,
  services_description = excluded.services_description,
  team_title = excluded.team_title,
  insights_title = excluded.insights_title,
  insights_description = excluded.insights_description,
  footer_address = excluded.footer_address,
  footer_newsletter_title = excluded.footer_newsletter_title,
  footer_pitch = excluded.footer_pitch,
  footer_wordmark = excluded.footer_wordmark,
  footer_email = excluded.footer_email,
  logo_url = excluded.logo_url,
  favicon_url = excluded.favicon_url,
  homepage_hero_video_url = excluded.homepage_hero_video_url,
  homepage_team_background_url = excluded.homepage_team_background_url,
  services_hero_background_url = excluded.services_hero_background_url,
  about_hero_background_url = excluded.about_hero_background_url,
  contact_hero_background_url = excluded.contact_hero_background_url,
  industries_hero_background_url = excluded.industries_hero_background_url;

update team_members
set is_active = false
where id not in (
  'anish-vettuvelil',
  'yan-thappa',
  'sidhiq-ahemedkunhi',
  'rajesh-sebastain',
  'vishnu-balachnadran',
  'saira',
  'divya-velikkath',
  'rituja-shahane',
  'rohan-smith',
  'ankita-ananad-acharya',
  'adeeb-noor-mahomed',
  'natalia-anna-gosciniak',
  'raina-ezechiel',
  'shibila-hakeem',
  'devapriya-venugopal',
  'dhanashree-vishwanath',
  'muhammed-jadeer',
  'harold-garcia-perez',
  'john-benedick-amo',
  'misba-naz-saikalgar',
  'wasim-iqbal',
  'rajgopalan-vasudevan',
  'carmichael-galbis-anacin',
  'marvin-osei',
  'ian-sirya-katana',
  'theophilus-aidoo',
  'yasmin-azzawi',
  'may-zin-htwe',
  'anjelica-bergonia-verosil',
  'mohammed-rafiq-amanji',
  'zohra-zoulati'
);

insert into team_members (id, initials, name, role, bio, email, number, avatar_url, sort_order, is_active) values
('anish-vettuvelil','AN','Anish Vettuvelil','Chief Financial Officer','Leads financial planning, budgeting, and controls to support sustainable project growth.','anish.vettuvelil@synergypm.com','01','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',1,true),
('yan-thappa','YT','Yan Thappa','Project Manager','Coordinates project execution plans, milestones, and delivery timelines across teams.','yan.thappa@synergypm.com','02','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',2,true),
('sidhiq-ahemedkunhi','SA','Sidhiq Ahemedkunhi','Project Financial Officer (UAE)','Manages UAE project financial operations, controls, and reporting requirements.','sidhiq.ahemedkunhi@synergypm.com','03','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',3,true),
('rajesh-sebastain','RS','Rajesh Sebastain','Project Financial Officer (UK)','Oversees UK project budgets, compliance, and financial performance reporting.','rajesh.sebastain@synergypm.com','04','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',4,true),
('vishnu-balachnadran','VB','Vishnu Balachnadran','Financial Auditor','Reviews financial records, validates controls, and highlights risk exposure.','vishnu.balachnadran@synergypm.com','05','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',5,true),
('saira','SA','Saira','Human Resources Manager','Leads recruitment, people operations, and employee engagement initiatives.','saira@synergypm.com','06','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',6,true),
('divya-velikkath','DV','Divya Velikkath','HR Coordinator','Supports HR workflows, onboarding, and employee lifecycle coordination.','divya.velikkath@synergypm.com','07','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',7,true),
('rituja-shahane','RS','Rituja Shahane','Social Media Specialist','Plans and executes social campaigns to improve brand reach and engagement.','rituja.shahane@synergypm.com','08','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',8,true),
('rohan-smith','RS','Rohan Smith','Paralegal','Supports legal documentation, case preparation, and compliance follow-through.','rohan.smith@synergypm.com','09','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',9,true),
('ankita-ananad-acharya','AA','Ankita Ananad Acharya','Compliance Officer','Maintains compliance programmes, audits controls, and enforces policy standards.','ankita.ananad.acharya@synergypm.com','10','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',10,true),
('adeeb-noor-mahomed','AN','Adeeb Noor Mahomed','Compliance Officer','Monitors regulatory requirements and supports audit-ready compliance operations.','adeeb.noor.mahomed@synergypm.com','11','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',11,true),
('natalia-anna-gosciniak','NG','Natalia Anna Gosciniak','Marketing Director','Leads marketing strategy, positioning, and growth initiatives across channels.','natalia.anna.gosciniak@synergypm.com','12','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',12,true),
('raina-ezechiel','RE','Raina Ezechiel','Marketing Manager','Drives campaign planning, execution, and performance optimisation.','raina.ezechiel@synergypm.com','13','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',13,true),
('shibila-hakeem','SH','Shibila Hakeem','Senior Marketing Executive','Executes channel programmes and tracks marketing conversion outcomes.','shibila.hakeem@synergypm.com','14','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',14,true),
('devapriya-venugopal','DV','Devapriya Venugopal','Marketing Assistant','Supports campaign operations, content scheduling, and reporting workflows.','devapriya.venugopal@synergypm.com','15','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',15,true),
('dhanashree-vishwanath','DV','Dhanashree Vishwanath','Senior Graphic Designer','Designs visual assets and ensures brand consistency across outputs.','dhanashree.vishwanath@synergypm.com','16','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',16,true),
('muhammed-jadeer','MJ','Muhammed Jadeer','Senior Graphic Designer','Creates high-impact graphics for campaigns, web, and production deliverables.','muhammed.jadeer@synergypm.com','17','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',17,true),
('harold-garcia-perez','HP','Harold Garcia Perez','Production Manager','Leads production schedules, quality checks, and delivery coordination.','harold.garcia.perez@synergypm.com','18','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',18,true),
('john-benedick-amo','JA','John Benedick Amo','Production Coordinator','Coordinates production tasks, handoffs, and team communication.','john.benedick.amo@synergypm.com','19','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',19,true),
('misba-naz-saikalgar','MS','Misba Naz Saikalgar','Sales Coordinator','Supports sales operations, lead workflows, and follow-up execution.','misba.naz.saikalgar@synergypm.com','20','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',20,true),
('wasim-iqbal','WI','Wasim Iqbal','Sales Manager','Leads sales strategy, pipeline growth, and team performance tracking.','wasim.iqbal@synergypm.com','21','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',21,true),
('rajgopalan-vasudevan','RV','Rajgopalan Vasudevan','Head of Operations','Oversees operational systems, delivery governance, and process optimisation.','rajgopalan.vasudevan@synergypm.com','22','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',22,true),
('carmichael-galbis-anacin','CA','Carmichael Galbis Anacin','Shopify Developer','Builds and maintains Shopify storefront features and integrations.','carmichael.galbis.anacin@synergypm.com','23','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',23,true),
('marvin-osei','MO','Marvin Osei','Media Manager','Manages media planning, production assets, and distribution quality.','marvin.osei@synergypm.com','24','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',24,true),
('ian-sirya-katana','IK','Ian Sirya Katana','Lead Software Developer','Leads software architecture, implementation quality, and technical delivery.','ian.sirya.katana@synergypm.com','25','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',25,true),
('theophilus-aidoo','TA','Theophilus Aidoo','Graphic Designer','Designs creative assets for digital, print, and campaign touchpoints.','theophilus.aidoo@synergypm.com','26','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',26,true),
('yasmin-azzawi','YA','Yasmin Azzawi','Marketing Manager','Leads campaign execution and channel performance for market growth.','yasmin.azzawi@synergypm.com','27','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',27,true),
('may-zin-htwe','MH','May Zin Htwe','CRM Assistant','Maintains CRM records, customer lifecycle updates, and reporting accuracy.','may.zin.htwe@synergypm.com','28','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',28,true),
('anjelica-bergonia-verosil','AV','Anjelica Bergonia Verosil','Personal Assistant','Provides executive coordination, scheduling, and administrative support.','anjelica.bergonia.verosil@synergypm.com','29','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',29,true),
('mohammed-rafiq-amanji','MA','Mohammed Rafiq Amanji','Executive Assistant for CEO','Supports CEO priorities through planning, communication, and follow-through.','mohammed.rafiq.amanji@synergypm.com','30','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',30,true),
('zohra-zoulati','ZZ','Zohra Zoulati','Front Office Executive','Manages front office operations, visitor experience, and communication flow.','zohra.zoulati@synergypm.com','31','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',31,true)
on conflict (id) do update set
initials = excluded.initials, name = excluded.name, role = excluded.role, bio = excluded.bio, email = excluded.email, number = excluded.number, avatar_url = excluded.avatar_url, sort_order = excluded.sort_order, is_active = excluded.is_active;

update services
set is_active = false
where id not in ('service-1', 'service-2', 'service-3', 'service-4');

insert into services (id, tag, title, description, quote, image_url, detail_sections, sort_order, is_active) values
('service-1','01 - Finance','Finance Head / UAE Finance Controller','Financial leadership, board reporting, UAE statutory compliance, and process transformation.','"Finance strategy aligned to UAE growth and governance."',null,$$[
  {"title":"1. Financial Leadership & Strategy","points":["Lead the overall UAE finance function aligned with group business objectives.","Develop and execute long-term financial strategy to support growth and profitability in the UAE market.","Act as strategic financial advisor to Directors and Board members.","Drive financial planning, budgeting, and forecasting processes."]},
  {"title":"2. Board Reporting & Management Information","points":["Prepare and present monthly and quarterly financial reports to the Board.","Deliver detailed MIS reports including profitability, margin analysis, and KPI performance.","Provide financial insights and variance analysis with actionable recommendations.","Support strategic decision-making with scenario planning and financial modelling."]}
]$$::jsonb,1,true),
('service-2','02 - Compliance','Compliance Department','Regulatory strategy, submissions, licensing, risk controls, and cross-functional compliance advisory.','"Regulatory pathways built for fast and safe market entry."',null,$$[
  {"title":"1. Regulatory Strategy & Planning","points":["Develop regulatory pathways for new products.","Advise leadership on approval requirements, timelines, and risks.","Identify the most efficient route to market (e.g., MHRA, EUCEG, Trading Standards).","Support expansion into new countries by assessing regulatory requirements."]},
  {"title":"2. Regulatory Submissions & Approvals","points":["Prepare and submit applications to regulatory authorities.","Manage product registrations, renewals, and amendments.","Respond to agency questions or deficiency letters.","Maintain regulatory documentation and records."]}
]$$::jsonb,2,true),
('service-3','03 - Human Resources','HR Department','UAE and UK hiring, lifecycle, payroll, compliance, engagement, and strategic workforce support.','"People operations built for UAE and UK scale."',null,$$[
  {"title":"1. Talent Acquisition & Workforce Planning","points":["Plan workforce requirements aligned with business growth in UAE and UK.","Draft job descriptions tailored to market requirements and legal standards.","Screen, shortlist, and interview candidates in compliance with UAE and UK rules."]},
  {"title":"2. Employee Lifecycle Management","points":["Prepare contracts, promotions, transfers, and exit documentation.","Monitor probation periods in line with local regulations.","Manage resignations and final settlements according to statutory requirements."]}
]$$::jsonb,3,true),
('service-4','04 - Integrated Delivery','General Services + Project Management','One coordinated delivery model across finance, compliance, HR, and project management execution.','"One operating system across all departments."',null,$$[
  {"title":"1. Department Coverage","points":["Finance leadership and UAE statutory oversight.","Regulatory strategy, approvals, and compliance operations.","UAE and UK HR lifecycle, payroll, legal compliance, and workforce planning."]},
  {"title":"2. Project Management Integration","points":["Cross-functional planning that aligns departments, milestones, and reporting.","Programme tracking with clear ownership, escalations, and performance indicators.","Unified governance so every team action supports business outcomes."]}
]$$::jsonb,4,true)
on conflict (id) do update set
tag = excluded.tag, title = excluded.title, description = excluded.description, quote = excluded.quote, image_url = excluded.image_url, detail_sections = excluded.detail_sections, sort_order = excluded.sort_order, is_active = excluded.is_active;

insert into insights (id, chip, date_label, title, image_url, alt_style, sort_order, is_active) values
('insight-1','Status: Completed, December 2020','Location: Giovanni Boutique Suites','G + 14 Hotel Apartment',null,false,1,true),
('insight-2','Status: Completed, 2016','Location: Giovanni Boutique Suites','G + 20 Hotel Apartment',null,true,2,true),
('insight-3','Status: Under Construction','Location: Giovanni Boutique Suites','G + 11 Hotel Apartment',null,false,3,true),
('insight-4','Status: Ongoing','Location: Giovanni Boutique Suites','Major Hospital Project',null,true,4,true)
on conflict (id) do update set
chip = excluded.chip, date_label = excluded.date_label, title = excluded.title, image_url = excluded.image_url, alt_style = excluded.alt_style, sort_order = excluded.sort_order, is_active = excluded.is_active;

insert into media_items (id, kind, label, value, link_url, file_path, file_url, sort_order, is_active) values
('trust-1','trust','Venice','Venice',null,null,null,1,true),
('trust-2','trust','Lightspeed','Lightspeed',null,null,null,2,true),
('trust-3','trust','Sitemark','Sitemark',null,null,null,3,true),
('trust-4','trust','Hamilton','Hamilton',null,null,null,4,true),
('social-1','social','X','X','https://x.com',null,null,1,true),
('social-2','social','LinkedIn','LinkedIn','https://linkedin.com',null,null,2,true),
('social-3','social','Instagram','Instagram','https://instagram.com',null,null,3,true),
('social-4','social','Facebook','Facebook','https://facebook.com',null,null,4,true)
on conflict (id) do update set
kind = excluded.kind, label = excluded.label, value = excluded.value, link_url = excluded.link_url, file_path = excluded.file_path, file_url = excluded.file_url, sort_order = excluded.sort_order, is_active = excluded.is_active;

insert into job_posts (id, title, department, summary, location_label, employment_type, workplace_type, apply_url, sort_order, is_active) values
('job-product-designer','Product Designer','Design','We are looking for a mid-level product designer to join our team.','100% remote','Full-time','Remote','#',1,true),
('job-engineering-manager','Engineering Manager','Development','We are looking for an experienced engineering manager to join our team.','100% remote','Full-time','Remote','#',2,true),
('job-customer-success-manager','Customer Success Manager','Customer Service','We are looking for a customer success manager to join our team.','100% remote','Full-time','Remote','#',3,true)
on conflict (id) do update set
title = excluded.title,
department = excluded.department,
summary = excluded.summary,
location_label = excluded.location_label,
employment_type = excluded.employment_type,
workplace_type = excluded.workplace_type,
apply_url = excluded.apply_url,
sort_order = excluded.sort_order,
is_active = excluded.is_active;
