import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, MapPin, Calendar, CloudSun, Tent,
  ExternalLink, Mountain, TreePine, Compass, Backpack,
} from 'lucide-react'
import parks from '../data/parks.json'
import type { Park, Amenity, Activity, WeatherDateRange, PackingItem } from '../lib/types'
import { fetchWeather, generateAlerts, type WeatherAlert } from '../lib/weather'
import { generatePackingList } from '../lib/packing'
import type { WeatherDay } from '../lib/types'
import WeatherForecast from '../components/WeatherForecast'
import WeatherAlerts from '../components/WeatherAlerts'
import DateRangePicker from '../components/DateRangePicker'
import WeatherSourceBanner from '../components/WeatherSourceBanner'
import FireDangerBanner from '../components/FireDangerBanner'
import PackingList from '../components/PackingList'
import Skeleton from '../components/Skeleton'
import ThemeToggle from '../components/ThemeToggle'

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

const ACTIVITY_LABELS: Record<Activity, string> = {
  hiking: 'Hiking',
  canoeing: 'Canoeing',
  kayaking: 'Kayaking',
  fishing: 'Fishing',
  swimming: 'Swimming',
  wildlife_viewing: 'Wildlife Viewing',
  cycling: 'Cycling',
  rock_climbing: 'Rock Climbing',
  cross_country_skiing: 'Cross-Country Skiing',
  snowshoeing: 'Snowshoeing',
  surfing: 'Surfing',
  scuba_diving: 'Scuba Diving',
  stargazing: 'Stargazing',
  photography: 'Photography',
}

