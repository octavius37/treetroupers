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
    content: `<section class="relative h-[400px] overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-r from-amber-900 to-green-900">
    <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1) 0%, transparent 50%);"></div>
  </div>
  <div class="relative z-10 flex items-center justify-center h-full px-6">
    <h1 class="text-4xl md:text-5xl text-white text-center font-bold">Climate Change &amp; Trees</h1>
  </div>
</section>
<section class="py-16 px-4">
  <div class="max-w-3xl mx-auto">
    <h2 class="text-2xl font-bold text-gray-900 mb-4">The Climate Crisis</h2>
    <p class="text-gray-600 leading-relaxed mb-6">Climate change represents one of the most significant challenges of our time. Rising global temperatures, extreme weather events, and loss of biodiversity threaten ecosystems and communities worldwide.</p>
    <div class="bg-gray-50 rounded-2xl p-8 my-8">
      <div class="w-full h-48 bg-gradient-to-br from-red-100 to-orange-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">[Climate data visualization placeholder]</div>
    </div>
    <h2 class="text-2xl font-bold text-gray-900 mb-4">Why Trees Matter</h2>
    <p class="text-gray-600 leading-relaxed mb-6">Trees are one of nature's most effective carbon capture systems. A single mature tree can absorb up to 22kg of CO₂ per year, while releasing enough oxygen for two people to breathe.</p>
    <h3 class="text-xl font-semibold text-gray-900 mb-3">The Power of Trees</h3>
    <ul class="space-y-3 mb-8">
      <li class="flex gap-3 text-gray-600"><span class="text-green-600 font-bold">•</span><span><strong class="text-gray-900">Carbon sequestration</strong> — Trees absorb CO₂ from the atmosphere and store it as biomass</span></li>
      <li class="flex gap-3 text-gray-600"><span class="text-green-600 font-bold">•</span><span><strong class="text-gray-900">Air quality</strong> — Trees filter pollutants and produce clean oxygen</span></li>
      <li class="flex gap-3 text-gray-600"><span class="text-green-600 font-bold">•</span><span><strong class="text-gray-900">Biodiversity</strong> — Trees provide habitat for countless species</span></li>
      <li class="flex gap-3 text-gray-600"><span class="text-green-600 font-bold">•</span><span><strong class="text-gray-900">Water management</strong> — Tree roots prevent soil erosion and regulate water cycles</span></li>
      <li class="flex gap-3 text-gray-600"><span class="text-green-600 font-bold">•</span><span><strong class="text-gray-900">Urban cooling</strong> — Trees reduce the urban heat island effect by up to 5°C</span></li>
      <li class="flex gap-3 text-gray-600"><span class="text-green-600 font-bold">•</span><span><strong class="text-gray-900">Mental health</strong> — Access to green spaces improves wellbeing and reduces stress</span></li>
    </ul>
    <div class="bg-green-50 rounded-2xl p-8 my-8">
      <div class="w-full h-48 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">[Forest ecosystem infographic placeholder]</div>
    </div>
    <h2 class="text-2xl font-bold text-gray-900 mb-4">Community Action</h2>
    <p class="text-gray-600 leading-relaxed mb-4">While systemic change is essential, community-level action creates immediate, tangible impact. When communities come together to plant and care for trees, they build social bonds while directly improving their local environment.</p>
    <p class="text-gray-600 leading-relaxed mb-8">Research shows that community-led environmental initiatives are more sustainable and impactful than top-down approaches, because they create a sense of ownership and shared purpose.</p>
    <div class="text-center">
      <a href="/what-can-i-do" class="inline-block bg-green-600 text-white px-8 py-3 rounded-full font-medium hover:bg-green-700 transition-colors">Find out what you can do →</a>
    </div>
  </div>
</section>`,
  },
  {
    slug: 'what-can-i-do',
    title: 'What Can I Do?',
    content: `<section class="relative h-[400px] overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-r from-green-800 to-teal-700">
    <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 50%);"></div>
  </div>
  <div class="relative z-10 flex items-center justify-center h-full px-6">
    <h1 class="text-4xl md:text-5xl text-white text-center font-bold">What Can I Do?</h1>
  </div>
</section>
<section class="py-16 px-4">
  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-12">
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">Every tree makes a difference. Here's how you can get involved with Tree Troupe and start making an impact in your community.</p>
    </div>
    <div class="space-y-16">
      <div class="flex flex-col md:flex-row gap-8 items-center">
        <div class="w-full md:w-1/3">
          <div class="aspect-square bg-gradient-to-br from-green-100 to-emerald-50 rounded-2xl flex items-center justify-center text-gray-400 text-sm">[Join illustration placeholder]</div>
        </div>
        <div class="w-full md:w-2/3">
          <div class="text-sm font-semibold text-green-600 mb-2">Step 1</div>
          <h3 class="text-2xl font-bold text-gray-900 mb-3">Join Your Local Tree Troupe</h3>
          <p class="text-gray-600 leading-relaxed">Sign up for a free account and find a community near you, or start your own. Tree Troupes are organised geographically — from neighbourhood level up to regional and national groups.</p>
        </div>
      </div>
      <div class="flex flex-col md:flex-row-reverse gap-8 items-center">
        <div class="w-full md:w-1/3">
          <div class="aspect-square bg-gradient-to-br from-amber-100 to-yellow-50 rounded-2xl flex items-center justify-center text-gray-400 text-sm">[Planting illustration placeholder]</div>
        </div>
        <div class="w-full md:w-2/3">
          <div class="text-sm font-semibold text-green-600 mb-2">Step 2</div>
          <h3 class="text-2xl font-bold text-gray-900 mb-3">Plant &amp; Log Your Trees</h3>
          <p class="text-gray-600 leading-relaxed">Plant a tree in your garden, neighbourhood, or at a community event. Log it on Tree Troupe with a photo and location to add it to our growing global map of community-planted trees.</p>
        </div>
      </div>
      <div class="flex flex-col md:flex-row gap-8 items-center">
        <div class="w-full md:w-1/3">
          <div class="aspect-square bg-gradient-to-br from-blue-100 to-sky-50 rounded-2xl flex items-center justify-center text-gray-400 text-sm">[Track illustration placeholder]</div>
        </div>
        <div class="w-full md:w-2/3">
          <div class="text-sm font-semibold text-green-600 mb-2">Step 3</div>
          <h3 class="text-2xl font-bold text-gray-900 mb-3">Track &amp; Update</h3>
          <p class="text-gray-600 leading-relaxed">Post updates about your trees and those planted by fellow community members. Watch them grow over time and share the progress with your troupe.</p>
        </div>
      </div>
      <div class="flex flex-col md:flex-row-reverse gap-8 items-center">
        <div class="w-full md:w-1/3">
          <div class="aspect-square bg-gradient-to-br from-purple-100 to-violet-50 rounded-2xl flex items-center justify-center text-gray-400 text-sm">[Rewards illustration placeholder]</div>
        </div>
        <div class="w-full md:w-2/3">
          <div class="text-sm font-semibold text-green-600 mb-2">Step 4</div>
          <h3 class="text-2xl font-bold text-gray-900 mb-3">Earn Points &amp; Rewards</h3>
          <p class="text-gray-600 leading-relaxed">Every tree planted, every update posted, and every tree verified earns you points. Climb your community's leaderboard and unlock rewards as you grow your impact.</p>
        </div>
      </div>
    </div>
    <div class="text-center mt-16">
      <a href="/register" class="inline-block bg-green-600 text-white px-8 py-3 rounded-full font-medium hover:bg-green-700 transition-colors text-lg">Join Tree Troupe Today</a>
    </div>
  </div>
</section>`,
  },
]
