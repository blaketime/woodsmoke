import type { WeatherDay, WeatherDateRange, FireDangerLevel } from './types'

export interface WeatherAlert {
  type: string
  severity: 'info' | 'warning' | 'danger'
  message: string
}

interface WmoEntry {
  description: string
  icon: string
  severity: 'clear' | 'mild' | 'moderate' | 'severe'
}

const WMO_CODES: Record<number, WmoEntry> = {
  0: { description: 'Clear sky', icon: 'Sun', severity: 'clear' },
  1: { description: 'Mainly clear', icon: 'Sun', severity: 'clear' },
  2: { description: 'Partly cloudy', icon: 'CloudSun', severity: 'clear' },
  3: { description: 'Overcast', icon: 'Cloud', severity: 'mild' },
  45: { description: 'Fog', icon: 'CloudFog', severity: 'mild' },
  48: { description: 'Depositing rime fog', icon: 'CloudFog', severity: 'mild' },
  51: { description: 'Light drizzle', icon: 'CloudDrizzle', severity: 'mild' },
  53: { description: 'Moderate drizzle', icon: 'CloudDrizzle', severity: 'moderate' },
  55: { description: 'Dense drizzle', icon: 'CloudDrizzle', severity: 'moderate' },
  56: { description: 'Light freezing drizzle', icon: 'CloudHail', severity: 'moderate' },
  57: { description: 'Dense freezing drizzle', icon: 'CloudHail', severity: 'severe' },
  61: { description: 'Slight rain', icon: 'CloudRain', severity: 'mild' },
  63: { description: 'Moderate rain', icon: 'CloudRain', severity: 'moderate' },
  65: { description: 'Heavy rain', icon: 'CloudRainWind', severity: 'severe' },
  66: { description: 'Light freezing rain', icon: 'CloudHail', severity: 'moderate' },
  67: { description: 'Heavy freezing rain', icon: 'CloudHail', severity: 'severe' },
  71: { description: 'Slight snow', icon: 'CloudSnow', severity: 'moderate' },
  73: { description: 'Moderate snow', icon: 'CloudSnow', severity: 'moderate' },
  75: { description: 'Heavy snow', icon: 'Snowflake', severity: 'severe' },
  77: { description: 'Snow grains', icon: 'Snowflake', severity: 'moderate' },
  80: { description: 'Slight rain showers', icon: 'CloudSunRain', severity: 'mild' },
  81: { description: 'Moderate rain showers', icon: 'CloudRain', severity: 'moderate' },
  82: { description: 'Violent rain showers', icon: 'CloudRainWind', severity: 'severe' },
  85: { description: 'Slight snow showers', icon: 'CloudSnow', severity: 'moderate' },
  86: { description: 'Heavy snow showers', icon: 'Snowflake', severity: 'severe' },
  95: { description: 'Thunderstorm', icon: 'CloudLightning', severity: 'severe' },
  96: { description: 'Thunderstorm with slight hail', icon: 'CloudLightning', severity: 'severe' },
  99: { description: 'Thunderstorm with heavy hail', icon: 'CloudLightning', severity: 'severe' },
}

export function getWmoInfo(code: number): WmoEntry {
  return WMO_CODES[code] ?? { description: 'Unknown', icon: 'Cloud', severity: 'mild' }
}

export function getFwiDangerLevel(fwi: number | null): FireDangerLevel {
  if (fwi == null || fwi < 5) return 'low'
  if (fwi < 12) return 'moderate'
  if (fwi < 22) return 'high'
  if (fwi < 38) return 'very_high'
  return 'extreme'
}

/**
 * Simplified fire weather estimate from temp, humidity, wind, and precipitation.
 * Not the real Canadian FWI (which needs sequential daily tracking), but a
 * reasonable proxy: hot + dry + windy + no rain = higher danger.
 * Returns a score on roughly the same 0-50+ scale as FWI.
 */
