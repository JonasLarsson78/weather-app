export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  setHeader(event, 'Pragma', 'no-cache')
  setHeader(event, 'Expires', '0')

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
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${config.weatherApiKey}`,
      },
    })

    return data
  } catch (error: any) {
    const status = Number(
      error?.statusCode
      || error?.status
      || error?.response?.status
      || error?.data?.statusCode,
    )

    if (status === 401) {
      // Fall back to x-api-key below
    } else if (status === 404 || status === 500) {
      throw createError({
        statusCode: 404,
        statusMessage: city
          ? `Staden "${city}" hittades inte.`
          : 'Staden hittades inte.',
      })
    } else {
      throw createError({
        statusCode: status || 500,
        statusMessage: error?.data?.statusMessage
          || error?.statusMessage
          || error?.message
          || 'Kunde inte hämta väderdata från tjänsten.',
      })
    }
  }

  try {
    const data = await $fetch(baseUrl, {
      query: { city },
      cache: 'no-store',
      headers: {
        'x-api-key': config.weatherApiKey,
      },
    })

    return data
  } catch (error: any) {
    const status = Number(
      error?.statusCode
      || error?.status
      || error?.response?.status
      || error?.data?.statusCode,
    )

    if (status === 404 || status === 500) {
      throw createError({
        statusCode: 404,
        statusMessage: city
          ? `Staden "${city}" hittades inte.`
          : 'Staden hittades inte.',
      })
    }

    throw createError({
      statusCode: status || 500,
      statusMessage: error?.data?.statusMessage
        || error?.statusMessage
        || error?.message
        || 'Kunde inte hämta väderdata från tjänsten.',
    })
  }
})