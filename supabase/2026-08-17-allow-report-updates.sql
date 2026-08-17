-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
--
-- The reports table currently has RLS enabled with no UPDATE policy for the
-- anon/publishable role, so PATCH requests silently match 0 rows (return
-- HTTP 200, but change nothing). This breaks the "Edit Report" feature in
-- the dashboard, which relies on PATCH to fix UNASSIGNED reports.
--
-- This adds an UPDATE policy matching the existing SELECT/INSERT access.
-- Run `select * from pg_policies where tablename = 'reports';` first if you
-- want to see what's already there before adding this.

create policy "Allow anon update on reports"
  on reports
  for update
  to anon
  using (true)
  with check (true);
