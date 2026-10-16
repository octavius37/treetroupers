-- Supports the per-tree page (/dashboard/trees/:id) and telling members why a
-- log was rejected.

-- The reviewer's note to the member, shown on the tree page and dashboard and
-- sent in the review email. Mostly a reason for rejecting.
alter table public.trees add column review_note text;

-- Only admins write the note, through the service role. Same as the other
-- review columns, so the guard from
-- 20261016080000_review_tree_logs_before_awarding_points.sql gains it.
create or replace function public.guard_tree_review()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  if tg_op = 'UPDATE' and old.review_status = 'approved' and new.review_status <> 'approved' then
    -- Its points have been paid, and nothing takes them back.
    raise exception 'An approved tree log cannot be un-approved'
      using errcode = 'check_violation';
  end if;

  if current_user not in ('anon', 'authenticated') then
    if tg_op = 'UPDATE' and new.review_status is distinct from old.review_status then
      new.reviewed_at := now();
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.review_status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.review_note := null;
  elsif new.review_status is distinct from old.review_status
     or new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at
     or new.review_note is distinct from old.review_note then
    raise exception 'Only an admin can review a tree log'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

-- Updates are posted by the tree's planter. The old policy only checked the
-- caller was signed in, so anyone could post as anyone on any tree.
drop policy "tree_updates: authenticated insert" on public.tree_updates;

create policy "tree_updates: own insert on own tree" on public.tree_updates
  for insert with check (
    auth.uid() = (select p.auth_user_id from public.profiles p where p.id = tree_updates.author_id)
    and auth.uid() = (
      select p.auth_user_id
      from public.trees t
      join public.profiles p on p.id = t.planted_by
      where t.id = tree_updates.tree_id
    )
  );
