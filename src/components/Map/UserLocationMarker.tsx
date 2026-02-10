import { Marker } from 'react-map-gl/maplibre'
import { MapPin } from 'lucide-react'
import type { UserLocation } from '../../lib/geolocation'

interface UserLocationMarkerProps {
  location: UserLocation
}

export default function UserLocationMarker({ location }: UserLocationMarkerProps) {
  return (
    <Marker longitude={location.lng} latitude={location.lat} anchor="bottom">
      <div className="flex flex-col items-center pointer-events-none">
        <div className="relative">
          {/* Pulsing ring behind pin */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-rust/30 animate-pulse-ring" />
          {/* Pin icon */}
          <MapPin className="w-8 h-8 text-rust drop-shadow-md" fill="#C4663A" strokeWidth={1.5} stroke="white" />
        </div>
      </div>
    </Marker>
  )
}
