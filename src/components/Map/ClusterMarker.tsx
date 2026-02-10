import { Marker } from 'react-map-gl/maplibre'
import type Supercluster from 'supercluster'
import type { GeoJsonProperties } from 'geojson'

interface ClusterMarkerProps {
  longitude: number
  latitude: number
  pointCount: number
  clusterId: number
  supercluster: Supercluster<GeoJsonProperties, GeoJsonProperties>
  onZoomToCluster: (longitude: number, latitude: number, zoom: number) => void
}

export default function ClusterMarker({
  longitude,
  latitude,
  pointCount,
  clusterId,
  supercluster,
  onZoomToCluster,
}: ClusterMarkerProps) {
  const size = pointCount < 11 ? 36 : pointCount < 51 ? 44 : 52

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const zoom = supercluster.getClusterExpansionZoom(clusterId)
    onZoomToCluster(longitude, latitude, zoom)
  }

  return (
    <Marker longitude={longitude} latitude={latitude} anchor="center">
      <button
        onClick={handleClick}
        className="flex items-center justify-center rounded-full bg-sage border-2 border-sage-dark text-white font-semibold shadow-md transition-transform duration-200 hover:scale-110 cursor-pointer"
        style={{ width: size, height: size, fontSize: size < 40 ? 12 : 14 }}
      >
        {pointCount}
      </button>
    </Marker>
  )
}
