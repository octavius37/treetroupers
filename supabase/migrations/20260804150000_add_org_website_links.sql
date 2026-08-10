-- Replaces the "[Add website link]" placeholders on the
-- "global-tree-planting-organizations" page with real links to each
-- organization's website, as supplied by the site admin.
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
</section>$page$,
  'published',
  false,
  0
)
on conflict (slug) do update
  set content = excluded.content,
      updated_at = now();
