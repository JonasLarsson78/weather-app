<template>
  <section class="weather-panel">
    <div class="weather-shell" :style="seasonBackgroundStyle">
      <button v-if="!favoriteCities.length" class="city-star city-star--corner" type="button"
        :disabled="!city.trim() || !!error || isCityNotFoundError" :aria-pressed="isCurrentCityFavorite"
        :title="isCurrentCityFavorite ? 'Ta bort från favoriter' : 'Lägg till i favoriter'"
        @click="toggleCurrentCityFavorite">
        {{ isCurrentCityFavorite ? '★' : '☆' }}
      </button>

      <div v-if="favoriteCities.length" class="favorites">
        <div ref="favoritesListEl" class="favorites__list">
          <div v-for="favoriteCity in favoriteCities" :key="favoriteCity" class="favorite-pill">
            <button class="favorite-pill__city" type="button" @click="selectFavoriteCity(favoriteCity)">
              {{ favoriteCity }}
            </button>
            <button class="favorite-pill__remove" type="button" title="Ta bort favorit"
              @click="removeFavoriteCity(favoriteCity)">
              ×
            </button>
          </div>
        </div>
        <p v-if="showFavoritesScrollHint" class="favorites-scroll-hint" aria-hidden="true">
          <span>←</span>
          Scrolla
          <span>→</span>
        </p>
        <hr v-if="favoriteCities.length > 0" class="favorites__divider">
        <button class="city-star city-star--below-divider" type="button"
          :disabled="!city.trim() || !!error || isCityNotFoundError" :aria-pressed="isCurrentCityFavorite"
          :title="isCurrentCityFavorite ? 'Ta bort från favoriter' : 'Lägg till i favoriter'"
          @click="toggleCurrentCityFavorite">
          {{ isCurrentCityFavorite ? '★' : '☆' }}
        </button>

      </div>

      <header class="hero">
        <p class="hero__city">{{ displayCity }}</p>
        <div class="hero__main">
          <i :class="['hero__icon', currentIconClass]" :style="{ color: currentIconColor }" aria-hidden="true" />
          <p class="hero__temp">{{ currentTemperature }}<span>{{ currentUnit }}</span></p>
        </div>

        <div class="hero__meta" v-if="weather">
          <p><strong>Vind</strong> {{ weather.current.average.windSpeed.value }} {{
            weather.current.average.windSpeed.unit }}</p>
          <p><strong>Luftfuktighet</strong> {{ weather.current.average.humidity.value }} {{
            weather.current.average.humidity.unit }}</p>
          <p><strong>Tryck</strong> {{ weather.current.average.pressure.value }} {{
            weather.current.average.pressure.unit }}</p>
        </div>
      </header>

      <form class="city-form" @submit.prevent="fetchWeather">
        <input ref="cityInputEl" v-model="city" class="city-input" type="text"
          placeholder="Ange stad, t.ex. Helsingborg">
        <button class="city-button" type="submit" :disabled="pending">
          Hämta väder
        </button>
        <button class="city-button city-button--secondary city-button--compact" type="button" title="Rensa sparad stad"
          @click="handleClearCity">
          Rensa
        </button>
      </form>

      <Loader v-if="pending" message="Laddar väder..." />
      <div v-else-if="error" class="status-card status-card--error" role="status" aria-live="polite">
        <p class="status-card__title">{{ errorTitle }}</p>
        <p class="status-card__text">{{ errorMessage }}</p>
      </div>

      <section v-else-if="weather" class="forecast">
        <div class="weather-meta">
          <p><strong>Uppdaterad:</strong> {{ weather.approvedTime }}</p>
          <p><strong>Referenstid:</strong> {{ weather.referenceTime }}</p>
        </div>

        <h2 class="forecast-title">Timprognos</h2>
        <div class="forecast-strip-wrap">
          <div class="forecast-strip">
            <ForecastCard v-for="item in next12" :key="item.validTime"
              :time-label="'kl ' + formatForecastTime(item.validTime)" :icon-class="item.icon?.value || 'wi wi-na'"
              :icon-color="resolveIconColor(item.icon?.color)"
              :temperature="`${item.temperature.value} ${item.temperature.unit}`"
              :wind="`Vind ${item.windSpeed.value} ${item.windSpeed.unit}`"
              :humidity="`Fukt ${item.humidity.value} ${item.humidity.unit}`" />
          </div>
          <p class="forecast-scroll-hint" aria-hidden="true">
            <span>←</span>
            Scrolla
            <span>→</span>
          </p>
        </div>

        <h2 class="forecast-title">7-dagarsprognos</h2>
        <ForecastList :city="city" />

      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import ForecastCard from '~/components/ForecastCard.vue'
