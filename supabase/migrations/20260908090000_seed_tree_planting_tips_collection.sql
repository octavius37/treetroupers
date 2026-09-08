-- Anchor page for the "Tree planting tips" blog (see AGENTS.md "vlog/blog
-- collection" note). Its own content is never rendered — /tree-planting-tips
-- is a code route and outranks this row in the [slug].vue catch-all — it only
-- exists so admins have a page to set as `parent_id` when authoring posts in
-- the CMS. show_in_nav is false because the collection is linked from body
-- copy, not the site nav.
insert into public.pages (title, slug, content, status, show_in_nav)
values (
  'Tree planting tips',
  'tree-planting-tips',
  '',
  'published',
  false
)
on conflict (slug) do nothing;
