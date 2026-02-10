import { Info } from 'lucide-react'
import type { WeatherDay } from '../lib/types'

interface WeatherSourceBannerProps {
  forecast: WeatherDay[]
}

export default function WeatherSourceBanner({ forecast }: WeatherSourceBannerProps) {
  if (forecast.length === 0) return null

  const isHistorical = forecast.some((d) => d.dataSource === 'historical')

  if (isHistorical) {
    return (
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-brown/10 border border-brown/20">
        <Info className="w-5 h-5 text-brown mt-0.5 shrink-0" />
        <p className="text-sm text-brown-dark leading-relaxed">
          Based on historical averages (2021–2025). Actual conditions may vary.
        </p>
      </div>
    )
  }

  return (
    <p className="mt-3 text-xs text-charcoal-light/60 flex items-center gap-1.5">
      <Info className="w-3.5 h-3.5" />
      Live forecast from Open-Meteo
    </p>
  )
}
