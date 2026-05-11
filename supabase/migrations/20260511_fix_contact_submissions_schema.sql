create table if not exists contact_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  message text not null,
  status text not null default 'new',
  submitted_at timestamptz not null default now()
);

alter table contact_submissions
add column if not exists full_name text;

alter table contact_submissions
add column if not exists phone text;

alter table contact_submissions
add column if not exists message text;

alter table contact_submissions
add column if not exists status text default 'new';

alter table contact_submissions
add column if not exists submitted_at timestamptz default now();

update contact_submissions
set full_name = coalesce(nullif(trim(full_name), ''), 'Unknown')
where full_name is null or trim(full_name) = '';

update contact_submissions
set phone = coalesce(nullif(trim(phone), ''), 'N/A')
where phone is null or trim(phone) = '';

update contact_submissions
set message = coalesce(nullif(trim(message), ''), 'No message provided.')
where message is null or trim(message) = '';

update contact_submissions
set status = coalesce(nullif(trim(status), ''), 'new')
where status is null or trim(status) = '';

update contact_submissions
set submitted_at = coalesce(submitted_at, now())
where submitted_at is null;

alter table contact_submissions
alter column full_name set not null;

alter table contact_submissions
alter column phone set not null;

alter table contact_submissions
alter column message set not null;

alter table contact_submissions
alter column status set not null;

alter table contact_submissions
alter column submitted_at set not null;
