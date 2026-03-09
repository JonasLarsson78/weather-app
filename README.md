## Väderpanelen – Nuxt väderapp

En responsiv väderpanel byggd med Nuxt 4 som hämtar prognoser från en extern vädertjänst via en server-side proxy. Användaren kan söka på stad, spara favoriter och få timprognos med väderikoner och säsongsanpassad bakgrund.

## Funktioner

- Sök väder per stad (svensk tidzon och format `HH:mm`).
- Timprognos med ikon, temperatur, vind och luftfuktighet.
- Säsongsbakgrund (vinter/vår/sommar/höst) baserat på referenstid.
- Favoritstäder med stjärn-toggle och horisontell scroll-lista.
- Senast använda stad sparas och laddas automatiskt vid reload.
- Snygg felhantering när stad inte hittas eller API-fel uppstår.
- Mobilanpassad layout (fullhöjdspanel, förbättrad knapp- och scroll-UX).

## Teknikstack

- Nuxt 4 (Vue 3, Vite, Nitro)
- TypeScript
- SCSS
- `weather-icons` för väderikoner

## Kom igång

### 1. Installera beroenden

```bash
npm install
```

### 2. Miljövariabler

Skapa en `.env`-fil i projektroten baserat på `.env.example` och fyll i:

```bash
NUXT_PUBLIC_WEATHER_API_BASE=http://127.0.0.1:3001
NUXT_WEATHER_API_KEY=din-api-nyckel
```

- `NUXT_PUBLIC_WEATHER_API_BASE` ska peka på din väder-API-backend (t.ex. `http://127.0.0.1:3001`).
- `NUXT_WEATHER_API_KEY` är nyckeln som proxyn använder mot väder-API:t.

### 3. Starta utvecklingsserver

```bash
npm run dev
```

Appen körs normalt på `http://localhost:3000`.

## Bygga och förhandsgranska

### Produktionbuild

```bash
npm run build
```

### Lokalt preview (standardport)

```bash
npm run preview
```

### Lokalt preview på annan port

```bash
npm run preview -- --port 5050
```

Om du vill nå appen från andra enheter i nätverket kan du lägga till host:

```bash
npm run preview -- --host 0.0.0.0 --port 5050
```

## Server-API (proxy)

Frontend pratar inte direkt med väder-API:t utan via en Nuxt server route:

- [server/api/weather.get.ts](server/api/weather.get.ts)

Denna route:

- Läser runtime-konfig från Nuxt (`NUXT_PUBLIC_WEATHER_API_BASE`, `NUXT_WEATHER_API_KEY`).
- Vidarebefordrar förfrågan till `/weather?city=...` på backend.
- Försöker först med `Authorization: Bearer <key>`, och faller tillbaka till `x-api-key` vid 401.

## Viktiga filer/struktur

- [app/app.vue](app/app.vue) – rotkomponent som monterar header och väderpanel.
- [app/components/Header.vue](app/components/Header.vue) – desktop-header.
- [app/components/WeatherPanel.vue](app/components/WeatherPanel.vue) – huvudvyn för vädret.
- [app/components/ForecastCard.vue](app/components/ForecastCard.vue) – kort för varje timprognos.
- [app/composables/useWeatherPanel.ts](app/composables/useWeatherPanel.ts) – logik för hämtning, state och formattering.
- [app/types](app/types) – delade TypeScript-typer.
- [app/assets/main.scss](app/assets/main.scss) – globala stilar och import av `weather-icons`.

## Vidareutveckling

Förslag på möjliga förbättringar:

- Lägga till fler vyer (t.ex. dags-/veckosammanfattning).
- Stöd för val av enheter (°C/°F) per användare.
- Ljus/mörk temaväxling.
- Cachelagring av senaste svar för snabbare återvisning.

För mer om Nuxt, se den officiella dokumentationen: https://nuxt.com/docs/getting-started/introduction