import ForecastList from './ForecastList.vue'
import Loader from './Loader.vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const {
  city,
  pending,
  error,
  weather,
  next12,
  displayCity,
  currentTemperature,
  currentUnit,
  currentIconClass,
  currentIconColor,
  seasonBackgroundStyle,
  formatForecastTime,
  resolveIconColor,
  fetchWeather,
  clearSavedCity,
  favoriteCities,
  isCityNotFoundError,
  weatherErrorMessage,
  isCurrentCityFavorite,
  removeFavoriteCity,
  selectFavoriteCity,
  toggleCurrentCityFavorite,
} = useWeatherPanel()

const favoritesListEl = ref<HTMLElement | null>(null)
const cityInputEl = ref<HTMLInputElement | null>(null)
const showFavoritesScrollHint = ref(false)
let favoritesResizeObserver: ResizeObserver | undefined

const errorTitle = computed(() => {
  return isCityNotFoundError.value ? 'Staden hittades inte' : 'Kunde inte hämta väderdata'
})

const errorMessage = computed(() => {
  return weatherErrorMessage.value
})

const handleClearCity = () => {
  clearSavedCity()
  cityInputEl.value?.focus()
}

const updateFavoritesScrollHint = () => {
  const listElement = favoritesListEl.value

  if (!listElement) {
    showFavoritesScrollHint.value = false
    return
  }

  showFavoritesScrollHint.value = listElement.scrollWidth - listElement.clientWidth > 1
}

watch(favoriteCities, async () => {
  await nextTick()
  updateFavoritesScrollHint()
}, { immediate: true })

watch(favoritesListEl, async (newElement, previousElement) => {
  if (favoritesResizeObserver && previousElement) {
    favoritesResizeObserver.unobserve(previousElement)
  }

  if (favoritesResizeObserver && newElement) {
    favoritesResizeObserver.observe(newElement)
  }

  await nextTick()
  updateFavoritesScrollHint()
})

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    favoritesResizeObserver = new ResizeObserver(() => {
      updateFavoritesScrollHint()
    })

    if (favoritesListEl.value) {
      favoritesResizeObserver.observe(favoritesListEl.value)
    }
  }

  updateFavoritesScrollHint()
})

onBeforeUnmount(() => {
  favoritesResizeObserver?.disconnect()
})
</script>

<style scoped lang="scss">
.weather-panel {
  margin: 0 auto;
  max-width: 1000px;
  padding: 1rem;
}

