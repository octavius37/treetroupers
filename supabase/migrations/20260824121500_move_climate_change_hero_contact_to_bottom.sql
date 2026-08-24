-- Moves the "Read on to discover..." hero banner and the "Contact us" CTA
-- section on the climate-change page below the closing "Find out what you
-- can do" CTA, so they sit at the true bottom of the page (per admin
-- request) instead of ahead of it.
--
-- Uses regex extraction rather than a full content overwrite so any live
-- edits made via the CMS admin UI since the last content migration (e.g. a
-- swapped-in photo) are preserved untouched — only the two sections'
-- position changes.
do $$
declare
  v_content text;
  v_hero text;
  v_contact text;
begin
  select content into v_content from public.pages where slug = 'climate-change';

  if v_content is null then
    return;
  end if;

  v_hero := substring(v_content from '<section class="relative h-\[400px\][\s\S]*?</section>');
  v_contact := substring(v_content from '<section class="py-12 px-4 bg-green-600 text-center">[\s\S]*?</section>');

  if v_hero is null or v_contact is null then
    raise notice 'climate-change page content did not match the expected hero/contact-us section markers; skipping reorder.';
    return;
  end if;

  v_content := replace(v_content, v_hero, '');
  v_content := replace(v_content, v_contact, '');

  update public.pages
  set content = v_content || v_hero || v_contact,
      updated_at = now()
  where slug = 'climate-change';
end $$;
