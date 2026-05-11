-- Some databases have a legacy NOT NULL column "name" while the SPA inserts "full_name",
-- leaving "name" null and causing 23502 on POST /rest/v1/contact_submissions.
-- Canonical column for this project is full_name (see src/lib/content.ts).

do $migration$
begin
  if to_regclass('public.contact_submissions') is null then
    return;
  end if;

  -- Only full_name: nothing to do.
  -- Only legacy name: rename to full_name so PostgREST matches the app payload.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contact_submissions' and column_name = 'name'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contact_submissions' and column_name = 'full_name'
  ) then
    execute 'alter table public.contact_submissions rename column name to full_name';
    return;
  end if;

  -- Both name and full_name: merge into full_name, then drop legacy name.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contact_submissions' and column_name = 'name'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contact_submissions' and column_name = 'full_name'
  ) then
    update public.contact_submissions
    set full_name = coalesce(
      nullif(trim(full_name), ''),
      nullif(trim(name), ''),
      'Unknown'
    )
    where full_name is null or trim(full_name) = '';

    execute 'alter table public.contact_submissions drop column name';
  end if;
end $migration$;
