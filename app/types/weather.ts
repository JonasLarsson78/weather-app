export type Metric = {
  value: number
  unit: string
}

export type WeatherIcon = {
  value: string
  color?: string
}

export type ForecastItem = {
  validTime: string
  icon?: WeatherIcon
  temperature: Metric
  windSpeed: Metric
  humidity: Metric
  pressure: Metric
}

export type WeatherResponse = {
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
