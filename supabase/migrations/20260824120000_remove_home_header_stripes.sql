-- Removes the faint repeating vertical-line overlay from the homepage
-- header banner, requested as a visual cleanup.
update public.pages
set content = replace(
    content,
    '<div class="absolute inset-0 opacity-[0.04]" style="background-image: repeating-linear-gradient(90deg, white 0px, transparent 2px, transparent 60px);"></div>',
    ''
  ),
  updated_at = now()
where slug = 'home';