function formatSeason(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

export default function ParkDetail() {
  const { id } = useParams<{ id: string }>()
  const park = (parks as Park[]).find((p) => p.id === id)

  const [forecast, setForecast] = useState<WeatherDay[] | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<WeatherAlert[]>([])
  const [dateRange, setDateRange] = useState<WeatherDateRange | null>(null)
  const [packingList, setPackingList] = useState<PackingItem[]>([])
  const [selectedCampground, setSelectedCampground] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)

  const imgRef = useCallback((node: HTMLImageElement | null) => {
    if (node && node.complete && node.naturalWidth > 0) {
      setImageLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!park) return
    let cancelled = false

    setWeatherLoading(true)
    setWeatherError(null)

    fetchWeather(park.lat, park.lng, dateRange ?? undefined)
      .then((data) => {
        if (cancelled) return
        setForecast(data)
        setAlerts(generateAlerts(data))
      })
      .catch((err) => {
        if (cancelled) return
        setWeatherError(err instanceof Error ? err.message : 'Failed to load forecast')
      })
      .finally(() => {
        if (!cancelled) setWeatherLoading(false)
      })

    return () => { cancelled = true }
  }, [park, dateRange])

  useEffect(() => {
    if (!park || !forecast) return
    setPackingList(generatePackingList(park, forecast, selectedCampground))
  }, [park, forecast, selectedCampground])

  const handlePackingToggle = (id: string) => {
    setPackingList(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ))
  }

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (!park) {
    return (
      <div className="min-h-full bg-cream dark:bg-dark-bg">
        <header className="border-b border-cream-dark dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-4">
            <Link to="/" className="text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-cream transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-display text-lg text-charcoal dark:text-cream">Woodsmoke</span>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl text-charcoal dark:text-cream mb-4">Park not found</h1>
          <p className="text-charcoal-light dark:text-dark-text-secondary mb-6">
            We couldn't find a park with that ID. It may have been removed or the URL is incorrect.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rust text-white rounded-xl font-medium text-sm hover:bg-rust-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </Link>
        </main>
      </div>
    )
  }

  const isNational = park.type === 'national'
  const totalSites = park.campgrounds.reduce((sum, cg) => sum + cg.sites, 0)
  const cg = park.campgrounds[selectedCampground]

  return (
    <div className="min-h-full bg-cream dark:bg-dark-bg">
      {/* Header */}
      <header className="border-b border-cream-dark dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-4">
          <Link to="/" className="text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-cream transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-display text-lg text-charcoal dark:text-cream">Woodsmoke</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 lg:h-[calc(100vh-49px)] lg:overflow-hidden">
        <div className="lg:grid lg:grid-cols-5 lg:gap-12 pt-6 lg:pt-8 lg:h-full">

          {/* ─── Left Column: Park Identity ─── */}
          <div className="lg:col-span-3 space-y-6 lg:overflow-y-auto lg:pb-8">

            {/* Hero image with overlaid info */}
            {park.imageUrl ? (
              <div className="relative -mx-4 lg:mx-0 h-[45vh] lg:h-[50vh] lg:rounded-2xl overflow-hidden">
                {!imageLoaded && <Skeleton className="absolute inset-0 rounded-none" />}
                <img
                  ref={imgRef}
                  src={park.imageUrl}
                  alt={park.name}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white/90 backdrop-blur-sm ${
                      isNational ? 'bg-sage/70' : 'bg-brown/70'
                    }`}
                  >
                    {isNational ? <Mountain className="w-3 h-3" /> : <TreePine className="w-3 h-3" />}
                    {park.type}
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl text-white mt-2 drop-shadow-lg">
                    {park.name}
                  </h1>
                  <div className="flex items-center gap-3 mt-2 text-sm text-white/80">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {park.province}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative -mx-4 lg:mx-0 h-[30vh] lg:rounded-2xl overflow-hidden bg-gradient-to-br from-sage/20 to-brown/15">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white backdrop-blur-sm ${
                      isNational ? 'bg-sage/80' : 'bg-brown/80'
                    }`}
                  >
                    {isNational ? <Mountain className="w-3 h-3" /> : <TreePine className="w-3 h-3" />}
                    {park.type}
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl text-charcoal mt-2">
                    {park.name}
                  </h1>
                  <div className="flex items-center gap-3 mt-2 text-sm text-charcoal-light">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {park.province}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Description — unwrapped editorial text */}
            <div>
              <p className="text-charcoal dark:text-cream leading-relaxed text-[15px]">{park.description}</p>
              <p className="text-sm text-charcoal-light dark:text-dark-text-secondary mt-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Open {formatSeason(park.season.open)} – {formatSeason(park.season.close)}
              </p>
            </div>

            {/* Activities — inline pills, no card */}
            {park.activities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {park.activities.map((activity) => (
                  <span
                    key={activity}
                    className="px-3 py-1.5 rounded-full bg-sage/10 dark:bg-sage/20 text-sage-dark dark:text-sage-light text-sm font-medium"
                  >
                    {ACTIVITY_LABELS[activity]}
                  </span>
                ))}
              </div>
            )}

            {/* Booking CTA */}
            <a
              href={park.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-rust text-white rounded-xl font-medium hover:bg-rust-dark transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              Book a Campsite
            </a>
          </div>

          {/* ─── Right Column: Planning Toolkit ─── */}
          <aside className="mt-10 lg:mt-0 lg:col-span-2 lg:overflow-y-auto lg:pl-8 lg:border-l lg:border-sage/15 dark:lg:border-sage/25">
            <div className="space-y-6 lg:pb-6">

              {/* Mobile section heading */}
              <h2 className="font-display text-xl text-charcoal dark:text-cream lg:hidden flex items-center gap-2 border-t border-sage/15 dark:border-sage/25 pt-6">
                <Compass className="w-5 h-5 text-sage" />
                Plan Your Trip
              </h2>

              {/* Weather */}
              <div id="weather-section" className="scroll-mt-16">
                <h3 className="text-sm font-medium text-charcoal-light dark:text-dark-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
                  <CloudSun className="w-4 h-4 text-sage" />
                  Weather
                </h3>
                <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
                {forecast && forecast.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <FireDangerBanner forecast={forecast} />
                    <WeatherAlerts alerts={alerts} />
                  </div>
                )}
                <WeatherForecast forecast={forecast} isLoading={weatherLoading} error={weatherError} compact />
                {forecast && forecast.length > 0 && <WeatherSourceBanner forecast={forecast} />}
              </div>

              {/* Campgrounds */}
              {park.campgrounds.length > 0 && (
                <div id="campground-section" className="scroll-mt-16">
                  <h3 className="text-sm font-medium text-charcoal-light dark:text-dark-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Tent className="w-4 h-4 text-sage" />
                    Campground
                    <span className="normal-case tracking-normal text-charcoal-light/60 dark:text-dark-text-secondary/60">
                      ({totalSites} sites)
                    </span>
                  </h3>

                  {/* Selector: segmented for ≤3, dropdown for 4+ */}
                  {park.campgrounds.length === 1 ? (
                    <p className="text-sm font-medium text-charcoal dark:text-cream">{park.campgrounds[0].name}</p>
                  ) : park.campgrounds.length <= 3 ? (
                    <div className="flex rounded-xl bg-cream-dark/50 dark:bg-dark-border/50 p-1">
                      {park.campgrounds.map((campground, i) => (
                        <button
                          key={campground.name}
                          type="button"
                          onClick={() => setSelectedCampground(i)}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all truncate cursor-pointer ${
                            i === selectedCampground
                              ? 'bg-white dark:bg-dark-border text-charcoal dark:text-cream shadow-sm'
                              : 'text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-cream hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          {campground.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <select
                      value={selectedCampground}
                      onChange={(e) => setSelectedCampground(Number(e.target.value))}
                      className="w-full rounded-xl border border-cream-dark dark:border-dark-border bg-white dark:bg-dark-surface px-3 py-2 text-sm text-charcoal dark:text-cream"
                    >
                      {park.campgrounds.map((campground, i) => (
                        <option key={campground.name} value={i}>{campground.name}</option>
                      ))}
                    </select>
                  )}

                  {/* Selected campground details */}
                  {cg && (
                    <div className="mt-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-charcoal-light dark:text-dark-text-secondary">
                        <span>{cg.sites} sites</span>
                        <span className="w-1 h-1 rounded-full bg-charcoal-light/30" />
                        <span className="capitalize">{cg.terrain} terrain</span>
                        {cg.bearCountry && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-charcoal-light/30" />
                            <span className="text-rust font-medium">Bear Country</span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cg.amenities.map((amenity) => (
                          <span
                            key={amenity}
                            className="px-2 py-0.5 rounded-full bg-sage/10 dark:bg-sage/20 text-sage-dark dark:text-sage-light text-[10px] font-medium"
                          >
                            {AMENITY_LABELS[amenity]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Packing List */}
              <div id="packing-section" className="scroll-mt-16">
                {weatherLoading ? (
                  <>
                    <h3 className="text-sm font-medium text-charcoal-light dark:text-dark-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Backpack className="w-4 h-4 text-sage" />
                      Packing List
                    </h3>
                    <div className="space-y-3">
                      <Skeleton className="h-2 w-full rounded-full" />
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Skeleton className="w-4 h-4 rounded" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      ))}
                    </div>
                  </>
                ) : packingList.length > 0 ? (
                  <>
                    <h3 className="text-sm font-medium text-charcoal-light dark:text-dark-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Backpack className="w-4 h-4 text-sage" />
                      Packing List
                    </h3>
                    <PackingList items={packingList} onToggle={handlePackingToggle} />
                  </>
                ) : null}
              </div>

            </div>
          </aside>

        </div>
      </main>

      {/* Mobile sticky tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm border-t border-cream-dark dark:border-dark-border z-20">
        <div className="flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => scrollToSection('weather-section')}
            className="flex flex-col items-center gap-0.5 text-charcoal-light dark:text-dark-text-secondary hover:text-sage dark:hover:text-sage transition-colors px-4 py-1"
          >
            <CloudSun className="w-5 h-5" />
            <span className="text-[10px] font-medium">Weather</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('campground-section')}
            className="flex flex-col items-center gap-0.5 text-charcoal-light dark:text-dark-text-secondary hover:text-sage dark:hover:text-sage transition-colors px-4 py-1"
          >
            <Tent className="w-5 h-5" />
            <span className="text-[10px] font-medium">Camp</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('packing-section')}
            className="flex flex-col items-center gap-0.5 text-charcoal-light dark:text-dark-text-secondary hover:text-sage dark:hover:text-sage transition-colors px-4 py-1"
          >
            <Backpack className="w-5 h-5" />
            <span className="text-[10px] font-medium">Packing</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
