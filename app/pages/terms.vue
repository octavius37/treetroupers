<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Terms of use' })
useSeoMeta({ description: 'The rules for using Tree Troupe: your account, what you post, points and rewards.' })

const UPDATED = '16 October 2026'
</script>

<template>
  <article class="max-w-3xl mx-auto px-4 py-16 text-gray-700 leading-relaxed">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">
      Terms of use
    </h1>
    <p class="text-sm text-gray-500 mb-10">
      Last updated {{ UPDATED }}
    </p>

    <p class="mb-6">
      Tree Troupe is a free community platform for logging and celebrating trees. By creating an account you
      agree to these terms. Questions? Email
      <a href="mailto:treetroupe@protonmail.com" class="text-green-700 underline">treetroupe@protonmail.com</a>.
    </p>

    <h2 class="text-xl font-semibold text-gray-900 mt-10 mb-3">
      Your account
    </h2>
    <ul class="list-disc pl-6 my-4 space-y-2">
      <li>You need to be 16 or older.</li>
      <li>Keep your password to yourself. You're responsible for what happens on your account.</li>
      <li>You can delete your account at any time from your profile page.</li>
    </ul>

    <h2 class="text-xl font-semibold text-gray-900 mt-10 mb-3">
      Logging trees honestly
    </h2>
    <ul class="list-disc pl-6 my-4 space-y-2">
      <li>Only log trees you really planted, donated or earned, with a genuine photo as proof.</li>
      <li>Only plant trees where you have permission to.</li>
      <li>Admins review every log and may reject it, or remove logs, points or accounts that break these rules.</li>
    </ul>

    <h2 class="text-xl font-semibold text-gray-900 mt-10 mb-3">
      What you post
    </h2>
    <p class="mb-4">
      You keep ownership of the photos and text you upload. You give Tree Troupe permission to show them on the
      platform (for example, a planted tree's photo in your community's feed) for as long as they're on the site.
      Don't post anything that's illegal, offensive, or someone else's without their permission, and don't
      include other people's personal details in photos.
    </p>

    <h2 class="text-xl font-semibold text-gray-900 mt-10 mb-3">
      Points and rewards
    </h2>
    <p class="mb-4">
      Points and rewards are a bit of fun to celebrate your contribution. They have no cash value, and we may
      change how they work.
    </p>

    <h2 class="text-xl font-semibold text-gray-900 mt-10 mb-3">
      The service
    </h2>
    <p class="mb-4">
      We run Tree Troupe on a volunteer basis and provide it as it is. We'll do our best to keep it running and
      your data safe, but we can't promise it will always be available or error-free. These terms are governed by
      Dutch law.
    </p>

    <p class="mt-10">
      See also our <NuxtLink to="/privacy" class="text-green-700 underline">
        privacy policy
      </NuxtLink>.
    </p>
  </article>
</template>
