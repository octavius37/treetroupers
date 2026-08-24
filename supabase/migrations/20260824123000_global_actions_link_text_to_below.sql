-- On the "what-can-i-do" page's Global actions section, replaces the
-- hyperlinked "here" (linking to /global-tree-planting-organizations) with
-- the plain word "below", since the "Learn More" button immediately under
-- the paragraph already links there.
update public.pages
set content = replace(
    content,
    'See our review of different organizations <a href="/global-tree-planting-organizations" class="underline hover:text-green-900">here</a>. Track your contributions with your friends by joining tree troupe.',
    'See our review of different organizations below. Track your contributions with your friends by joining tree troupe.'
  ),
  updated_at = now()
where slug = 'what-can-i-do';
