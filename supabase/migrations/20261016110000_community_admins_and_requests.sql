-- Community admins and community requests.
--
-- A member with role 'admin' or 'moderator' in community_members can now post
-- announcements to that community's feed (POST /api/dashboard/feed/posts), so
-- the role has to be something only a site admin hands out.

-- The baseline policy let a member insert their own membership with any role,
-- 'admin' included, straight through the REST API. Joining is as a member only;
-- roles are set by site admins through the service role (/cms/communities).
drop policy "community_members: own insert" on public.community_members;

create policy "community_members: own insert as member" on public.community_members
  for insert with check (
    role = 'member'
    and auth.uid() = (select p.auth_user_id from public.profiles p where p.id = community_members.profile_id)
  );

-- Members ask for a community that doesn't exist yet; a site admin approves
-- (creating it, with the requester as its admin) or declines it in the CMS.
create table public.community_requests (
  id                   uuid primary key default extensions.uuid_generate_v4(),
  requested_by         uuid not null references public.profiles (id) on delete cascade,
  name                 text not null check (char_length(name) between 2 and 80),
  area                 text,
  description          text,
  parent_community_id  uuid references public.communities (id) on delete set null,
  status               text not null default 'pending'
                         check (status in ('pending', 'approved', 'declined')),
  community_id         uuid references public.communities (id) on delete set null,
  created_at           timestamptz not null default now(),
  reviewed_at          timestamptz
);

create index community_requests_pending_idx on public.community_requests (created_at)
  where status = 'pending';

-- Requesters can see their own requests. Writes go through the endpoints
-- (signed in to request, requireAdmin to review), so there are no write policies.
alter table public.community_requests enable row level security;

create policy "community_requests: own read" on public.community_requests
  for select using (
    auth.uid() = (select p.auth_user_id from public.profiles p where p.id = community_requests.requested_by)
  );
