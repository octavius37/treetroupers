-- The community feed: admin announcements under headings, automatic posts when
-- a member's tree log is approved, and likes so people can congratulate each
-- other. Posting earns no points.
--
-- One table holds both kinds of post so likes need a single foreign key:
--
--   announcement  written by an admin in the CMS, under a category, for one
--                 community (and the communities inside it) or, with no
--                 community, for everyone
--   activity      "X just planted/donated/earned ..." — written by the
--                 on_tree_approved_post trigger. It stores only the tree; the
--                 wording comes from the tree when the feed is rendered.
create table public.feed_posts (
  id            uuid primary key default extensions.uuid_generate_v4(),
  kind          text not null check (kind in ('announcement', 'activity')),
  community_id  uuid references public.communities (id) on delete cascade,
  author_id     uuid references public.profiles (id) on delete set null,
  -- Adding a heading means widening this check in a new migration and adding
  -- it to FEED_CATEGORIES in server/utils/feed.ts.
  category      text check (category in ('upcoming_events', 'latest_news')),
  title         text,
  body          text,
  photo_url     text,
  event_at      timestamptz,
  tree_id       uuid references public.trees (id) on delete cascade,
  created_at    timestamptz not null default now(),

  constraint feed_posts_announcement_shape check (
    kind <> 'announcement'
    or (category is not null and title is not null and tree_id is null)
  ),
  constraint feed_posts_activity_shape check (
    kind <> 'activity' or (tree_id is not null and category is null)
  ),
  constraint feed_posts_event_has_date check (
    category is distinct from 'upcoming_events' or event_at is not null
  )
);

create index feed_posts_community_created_idx on public.feed_posts (community_id, created_at desc);
create index feed_posts_author_idx on public.feed_posts (author_id);
-- One activity post per tree, so approving can never announce a log twice.
create unique index feed_posts_one_per_tree on public.feed_posts (tree_id) where kind = 'activity';

create table public.post_likes (
  post_id     uuid not null references public.feed_posts (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create index post_likes_profile_idx on public.post_likes (profile_id);

-- Readable by anyone, like trees and communities. There are deliberately no
-- write policies: announcements are written through /api/cms/feed-posts
-- (requireAdmin), likes through /api/dashboard/feed/posts/:id/like (signed in),
-- and activity posts by the trigger below, all bypassing RLS.
alter table public.feed_posts enable row level security;
alter table public.post_likes enable row level security;

create policy "feed_posts: public read" on public.feed_posts
  for select using (true);

create policy "post_likes: public read" on public.post_likes
  for select using (true);

create or replace function public.post_activity_for_approved_tree()
returns trigger
language plpgsql
-- feed_posts has no insert policy.
security definer
set search_path = public, extensions
as $$
begin
  if new.review_status <> 'approved' or new.planted_by is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.review_status = 'approved' then
    return new;
  end if;

  insert into public.feed_posts (kind, community_id, author_id, tree_id)
  values ('activity', new.community_id, new.planted_by, new.id)
  on conflict (tree_id) where kind = 'activity' do nothing;

  return new;
end;
$$;

revoke execute on function public.post_activity_for_approved_tree() from public, anon, authenticated;

create trigger on_tree_approved_post
  after insert or update of review_status on public.trees
  for each row execute function public.post_activity_for_approved_tree();

-- Give the feed some history: one activity post per tree that is already
-- approved, dated when it was logged.
insert into public.feed_posts (kind, community_id, author_id, tree_id, created_at)
select 'activity', t.community_id, t.planted_by, t.id, t.created_at
from public.trees t
where t.review_status = 'approved' and t.planted_by is not null
on conflict (tree_id) where kind = 'activity' do nothing;
