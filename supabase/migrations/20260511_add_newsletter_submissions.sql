create table if not exists newsletter_submissions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text default 'footer',
  status text not null default 'new',
  submitted_at timestamptz not null default now()
);
