-- Reorders the "climate-change" page's sections per admin request: the
-- hero ("Read on to discover...") and the Contact-us CTA move from the top
-- of the page to the bottom, after the "A simple solution: plant more
-- trees!" section. New order: climate-crisis section, solution section,
-- hero, contact-us CTA, closing "Find out what you can do" CTA.
-- Uses upsert-by-slug, consistent with the earlier climate-change migration.
insert into public.pages (title, slug, content, status, show_in_nav, nav_order)
values (
  'Climate Change & Trees',
  'climate-change',
  $page$<section class="py-16 px-4 bg-gray-100">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-3xl font-bold text-gray-900 text-center mb-10">The climate crisis and action paralysis</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div class="h-48 rounded-lg bg-gradient-to-br from-red-600 via-orange-500 to-yellow-400 flex items-center justify-center text-white text-xs font-semibold uppercase tracking-wider text-center px-4">Photo placeholder: Earth in climate crisis</div>
      <div class="h-48 rounded-lg bg-gradient-to-br from-amber-200 to-yellow-100 flex items-center justify-center text-gray-600 text-xs font-semibold uppercase tracking-wider text-center px-4">Photo placeholder: International climate summit</div>
      <div class="h-48 rounded-lg bg-gradient-to-br from-sky-300 to-slate-200 flex items-center justify-center text-gray-600 text-xs font-semibold uppercase tracking-wider text-center px-4">Photo placeholder: Climate justice protest</div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="border-t-4 border-gray-900 pt-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Climate change</h3>
        <p class="text-gray-600 leading-relaxed">Climate change, driven by human greenhouse gas emissions, is a fact. It is driving terrestrial and marine warming, extreme weather events, and biodiversity loss.</p>
      </div>
      <div class="border-t-4 border-gray-900 pt-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Collective helplessness</h3>
        <p class="text-gray-600 leading-relaxed">Global governments are taking action to tackle climate change, but scientists agree that progress is too slow. Individual citizens are frustrated, with over 80% of people globally wanting their governments to do more.</p>
      </div>
      <div class="border-t-4 border-gray-900 pt-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Personal action gap</h3>
        <p class="text-gray-600 leading-relaxed">50% of people feel they are personally doing too little to combat climate change. But it's hard to know what to do to tackle such a pervasive and massive problem. Even motivated individuals do not know how best to act.</p>
      </div>
    </div>
  </div>
</section>
<section class="relative py-24 px-6 bg-gradient-to-br from-orange-600 via-red-600 to-amber-700 overflow-hidden">
  <span class="absolute top-4 right-4 z-10 text-xs font-semibold uppercase tracking-wider bg-gray-900 text-white px-3 py-1 rounded-full">Photo placeholder: Autumn forest &amp; lake</span>
  <div class="absolute inset-0 bg-gray-900 opacity-40"></div>
  <div class="relative z-10 max-w-4xl mx-auto">
    <h2 class="text-3xl md:text-5xl font-bold text-white mb-12 leading-tight">A simple solution: plant more trees!</h2>
    <ul class="space-y-6">
      <li class="flex gap-3 text-white text-lg leading-relaxed"><span class="text-green-400 font-bold">•</span><span><strong class="text-white">Nature's carbon capture</strong>: Trees sequester carbon dioxide effectively. There is no need for expensive technological fixes.</span></li>
      <li class="flex gap-3 text-white text-lg leading-relaxed"><span class="text-green-400 font-bold">•</span><span><strong class="text-white">Tangible individual impact</strong>: Planting trees provides a direct and visible environmental impact that is driven by the community, not politics.</span></li>
      <li class="flex gap-3 text-white text-lg leading-relaxed"><span class="text-green-400 font-bold">•</span><span><strong class="text-white">Emotional connection</strong>: Planting trees gives communities a personal stake in climate action where green spaces are treasured.</span></li>
    </ul>
  </div>
</section>
<section class="relative h-[400px] overflow-hidden bg-gradient-to-b from-sky-300 via-sky-100 to-slate-200">
  <div class="relative z-10 h-full max-w-6xl mx-auto px-6 pt-10 flex items-start justify-between gap-6 flex-wrap">
    <h1 class="text-2xl md:text-4xl font-bold text-gray-900 max-w-2xl leading-snug">Read on to discover how tree troupe can help you plant trees individually and collectively, and to track your progress!</h1>
    <a href="/what-can-i-do" class="shrink-0 inline-block bg-green-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-green-700 transition-colors">What can I do?</a>
  </div>
</section>
<section class="py-12 px-4 bg-green-600 text-center">
  <h2 class="text-2xl md:text-3xl font-bold text-white mb-3">Contact us</h2>
  <p class="text-green-100 mb-6 max-w-xl mx-auto">Got a question about planting with your community? We would love to hear from you.</p>
  <a href="/contact" class="inline-block bg-white text-green-700 px-8 py-3 rounded-full font-medium hover:bg-green-50 transition-colors">Get in touch</a>
</section>
<section class="py-16 px-4 bg-white text-center">
  <a href="/what-can-i-do" class="inline-block bg-green-600 text-white px-8 py-3 rounded-full font-medium hover:bg-green-700 transition-colors">Find out what you can do →</a>
</section>$page$,
  'published',
  false,
  0
)
on conflict (slug) do update
  set content = excluded.content,
      updated_at = now();
