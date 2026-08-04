// Starting content for the CMS pages that replaced the old hardcoded routes
// (see app/pages/index.vue and the deleted who-we-are/climate-change/what-can-i-do
// pages). Used by server/api/cms/seed-default-pages.post.ts to populate the
// `pages` table on first run so the site isn't blank right after this migration
// — after that, admins edit this content entirely through the CMS.
export interface DefaultPage {
  slug: string
  title: string
  content: string
}

const statsCounterBlock = `<div data-block="stats-counter" class="my-8 py-12 px-6 rounded-2xl border-2 border-dashed border-green-400 bg-green-50 text-center"><span class="block text-xs uppercase tracking-wider text-green-700 font-semibold mb-2">Smart Block · Stats Counter</span><span class="block text-sm text-gray-600">Shows live tree, community &amp; member counts</span><span class="block text-xs text-gray-400 mt-2">Renders live data on the public page.</span></div>`

export const DEFAULT_PAGES: DefaultPage[] = [
  {
    slug: 'home',
    title: 'Home',
    content: `<section class="relative h-[400px] overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-b from-green-950 via-green-800 to-green-600">
    <div class="absolute inset-0 opacity-30" style="background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(255,255,255,0.06) 0%, transparent 60%);"></div>
    <div class="absolute inset-0 opacity-[0.04]" style="background-image: repeating-linear-gradient(90deg, white 0px, transparent 2px, transparent 60px);"></div>
  </div>
  <div class="relative z-10 flex items-center justify-center h-full px-6">
    <h1 class="text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white text-center italic font-light max-w-4xl leading-snug" style="font-family: Georgia, 'Times New Roman', serif;">Transforming climate helplessness into empowered action through community tree planting</h1>
  </div>
</section>
<section class="py-20 px-4">
  <div class="max-w-7xl mx-auto text-center">
    <h2 class="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
    <p class="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">Tree Troupe connects communities around the world to plant, track, and celebrate trees together. We believe that collective action starts locally — one tree, one neighbourhood, one community at a time.</p>
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
${statsCounterBlock}
<section class="py-20 px-4 bg-green-600">
  <div class="max-w-3xl mx-auto text-center">
    <h2 class="text-3xl font-bold text-white mb-6">Ready to make a difference?</h2>
    <p class="text-green-100 text-lg mb-8">Join Tree Troupe and start planting trees with your local community today.</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="/register" class="bg-white text-green-700 px-8 py-3 rounded-full font-medium hover:bg-green-50 transition-colors">Get Started</a>
      <a href="/what-can-i-do" class="border-2 border-white text-white px-8 py-3 rounded-full font-medium hover:bg-green-700 transition-colors">Learn More</a>
    </div>
  </div>
</section>`,
  },
  {
    slug: 'who-we-are',
    title: 'Who We Are',
    content: `<section class="relative h-[400px] overflow-hidden">
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
        <div class="w-32 h-32 bg-gradient-to-br from-green-200 to-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-400 text-sm">[Photo]</div>
        <h3 class="font-semibold text-gray-900">Team Member 1</h3>
        <p class="text-sm text-gray-500">Role / Title</p>
      </div>
      <div class="text-center">
        <div class="w-32 h-32 bg-gradient-to-br from-green-200 to-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-400 text-sm">[Photo]</div>
        <h3 class="font-semibold text-gray-900">Team Member 2</h3>
        <p class="text-sm text-gray-500">Role / Title</p>
      </div>
      <div class="text-center">
        <div class="w-32 h-32 bg-gradient-to-br from-green-200 to-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-400 text-sm">[Photo]</div>
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
</section>`,
  },
  {
    slug: 'climate-change',
    title: 'Climate Change & Trees',
    content: `<section class="relative h-[400px] overflow-hidden bg-gradient-to-b from-sky-300 via-sky-100 to-slate-200">
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
<section class="py-16 px-4 bg-gray-100">
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
<section class="py-16 px-4 bg-white text-center">
  <a href="/what-can-i-do" class="inline-block bg-green-600 text-white px-8 py-3 rounded-full font-medium hover:bg-green-700 transition-colors">Find out what you can do →</a>
</section>`,
  },
  {
    slug: 'what-can-i-do',
    title: 'What Can I Do?',
    content: `<section class="relative py-32 px-6 bg-gradient-to-br from-gray-900 via-gray-800 to-amber-900 overflow-hidden">
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
`,
  },
  {
    slug: 'global-tree-planting-organizations',
    title: 'Global tree planting organizations',
    content: `<section class="py-16 px-4 bg-gray-200">
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
        <a href="https://www.onetreeplanted.org" target="_blank" rel="noopener noreferrer" class="text-green-600 font-medium text-sm hover:text-green-700">Visit website →</a>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6">
        <div class="w-full h-32 bg-gradient-to-br from-green-100 to-emerald-50 rounded-xl flex items-center justify-center text-gray-400 text-sm mb-4">[Organization logo placeholder]</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Eden: People + Planet</h3>
        <p class="text-gray-600 leading-relaxed mb-4">Takes a broader approach, supporting community-led restoration activities including indigenous tree planting, fire prevention, and sustainable agriculture training in some of the world's most important ecosystems.</p>
        <a href="https://www.eden-plus.org" target="_blank" rel="noopener noreferrer" class="text-green-600 font-medium text-sm hover:text-green-700">Visit website →</a>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6">
        <div class="w-full h-32 bg-gradient-to-br from-green-100 to-emerald-50 rounded-xl flex items-center justify-center text-gray-400 text-sm mb-4">[Organization logo placeholder]</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">WeForest</h3>
        <p class="text-gray-600 leading-relaxed mb-4">Focuses on science-led landscape restoration, working in partnership with governments, local organisations, and communities on the ground in tropical regions and biodiversity hotspots — with the goal not merely of planting trees but of restoring entire landscapes and protecting them from deforestation over the long term.</p>
        <a href="https://www.weforest.org" target="_blank" rel="noopener noreferrer" class="text-green-600 font-medium text-sm hover:text-green-700">Visit website →</a>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6">
        <div class="w-full h-32 bg-gradient-to-br from-green-100 to-emerald-50 rounded-xl flex items-center justify-center text-gray-400 text-sm mb-4">[Organization logo placeholder]</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">TreeSisters</h3>
        <p class="text-gray-600 leading-relaxed mb-4">Channels donations specifically into tropical reforestation, funding ethical, community-led planting projects that empower women and support local and indigenous communities, with 80% of monthly donations going directly to reforestation partner programmes.</p>
        <a href="https://www.treesisters.org" target="_blank" rel="noopener noreferrer" class="text-green-600 font-medium text-sm hover:text-green-700">Visit website →</a>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6 col-span-2">
        <div class="w-full h-32 bg-gradient-to-br from-green-100 to-emerald-50 rounded-xl flex items-center justify-center text-gray-400 text-sm mb-4">[Organization logo placeholder]</div>
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
</section>`,
  },
]
