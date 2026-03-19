<script lang="ts" setup>
const { $client } = useNuxtApp()

const hello = await $client.hello.useQuery({ text: 'client' })
</script>

<template>
  <div class="layout">
    <div class="group">
      <h1 class="heading">
        tRPC
      </h1>
      <p class="description">
        tRPC allows you to easily build & consume fully typesafe APIs without schemas or code generation.
      </p>
    </div>
    <div class="group">
      <p>
        <!-- As superjson is already pre-configured, we can use time as a Date object without further deserialization 🎉 -->
        tRPC Data: "{{ hello.data.value?.greeting }}" send at "{{ hello.data.value?.time.toLocaleDateString('en-EN') }}".
      </p>
      <div class="actions">
        <WelcomeButtonLink href="https://sidebase.io/sidebase/components/trpc" :blank="true">
          Documentation
        </WelcomeButtonLink>
      </div>
    </div>
  </div>
</template>
