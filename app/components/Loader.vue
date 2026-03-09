<template>
  <div class="loader-wrap" role="status" aria-live="polite">
    <div class="spinner" aria-hidden="true"></div>
    <p class="loader-text">{{ props.message || 'Laddar…' }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  message?: string
}>()
</script>

<style scoped lang="scss">
.loader-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 1rem;
  background: rgba(15, 23, 42, 0.45);
  border-radius: 8px;
  border: 1px solid rgba(189, 230, 253, 0.08);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: #fde68a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loader-text {
  color: #dbeafe;
  font-weight: 600;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