function estimateFireWeatherIndex(
  tempMax: number,
  humidityMin: number | null,
  windMax: number | null,
  precip: number | null,
): number {
  // Cold/wet conditions = minimal fire risk
  if (tempMax < 5) return 0
  if (precip != null && precip > 5) return 1

  // Temperature component: ramps up above 15°C, peaks around 35+
  const tempScore = Math.max(0, Math.min((tempMax - 15) / 20, 1))

  // Humidity component: lower humidity = higher risk. Below 25% is extreme.
  const rh = humidityMin ?? 50 // default to moderate if unknown
  const humidityScore = Math.max(0, Math.min((70 - rh) / 50, 1))

  // Wind component: higher wind = higher risk. 30+ km/h is significant.
  const wind = windMax ?? 10
  const windScore = Math.max(0, Math.min(wind / 40, 1))

  // Precipitation dampening: recent rain reduces risk
  const precipDampening = precip != null && precip > 0.5
    ? Math.max(0.1, 1 - precip / 10)
    : 1

  // Weighted combination scaled to roughly match FWI range (0-50+)
  const raw = (tempScore * 20 + humidityScore * 15 + windScore * 10) * precipDampening
  return Math.round(raw)
}

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function isWithinForecastRange(dateRange: WeatherDateRange): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(dateRange.endDate + 'T00:00:00')
  const diffMs = end.getTime() - today.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays <= 16
}

async function fetchForecastRange(lat: number, lng: number, startDate: string, endDate: string): Promise<WeatherDay[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weathercode,relative_humidity_2m_min,wind_speed_10m_max&timezone=auto&start_date=${startDate}&end_date=${endDate}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`)

  const data = await res.json()
  const daily = data.daily

  return daily.time.map((date: string, i: number) => {
    const code = daily.weathercode[i]
    const wmo = getWmoInfo(code)
    const fwi = estimateFireWeatherIndex(
      daily.temperature_2m_max[i],
      daily.relative_humidity_2m_min?.[i] ?? null,
      daily.wind_speed_10m_max?.[i] ?? null,
      daily.precipitation_sum?.[i] ?? null,
    )
    return {
      date,
      tempMax: Math.round(daily.temperature_2m_max[i]),
      tempMin: Math.round(daily.temperature_2m_min[i]),
      precipProbability: daily.precipitation_probability_max[i],
      weatherCode: code,
      weatherDescription: wmo.description,
      dataSource: 'forecast' as const,
      fireWeatherIndex: fwi,
      fireDangerLevel: getFwiDangerLevel(fwi),
    }
  })
}

interface ArchiveDayData {
  date: string
  tempMax: number
  tempMin: number
  precipSum: number
  weatherCode: number
  humidityMin: number | null
  windMax: number | null
}

async function fetchArchiveYear(lat: number, lng: number, startDate: string, endDate: string): Promise<ArchiveDayData[]> {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,relative_humidity_2m_min,wind_speed_10m_max&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Archive API error: ${res.status}`)

  const data = await res.json()
  const daily = data.daily

  return daily.time.map((date: string, i: number) => ({
    date,
    tempMax: daily.temperature_2m_max[i],
    tempMin: daily.temperature_2m_min[i],
    precipSum: daily.precipitation_sum[i],
    weatherCode: daily.weather_code[i],
    humidityMin: daily.relative_humidity_2m_min?.[i] ?? null,
    windMax: daily.wind_speed_10m_max?.[i] ?? null,
  }))
}

function replaceYear(dateStr: string, year: number): string {
  return `${year}${dateStr.slice(4)}`
}

function getMonthDay(dateStr: string): string {
  return dateStr.slice(5) // "MM-DD"
}

