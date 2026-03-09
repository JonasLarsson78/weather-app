<template>
  <article class="forecast-card">
    <p class="forecast-card__time">{{ timeLabel }}</p>
    <i :class="['forecast-icon', iconClass]" :style="{ color: iconColor }" aria-hidden="true" />
    <p class="forecast-card__temp">{{ temperature }}</p>
    <p class="forecast-card__meta">{{ wind }}</p>
    <p class="forecast-card__meta">{{ humidity }}</p>
  </article>
</template>

<script setup lang="ts">
import type { ForecastCardProps } from '~/types/forecast-card'

defineProps<ForecastCardProps>()
</script>

<style scoped lang="scss">
.forecast-card {
  background: #0f172a40;
  border: 1px solid #bfdbfe4d;
  border-radius: 12px;
  min-height: 132px;
  padding: 0.7rem;
  text-shadow: 0 2px 8px #02061780;

  p {
    margin: 0;
  }
}

.forecast-card__time {
  color: #dbeafe;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  text-transform: capitalize;
  font-weight: 700;
}

.forecast-card__temp {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0.25rem 0;
}

.forecast-card__meta {
  color: #dbeafe;
  font-size: 0.78rem;
}

.forecast-icon {
  font-size: 2rem;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .forecast-card {
    min-height: 120px;
    padding: 0.6rem;
    scroll-snap-align: start;
  }
}

@media (max-width: 480px) {
  .forecast-card__time {
    font-size: 0.75rem;
  }

  .forecast-card__temp {
    font-size: 1rem;
  }

  .forecast-card__meta {
    font-size: 0.72rem;
  }
}
</style>
