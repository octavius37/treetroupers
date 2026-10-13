-- Limit planting_suggestions reads to logged-in members.
--
-- 20260924120000 created a public read policy, so anyone with the anon key
-- could list every member's suggested spots and notes. The only reader is the
-- auth-protected /dashboard/suggest page, which queries as the logged-in user,
-- so the anon key has no reason to see these rows.
drop policy "planting_suggestions: public read" on public.planting_suggestions;

create policy "planting_suggestions: member read" on public.planting_suggestions
  for select to authenticated using (true);
