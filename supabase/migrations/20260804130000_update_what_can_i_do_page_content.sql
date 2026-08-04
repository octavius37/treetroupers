-- Rebuilds the "What Can I Do?" CMS page content to match the design
-- template (screenshots) supplied for this page: a lightbulb hero
-- ("You can make a difference") with anchor badges to three sections
-- (Individual / Community / Global actions), each with photo placeholders
-- and paired action cards, closing with the "Contribute to global tree
-- planting efforts" CTA. Uses upsert-by-slug so this applies whether the
-- page was already seeded (via seed-default-pages) or not.
insert into public.pages (title, slug, content, status, show_in_nav, nav_order)
values (
  'What Can I Do?',
  'what-can-i-do',
  $page$<section class="relative py-32 px-6 bg-gradient-to-br from-gray-900 via-gray-800 to-amber-900 overflow-hidden">
  <span class="absolute top-4 right-4 z-20 text-xs font-semibold uppercase tracking-wider bg-white text-gray-900 px-3 py-1 rounded-full">Photo placeholder: Lit lightbulb close-up</span>
  <div class="relative z-10 max-w-6xl mx-auto">
    <h1 class="text-4xl md:text-6xl font-bold text-white mb-4">You can make a difference</h1>
  </div>
  <a href="#individual-actions" style="position:absolute; left:6%; top:42%; width:180px; height:180px;" class="rounded-full bg-pink-500 opacity-80 flex items-center justify-center text-center text-gray-900 font-bold px-4">Individual actions</a>
  <a href="#community-actions" style="position:absolute; right:8%; top:12%; width:180px; height:180px;" class="rounded-full bg-green-500 opacity-80 flex items-center justify-center text-center text-gray-900 font-bold px-4">Community actions</a>
  <a href="#global-actions" style="position:absolute; right:18%; bottom:4%; width:180px; height:180px;" class="rounded-full bg-sky-400 opacity-80 flex items-center justify-center text-center text-gray-900 font-bold px-4">Global actions</a>
</section>
<section id="individual-actions" class="py-16 px-4 bg-green-600 text-center">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-3xl font-bold text-white mb-10">Individual actions</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      <div class="h-64 rounded-lg bg-gradient-to-br from-emerald-700 via-green-600 to-lime-500 flex items-center justify-center text-white text-xs font-semibold uppercase tracking-wider px-4">Photo placeholder: Planting a sapling</div>
      <div class="h-64 rounded-lg bg-gradient-to-br from-sky-600 via-teal-500 to-emerald-500 flex items-center justify-center text-white text-xs font-semibold uppercase tracking-wider px-4">Photo placeholder: Digital / tech abstract</div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
      <div>
        <h3 class="text-2xl font-bold text-white mb-4">Plant a tree in your own garden</h3>
        <p class="text-green-50 leading-relaxed">Every tree planted makes a difference. This is something you can do at home, at little to no cost. We have helpful guides to get you started here. Join tree troupe, use our geotagging software to log your trees, and track your progress with your friends!</p>
      </div>
      <div>
        <h3 class="text-2xl font-bold text-white mb-4">Plant free trees doing everyday tasks</h3>
        <p class="text-green-50 leading-relaxed">There are many apps, browsers and search engines that will plant trees simply by you using them. So you help the planet by doing something you would do anyway! Win! For our list and review of the options, see here. Join tree troupe and track your progress with your friends!</p>
      </div>
    </div>
    <a href="/dashboard/plant" class="inline-block bg-white border-2 border-green-600 text-green-700 px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition-colors">Learn More</a>
  </div>
</section>
<section id="community-actions" class="py-16 px-4 bg-gray-200 text-center">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-3xl font-bold text-gray-900 mb-10">Community actions</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      <div class="h-64 rounded-lg bg-gradient-to-br from-lime-700 via-green-600 to-emerald-800 flex items-center justify-center text-white text-xs font-semibold uppercase tracking-wider px-4">Photo placeholder: Community tree planting</div>
      <div class="h-64 rounded-lg bg-gradient-to-br from-stone-400 via-neutral-500 to-stone-600 flex items-center justify-center text-white text-xs font-semibold uppercase tracking-wider px-4">Photo placeholder: Climate justice protest sign</div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
      <div>
        <h3 class="text-2xl font-bold text-gray-900 mb-4">Join a tree planting effort in your neighbourhood</h3>
        <p class="text-gray-700 leading-relaxed">Many organizations run tree planting efforts around the world. Join your local tree troupe pod to find out about events happening in your area, and track your progress with your friends!</p>
      </div>
      <div>
        <h3 class="text-2xl font-bold text-gray-900 mb-4">Engage with your municipality to plant trees</h3>
        <p class="text-gray-700 leading-relaxed">Many local municipalities have greening programs underway. Join your local tree troupe pod to find out about, and take advantage of, local programs, and to band together with other members to lobby your local politicians to take action.</p>
      </div>
    </div>
    <a href="/dashboard/communities" class="inline-block bg-white border-2 border-green-600 text-green-700 px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition-colors">Learn More</a>
  </div>
</section>
<section id="global-actions" class="relative pt-16 pb-32 px-4 bg-white text-center overflow-hidden">
  <h2 class="text-3xl font-bold text-green-700 mb-10">Global actions</h2>
  <div class="max-w-2xl mx-auto h-64 rounded-lg bg-gradient-to-br from-lime-400 via-green-500 to-emerald-700 flex items-center justify-center text-white text-xs font-semibold uppercase tracking-wider px-4 mb-16">Photo placeholder: Seedling trays</div>
  <h2 class="text-3xl md:text-4xl font-bold text-green-700 mb-6">Contribute to global tree planting efforts</h2>
  <p class="text-green-700 max-w-2xl mx-auto mb-10 leading-relaxed">Many organizations engage in mass restoration, reforestation, and conservation efforts around the world. See our review of different organizations here. Track your contributions with your friends by joining tree troupe.</p>
  <a href="/register" class="inline-block bg-white border-2 border-green-600 text-green-700 px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition-colors">Learn More</a>
  <div style="position:absolute; left:0; right:0; bottom:0; height:90px; overflow:hidden;">
    <svg viewBox="0 0 1440 90" preserveAspectRatio="none" style="width:100%; height:100%; display:block;">
      <path d="M0,60 C360,0 1080,120 1440,40 L1440,90 L0,90 Z" fill="#16a34a"></path>
    </svg>
  </div>
</section>$page$,
  'published',
  false,
  0
)
on conflict (slug) do update
  set content = excluded.content,
      updated_at = now();
