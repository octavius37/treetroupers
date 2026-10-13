import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import PhotoUpload from '~/components/PhotoUpload.vue'
import PlantDonated from '~/pages/dashboard/plant-donated.vue'
import PlantEarned from '~/pages/dashboard/plant-earned.vue'
import Plant from '~/pages/dashboard/plant.vue'

// No signed-in user, so each form's onMounted lookups return straight away and
// the form renders empty.
mockNuxtImport('useAuthUserId', () => () => ref(null))
mockNuxtImport('useSupabaseClient', () => () => ({}))

describe.each([
  ['plant', Plant],
  ['plant-donated', PlantDonated],
  ['plant-earned', PlantEarned],
])('%s form', (_name, page) => {
  it('disables submit while a photo is uploading', async () => {
    // Submitting mid-upload saves the tree with no photo, and the upload's URL
    // is dropped when the form is replaced by the success panel.
    const wrapper = await mountSuspended(page)
    const submit = () => wrapper.find('button[type="submit"]')
    const photo = wrapper.findComponent(PhotoUpload)
    expect(submit().attributes('disabled')).toBeUndefined()

    photo.vm.$emit('update:uploading', true)
    await nextTick()
    expect(submit().attributes('disabled')).toBeDefined()

    photo.vm.$emit('update:uploading', false)
    await nextTick()
    expect(submit().attributes('disabled')).toBeUndefined()
  })
})
