import { useRef, useState, useEffect, useCallback, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown } from 'lucide-react'
import type { Province, Amenity } from '../lib/types'

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

/* ── Position a portal dropdown below its trigger ── */
function useDropdownPosition(
  triggerRef: React.RefObject<HTMLElement | null>,
  open: boolean,
) {
  const [style, setStyle] = useState<CSSProperties>({})

  useEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left: rect.left,
    })
  }, [open, triggerRef])

  return style
}

interface FilterBarProps {
  parkType: 'all' | 'national' | 'provincial'
  onParkTypeChange: (type: 'all' | 'national' | 'provincial') => void
  province: Province | 'all'
  onProvinceChange: (province: Province | 'all') => void
  requiredAmenities: Amenity[]
  onRequiredAmenitiesChange: (amenities: Amenity[]) => void
  onClearAll: () => void
  nearbyOnly: boolean
  onNearbyOnlyChange: (nearby: boolean) => void
  hasUserLocation: boolean
}

export default function FilterBar({
  parkType,
  onParkTypeChange,
  province,
  onProvinceChange,
  requiredAmenities,
  onRequiredAmenitiesChange,
  onClearAll,
  nearbyOnly,
  onNearbyOnlyChange,
  hasUserLocation,
}: FilterBarProps) {
  const [amenityOpen, setAmenityOpen] = useState(false)
  const [provinceOpen, setProvinceOpen] = useState(false)

  const provinceTriggerRef = useRef<HTMLButtonElement>(null)
  const amenityTriggerRef = useRef<HTMLButtonElement>(null)
  const provinceDropRef = useRef<HTMLDivElement>(null)
  const amenityDropRef = useRef<HTMLDivElement>(null)

  const provinceAnim = useAnimatedOpen(provinceOpen)
  const amenityAnim = useAnimatedOpen(amenityOpen)
  const provinceStyle = useDropdownPosition(provinceTriggerRef, provinceOpen)
  const amenityStyle = useDropdownPosition(amenityTriggerRef, amenityOpen)

  /* Outside-click handler */
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

  const hasActiveFilters =
    parkType !== 'all' || province !== 'all' || requiredAmenities.length > 0 || nearbyOnly

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

  return (
    <div className="flex items-center gap-2">
      {/* Park type pills */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onParkTypeChange(parkType === 'national' ? 'all' : 'national')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            parkType === 'national'
              ? 'bg-sage text-white'
              : 'bg-white/60 dark:bg-dark-surface/60 text-charcoal-light dark:text-dark-text-secondary hover:bg-white/80 dark:hover:bg-dark-surface/80'
          }`}
        >
          National
        </button>
        <button
          type="button"
          onClick={() => onParkTypeChange(parkType === 'provincial' ? 'all' : 'provincial')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            parkType === 'provincial'
              ? 'bg-brown text-white'
              : 'bg-white/60 dark:bg-dark-surface/60 text-charcoal-light dark:text-dark-text-secondary hover:bg-white/80 dark:hover:bg-dark-surface/80'
          }`}
        >
          Provincial
        </button>
      </div>

      {/* Nearby — within 500 km, only shown when location available */}
      {hasUserLocation && (
        <div className="flex gap-1 border-l border-cream-dark/50 pl-2">
          <button
            type="button"
            onClick={() => onNearbyOnlyChange(!nearbyOnly)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              nearbyOnly
                ? 'bg-rust text-white'
                : 'bg-white/60 dark:bg-dark-surface/60 text-charcoal-light dark:text-dark-text-secondary hover:bg-white/80 dark:hover:bg-dark-surface/80'
            }`}
          >
            Nearby
          </button>
        </div>
      )}

      {/* Province dropdown — trigger */}
      <button
        ref={provinceTriggerRef}
        type="button"
        onClick={() => setProvinceOpen(!provinceOpen)}
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          province !== 'all'
            ? 'bg-sage/20 text-sage-dark'
            : 'bg-white/60 dark:bg-dark-surface/60 text-charcoal-light dark:text-dark-text-secondary hover:bg-white/80 dark:hover:bg-dark-surface/80'
        }`}
      >
        {province === 'all' ? 'All provinces' : province}
        <ChevronDown className={`w-3 h-3 transition-transform ${provinceOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Province dropdown — portal */}
      {provinceAnim.mounted &&
        createPortal(
          <div
            ref={provinceDropRef}
            style={provinceStyle}
            className={`z-[9000] bg-white rounded-xl shadow-lg border border-cream-dark py-1 w-56 max-h-56 overflow-y-auto transition-opacity duration-150 ${
              provinceAnim.visible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              type="button"
              onClick={() => { onProvinceChange('all'); setProvinceOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-cream cursor-pointer ${province === 'all' ? 'text-sage font-semibold' : 'text-charcoal'}`}
            >
              All provinces
            </button>
            {PROVINCES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { onProvinceChange(p); setProvinceOpen(false) }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-cream cursor-pointer ${province === p ? 'text-sage font-semibold' : 'text-charcoal'}`}
              >
                {p}
              </button>
            ))}
          </div>,
          document.body,
        )}

      {/* Amenities dropdown — trigger */}
      <button
        ref={amenityTriggerRef}
        type="button"
        onClick={() => setAmenityOpen(!amenityOpen)}
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          requiredAmenities.length > 0
            ? 'bg-sage/20 text-sage-dark'
            : 'bg-white/60 dark:bg-dark-surface/60 text-charcoal-light dark:text-dark-text-secondary hover:bg-white/80 dark:hover:bg-dark-surface/80'
        }`}
      >
        Amenities
        {requiredAmenities.length > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-sage text-white text-[10px]">
            {requiredAmenities.length}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${amenityOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Amenities dropdown — portal */}
      {amenityAnim.mounted &&
        createPortal(
          <div
            ref={amenityDropRef}
            style={amenityStyle}
            className={`z-[9000] bg-white rounded-xl shadow-lg border border-cream-dark py-1 w-48 max-h-56 overflow-y-auto transition-opacity duration-150 ${
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
                <span className="text-xs text-charcoal">{label}</span>
              </label>
            ))}
          </div>,
          document.body,
        )}

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearAll}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-charcoal-light hover:text-rust transition-colors"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  )
}
