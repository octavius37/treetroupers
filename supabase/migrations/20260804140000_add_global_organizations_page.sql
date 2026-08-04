-- Adds the new "Global tree planting organizations" CMS page (a review of
-- five reforestation nonprofits), and updates the "what-can-i-do" page's
-- "Contribute to global tree planting efforts" CTA so its "here" link and
-- "Learn More" button point at the new page instead of the earlier
-- placeholder targets. Uses upsert-by-slug so this applies whether either
-- page was already seeded or not.

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
  <p class="text-green-700 max-w-2xl mx-auto mb-10 leading-relaxed">Many organizations engage in mass restoration, reforestation, and conservation efforts around the world. See our review of different organizations <a href="/global-tree-planting-organizations" class="underline hover:text-green-900">here</a>. Track your contributions with your friends by joining tree troupe.</p>
  <a href="/global-tree-planting-organizations" class="inline-block bg-white border-2 border-green-600 text-green-700 px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition-colors">Learn More</a>
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

insert into public.pages (title, slug, content, status, show_in_nav, nav_order)
values (
  'Global tree planting organizations',
  'global-tree-planting-organizations',
  $page$<section class="py-16 px-4 bg-gray-200">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Global tree planting organizations</h1>
    <p class="text-green-700 leading-relaxed max-w-3xl">There are a large number of organizations engaged in reforestation and conservation globally. We've done our research and these are some of our favourites, which we consider give the most bang for buck in terms of climate impacts.</p>
  </div>
</section>
<section class="py-16 px-4 bg-white">
  <div class="max-w-5xl mx-auto">
    <p class="text-gray-600 leading-relaxed mb-12 max-w-3xl">For those with limited space or time, a number of well-established nonprofits make it easy to fund global reforestation at scale. Here is our review of some of the best.</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="border border-gray-200 rounded-2xl p-6">
        <div class="w-full h-32 bg-gradient-to-br from-green-100 to-emerald-50 rounded-xl flex items-center justify-center text-gray-400 text-sm mb-4">[Organization logo placeholder]</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">One Tree Planted</h3>
        <p class="text-gray-600 leading-relaxed mb-4">Perhaps the most accessible option, operating on a simple model of $1 per tree planted across projects in over 80 countries. Founded in 2014 to create a straightforward avenue for individuals and businesses to give back and aid in global reforestation.</p>
        <span class="text-green-600 font-medium text-sm">[Add website link]</span>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6">
        <div class="w-full h-32 bg-gradient-to-br from-green-100 to-emerald-50 rounded-xl flex items-center justify-center text-gray-400 text-sm mb-4">[Organization logo placeholder]</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Eden: People + Planet</h3>
        <p class="text-gray-600 leading-relaxed mb-4">Takes a broader approach, supporting community-led restoration activities including indigenous tree planting, fire prevention, and sustainable agriculture training in some of the world's most important ecosystems.</p>
        <span class="text-green-600 font-medium text-sm">[Add website link]</span>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6">
        <div class="w-full h-32 bg-gradient-to-br from-green-100 to-emerald-50 rounded-xl flex items-center justify-center text-gray-400 text-sm mb-4">[Organization logo placeholder]</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">WeForest</h3>
        <p class="text-gray-600 leading-relaxed mb-4">Focuses on science-led landscape restoration, working in partnership with governments, local organisations, and communities on the ground in tropical regions and biodiversity hotspots — with the goal not merely of planting trees but of restoring entire landscapes and protecting them from deforestation over the long term.</p>
        <span class="text-green-600 font-medium text-sm">[Add website link]</span>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6">
        <div class="w-full h-32 bg-gradient-to-br from-green-100 to-emerald-50 rounded-xl flex items-center justify-center text-gray-400 text-sm mb-4">[Organization logo placeholder]</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">TreeSisters</h3>
        <p class="text-gray-600 leading-relaxed mb-4">Channels donations specifically into tropical reforestation, funding ethical, community-led planting projects that empower women and support local and indigenous communities, with 80% of monthly donations going directly to reforestation partner programmes.</p>
        <span class="text-green-600 font-medium text-sm">[Add website link]</span>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6 col-span-2">
        <div class="w-full h-32 bg-gradient-to-br from-green-100 to-emerald-50 rounded-xl flex items-center justify-center text-gray-400 text-sm mb-4">[Organization logo placeholder]</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Trees for the Future</h3>
        <p class="text-gray-600 leading-relaxed mb-4">Links tree planting to poverty alleviation, training farmers across Sub-Saharan Africa to plant, protect, and grow trees as a route to sustainable livelihoods — having already planted over 190 million trees and improved food security for over 150,000 people.</p>
        <span class="text-green-600 font-medium text-sm">[Add website link]</span>
      </div>
    </div>
    <p class="text-gray-500 text-sm italic text-center mt-12">The Tree Troupe platform provides our analysis of the best bang for your buck in tree-planting efforts globally.</p>
  </div>
</section>
<section class="py-16 px-4 bg-green-600 text-center">
  <h2 class="text-2xl md:text-3xl font-bold text-white mb-6">Ready to track your own tree planting?</h2>
  <a href="/register" class="inline-block bg-white text-green-700 px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition-colors">Join tree troupe</a>
</section>$page$,
  'published',
  false,
  0
)
on conflict (slug) do update
  set content = excluded.content,
      updated_at = now();