function mode(arr: number[]): number {
  const counts = new Map<number, number>()
  for (const v of arr) {
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  let best = arr[0]
  let bestCount = 0
  for (const [val, count] of counts) {
    if (count > bestCount) {
      best = val
      bestCount = count
    }
  }
  return best
}

function averageHistoricalData(allYearsData: ArchiveDayData[][], dateRange: WeatherDateRange): WeatherDay[] {
  // Build a map of month-day → data across all years
  const byMonthDay = new Map<string, ArchiveDayData[]>()
  for (const yearData of allYearsData) {
    for (const day of yearData) {
      const md = getMonthDay(day.date)
      const existing = byMonthDay.get(md) ?? []
      existing.push(day)
      byMonthDay.set(md, existing)
    }
  }

  // Walk through each date in the requested range
  const result: WeatherDay[] = []
  const start = new Date(dateRange.startDate + 'T00:00:00')
  const end = new Date(dateRange.endDate + 'T00:00:00')

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = toISODate(d)
    const md = getMonthDay(dateStr)
    const entries = byMonthDay.get(md)

    if (!entries || entries.length === 0) continue

    const avgMax = Math.round(entries.reduce((s, e) => s + e.tempMax, 0) / entries.length)
    const avgMin = Math.round(entries.reduce((s, e) => s + e.tempMin, 0) / entries.length)
    const rainyYears = entries.filter((e) => e.precipSum > 0.5).length
    const precipProbability = Math.round((rainyYears / entries.length) * 100)
    const weatherCode = mode(entries.map((e) => e.weatherCode))
    const wmo = getWmoInfo(weatherCode)
    const avgPrecip = entries.reduce((s, e) => s + e.precipSum, 0) / entries.length
    const humidityEntries = entries.filter((e) => e.humidityMin != null)
    const avgHumidity = humidityEntries.length > 0
      ? humidityEntries.reduce((s, e) => s + e.humidityMin!, 0) / humidityEntries.length
      : null
    const windEntries = entries.filter((e) => e.windMax != null)
    const avgWind = windEntries.length > 0
      ? windEntries.reduce((s, e) => s + e.windMax!, 0) / windEntries.length
      : null
    const avgFwi = estimateFireWeatherIndex(avgMax, avgHumidity, avgWind, avgPrecip)

    result.push({
      date: dateStr,
      tempMax: avgMax,
      tempMin: avgMin,
      precipProbability,
      weatherCode,
      weatherDescription: wmo.description,
      dataSource: 'historical',
      fireWeatherIndex: avgFwi,
      fireDangerLevel: getFwiDangerLevel(avgFwi),
    })
  }

  return result
}

async function fetchHistoricalAverages(lat: number, lng: number, dateRange: WeatherDateRange): Promise<WeatherDay[]> {
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4, currentYear - 5]

  const requests = years.map((year) => {
    const start = replaceYear(dateRange.startDate, year)
    const end = replaceYear(dateRange.endDate, year)
    return fetchArchiveYear(lat, lng, start, end).catch((err) => {
      console.warn(`Failed to fetch archive for ${year}:`, err)
      return null
    })
  })

  const results = await Promise.all(requests)
  const validResults = results.filter((r): r is ArchiveDayData[] => r !== null)

  if (validResults.length === 0) {
    throw new Error('Unable to load historical weather data. Please try again later.')
  }

  return averageHistoricalData(validResults, dateRange)
}

export async function fetchWeather(lat: number, lng: number, dateRange?: WeatherDateRange): Promise<WeatherDay[]> {
  if (!dateRange) {
    // Default: next 7 days forecast (original behaviour)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weathercode,relative_humidity_2m_min,wind_speed_10m_max&timezone=auto&forecast_days=7`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`)

    const data = await res.json()
    const daily = data.daily

    return daily.time.map((date: string, i: number) => {
      const code = daily.weathercode[i]
      const wmo = getWmoInfo(code)
      const fwi = estimateFireWeatherIndex(
        daily.temperature_2m_max[i],
        daily.relative_humidity_2m_min?.[i] ?? null,
        daily.wind_speed_10m_max?.[i] ?? null,
        daily.precipitation_sum?.[i] ?? null,
      )
      return {
        date,
        tempMax: Math.round(daily.temperature_2m_max[i]),
        tempMin: Math.round(daily.temperature_2m_min[i]),
        precipProbability: daily.precipitation_probability_max[i],
        weatherCode: code,
        weatherDescription: wmo.description,
        dataSource: 'forecast' as const,
        fireWeatherIndex: fwi,
        fireDangerLevel: getFwiDangerLevel(fwi),
      }
    })
  }

  if (isWithinForecastRange(dateRange)) {
    return fetchForecastRange(lat, lng, dateRange.startDate, dateRange.endDate)
  }

  return fetchHistoricalAverages(lat, lng, dateRange)
}

