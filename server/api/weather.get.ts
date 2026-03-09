export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const city =
    typeof query.city === 'string' && query.city.trim().length > 0
      ? query.city.trim()
      : ''

  if (!config.public.weatherApiBase) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing WEATHER_API_BASE in server runtime config.',
    })
  }

  if (!config.weatherApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing WEATHER_API_KEY in server runtime config.',
    })
  }

  const baseUrl = `${config.public.weatherApiBase}/weather`

  try {
    const data = await $fetch(baseUrl, {
      query: { city },
      headers: {
        Authorization: `Bearer ${config.weatherApiKey}`,
      },
    })

    return data
  } catch (error: any) {
    if (error?.response?.status !== 401) {
      throw error
    }
  }

  const data = await $fetch(baseUrl, {
    query: { city },
    headers: {
      'x-api-key': config.weatherApiKey,
    },
  })

  return data
})