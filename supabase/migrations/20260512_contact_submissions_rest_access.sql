-- contact_submissions: SPA uses PostgREST with the anon key for inserts (contact form) and
-- admin CRUD. If RLS is enabled without policies, or table privileges are missing, POST returns 401.

grant usage on schema public to anon, authenticated;

grant insert, select, update, delete on table public.contact_submissions to anon, authenticated;

alter table public.contact_submissions enable row level security;

drop policy if exists "contact_submissions_insert_public" on public.contact_submissions;
create policy "contact_submissions_insert_public"
  on public.contact_submissions
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "contact_submissions_select_public" on public.contact_submissions;
create policy "contact_submissions_select_public"
  on public.contact_submissions
  for select
  to anon, authenticated
  using (true);

drop policy if exists "contact_submissions_update_public" on public.contact_submissions;
create policy "contact_submissions_update_public"
  on public.contact_submissions
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "contact_submissions_delete_public" on public.contact_submissions;
create policy "contact_submissions_delete_public"
  on public.contact_submissions
  for delete
  to anon, authenticated
  using (true);
