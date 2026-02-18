import { useRef, useState, useEffect, useCallback, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, ChevronUp, MapPin, Navigation } from 'lucide-react'
import type { Park, Province, Amenity } from '../lib/types'

const PROVINCES: Province[] = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Northwest Territories',
  'Nova Scotia',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Yukon',
]

const AMENITIES: { value: Amenity; label: string }[] = [
  { value: 'fire_pit', label: 'Fire Pits' },
  { value: 'potable_water', label: 'Potable Water' },
  { value: 'flush_toilets', label: 'Flush Toilets' },
  { value: 'vault_toilets', label: 'Vault Toilets' },
  { value: 'showers', label: 'Showers' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'trails', label: 'Trails' },
  { value: 'boat_launch', label: 'Boat Launch' },
  { value: 'bear_locker', label: 'Bear Lockers' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'playground', label: 'Playground' },
  { value: 'dump_station', label: 'Dump Station' },
]

/* ── Animate mount/unmount with enter/exit transition ── */
function useAnimatedOpen(open: boolean, durationMs = 150) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const timer = setTimeout(() => setMounted(false), durationMs)
      return () => clearTimeout(timer)
    }
  }, [open, durationMs])

  return { mounted, visible }
}

/* ── Position a portal dropdown ABOVE its trigger ── */
function useDropdownPositionUp(
  triggerRef: React.RefObject<HTMLElement | null>,
  open: boolean,
) {
  const [style, setStyle] = useState<CSSProperties>({})

  useEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setStyle({
      position: 'fixed',
      bottom: window.innerHeight - rect.top + 8,
      left: Math.max(8, rect.left),
    })
  }, [open, triggerRef])

  return style
}

interface MobileToolbarProps {
  visible: boolean
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  searchResults: Park[]
  onSelectPark: (park: Park) => void
  province: Province | 'all'
  onProvinceChange: (province: Province | 'all') => void
  requiredAmenities: Amenity[]
  onRequiredAmenitiesChange: (amenities: Amenity[]) => void
  nearbyOnly: boolean
  onNearbyOnlyChange: (nearby: boolean) => void
  hasUserLocation: boolean
}

