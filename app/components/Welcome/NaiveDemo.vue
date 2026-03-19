<script setup lang="ts">
const showModal = ref(false)
</script>

<template>
  <div class="layout">
    <div class="group">
      <h1 class="heading">
        NaiveUI
      </h1>
      <p class="description">
        A Vue 3 Component Library. Complete, Customizable, Uses TypeScript, Fast.
      </p>
    </div>
    <div class="group">
      <n-modal v-model:show="showModal">
        <n-card
          style="width: 600px"
          title="NaiveUI + sidebase = ❤️"
          role="dialog"
          aria-modal="true"
        >
          Its this simple! You can now begin using any NaiveUI component in your project!
        </n-card>
      </n-modal>
      <div class="actions">
        <WelcomeButtonLink href="https://www.naiveui.com/en-US/os-theme" :blank="true">
          Documentation
        </WelcomeButtonLink>
        <WelcomeButtonLink @click="showModal = true">
          Open modal
        </WelcomeButtonLink>
      </div>
    </div>
  </div>
</template>
