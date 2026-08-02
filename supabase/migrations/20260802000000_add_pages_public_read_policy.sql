-- `pages` was created with RLS enabled but no policies (see
-- 20260604122558_create_pages_table.sql), which denies all access to the `anon`
-- and `authenticated` roles. Public pages still render today only because every
-- endpoint that touches the table uses serverSupabaseServiceRole, which bypasses
-- RLS — so a deny-all table went unnoticed.
--
-- This adds the read policy the table should have had. It is defence in depth
-- rather than a behaviour change: no current code path is affected, but a future
-- client-side query against `pages` will now return published rows instead of
-- silently returning [].
--
-- Drafts stay invisible to the API. Admin writes continue to run through the
-- service role in requireAdmin()-guarded endpoints, so no write policy is added
-- here — adding one would widen the surface beyond what the app exercises.

create policy "pages: public read" on public.pages
  for select
  using (status = 'published');
