-- Make `leaderboard` apply the caller's RLS instead of its owner's.
--
-- Views run with their owner's privileges unless created with
-- `security_invoker`, so this one ignored RLS on the tables it reads. Supabase's
-- security advisor reports that as `security_definer_view`. It returns the same
-- rows either way today, because `profiles`, `trees` and `tree_updates` all
-- have a `public read` policy, but a table joined in later would otherwise be
-- read past its policies.
alter view public.leaderboard set (security_invoker = true);
