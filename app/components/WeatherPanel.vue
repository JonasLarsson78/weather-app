<template>
  <section class="weather-panel">
    <div class="weather-shell" :style="seasonBackgroundStyle">
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
        <input v-model="city" class="city-input" type="text" placeholder="Ange stad, t.ex. Helsingborg">
        <button class="city-button" type="submit" :disabled="pending">
          Hämta väder
        </button>
        <button class="city-button city-button--secondary city-button--compact" type="button" title="Rensa sparad stad"
          @click="clearSavedCity">
          Rensa
        </button>
      </form>

      <p v-if="pending" class="status">Laddar väder...</p>
      <p v-else-if="error" class="status status--error">Kunde inte hämta väderdata.</p>

      <section v-else-if="weather" class="forecast">
        <div class="weather-meta">
          <p><strong>Uppdaterad:</strong> {{ weather.approvedTime }}</p>
          <p><strong>Referenstid:</strong> {{ weather.referenceTime }}</p>
        </div>

        <h2 class="forecast-title">Timprognos</h2>
        <div class="forecast-strip-wrap">
          <div class="forecast-strip">
            <article v-for="item in next12" :key="item.validTime" class="forecast-card">
              <p class="forecast-card__time">{{ 'kl ' + formatForecastTime(item.validTime) }}</p>
              <i :class="['forecast-icon', item.icon?.value || 'wi wi-na']"
                :style="{ color: resolveIconColor(item.icon?.color) }" aria-hidden="true" />
              <p class="forecast-card__temp">{{ item.temperature.value }} {{ item.temperature.unit }}</p>
              <p class="forecast-card__meta">Vind {{ item.windSpeed.value }} {{ item.windSpeed.unit }}</p>
              <p class="forecast-card__meta">Fukt {{ item.humidity.value }} {{ item.humidity.unit }}</p>
            </article>
          </div>
          <p class="forecast-scroll-hint" aria-hidden="true">
            <span>←</span>
            Scrolla
            <span>→</span>
          </p>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
type Metric = {
  value: number
  unit: string
}

type WeatherIcon = {
  value: string
  color?: string
}

type ForecastItem = {
  validTime: string
  icon?: WeatherIcon
  temperature: Metric
  windSpeed: Metric
  humidity: Metric
  pressure: Metric
}

type WeatherResponse = {
  city: string
  approvedTime: string
  referenceTime: string
  current: {
    validTime: string
    average: {
      icon?: WeatherIcon
      temperature: Metric
      windSpeed: Metric
      humidity: Metric
      pressure: Metric
    }
  }
  forecast: ForecastItem[]
}

const savedCity = useCookie<string | undefined>('weather-last-city')
const city = ref(savedCity.value?.trim() || '')

const { data, pending, error, execute } = await useFetch<WeatherResponse>('/api/weather', {
  query: computed(() => ({ city: city.value })),
  immediate: false,
  server: false,
  watch: false,
})

const weather = computed(() => data.value ?? null)
const next12 = computed(() => weather.value?.forecast?.slice(0, 12) ?? [])
const displayCity = computed(() => weather.value?.city || city.value || '—')
const currentTemperature = computed(() => weather.value?.current?.average?.temperature.value ?? '--')
const currentUnit = computed(() => weather.value?.current?.average?.temperature.unit ?? '')
const currentIconClass = computed(() => {
  return weather.value?.current?.average?.icon?.value || weather.value?.forecast?.[0]?.icon?.value || 'wi wi-na'
})
const resolveIconColor = (color?: string) => {
  return color?.trim() || '#fde68a'
}
const currentIconColor = computed(() => {
  return resolveIconColor(weather.value?.current?.average?.icon?.color || weather.value?.forecast?.[0]?.icon?.color)
})

const seasonBackgroundStyle = computed(() => {
  const referenceDate = weather.value?.referenceTime
    ? new Date(weather.value.referenceTime)
    : new Date()

  const month = Number.isNaN(referenceDate.getTime())
    ? new Date().getMonth() + 1
    : referenceDate.getMonth() + 1

  const season = month === 12 || month <= 2
    ? 'winter'
    : month >= 3 && month <= 5
      ? 'spring'
      : month >= 6 && month <= 8
        ? 'summer'
        : 'autumn'

  return {
    backgroundImage: `linear-gradient(165deg, #0f172a3d 0%, #1e3a8a33 100%), url('/seasons/${season}.svg')`,
  }
})

const formatForecastTime = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

const fetchWeather = async () => {
  const normalizedCity = city.value.trim()

  if (normalizedCity.length > 0) {
    city.value = normalizedCity
    savedCity.value = normalizedCity
  }

  await execute()
}

const clearSavedCity = () => {
  savedCity.value = undefined
  city.value = ''
  data.value = undefined
}

onMounted(() => {
  fetchWeather()
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
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  font: inherit;
  padding: 0.55rem 0.8rem;
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

.status {
  margin: 0.5rem 0 1rem;
}

.status--error {
  color: #fee2e2;
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
  margin-bottom: 0.5rem !important;
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
  font-size: 2rem !important;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
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

  .forecast-card {
    min-height: 120px;
    padding: 0.6rem;
    scroll-snap-align: start;
  }
}

@media (max-width: 480px) {
  .forecast-strip {
    gap: 0.5rem;
    grid-auto-columns: minmax(130px, 1fr);
  }

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
