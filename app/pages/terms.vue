<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Terms of use' })
useSeoMeta({ description: 'The rules for using Tree Troupe: your account, what you post, points and rewards.' })

const UPDATED = '12 November 2026'
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
      <li>You need to be 16 or older. By signing up you confirm that you are. If we learn that someone under 16 has an account, we'll delete it.</li>
      <li>Keep your password to yourself. You're responsible for what happens on your account.</li>
      <li>You can delete your account at any time from your profile page.</li>
    </ul>

    <h2 class="text-xl font-semibold text-gray-900 mt-10 mb-3">
      Logging trees honestly
    </h2>
    <ul class="list-disc pl-6 my-4 space-y-2">
      <li>Only log trees you really planted, donated or earned, with a genuine photo as proof.</li>
      <li>Only plant trees where you have permission to.</li>
      <li>Admins review every log and may reject it, or remove logs, points or accounts that break these rules. When a log is removed, the points it earned are removed too.</li>
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
    <p class="mb-4">
      To keep the site fair and free of spam, there are limits on how often you can upload photos, log trees and
      post. They're generous for normal use; if you hit one, try again a little later.
    </p>

    <h2 class="text-xl font-semibold text-gray-900 mt-10 mb-3">
      Decisions and complaints
    </h2>
    <p class="mb-4">
      If an admin rejects your log, or removes your content, points or account, we'll tell you why where we can.
      If you disagree with a decision, or want to complain about anything else on the site, email
      <a href="mailto:treetroupe@protonmail.com" class="text-green-700 underline">treetroupe@protonmail.com</a>
      and we'll look at it again and reply.
    </p>

    <h2 class="text-xl font-semibold text-gray-900 mt-10 mb-3">
      The service and our liability
    </h2>
    <p class="mb-4">
      Tree Troupe is free and run by volunteers. It isn't a company or a registered organisation. We provide it
      "as is" and "as available": we'll do our best to keep it running and your data safe, but we can't promise
      it will always be available, accurate or error-free, and we may change or stop it at any time.
    </p>
    <p class="mb-4">
      To the fullest extent Dutch law allows, we are not liable for any damage or loss arising from your use of
      the site, or from not being able to use it. This includes:
    </p>
    <ul class="list-disc pl-6 my-4 space-y-2">
      <li>loss of data, photos, points or rewards, and any indirect or consequential damage;</li>
      <li>anything posted by other members, and any information, advice or suggested planting spot on the site;</li>
      <li>planting itself: you plant trees at your own risk, and are responsible for having the landowner's permission, following local rules, and working safely;</li>
      <li>services run by others that the site relies on or links to.</li>
    </ul>
    <p class="mb-4">
      This applies to Tree Troupe and to each of the volunteers who run it. Nothing in these terms excludes or
      limits liability for damage caused by our intent or deliberate recklessness, or any other liability or
      consumer right that cannot be excluded under Dutch law.
    </p>
    <p class="mb-4">
      These terms are governed by Dutch law.
    </p>

    <p class="mt-10">
      See also our <NuxtLink to="/privacy" class="text-green-700 underline">
        privacy policy
      </NuxtLink>.
    </p>
  </article>
</template>
