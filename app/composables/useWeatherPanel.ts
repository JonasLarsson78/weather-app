import type { WeatherResponse } from '~/types/weather'

export const useWeatherPanel = () => {
  const STORAGE_CITY_KEY = 'weather-last-city'
  const STORAGE_FAVORITES_KEY = 'weather-favorite-cities'

  const savedCity = useCookie<string | undefined>('weather-last-city')
  const favoriteCitiesCookie = useCookie<string[]>('weather-favorite-cities', {
    default: () => [],
  })

  const city = ref(savedCity.value?.trim() || '')
  const refreshToken = ref(Date.now())

  const formatCityName = (value: string) => {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
      return ''
    }

    return trimmedValue.charAt(0).toLocaleUpperCase('sv-SE') + trimmedValue.slice(1).toLocaleLowerCase('sv-SE')
  }

  const { data, pending, error, execute } = useFetch<WeatherResponse>('/api/weather', {
    query: computed(() => ({
      city: city.value,
      refresh: refreshToken.value,
    })),
    immediate: false,
    server: false,
    watch: false,
  })

  const weather = computed(() => data.value ?? null)
  const next12 = computed(() => weather.value?.forecast?.slice(0, 12) ?? [])
  const displayCity = computed(() => weather.value?.city || city.value || '—')

  const rawErrorMessage = computed(() => {
    const currentError = error.value as any

    return currentError?.data?.statusMessage
      || currentError?.data?.message
      || currentError?.statusMessage
      || ''
  })

  const isCityNotFoundError = computed(() => {
    const currentError = error.value as any

    const statusCode = Number(
      currentError?.statusCode
      || currentError?.status
      || currentError?.response?.status
      || currentError?.data?.statusCode,
    )

    const normalizedMessage = rawErrorMessage.value.toLowerCase()

    return statusCode === 404
      || normalizedMessage.includes('not found')
      || normalizedMessage.includes('hittades inte')
  })

  const weatherErrorMessage = computed(() => {
    if (isCityNotFoundError.value) {
      const searchedCity = city.value.trim()

      if (searchedCity) {
        return `Vi kunde inte hitta "${searchedCity}". Kontrollera stavningen och försök igen.`
      }

      return 'Vi kunde inte hitta den staden. Kontrollera stavningen och försök igen.'
    }

    return 'Kunde inte hämta väderdata just nu. Försök igen om en stund.'
  })

  const favoriteCities = computed(() => favoriteCitiesCookie.value ?? [])

  const currentCityNormalized = computed(() => city.value.trim().toLowerCase())

  const isCurrentCityFavorite = computed(() => {
    if (!currentCityNormalized.value) {
      return false
    }

    return favoriteCities.value.some((favoriteCity) => favoriteCity.toLowerCase() === currentCityNormalized.value)
  })

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

  const saveFavoritesToStorage = () => {
    localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(favoriteCitiesCookie.value))
  }

  const fetchWeather = async () => {
    const normalizedCity = formatCityName(city.value)

    if (!normalizedCity) {
      city.value = ''
      data.value = undefined
      ;(error as any).value = null
      return
    }

    city.value = normalizedCity
    savedCity.value = normalizedCity

    localStorage.setItem(STORAGE_CITY_KEY, normalizedCity)

    refreshToken.value = Date.now()

    await execute()
  }

  const clearSavedCity = () => {
    city.value = ''
  }

  const addCurrentCityToFavorites = () => {
    const normalizedCity = formatCityName(city.value)

    if (!normalizedCity) {
      return
    }

    const alreadyExists = favoriteCities.value.some((favoriteCity) => {
      return favoriteCity.toLowerCase() === normalizedCity.toLowerCase()
    })

    if (alreadyExists) {
      return
    }

    favoriteCitiesCookie.value = [...favoriteCities.value, normalizedCity]

    saveFavoritesToStorage()
  }

  const removeFavoriteCity = (cityToRemove: string) => {
    favoriteCitiesCookie.value = favoriteCities.value.filter((favoriteCity) => {
      return favoriteCity.toLowerCase() !== cityToRemove.toLowerCase()
    })

    saveFavoritesToStorage()
  }

  const toggleCurrentCityFavorite = () => {
    if (isCityNotFoundError.value) {
      return
    }

    const normalizedCity = formatCityName(city.value)

    if (!normalizedCity) {
      return
    }

    if (isCurrentCityFavorite.value) {
      removeFavoriteCity(normalizedCity)
      return
    }

    addCurrentCityToFavorites()
  }

  const selectFavoriteCity = async (favoriteCity: string) => {
    city.value = favoriteCity
    savedCity.value = favoriteCity

    localStorage.setItem(STORAGE_CITY_KEY, favoriteCity)

    await fetchWeather()
  }

  let lastForegroundRefreshAt = 0

  const refreshWeatherOnForeground = async () => {
    const now = Date.now()
    const hasCity = city.value.trim().length > 0

    if (!hasCity || pending.value) {
      return
    }

    if (now - lastForegroundRefreshAt < 3000) {
      return
    }

    lastForegroundRefreshAt = now

    await fetchWeather()
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void refreshWeatherOnForeground()
    }
  }

  const handleWindowFocus = () => {
    void refreshWeatherOnForeground()
  }

  const handlePageShow = () => {
    void refreshWeatherOnForeground()
  }

  onMounted(() => {
    const storedCity = localStorage.getItem(STORAGE_CITY_KEY)
    const storedFavorites = localStorage.getItem(STORAGE_FAVORITES_KEY)

    if (storedCity) {
      city.value = storedCity
      savedCity.value = storedCity
    }

    if (storedFavorites) {
      try {
        favoriteCitiesCookie.value = JSON.parse(storedFavorites)
      } catch {}
    }

    void fetchWeather()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)
    window.addEventListener('pageshow', handlePageShow)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('focus', handleWindowFocus)
    window.removeEventListener('pageshow', handlePageShow)
  })

  return {
    city,
    pending,
    error,
    weather,
    next12,
    displayCity,
    isCityNotFoundError,
    weatherErrorMessage,
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
    isCurrentCityFavorite,
    addCurrentCityToFavorites,
    removeFavoriteCity,
    selectFavoriteCity,
    toggleCurrentCityFavorite,
  }
}
