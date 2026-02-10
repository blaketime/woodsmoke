import { Thermometer, CloudRain, Snowflake, CloudLightning, ThermometerSun } from 'lucide-react'
import type { WeatherAlert } from '../lib/weather'
import type { FC } from 'react'
import type { LucideProps } from 'lucide-react'

const ALERT_ICON: Record<string, FC<LucideProps>> = {
  cold: Thermometer,
  rain: CloudRain,
  snow: Snowflake,
  storm: CloudLightning,
  heat: ThermometerSun,
}

const SEVERITY_STYLES: Record<string, string> = {
  info: 'bg-sage/10 border-sage/30 text-sage-dark',
  warning: 'bg-rust/10 border-rust/30 text-rust-dark',
  danger: 'bg-rust/20 border-rust/50 text-rust-dark',
}

interface WeatherAlertsProps {
  alerts: WeatherAlert[]
}

export default function WeatherAlerts({ alerts }: WeatherAlertsProps) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const Icon = ALERT_ICON[alert.type] ?? CloudRain
        return (
          <div
            key={alert.type}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${SEVERITY_STYLES[alert.severity]}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">{alert.message}</p>
          </div>
        )
      })}
    </div>
  )
}
