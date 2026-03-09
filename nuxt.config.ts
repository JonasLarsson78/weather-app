// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/main.scss'],
  runtimeConfig: {
    weatherApiKey: process.env.WEATHER_API_KEY,
    public: {
      weatherApiBase: process.env.WEATHER_API_BASE,
    },
  },
})
