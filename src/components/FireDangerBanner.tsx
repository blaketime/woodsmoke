import { Flame } from 'lucide-react'
import type { WeatherDay, FireDangerLevel } from '../lib/types'

interface FireDangerBannerProps {
  forecast: WeatherDay[]
}

const LEVEL_CONFIG: Record<FireDangerLevel, { label: string; colour: string; bg: string; border: string; message: string }> = {
  low: {
    label: 'Low',
    colour: 'text-sage',
    bg: 'bg-sage/10',
    border: 'border-sage/20',
    message: 'Campfires likely permitted',
  },
  moderate: {
    label: 'Moderate',
    colour: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    message: 'Campfires likely permitted — stay cautious',
  },
  high: {
    label: 'High',
    colour: 'text-orange-600',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    message: 'Campfire restrictions may be in effect',
  },
  very_high: {
    label: 'Very High',
    colour: 'text-rust',
    bg: 'bg-rust/10',
    border: 'border-rust/20',
    message: 'Campfire bans likely — check with park staff',
  },
  extreme: {
    label: 'Extreme',
    colour: 'text-red-800',
    bg: 'bg-red-800/10',
    border: 'border-red-800/20',
    message: 'Campfire bans highly likely — bring a stove',
  },
}

function getPeakDangerLevel(forecast: WeatherDay[]): FireDangerLevel {
  const levels: FireDangerLevel[] = ['low', 'moderate', 'high', 'very_high', 'extreme']
  let peak: FireDangerLevel = 'low'
  for (const day of forecast) {
    if (levels.indexOf(day.fireDangerLevel) > levels.indexOf(peak)) {
      peak = day.fireDangerLevel
    }
  }
  return peak
}

export default function FireDangerBanner({ forecast }: FireDangerBannerProps) {
  if (forecast.length === 0) return null

  const level = getPeakDangerLevel(forecast)
  const config = LEVEL_CONFIG[level]

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl ${config.bg} border ${config.border}`}>
      <Flame className={`w-5 h-5 ${config.colour} shrink-0 mt-0.5`} />
      <p className="text-sm text-charcoal dark:text-cream leading-relaxed">
        Fire Danger: <span className={`font-semibold ${config.colour}`}>{config.label}</span>
        <span className="text-charcoal-light dark:text-dark-text-secondary"> — {config.message}</span>
      </p>
    </div>
  )
}
