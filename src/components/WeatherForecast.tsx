import { Droplets } from 'lucide-react'
import type { WeatherDay, FireDangerLevel } from '../lib/types'
import { getWmoInfo } from '../lib/weather'
import WeatherIcon from './WeatherIcon'
import Skeleton from './Skeleton'

export const FIRE_DOT_COLOUR: Record<FireDangerLevel, string> = {
  low: 'bg-sage',
  moderate: 'bg-amber-500',
  high: 'bg-orange-500',
  very_high: 'bg-rust',
  extreme: 'bg-red-800',
}

export const FIRE_DOT_LABEL: Record<FireDangerLevel, string> = {
  low: 'Low fire danger',
  moderate: 'Moderate fire danger',
  high: 'High fire danger',
  very_high: 'Very high fire danger',
  extreme: 'Extreme fire danger',
}

interface WeatherForecastProps {
  forecast: WeatherDay[] | null
  isLoading: boolean
  error: string | null
  compact?: boolean
}

function dayLabel(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr + 'T00:00:00')
  const diffMs = date.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays >= 2 && diffDays <= 6) {
    return date.toLocaleDateString('en-CA', { weekday: 'short' })
  }
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

export default function WeatherForecast({ forecast, isLoading, error, compact }: WeatherForecastProps) {
  const gridCls = compact
    ? 'grid grid-cols-4 gap-2'
    : 'flex gap-2 overflow-x-auto scrollbar-hide pb-2 sm:grid sm:grid-cols-7 sm:overflow-visible sm:pb-0'
  const cardBase = compact
    ? 'rounded-xl p-3 flex flex-col items-center gap-1.5'
    : 'rounded-xl p-3 flex flex-col items-center gap-1.5 min-w-[100px] sm:min-w-0 shrink-0 sm:shrink'

  if (isLoading) {
    return (
      <div className={gridCls}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className={`bg-white/60 dark:bg-dark-surface/60 ${cardBase}`}>
            <Skeleton className="w-10 h-3" />
            <Skeleton className="w-7 h-7 rounded-full" />
            <Skeleton className="w-14 h-3" />
            <Skeleton className="w-12 h-4" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-rust/10 border border-rust/20 rounded-xl px-4 py-3 text-sm text-rust-dark">
        {error}
      </div>
    )
  }

  if (!forecast) return null

  return (
    <div className={gridCls}>
      {forecast.map((day) => {
        const wmo = getWmoInfo(day.weatherCode)
        const iconColour = wmo.severity === 'severe' ? 'text-rust' : 'text-sage'
        const isHistorical = day.dataSource === 'historical'
        const cardBg = isHistorical
          ? 'bg-brown/5 border border-brown/20'
          : 'bg-white/60 dark:bg-dark-surface/60'

        return (
          <div
            key={day.date}
            className={`${cardBg} ${cardBase}`}
          >
            <span className="text-xs font-medium text-charcoal dark:text-cream truncate w-full text-center">
              {dayLabel(day.date)}
            </span>
            <WeatherIcon iconName={wmo.icon} className={`w-7 h-7 ${iconColour}`} />
            <span className="text-[11px] text-charcoal-light dark:text-dark-text-secondary text-center leading-tight">
              {day.weatherDescription}
            </span>
            <div className="text-sm font-medium text-charcoal dark:text-cream">
              {day.tempMax}° <span className="text-charcoal-light dark:text-dark-text-secondary font-normal">/ {day.tempMin}°</span>
            </div>
            {day.precipProbability > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-sage-dark">
                <Droplets className="w-3 h-3" />
                {day.precipProbability}%
              </div>
            )}
            {isHistorical && (
              <span className="text-[10px] text-brown-light font-medium uppercase tracking-wide">avg</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
