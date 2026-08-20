-- Converts every gradient-div "photo placeholder" and "[Organization logo
-- placeholder]" block across the CMS default pages into a real <img> tag
-- (with a neutral inline SVG placeholder graphic as its src). GrapesJS
-- treats any <img> element as an Image component, so admins can now
-- double-click straight into the asset manager to upload a real photo in
-- place, rather than having to delete a div and drag in a new Image block.
-- Also adds a Tailwind safelist entry for object-cover/object-contain
-- (see tailwind.config.ts) since these images rely on it.
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
        <h3 class="font-semibold text-gray-900">Team Member 1</h3>
        <p class="text-sm text-gray-500">Role / Title</p>
      </div>
      <div class="text-center">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Team member photo placeholder" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover bg-gray-100">
        <h3 class="font-semibold text-gray-900">Team Member 2</h3>
        <p class="text-sm text-gray-500">Role / Title</p>
      </div>
      <div class="text-center">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Team member photo placeholder" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover bg-gray-100">
        <h3 class="font-semibold text-gray-900">Team Member 3</h3>
        <p class="text-sm text-gray-500">Role / Title</p>
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

insert into public.pages (title, slug, content, status, show_in_nav, nav_order)
values (
  'Climate Change & Trees',
  'climate-change',
  $page$<section class="py-16 px-4 bg-gray-100">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-3xl font-bold text-gray-900 text-center mb-10">The climate crisis and action paralysis</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Photo placeholder: Earth in climate crisis" class="h-48 w-full rounded-lg object-cover">
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Photo placeholder: International climate summit" class="h-48 w-full rounded-lg object-cover">
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Photo placeholder: Climate justice protest" class="h-48 w-full rounded-lg object-cover">
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
<section class="relative py-24 px-6 overflow-hidden">
  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Photo placeholder: Autumn forest and lake" class="absolute inset-0 w-full h-full object-cover">
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
<section class="relative h-[400px] overflow-hidden">
  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Photo placeholder: Mountain vista with clouds" class="absolute inset-0 w-full h-full object-cover">
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

insert into public.pages (title, slug, content, status, show_in_nav, nav_order)
values (
  'What Can I Do?',
  'what-can-i-do',
  $page$<section class="relative py-32 px-6 overflow-hidden">
  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Photo placeholder: Lit lightbulb close-up" class="absolute inset-0 w-full h-full object-cover">
  <div class="absolute inset-0 bg-gray-900 opacity-60"></div>
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
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Photo placeholder: Planting a sapling" class="h-64 w-full rounded-lg object-cover">
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Photo placeholder: Digital / tech abstract" class="h-64 w-full rounded-lg object-cover">
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
      <div>
        <h3 class="text-2xl font-bold text-white mb-4">Plant a tree in your own garden</h3>
        <p class="text-green-50 leading-relaxed">Every tree planted makes a difference. This is something you can do at home, at little to no cost. We have helpful guides to get you started here. Join tree troupe, use our geotagging software to log your trees, and track your progress with your friends!</p>
      </div>
      <div>
        <h3 class="text-2xl font-bold text-white mb-4">Plant free trees doing everyday tasks</h3>
        <p class="text-green-50 leading-relaxed">There are many apps, browsers and search engines that will plant trees simply by you using them. So you help the planet by doing something you would do anyway! Win! For our list and review of the options, see <a href="/planting-trees-doing-everyday-tasks" class="underline hover:text-white">here</a>. Join tree troupe and track your progress with your friends!</p>
      </div>
    </div>
    <a href="/dashboard/plant" class="inline-block bg-white border-2 border-green-600 text-green-700 px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition-colors">Learn More</a>
  </div>
</section>
<section id="community-actions" class="py-16 px-4 bg-gray-200 text-center">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-3xl font-bold text-gray-900 mb-10">Community actions</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Photo placeholder: Community tree planting" class="h-64 w-full rounded-lg object-cover">
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Photo placeholder: Climate justice protest sign" class="h-64 w-full rounded-lg object-cover">
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
  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Photo placeholder: Seedling trays" class="max-w-2xl mx-auto h-64 w-full rounded-lg object-cover mb-16">
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
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Organization logo placeholder" class="w-full h-32 rounded-xl object-contain bg-gray-100 mb-4">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">One Tree Planted</h3>
        <p class="text-gray-600 leading-relaxed mb-4">Perhaps the most accessible option, operating on a simple model of $1 per tree planted across projects in over 80 countries. Founded in 2014 to create a straightforward avenue for individuals and businesses to give back and aid in global reforestation.</p>
        <a href="https://www.onetreeplanted.org" target="_blank" rel="noopener noreferrer" class="text-green-600 font-medium text-sm hover:text-green-700">Visit website →</a>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Organization logo placeholder" class="w-full h-32 rounded-xl object-contain bg-gray-100 mb-4">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Eden: People + Planet</h3>
        <p class="text-gray-600 leading-relaxed mb-4">Takes a broader approach, supporting community-led restoration activities including indigenous tree planting, fire prevention, and sustainable agriculture training in some of the world's most important ecosystems.</p>
        <a href="https://www.eden-plus.org" target="_blank" rel="noopener noreferrer" class="text-green-600 font-medium text-sm hover:text-green-700">Visit website →</a>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Organization logo placeholder" class="w-full h-32 rounded-xl object-contain bg-gray-100 mb-4">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">WeForest</h3>
        <p class="text-gray-600 leading-relaxed mb-4">Focuses on science-led landscape restoration, working in partnership with governments, local organisations, and communities on the ground in tropical regions and biodiversity hotspots — with the goal not merely of planting trees but of restoring entire landscapes and protecting them from deforestation over the long term.</p>
        <a href="https://www.weforest.org" target="_blank" rel="noopener noreferrer" class="text-green-600 font-medium text-sm hover:text-green-700">Visit website →</a>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Organization logo placeholder" class="w-full h-32 rounded-xl object-contain bg-gray-100 mb-4">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">TreeSisters</h3>
        <p class="text-gray-600 leading-relaxed mb-4">Channels donations specifically into tropical reforestation, funding ethical, community-led planting projects that empower women and support local and indigenous communities, with 80% of monthly donations going directly to reforestation partner programmes.</p>
        <a href="https://www.treesisters.org" target="_blank" rel="noopener noreferrer" class="text-green-600 font-medium text-sm hover:text-green-700">Visit website →</a>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6 col-span-2">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Organization logo placeholder" class="w-full h-32 rounded-xl object-contain bg-gray-100 mb-4">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Trees for the Future</h3>
        <p class="text-gray-600 leading-relaxed mb-4">Links tree planting to poverty alleviation, training farmers across Sub-Saharan Africa to plant, protect, and grow trees as a route to sustainable livelihoods — having already planted over 190 million trees and improved food security for over 150,000 people.</p>
        <a href="https://trees.org" target="_blank" rel="noopener noreferrer" class="text-green-600 font-medium text-sm hover:text-green-700">Visit website →</a>
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

insert into public.pages (title, slug, content, status, show_in_nav, nav_order)
values (
  'Planting trees doing everyday tasks',
  'planting-trees-doing-everyday-tasks',
  $page$<section class="py-16 px-4 bg-gray-200">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Planting trees doing everyday tasks</h1>
    <p class="text-green-700 leading-relaxed max-w-3xl">But you can also take advantage of options offered by a vast number of technology companies to earn trees through everyday digital experiences, converting digital engagement into real-world impact with minimal lifestyle changes.</p>
  </div>
</section>
<section class="py-16 px-4 bg-white">
  <div class="max-w-5xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="border border-gray-200 rounded-2xl p-6">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Organization logo placeholder" class="w-full h-32 rounded-xl object-contain bg-gray-100 mb-4">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Ecosia</h3>
        <p class="text-gray-600 leading-relaxed mb-4">A search engine which uses the advertising revenue generated by its searches to fund reforestation projects — 250 million trees so far.</p>
        <a href="https://www.ecosia.org" target="_blank" rel="noopener noreferrer" class="text-green-600 font-medium text-sm hover:text-green-700">Visit website →</a>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Organization logo placeholder" class="w-full h-32 rounded-xl object-contain bg-gray-100 mb-4">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Forest</h3>
        <p class="text-gray-600 leading-relaxed mb-4">A productivity app that plants a real tree every time you stay focused and off your phone.</p>
        <a href="https://www.forestapp.cc" target="_blank" rel="noopener noreferrer" class="text-green-600 font-medium text-sm hover:text-green-700">Visit website →</a>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Organization logo placeholder" class="w-full h-32 rounded-xl object-contain bg-gray-100 mb-4">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Flora</h3>
        <p class="text-gray-600 leading-relaxed mb-4">A productivity app that plants a real tree every time you stay focused and off your phone.</p>
        <a href="https://flora.appfluence.com" target="_blank" rel="noopener noreferrer" class="text-green-600 font-medium text-sm hover:text-green-700">Visit website →</a>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Organization logo placeholder" class="w-full h-32 rounded-xl object-contain bg-gray-100 mb-4">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Treecard</h3>
        <p class="text-gray-600 leading-relaxed mb-4">A wooden debit card that funds reforestation through merchant transaction fees — and even rewards you for the steps you walk.</p>
        <a href="https://www.treecard.org" target="_blank" rel="noopener noreferrer" class="text-green-600 font-medium text-sm hover:text-green-700">Visit website →</a>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Organization logo placeholder" class="w-full h-32 rounded-xl object-contain bg-gray-100 mb-4">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">bunq</h3>
        <p class="text-gray-600 leading-relaxed mb-4">A European neobank that provides rewards in the form of trees planted.</p>
        <a href="https://www.bunq.com" target="_blank" rel="noopener noreferrer" class="text-green-600 font-medium text-sm hover:text-green-700">Visit website →</a>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Organization logo placeholder" class="w-full h-32 rounded-xl object-contain bg-gray-100 mb-4">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">GreenFi</h3>
        <p class="text-gray-600 leading-relaxed mb-4">Rounds up card purchases to fund reforestation projects worldwide.</p>
        <a href="https://www.greenfi.com" target="_blank" rel="noopener noreferrer" class="text-green-600 font-medium text-sm hover:text-green-700">Visit website →</a>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Organization logo placeholder" class="w-full h-32 rounded-xl object-contain bg-gray-100 mb-4">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Treeapp</h3>
        <p class="text-gray-600 leading-relaxed mb-4">A dedicated platform where users can plant a free tree daily simply by watching a short ad.</p>
        <a href="https://www.thetreeapp.org" target="_blank" rel="noopener noreferrer" class="text-green-600 font-medium text-sm hover:text-green-700">Visit website →</a>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='140' cy='110' r='30' fill='%239ca3af'/%3E%3Cpath d='M0 260 L120 150 L200 220 L280 130 L400 260 Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="Organization logo placeholder" class="w-full h-32 rounded-xl object-contain bg-gray-100 mb-4">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">PlantSnap</h3>
        <p class="text-gray-600 leading-relaxed mb-4">A plant identification app that commits to planting a tree for every new user who registers.</p>
        <a href="https://www.plantsnap.com" target="_blank" rel="noopener noreferrer" class="text-green-600 font-medium text-sm hover:text-green-700">Visit website →</a>
      </div>
    </div>
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
