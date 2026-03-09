import type { WeatherResponse } from '~/types/weather'

export const useWeatherPanel = () => {
  const savedCity = useCookie<string | undefined>('weather-last-city')
  const city = ref(savedCity.value?.trim() || '')

  const { data, pending, error, execute } = useFetch<WeatherResponse>('/api/weather', {
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

  return {
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
  }
}