export default function MobileToolbar({
  visible,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  onSelectPark,
  province,
  onProvinceChange,
  requiredAmenities,
  onRequiredAmenitiesChange,
  nearbyOnly,
  onNearbyOnlyChange,
  hasUserLocation,
}: MobileToolbarProps) {
  const [provinceOpen, setProvinceOpen] = useState(false)
  const [amenityOpen, setAmenityOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const provinceTriggerRef = useRef<HTMLButtonElement>(null)
  const amenityTriggerRef = useRef<HTMLButtonElement>(null)
  const provinceDropRef = useRef<HTMLDivElement>(null)
  const amenityDropRef = useRef<HTMLDivElement>(null)

  const provinceAnim = useAnimatedOpen(provinceOpen)
  const amenityAnim = useAnimatedOpen(amenityOpen)
  const provinceStyle = useDropdownPositionUp(provinceTriggerRef, provinceOpen)
  const amenityStyle = useDropdownPositionUp(amenityTriggerRef, amenityOpen)

  // Close dropdowns when toolbar hides
  useEffect(() => {
    if (!visible) {
      setProvinceOpen(false)
      setAmenityOpen(false)
      setSearchFocused(false)
    }
  }, [visible])

  // Outside-click handler
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        provinceOpen &&
        !provinceTriggerRef.current?.contains(target) &&
        !provinceDropRef.current?.contains(target)
      ) {
        setProvinceOpen(false)
      }
      if (
        amenityOpen &&
        !amenityTriggerRef.current?.contains(target) &&
        !amenityDropRef.current?.contains(target)
      ) {
        setAmenityOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [provinceOpen, amenityOpen])

  const toggleAmenity = useCallback(
    (amenity: Amenity) => {
      if (requiredAmenities.includes(amenity)) {
        onRequiredAmenitiesChange(requiredAmenities.filter((a) => a !== amenity))
      } else {
        onRequiredAmenitiesChange([...requiredAmenities, amenity])
      }
    },
    [requiredAmenities, onRequiredAmenitiesChange],
  )

  const showResults = searchQuery.trim().length > 0 && searchResults.length > 0

  return (
    <>
      {/* Root toolbar container */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-20 sm:hidden transition-transform duration-300 ease-in-out ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Search results — above toolbar */}
        {showResults && (
          <div className="mx-4 mb-2 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-xl rounded-xl shadow-lg border border-cream-dark/20 dark:border-dark-border/30 py-1 max-h-60 overflow-y-auto">
            {searchResults.map((park) => (
              <button
                key={park.id}
                type="button"
                onClick={() => onSelectPark(park)}
                className="w-full text-left px-3 py-2.5 hover:bg-cream/80 dark:hover:bg-dark-surface/80 transition-colors flex items-center gap-2.5 cursor-pointer"
              >
                <MapPin className={`w-3.5 h-3.5 shrink-0 ${park.type === 'national' ? 'text-sage' : 'text-brown'}`} />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-charcoal dark:text-cream truncate">{park.name}</div>
                  <div className="text-[10px] text-charcoal-light/70 dark:text-dark-text-secondary/70">{park.province}</div>
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

        {/* Toolbar body — frosted card with rounded top */}
        <div className="bg-white/95 dark:bg-dark-surface/95 backdrop-blur-xl rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)] px-4 pt-3 pb-3">
          {/* Search input row — primary action, on top */}
          <div className="relative flex items-center bg-cream/60 dark:bg-dark-border/20 border border-cream-dark/30 dark:border-dark-border/40 rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-charcoal-light/40 dark:text-dark-text-secondary/40 shrink-0 mr-2.5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search parks..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="flex-1 bg-transparent text-sm text-charcoal dark:text-cream placeholder:text-charcoal-light/40 dark:placeholder:text-dark-text-secondary/40 focus:outline-none font-body"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange('')}
                className="p-0.5 text-charcoal-light/50 dark:text-dark-text-secondary/50 hover:text-charcoal dark:hover:text-cream"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-cream-dark/20 dark:bg-dark-border/30 mx-1 my-2.5" />

          {/* Filter tags row */}
          <div className="flex items-center gap-2 pb-3 overflow-x-auto">
            {/* Nearby toggle — only when location available */}
            {hasUserLocation && (
              <button
                type="button"
                onClick={() => onNearbyOnlyChange(!nearbyOnly)}
                className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  nearbyOnly
                    ? 'bg-rust text-white shadow-sm'
                    : 'bg-transparent border border-charcoal-light/20 dark:border-dark-border/50 text-charcoal-light dark:text-dark-text-secondary'
                }`}
              >
                <Navigation className="w-3 h-3" />
                Nearby
              </button>
            )}

            {/* Province dropdown trigger */}
            <button
              ref={provinceTriggerRef}
              type="button"
              onClick={() => { setProvinceOpen(!provinceOpen); setAmenityOpen(false) }}
              className={`shrink-0 whitespace-nowrap flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                province !== 'all'
                  ? 'bg-sage/15 text-sage-dark dark:text-sage-light border border-sage/30 shadow-sm'
                  : 'bg-transparent border border-charcoal-light/20 dark:border-dark-border/50 text-charcoal-light dark:text-dark-text-secondary'
              }`}
            >
              {province === 'all' ? 'Province' : province}
              <ChevronUp className={`w-3 h-3 transition-transform ${provinceOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Amenities dropdown trigger */}
            <button
              ref={amenityTriggerRef}
              type="button"
              onClick={() => { setAmenityOpen(!amenityOpen); setProvinceOpen(false) }}
              className={`shrink-0 whitespace-nowrap flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                requiredAmenities.length > 0
                  ? 'bg-sage/15 text-sage-dark dark:text-sage-light border border-sage/30 shadow-sm'
                  : 'bg-transparent border border-charcoal-light/20 dark:border-dark-border/50 text-charcoal-light dark:text-dark-text-secondary'
              }`}
            >
              Amenities
              {requiredAmenities.length > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-sage text-white text-[10px]">
                  {requiredAmenities.length}
                </span>
              )}
              <ChevronUp className={`w-3 h-3 transition-transform ${amenityOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
        {/* Safe-area extender — background bleeds through home indicator zone */}
        <div
          className="bg-white/95 dark:bg-dark-surface/95 backdrop-blur-xl"
          style={{ height: 'env(safe-area-inset-bottom, 0px)' }}
        />
      </div>

      {/* Province dropdown — portal, opens upward */}
      {provinceAnim.mounted &&
        createPortal(
          <div
            ref={provinceDropRef}
            style={provinceStyle}
            className={`z-[9000] sm:hidden bg-white dark:bg-dark-surface rounded-xl shadow-lg border border-cream-dark dark:border-dark-border py-1 w-56 max-h-56 overflow-y-auto transition-opacity duration-150 ${
              provinceAnim.visible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              type="button"
              onClick={() => { onProvinceChange('all'); setProvinceOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-cream dark:hover:bg-dark-border/50 cursor-pointer ${province === 'all' ? 'text-sage font-semibold' : 'text-charcoal dark:text-cream'}`}
            >
              All provinces
            </button>
            {PROVINCES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { onProvinceChange(p); setProvinceOpen(false) }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-cream dark:hover:bg-dark-border/50 cursor-pointer ${province === p ? 'text-sage font-semibold' : 'text-charcoal dark:text-cream'}`}
              >
                {p}
              </button>
            ))}
          </div>,
          document.body,
        )}

      {/* Amenities dropdown — portal, opens upward */}
      {amenityAnim.mounted &&
        createPortal(
          <div
            ref={amenityDropRef}
            style={amenityStyle}
            className={`z-[9000] sm:hidden bg-white dark:bg-dark-surface rounded-xl shadow-lg border border-cream-dark dark:border-dark-border py-1 w-48 max-h-56 overflow-y-auto transition-opacity duration-150 ${
              amenityAnim.visible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {AMENITIES.map(({ value, label }) => (
              <label
                key={value}
                className="item-slide flex items-center gap-2 px-3 py-1.5"
              >
                <input
                  type="checkbox"
                  checked={requiredAmenities.includes(value)}
                  onChange={() => toggleAmenity(value)}
                  className="check-pop rounded w-3.5 h-3.5"
                />
                <span className="text-xs text-charcoal dark:text-cream">{label}</span>
              </label>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
