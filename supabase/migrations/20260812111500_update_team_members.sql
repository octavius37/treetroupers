-- Replaces the placeholder "Team Member 1/2/3" cards on the who-we-are
-- page with the real Tree Troupe team.
insert into public.pages (title, slug, content, status, show_in_nav, nav_order)
values (
  'Who We Are',
  'who-we-are',
  $page$<section class="relative h-[400px] overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-r from-green-900 to-emerald-800">
    <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 60%);"></div>
  </div>
  <div class="relative z-10 flex items-center justify-center h-full px-6">
    <h1 class="text-4xl md:text-5xl text-white text-center font-bold">Who We Are</h1>
  </div>
</section>
<section class="py-16 px-4">
  <div class="max-w-3xl mx-auto">
    <p class="text-xl text-gray-600 leading-relaxed mb-10">Tree Troupe was born from a simple idea: that planting trees together is one of the most powerful things a community can do for the planet — and for each other.</p>
    <h2 class="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
    <p class="text-gray-600 leading-relaxed mb-4">We started as a small group of neighbours who wanted to do something tangible about climate change. We quickly realised that the act of planting trees together created something beyond environmental impact — it built real community connections.</p>
    <p class="text-gray-600 leading-relaxed mb-12">Today, Tree Troupe is a growing platform that helps communities around the world coordinate tree planting, track their impact, and celebrate their collective progress.</p>
    <h2 class="text-2xl font-bold text-gray-900 text-center mb-10">Our Team</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
      <div class="text-center">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Team member photo placeholder" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover bg-gray-100">
        <h3 class="font-semibold text-gray-900">Jessica Howley</h3>
        <p class="text-sm text-gray-500">Founder, Climate enthusiast, Rhodes Scholar, former UN staffer, international lawyer</p>
      </div>
      <div class="text-center">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Team member photo placeholder" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover bg-gray-100">
        <h3 class="font-semibold text-gray-900">Charlotte Howley</h3>
        <p class="text-sm text-gray-500">Media specialist</p>
      </div>
      <div class="text-center">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Team member photo placeholder" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover bg-gray-100">
        <h3 class="font-semibold text-gray-900">Paul Bollerman</h3>
        <p class="text-sm text-gray-500">Software expert</p>
      </div>
    </div>
    <h2 class="text-2xl font-bold text-gray-900 text-center mb-10">Our Values</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-green-50 rounded-xl p-6">
        <h3 class="font-semibold text-gray-900 mb-2">Community First</h3>
        <p class="text-gray-600 text-sm">Real change happens when people come together. We build tools that strengthen local communities.</p>
      </div>
      <div class="bg-green-50 rounded-xl p-6">
        <h3 class="font-semibold text-gray-900 mb-2">Transparency</h3>
        <p class="text-gray-600 text-sm">Every tree is tracked, every impact is measured. We believe in open, honest data.</p>
      </div>
      <div class="bg-green-50 rounded-xl p-6">
        <h3 class="font-semibold text-gray-900 mb-2">Accessibility</h3>
        <p class="text-gray-600 text-sm">Anyone can plant a tree. We make it easy to get started regardless of experience.</p>
      </div>
      <div class="bg-green-50 rounded-xl p-6">
        <h3 class="font-semibold text-gray-900 mb-2">Long-term Thinking</h3>
        <p class="text-gray-600 text-sm">Trees grow for decades. We're building something that lasts, not a quick fix.</p>
      </div>
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