export function generateAlerts(forecast: WeatherDay[]): WeatherAlert[] {
  const alerts: WeatherAlert[] = []
  const isHistorical = forecast.some((d) => d.dataSource === 'historical')
  const dayCount = forecast.length

  const coldDanger = forecast.filter((d) => d.tempMin <= -5)
  const coldWarning = forecast.filter((d) => d.tempMin > -5 && d.tempMin <= 2)
  const rainyDays = forecast.filter((d) => d.precipProbability >= 50)
  const snowDays = forecast.filter((d) =>
    [71, 73, 75, 77, 85, 86].includes(d.weatherCode)
  )
  const stormDays = forecast.filter((d) =>
    [95, 96, 99].includes(d.weatherCode)
  )
  const hotDays = forecast.filter((d) => d.tempMax >= 32)

  if (coldDanger.length > 0) {
    const lowest = Math.min(...coldDanger.map((d) => d.tempMin))
    alerts.push({
      type: 'cold',
      severity: 'danger',
      message: isHistorical
        ? `Historically extreme cold — overnight lows around ${lowest}°C. Pack a four-season sleeping bag and insulated layers.`
        : `Extreme cold expected — overnight lows dropping to ${lowest}°C. Pack a four-season sleeping bag and insulated layers.`,
    })
  } else if (coldWarning.length > 0) {
    const lowest = Math.min(...coldWarning.map((d) => d.tempMin))
    alerts.push({
      type: 'cold',
      severity: 'warning',
      message: isHistorical
        ? `Overnight lows historically around ${lowest}°C — pack warm layers and a three-season sleeping bag.`
        : `Overnight lows near ${lowest}°C — pack warm layers and a three-season sleeping bag.`,
    })
  }

  if (stormDays.length > 0) {
    alerts.push({
      type: 'storm',
      severity: 'danger',
      message: isHistorical
        ? `Thunderstorms are historically common during these dates. Avoid exposed ridges and have a plan for shelter.`
        : `Thunderstorms in the forecast. Avoid exposed ridges and have a plan for shelter.`,
    })
  }

  if (snowDays.length > 0) {
    alerts.push({
      type: 'snow',
      severity: 'warning',
      message: isHistorical
        ? `Snow historically common on ${snowDays.length} day${snowDays.length > 1 ? 's' : ''}. Roads may be affected — check conditions before heading out.`
        : `Snow expected on ${snowDays.length} day${snowDays.length > 1 ? 's' : ''}. Roads may be affected — check conditions before heading out.`,
    })
  }

  if (rainyDays.length > 0) {
    alerts.push({
      type: 'rain',
      severity: 'info',
      message: isHistorical
        ? `Rain historically likely on ${rainyDays.length} of ${dayCount} days. Bring waterproof layers and a tarp for your campsite.`
        : `Rain likely on ${rainyDays.length} of ${dayCount} days. Bring waterproof layers and a tarp for your campsite.`,
    })
  }

  if (hotDays.length > 0) {
    const highest = Math.max(...hotDays.map((d) => d.tempMax))
    alerts.push({
      type: 'heat',
      severity: 'warning',
      message: isHistorical
        ? `Historically high temperatures around ${highest}°C. Stay hydrated, seek shade midday, and store food carefully.`
        : `High of ${highest}°C expected. Stay hydrated, seek shade midday, and store food carefully.`,
    })
  }

  // Fire danger alerts
  const peakFwi = Math.max(...forecast.map((d) => d.fireWeatherIndex ?? 0))
  const peakFireLevel = getFwiDangerLevel(peakFwi)

  if (peakFireLevel === 'extreme') {
    alerts.push({
      type: 'fire',
      severity: 'danger',
      message: isHistorical
        ? `Historically extreme fire danger during these dates — campfire bans are highly likely. Bring a camp stove for cooking and avoid all open flames.`
        : `Extreme fire danger — campfire bans are highly likely. Bring a camp stove for cooking and avoid all open flames.`,
    })
  } else if (peakFireLevel === 'high' || peakFireLevel === 'very_high') {
    alerts.push({
      type: 'fire',
      severity: 'warning',
      message: isHistorical
        ? `Historically elevated fire danger — campfire restrictions may apply. Check with park staff before lighting fires and never leave a fire unattended.`
        : `Fire danger is elevated — campfire restrictions may be in effect. Check with park staff before lighting fires and never leave a fire unattended.`,
    })
  }

  return alerts
}
