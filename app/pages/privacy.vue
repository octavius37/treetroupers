<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Privacy policy' })
useSeoMeta({ description: 'What Tree Troupe collects about you, why, who we share it with, and your rights.' })

// Bump this when the policy changes; it is shown at the top of the page.
const UPDATED = '16 October 2026'
</script>

<template>
  <article class="max-w-3xl mx-auto px-4 py-16 text-gray-700 leading-relaxed">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">
      Privacy policy
    </h1>
    <p class="text-sm text-gray-500 mb-10">
      Last updated {{ UPDATED }}
    </p>

    <p class="mb-6">
      Tree Troupe is run by a small team based in The Hague, the Netherlands. This page explains what we
      collect when you use the site, why, and what you can do about it. If anything is unclear, email us at
      <a href="mailto:treetroupe@protonmail.com" class="text-green-700 underline">treetroupe@protonmail.com</a>.
    </p>

    <h2 class="text-xl font-semibold text-gray-900 mt-10 mb-3">
      What we collect
    </h2>
    <ul class="list-disc pl-6 my-4 space-y-2">
      <li><strong>Your account:</strong> email address, password (stored only as a secure hash), display name, and optionally a bio and profile photo.</li>
      <li><strong>Trees you log:</strong> the photo you upload as proof, the species, date and notes, the quantity for donated or earned trees, and, for trees you plant, the GPS location of the tree.</li>
      <li><strong>Your activity:</strong> the communities you join, planting spots you suggest, your points, the posts you like, and updates you post about your trees.</li>
      <li><strong>Messages</strong> you send through the contact form: your name, email address and message.</li>
    </ul>
    <p class="mb-4">
      Before a photo is uploaded, the site shrinks it and removes its hidden metadata (including any GPS
      position your camera stored). We use only strictly necessary cookies, to keep you signed in; we don't use
      advertising or tracking cookies.
    </p>

    <h2 class="text-xl font-semibold text-gray-900 mt-10 mb-3">
      Why we use it
    </h2>
    <p class="mb-4">
      We use your information to run your account and the platform you signed up for (our legal basis is the
      performance of our agreement with you): showing your trees, checking logs before awarding points, running
      leaderboards and community feeds, and replying when you contact us.
    </p>

    <h2 class="text-xl font-semibold text-gray-900 mt-10 mb-3">
      What other members can see
    </h2>
    <ul class="list-disc pl-6 my-4 space-y-2">
      <li>Your display name, profile photo, bio, points, and the communities you belong to.</li>
      <li>Trees you've logged, with their species and date. Signed-in members can see where planted trees are on the map. Visitors who aren't signed in see an approximate location only, without your name.</li>
      <li>The photo of a tree you planted, once an admin has approved it. Photos of donation or earning proof are only seen by admins.</li>
    </ul>
    <p class="mb-4">
      Your email address is never shown to other members.
    </p>

    <h2 class="text-xl font-semibold text-gray-900 mt-10 mb-3">
      Who we share it with
    </h2>
    <p class="mb-4">
      We don't sell your data or share it with advertisers. We use a few services to run the site, who process
      data on our behalf:
    </p>
    <ul class="list-disc pl-6 my-4 space-y-2">
      <li><strong>Supabase</strong>: database, sign-in and photo storage.</li>
      <li><strong>Vercel</strong>: hosting the website.</li>
      <li><strong>Resend</strong>: sending emails, such as contact-form messages and notices about your tree logs.</li>
    </ul>

    <h2 class="text-xl font-semibold text-gray-900 mt-10 mb-3">
      How long we keep it
    </h2>
    <p class="mb-4">
      We keep your account until you delete it. When you delete your account, your profile, points, likes,
      memberships, suggestions, updates and uploaded photos are deleted. The trees you logged stay in the
      community totals and on the map, but are no longer linked to you, and their photos and notes are removed.
    </p>

    <h2 class="text-xl font-semibold text-gray-900 mt-10 mb-3">
      Your rights
    </h2>
    <p class="mb-4">
      Under the GDPR you can ask to see, correct, export or delete your data, or object to how we use it. You can
      change your profile at any time, and delete your account yourself from your
      <NuxtLink to="/dashboard/profile" class="text-green-700 underline">
        profile page
      </NuxtLink>. For anything
      else, email us. If you're not happy with our answer, you can complain to the Dutch Data Protection
      Authority (Autoriteit Persoonsgegevens).
    </p>

    <h2 class="text-xl font-semibold text-gray-900 mt-10 mb-3">
      Children
    </h2>
    <p class="mb-4">
      You need to be 16 or older to create an account.
    </p>

    <h2 class="text-xl font-semibold text-gray-900 mt-10 mb-3">
      Changes
    </h2>
    <p class="mb-4">
      If we change this policy, we'll update the date at the top, and tell members by email about any
      significant change.
    </p>
  </article>
</template>
