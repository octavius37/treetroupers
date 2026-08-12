-- Merges the standalone "mission" CMS page's content (created directly via
-- the CMS admin UI, not previously tracked in source) into the homepage's
-- "Our Mission" section, ahead of the existing "How It Works" section, and
-- deletes the now-redundant "mission" page (including its duplicate
-- Active Communities / stats / CTA smart blocks, which the homepage
-- already has its own copies of).
insert into public.pages (title, slug, content, status, show_in_nav, nav_order)
values (
  'Home',
  'home',
  $page$<section class="relative h-[400px] overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-b from-green-950 via-green-800 to-green-600">
    <div class="absolute inset-0 opacity-30" style="background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(255,255,255,0.06) 0%, transparent 60%);"></div>
    <div class="absolute inset-0 opacity-[0.04]" style="background-image: repeating-linear-gradient(90deg, white 0px, transparent 2px, transparent 60px);"></div>
  </div>
  <div class="relative z-10 flex items-center justify-center h-full px-6">
    <h1 class="text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white text-center italic font-light max-w-4xl leading-snug" style="font-family: Georgia, 'Times New Roman', serif;">Transforming climate helplessness into empowered action through community tree planting</h1>
  </div>
</section>
<section class="py-20 px-4">
  <div class="max-w-4xl mx-auto">
    <h2 class="text-3xl font-bold text-gray-900 text-center mb-6">Our Mission</h2>
    <p class="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed text-center mb-12">Tree Troupe connects communities around the world to plant, track, and celebrate trees together. We believe that collective action starts locally — one tree, one neighbourhood, one community at a time.</p>
    <h3 class="text-xl font-semibold text-gray-900 mb-3">The Climate Emergency</h3>
    <p class="text-gray-600 leading-relaxed mb-8">It is difficult to overstate the seriousness of the climate crisis and the urgency of taking action to mitigate its effects. The burning of fossil fuels is driving unprecedented and accelerating changes in the Earth's climate system, with the critical 1.5°C global temperature increase threshold breached in 2024. Without immediate and deep emissions cuts, the long-term average is likely to surpass 1.5°C within this decade, posing direct threats to human well-being and planetary health: more frequent extreme weather events, rising sea levels, serious disruption to ecosystems and biodiversity, and widespread risks to food and water security.</p>
    <h3 class="text-xl font-semibold text-gray-900 mb-3">Harnessing Climate Helplessness</h3>
    <p class="text-gray-600 leading-relaxed mb-4">Many people do not just worry about climate change — they feel a sense of helplessness about their ability to change the status quo. A substantial proportion of people believe governments are failing to respond adequately, but also that they are personally doing too little to address climate change.</p>
    <p class="text-gray-600 leading-relaxed mb-4">Enter Tree Troupe.</p>
    <p class="text-gray-600 leading-relaxed mb-4">Tree Troupe allows individuals to maximize and collate scaleable personal actions that can meaningfully influence the trajectory of the climate crisis. Tree Troupers harness collective helplessness to drive climate ambition. Tree Troupe is founded on three key tenets:</p>
    <ol class="space-y-2 pl-6 text-gray-600">
      <li>Planting trees is one of the easiest, most effective ways to combat climate change;</li>
      <li>Tree planting on a mass scale could be a game-changer for our planet's health</li>
      <li>Tree-planting is something anyone can do - individually, collectively or globally.</li>
    </ol>
  </div>
</section>
<section class="py-10 px-4 bg-gray-50">
  <div class="max-w-7xl mx-auto">
    <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="text-center p-8">
        <h3 class="text-xl font-semibold text-gray-900 mb-3">Join a Community</h3>
        <p class="text-gray-600">Find or create a local tree troupe in your area and connect with fellow planters.</p>
      </div>
      <div class="text-center p-8">
        <h3 class="text-xl font-semibold text-gray-900 mb-3">Plant &amp; Log Trees</h3>
        <p class="text-gray-600">Plant a tree and log it with a photo and GPS location to add it to our global map.</p>
      </div>
      <div class="text-center p-8">
        <h3 class="text-xl font-semibold text-gray-900 mb-3">Earn &amp; Celebrate</h3>
        <p class="text-gray-600">Earn points for planting and verifying trees. Climb the leaderboard and unlock rewards.</p>
      </div>
    </div>
  </div>
</section>
<div data-block="stats-counter" class="my-8 py-12 px-6 rounded-2xl border-2 border-dashed border-green-400 bg-green-50 text-center"><span class="block text-xs uppercase tracking-wider text-green-700 font-semibold mb-2">Smart Block · Stats Counter</span><span class="block text-sm text-gray-600">Shows live tree, community &amp; member counts</span><span class="block text-xs text-gray-400 mt-2">Renders live data on the public page.</span></div>
<section class="py-20 px-4 bg-green-600">
  <div class="max-w-3xl mx-auto text-center">
    <h2 class="text-3xl font-bold text-white mb-6">Ready to make a difference?</h2>
    <p class="text-green-100 text-lg mb-8">Join Tree Troupe and start planting trees with your local community today.</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="/register" class="bg-white text-green-700 px-8 py-3 rounded-full font-medium hover:bg-green-50 transition-colors">Get Started</a>
      <a href="/what-can-i-do" class="border-2 border-white text-white px-8 py-3 rounded-full font-medium hover:bg-green-700 transition-colors">Learn More</a>
    </div>
  </div>
</section>$page$,
  'published',
  false,
  0
)
on conflict (slug) do update
  set content = excluded.content,
      updated_at = now();

-- Remove the now-redundant standalone mission page.
delete from public.pages where slug = 'mission';
