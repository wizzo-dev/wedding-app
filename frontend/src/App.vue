<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

onMounted(async () => {
  // Initialize auth: attempt silent refresh + fetchMe.
  // Sets auth.authReady = true when done so the router guard can proceed.
  await auth.init()
})
</script>
