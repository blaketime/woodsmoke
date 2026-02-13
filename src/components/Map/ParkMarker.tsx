import { Marker } from 'react-map-gl/maplibre'
import { TreePine, Mountain } from 'lucide-react'
import type { Park } from '../../lib/types'
import { formatDistance } from '../../lib/geolocation'

interface ParkMarkerProps {
  park: Park
  onClick: (park: Park) => void
  isSelected: boolean
  distance?: number
}

export default function ParkMarker({ park, onClick, isSelected, distance }: ParkMarkerProps) {
  const isNational = park.type === 'national'

  return (
    <Marker
      longitude={park.lng}
      latitude={park.lat}
      anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation()
        onClick(park)
      }}
    >
      <button
        className={`group flex flex-col items-center cursor-pointer transition-transform duration-200 ${
          isSelected ? 'scale-125 z-10' : 'hover:scale-110'
        }`}
      >
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full shadow-md border-2 transition-colors duration-200 ${
            isSelected
              ? 'bg-rust border-rust-dark text-white'
              : isNational
                ? 'bg-sage border-sage-dark text-white hover:bg-rust hover:border-rust-dark'
                : 'bg-brown border-brown-dark text-white hover:bg-rust hover:border-rust-dark'
          }`}
        >
          {isNational ? (
            <Mountain className="w-4 h-4" />
          ) : (
            <TreePine className="w-4 h-4" />
          )}
        </div>
        <div
          className={`mt-1 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-opacity duration-200 ${
            isSelected
              ? 'bg-charcoal text-white opacity-100'
              : 'bg-charcoal/80 text-white opacity-0 group-hover:opacity-100'
          }`}
        >
          {park.name.replace(/( National| Provincial| Interprovincial).*/, '')}
        </div>
        {distance !== undefined && (
          <div className="px-1.5 py-0.5 rounded text-[9px] text-charcoal/50 whitespace-nowrap">
            {formatDistance(distance)}
          </div>
        )}
      </button>
    </Marker>
  )
}