.weather-shell {
  backdrop-filter: blur(4px);
  background-color: #1e3a8a;
  background-position: center;
  background-size: cover;
  border: 1px solid #93c5fd55;
  border-radius: 14px;
  box-shadow: 0 20px 40px #0f172a30;
  color: #eff6ff;
  overflow: hidden;
  padding: 1.1rem;
  position: relative;

  &::before {
    background: linear-gradient(180deg, #02061766 0%, #0f172a4d 45%, #0f172a59 100%);
    content: '';
    inset: 0;
    pointer-events: none;
    position: absolute;
  }

  >* {
    position: relative;
    z-index: 1;
  }
}

.hero {
  margin-bottom: 1rem;
  text-align: center;
}

.hero__city {
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 2px 10px #02061799;
}

.hero__main {
  align-items: center;
  display: inline-flex;
  gap: 0.75rem;
}

.hero__icon {
  font-size: 2.8rem;
}

.hero__temp {
  font-size: 4.2rem;
  font-weight: 300;
  line-height: 1;
  margin: 0.4rem 0 0;
  text-shadow: 0 4px 16px #020617b3;

  span {
    font-size: 1.2rem;
    font-weight: 500;
    margin-left: 0.3rem;
    vertical-align: super;
  }
}

.weather-panel :deep(.wi) {
  color: #fde68a;
}

.hero__meta {
  background: #0f172a4d;
  border: 1px solid #dbeafe40;
  border-radius: 10px;
  display: flex;
  flex-wrap: wrap;
  font-size: 0.92rem;
  gap: 0.9rem 1.2rem;
  justify-content: center;
  margin-top: 0.65rem;
  padding: 0.45rem 0.65rem;
  text-shadow: 0 2px 8px #02061799;

  p {
    margin: 0;
  }
}

.city-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.city-input,
.city-button {
  box-sizing: border-box;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  font: inherit;
  padding: 0.55rem 0.8rem;
}

.city-star {
  align-items: center;
  background: #0f172a80;
  border: 1px solid #dbeafe99;
  border-radius: 999px;
  color: #fde68a;
  cursor: pointer;
  display: inline-flex;
  font-size: 1.2rem;
  justify-content: center;
  line-height: 1;
  min-height: 38px;
  min-width: 38px;
  padding: 0.35rem;
}

.city-star--corner {
  position: absolute;
  right: 1rem;
  top: 0.85rem;
  z-index: 2;
}

.city-star--below-divider {
  display: flex;
  margin: 0.35rem 0 0 auto;
}

.city-star[aria-pressed='false'] {
  color: #dbeafe;
}

.city-star:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.city-input {
  background: #eff6ff;
  color: #0f172a;
  flex: 1;
  min-width: 220px;
}

.city-button {
  background: #0f172a;
  color: #eff6ff;
  cursor: pointer;
}

.city-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.city-button--secondary {
  background: #dbeafe;
  color: #1e3a8a;
}

.city-button--compact {
  min-width: auto;
  padding-inline: 0.65rem;
}

.favorites {
  margin: -0.3rem 0 0.9rem;
}

.favorites__label {
  color: #dbeafe;
  font-size: 0.85rem;
  margin: 0 0 0.4rem;
  text-shadow: 0 2px 8px #02061799;
}

.favorites__list {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.45rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  padding-bottom: 0.25rem;
  -webkit-overflow-scrolling: touch;
}

.favorite-pill {
  align-items: center;
  background: #0f172a66;
  border: 1px solid #dbeafe55;
  border-radius: 999px;
  display: inline-flex;
  flex: 0 0 auto;
  overflow: hidden;
}

.favorite-pill__city,
.favorite-pill__remove {
  appearance: none;
  background: transparent;
  border: 0;
  color: #eff6ff;
  cursor: pointer;
  font: inherit;
  line-height: 1;
}

.favorite-pill__city {
  padding: 0.4rem 0.55rem 0.4rem 0.65rem;
}

.favorite-pill__remove {
  border-left: 1px solid #dbeafe44;
  color: #bfdbfe;
  font-size: 1.05rem;
  padding: 0.36rem 0.52rem 0.42rem;
}

.favorites-scroll-hint {
  align-items: center;
  color: #dbeafe;
  display: flex;
  font-size: 0.78rem;
  gap: 0.55rem;
  justify-content: center;
  margin: 0.2rem 0 0;
  opacity: 0.92;
  text-shadow: 0 2px 8px #02061799;

  span {
    font-size: 0.95rem;
    line-height: 1;
  }
}

.status {
  margin: 0.5rem 0 1rem;
}

.status--error {
  color: #fee2e2;
}

.status-card {
  border-radius: 10px;
  margin: 0.5rem 0 1rem;
  padding: 0.65rem 0.75rem;
  text-shadow: 0 2px 8px #02061799;
}

.status-card--error {
  background: #7f1d1d66;
  border: 1px solid #fecaca66;
  color: #fee2e2;
}

.status-card__title {
  font-weight: 700;
  margin: 0;
}

.status-card__text {
  margin: 0.2rem 0 0;
}

.weather-meta {
  background: #0f172a4d;
  border: 1px solid #dbeafe33;
  border-radius: 10px;
  color: #dbeafe;
  display: flex;
  flex-wrap: wrap;
  font-size: 0.88rem;
  gap: 0.8rem 1rem;
  margin-bottom: 1rem;
  padding: 0.45rem 0.65rem;
  text-shadow: 0 2px 8px #02061799;

  p {
    margin: 0;
  }
}

.forecast-title {
  font-size: 1.15rem;
  margin: 0 0 0.75rem;
  text-shadow: 0 2px 8px #02061799;
}

.forecast-strip-wrap {
  position: relative;
}

.forecast-scroll-hint {
  display: none;
}

.forecast-strip {
  display: grid;
  gap: 0.7rem;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  overflow: visible;
  padding-bottom: 0.35rem;
}

@media (max-width: 768px) {
  .weather-panel {
    display: flex;
    min-height: calc(100dvh - 2rem);
  }

  .weather-shell {
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  .city-form {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    min-width: 0;
    width: 100%;
  }

  .city-input {
    grid-column: 1 / -1;
    justify-self: stretch;
    min-width: 0;
    width: 100%;
  }

  .city-button {
    width: 100%;
  }

  .forecast-strip {
    gap: 0.55rem;
    grid-auto-flow: column;
    grid-auto-columns: minmax(130px, 1fr);
    grid-template-columns: none;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 0.5rem;
  }

  .forecast-scroll-hint {
    align-items: center;
    color: #dbeafe;
    display: flex;
    font-size: 0.78rem;
    gap: 0.55rem;
    justify-content: center;
    margin: 0.15rem 0 0;
    opacity: 0.92;
    text-shadow: 0 2px 8px #02061799;

    span {
      font-size: 0.95rem;
      line-height: 1;
    }
  }

}

@media (max-width: 480px) {
  .forecast-strip {
    gap: 0.5rem;
    grid-auto-columns: minmax(130px, 1fr);
  }
}
</style>
