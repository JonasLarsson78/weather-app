<template>
  <Header />
  <main>
    <WeatherPanel />
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import Header from '~/components/Header.vue'
import WeatherPanel from '~/components/WeatherPanel.vue'

onMounted(() => {
  document.title = 'Väderkollen';
})
</script>