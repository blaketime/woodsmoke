import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, MapPin, Calendar, ExternalLink, Tent, TreePine, Mountain } from 'lucide-react'
import type { Park, Amenity } from '../lib/types'
import { fetchWeather, getWmoInfo } from '../lib/weather'
import type { WeatherDay } from '../lib/types'
import WeatherIcon from './WeatherIcon'
import Skeleton from './Skeleton'
import { formatDistance } from '../lib/geolocation'

const AMENITY_LABELS: Record<Amenity, string> = {
  fire_pit: 'Fire Pits',
  potable_water: 'Potable Water',
  flush_toilets: 'Flush Toilets',
  vault_toilets: 'Vault Toilets',
  showers: 'Showers',
  swimming: 'Swimming',
  trails: 'Trails',
  boat_launch: 'Boat Launch',
  bear_locker: 'Bear Lockers',
  electricity: 'Electricity',
  wheelchair_accessible: 'Accessible',
  playground: 'Playground',
  laundry: 'Laundry',
  dump_station: 'Dump Station',
}

interface ParkPanelProps {
  park: Park
  onClose: () => void
  distance?: number
}

export default function ParkPanel({ park, onClose, distance }: ParkPanelProps) {
  const navigate = useNavigate()
  const isNational = park.type === 'national'
  const totalSites = park.campgrounds.reduce((sum, cg) => sum + cg.sites, 0)
  const hasBearCountry = park.campgrounds.some((cg) => cg.bearCountry)

  const [todayWeather, setTodayWeather] = useState<WeatherDay | null>(null)
  const [weatherLoaded, setWeatherLoaded] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    setImageLoaded(false)
  }, [park.imageUrl])

  const imgRef = useCallback((node: HTMLImageElement | null) => {
    if (node && node.complete && node.naturalWidth > 0) {
      setImageLoaded(true)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setTodayWeather(null)
    setWeatherLoaded(false)
    fetchWeather(park.lat, park.lng)
      .then((data) => {
        if (!cancelled && data.length > 0) setTodayWeather(data[0])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setWeatherLoaded(true)
      })
    return () => { cancelled = true }
  }, [park.lat, park.lng])

  return (
    <div className="absolute z-20 bg-cream/95 dark:bg-dark-bg/95 backdrop-blur-md shadow-2xl overflow-y-auto bottom-0 left-0 right-0 max-h-[60vh] rounded-t-2xl border-t border-cream-dark dark:border-dark-border animate-slide-up sm:top-0 sm:right-0 sm:left-auto sm:bottom-0 sm:max-h-none sm:w-full sm:max-w-sm sm:rounded-t-none sm:border-t-0 sm:border-l sm:animate-slide-in">
      {/* Mobile drag handle */}
      <div className="flex justify-center pt-2 pb-1 sm:hidden">
        <div className="w-10 h-1 rounded-full bg-charcoal/20 dark:bg-cream/20" />
      </div>

      {/* Hero thumbnail */}
      {park.imageUrl && (
        <div className="h-32 overflow-hidden relative">
          {!imageLoaded && <Skeleton className="absolute inset-0 rounded-none" />}
          <img
            ref={imgRef}
            src={park.imageUrl}
            alt={park.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 bg-cream/95 dark:bg-dark-bg/95 backdrop-blur-md border-b border-cream-dark dark:border-dark-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${
                  isNational ? 'bg-sage' : 'bg-brown'
                }`}
              >
                {isNational ? <Mountain className="w-3 h-3" /> : <TreePine className="w-3 h-3" />}
                {park.type}
              </span>
              {hasBearCountry && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rust/10 text-rust">
                  Bear Country
                </span>
              )}
            </div>
            <h2 className="font-display text-xl text-charcoal dark:text-cream leading-tight">{park.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-cream-dark dark:hover:bg-dark-border transition-colors text-charcoal-light dark:text-dark-text-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Location & Season */}
        <div className="flex items-center gap-4 text-sm text-charcoal-light dark:text-dark-text-secondary">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {park.province}
          </span>
          {distance !== undefined && (
            <span className="flex items-center gap-1 text-rust">
              {formatDistance(distance)} away
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatSeason(park.season.open)} – {formatSeason(park.season.close)}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-charcoal dark:text-cream leading-relaxed">{park.description}</p>

        {/* Today's Weather */}
        {!weatherLoaded ? (
          <div className="bg-white/60 dark:bg-dark-surface/60 rounded-xl px-3 py-2 flex items-center gap-3">
            <Skeleton className="w-5 h-5 rounded-full shrink-0" />
            <Skeleton className="w-10 h-3" />
            <Skeleton className="flex-1 h-3" />
            <Skeleton className="w-16 h-3" />
          </div>
        ) : todayWeather ? (
          <div className="bg-white/60 dark:bg-dark-surface/60 rounded-xl px-3 py-2 flex items-center gap-3">
            <WeatherIcon
              iconName={getWmoInfo(todayWeather.weatherCode).icon}
              className="w-5 h-5 text-sage shrink-0"
            />
            <span className="text-xs font-medium text-charcoal dark:text-cream">Today</span>
            <span className="text-xs text-charcoal-light dark:text-dark-text-secondary flex-1 truncate">
              {todayWeather.weatherDescription}
            </span>
            <span className="text-xs font-medium text-charcoal dark:text-cream whitespace-nowrap">
              {todayWeather.tempMax}° / {todayWeather.tempMin}°
            </span>
          </div>
        ) : null}

        {/* Campgrounds */}
        {park.campgrounds.length > 0 && (
          <div>
            <h3 className="font-display text-base text-charcoal mb-3 flex items-center gap-2">
              <Tent className="w-4 h-4 text-sage" />
              Campgrounds
              <span className="text-xs font-body text-charcoal-light">({totalSites} total sites)</span>
            </h3>
            <div className="space-y-3">
              {park.campgrounds.map((cg) => (
                <div key={cg.name} className="bg-white/60 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-charcoal">{cg.name}</span>
                    <span className="text-xs text-charcoal-light">{cg.sites} sites</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cg.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="px-2 py-0.5 rounded-full bg-sage/10 text-sage-dark text-[11px] font-medium"
                      >
                        {AMENITY_LABELS[amenity]}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              sessionStorage.setItem('woodsmoke:lastParkId', park.id)
              navigate(`/park/${park.id}`)
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rust text-white rounded-xl font-medium text-sm hover:bg-rust-dark transition-colors"
          >
            View Details
          </button>
          <a
            href={park.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-cream-dark text-charcoal rounded-xl font-medium text-sm hover:bg-cream-dark transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Book
          </a>
        </div>
      </div>
    </div>
  )
}

function formatSeason(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}
