import {
  Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain,
  CloudHail, CloudSnow, Snowflake, CloudRainWind, CloudLightning,
  type LucideProps,
} from 'lucide-react'
import type { FC } from 'react'

const ICON_MAP: Record<string, FC<LucideProps>> = {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudHail,
  CloudSnow,
  Snowflake,
  CloudSunRain: CloudRain,
  CloudRainWind,
  CloudLightning,
}

interface WeatherIconProps {
  iconName: string
  className?: string
}

export default function WeatherIcon({ iconName, className }: WeatherIconProps) {
  const Icon = ICON_MAP[iconName] ?? Cloud
  return <Icon className={className} />
}
