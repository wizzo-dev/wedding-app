<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>

<script setup>
// auth.init() is called in main.js before mount — authReady is guaranteed by the time
// any route guard or component runs. No need to call it here again.
</script>
