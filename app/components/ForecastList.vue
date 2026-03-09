<template>
  <div class="forecast-list">
    <div v-for="(day, idx) in forecast" :key="idx" class="forecast-day">
      <button class="day-header" @click="toggle(idx)">
        <span>{{ formatDate(day.date) }}</span>
        <span>{{ openIndex === idx ? '▲' : '▼' }}</span>
      </button>
      <div v-if="openIndex === idx" class="day-details">
        <ul class="times-list">
          <li v-for="(t, i) in day.times" :key="i" class="time-entry">
            <div class="time-row">
              <span class="time-label">{{ t.time }}</span>
              <span class="time-summary"><i :class="['forecast-icon', t.icon]"
                  :style="{ color: t.iconColor || '#fde68a' }" aria-hidden="true"></i> {{ t.temp
                }}°C</span>
            </div>
            <div class="time-meta">
              <span>Vind: {{ t.wind }} m/s</span>
              <span>Fukt: {{ t.humidity }}%</span>
            </div>
            <p class="time-desc">{{ t.description }}</p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{ city?: string; days?: number }>()

interface TimeEntry {
  time: string
  temp: number
  humidity: number
  wind: number
  icon?: string
  iconColor?: string
  description: string
}

interface ForecastDay {
  date: string
  summary: string
  times: TimeEntry[]
}

const forecast = ref<ForecastDay[]>([])
const openIndex = ref<number | null>(null)

function toggle(idx: number) {
  openIndex.value = openIndex.value === idx ? null : idx
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const formatted = d.toLocaleDateString('sv-SE', { weekday: 'long', month: 'short', day: 'numeric' })
  if (!formatted) return formatted
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

async function fetchForecast() {
  const city = props.city?.trim()
  const days = props.days ?? 7
  if (!city) return

  try {
    const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}&days=${days}`)
    if (!res.ok) return
    const data = await res.json()

    if (data && Array.isArray(data.forecast)) {
      // Group forecast items by date (YYYY-MM-DD)
      const groups = new Map<string, any[]>()
      data.forecast.forEach((item: any) => {
        const raw = item.validTime || item.date || ''
        const isoCandidate = raw.replace(' ', 'T')
        let dt = new Date(isoCandidate)
        if (isNaN(dt.getTime())) {
          dt = new Date(isoCandidate + 'Z')
        }
        if (isNaN(dt.getTime())) return

        // use local date (yyyy-mm-dd) as grouping key so entries fall into local days
        const y = dt.getFullYear()
        const m = String(dt.getMonth() + 1).padStart(2, '0')
        const d = String(dt.getDate()).padStart(2, '0')
        const key = `${y}-${m}-${d}`

        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push({ item, dt })
      })

      const days = props.days ?? 7
      const result: ForecastDay[] = []

      // sort group keys chronologically to ensure we pick the next N days
      const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
        // parse as local midnight for reliable chronological order
        const ad = new Date(a[0] + 'T00:00:00')
        const bd = new Date(b[0] + 'T00:00:00')
        return ad.getTime() - bd.getTime()
      }).slice(0, days)

      for (const [date, itemsWithDt] of sortedGroups) {
        // itemsWithDt contains objects { item, dt }
        const items = (itemsWithDt as any[]).sort((a, b) => a.dt.getTime() - b.dt.getTime())
        const times: TimeEntry[] = items.map(({ item, dt }: any) => {
          return {
            time: dt.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
            temp: item.temperature?.value ?? 0,
            humidity: item.humidity?.value ?? 0,
            wind: item.windSpeed?.value ?? 0,
            icon: item.icon?.value,
            iconColor: item.icon?.color,
            description: item.description || `Tryck: ${item.pressure?.value ?? '-'} ${item.pressure?.unit ?? ''}`
          }
        })

        result.push({
          date,
          summary: (items[0] && items[0].item?.icon?.value) || '',
          times,
        })
      }

      // reset open index when replacing forecast
      forecast.value = result
      openIndex.value = null
    }
  } catch (e) {
    console.error('Forecast fetch failed', e)
  }
}

onMounted(() => {
  if (props.city) fetchForecast()
})

watch(() => props.city, (newCity, oldCity) => {
  if (newCity && newCity !== oldCity) fetchForecast()
})
</script>

<style scoped>
.forecast-list {
  width: 100%;
  max-width: 100%;
  margin: 0;
}

.forecast-day {
  border-bottom: 1px solid rgba(219, 234, 254, 0.12);
}

.day-header {
  width: 100%;
  background: linear-gradient(90deg, rgba(15, 23, 42, 0.6), rgba(30, 58, 138, 0.35));
  border: 1px solid rgba(189, 230, 253, 0.12);
  border-radius: 10px;
  padding: 0.9em 1em;
  text-align: left;
  font-size: 1.05em;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  color: #eff6ff;
}

.day-details {
  background: rgba(15, 23, 42, 0.45);
  padding: 0.9em 1em;
  font-size: 0.98em;
  border-radius: 8px;
}

.forecast-icon {
  font-size: 1.3rem;
  margin-right: 0.45rem;
  color: #fde68a;
}

.times-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.6rem;
}

.time-entry {
  background: rgba(15, 23, 42, 0.25);
  border: 1px solid rgba(189, 230, 253, 0.08);
  border-radius: 10px;
  padding: 0.7rem;
}

.time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
}

.time-label {
  color: #dbeafe;
  font-weight: 700;
}

.time-summary {
  color: #eff6ff;
  font-weight: 600;
}

.time-meta {
  display: flex;
  gap: 1rem;
  color: #dbeafe;
  font-size: 0.9rem;
  margin-top: 0.35rem;
}

.time-desc {
  color: #dbeafe;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}
</style>
