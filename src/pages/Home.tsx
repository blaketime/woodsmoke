import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, SlidersHorizontal, X, MapPin } from 'lucide-react'
import ParkMap from '../components/Map/ParkMap'
import ParkPanel from '../components/ParkPanel'
import FilterBar from '../components/FilterBar'
import parks from '../data/parks.json'
import type { Park, Province, Amenity } from '../lib/types'
import { getUserLocation, getDistance, type UserLocation } from '../lib/geolocation'

const typedParks = parks as Park[]

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPark, setSelectedPark] = useState<Park | null>(() => {
    const savedId = sessionStorage.getItem('woodsmoke:lastParkId')
    if (savedId) return typedParks.find((p) => p.id === savedId) ?? null
    return null
  })
  const [parkType, setParkType] = useState<'all' | 'national' | 'provincial'>('all')
  const [province, setProvince] = useState<Province | 'all'>('all')
  const [requiredAmenities, setRequiredAmenities] = useState<Amenity[]>([])
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [nearbyOnly, setNearbyOnly] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getUserLocation().then(setUserLocation)
  }, [])

  useEffect(() => {
    if (filtersOpen) {
      const timer = setTimeout(() => setFiltersExpanded(true), 300)
      return () => clearTimeout(timer)
    } else {
      setFiltersExpanded(false)
    }
  }, [filtersOpen])

  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 150)
      return () => clearTimeout(timer)
    }
  }, [searchOpen])

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
  }

  const selectParkFromSearch = (park: Park) => {
    setSelectedPark(park)
    closeSearch()
  }

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return typedParks
      .filter((p) => p.name.toLowerCase().includes(q) || p.province.toLowerCase().includes(q))
      .slice(0, 8)
  }, [searchQuery])

  const hasActiveFilters =
    parkType !== 'all' || province !== 'all' || requiredAmenities.length > 0 || nearbyOnly

  const distanceLookup = useMemo(() => {
    if (!userLocation) return {} as Record<string, number>
    const lookup: Record<string, number> = {}
    for (const p of typedParks) {
      lookup[p.id] = getDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
    }
    return lookup
  }, [userLocation])

  const filteredParks = useMemo(() => {
    return typedParks.filter((p) => {
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !p.province.toLowerCase().includes(q))
          return false
      }
      // Park type
      if (parkType !== 'all' && p.type !== parkType) return false
      // Province
      if (province !== 'all' && p.province !== province) return false
      // Nearby — within 500 km
      if (nearbyOnly && userLocation) {
        if ((distanceLookup[p.id] ?? Infinity) > 500) return false
      }
      // Amenities — park must have at least one campground with ALL required amenities
      if (requiredAmenities.length > 0) {
        const hasAll = p.campgrounds.some((cg) =>
          requiredAmenities.every((a) => cg.amenities.includes(a))
        )
        if (!hasAll) return false
      }
      return true
    })
  }, [searchQuery, parkType, province, requiredAmenities, nearbyOnly, userLocation, distanceLookup])

  const clearAllFilters = () => {
    setParkType('all')
    setProvince('all')
    setRequiredAmenities([])
    setNearbyOnly(false)
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* Header */}
      <header className={`absolute top-0 left-0 right-0 z-10 py-4 pl-4 pr-4 pointer-events-none transition-[padding] duration-500 ease-in-out ${
        selectedPark ? 'sm:pr-[26rem]' : ''
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="pointer-events-auto bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm">
            <h1 className="font-display text-xl text-charcoal">Woodsmoke</h1>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Collapsible filters — pills expand inline to the left of the icon */}
            <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-xl shadow-sm">
              <div
                className={`transition-[max-width,opacity,height] duration-300 ease-in-out ${
                  filtersOpen ? 'max-w-[600px] opacity-100 h-9' : 'max-w-0 h-0 opacity-0'
                } ${filtersExpanded ? 'overflow-visible' : 'overflow-hidden'}`}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 whitespace-nowrap">
                  <FilterBar
                    parkType={parkType}
                    onParkTypeChange={setParkType}
                    province={province}
                    onProvinceChange={setProvince}
                    requiredAmenities={requiredAmenities}
                    onRequiredAmenitiesChange={setRequiredAmenities}
                    onClearAll={clearAllFilters}
                    nearbyOnly={nearbyOnly}
                    onNearbyOnlyChange={setNearbyOnly}
                    hasUserLocation={userLocation !== null}
                  />
                  {hasActiveFilters && (
                    <span className="text-xs text-charcoal-light bg-cream/60 px-2 py-0.5 rounded-full shrink-0">
                      {filteredParks.length}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`relative p-2.5 transition-colors shrink-0 ${
                  filtersOpen || hasActiveFilters
                    ? 'text-sage'
                    : 'text-charcoal-light hover:text-charcoal'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {hasActiveFilters && !filtersOpen && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-sage opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sage" />
                  </span>
                )}
              </button>
            </div>

            {/* Collapsible search */}
            <div className="relative">
              <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-xl shadow-sm">
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    searchOpen ? 'w-40 sm:w-56' : 'w-0'
                  }`}
                >
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search parks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && closeSearch()}
                    className="w-full pl-3 pr-1 py-2 text-xs text-charcoal placeholder:text-charcoal-light/50 focus:outline-none bg-transparent font-body"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
                  className="p-2.5 text-charcoal-light hover:text-charcoal transition-colors shrink-0"
                >
                  {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                </button>
              </div>

              {/* Search results dropdown */}
              {searchOpen && searchResults.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-cream-dark/30 py-1 max-h-80 overflow-y-auto z-50">
                  {searchResults.map((park) => (
                    <button
                      key={park.id}
                      type="button"
                      onClick={() => selectParkFromSearch(park)}
                      className="w-full text-left px-3 py-2.5 hover:bg-cream/80 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${park.type === 'national' ? 'text-sage' : 'text-brown'}`} />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-charcoal truncate">{park.name}</div>
                        <div className="text-[10px] text-charcoal-light/70">{park.province}</div>
                      </div>
                      <span className={`ml-auto text-[9px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0 ${
                        park.type === 'national'
                          ? 'bg-sage/10 text-sage'
                          : 'bg-brown/10 text-brown'
                      }`}>
                        {park.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1">
        <ParkMap
          parks={filteredParks}
          selectedPark={selectedPark}
          onSelectPark={setSelectedPark}
          onDeselectPark={() => {
            setSelectedPark(null)
            sessionStorage.removeItem('woodsmoke:lastParkId')
          }}
          userLocation={userLocation}
          distanceLookup={distanceLookup}
        />
      </div>

      {/* Park Panel */}
      {selectedPark && (
        <ParkPanel
          park={selectedPark}
          onClose={() => {
            setSelectedPark(null)
            sessionStorage.removeItem('woodsmoke:lastParkId')
          }}
          distance={distanceLookup[selectedPark.id]}
        />
      )}
    </div>
  )
}
