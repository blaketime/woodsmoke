import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, { type MapRef, type ViewStateChangeEvent } from 'react-map-gl/maplibre'
import { Plus, Minus } from 'lucide-react'
import useSupercluster from 'use-supercluster'
import type { BBox } from 'geojson'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Park } from '../../lib/types'
import { useMapStyle } from '../../hooks/useMapStyle'
import ParkMarker from './ParkMarker'
import ClusterMarker from './ClusterMarker'
import UserLocationMarker from './UserLocationMarker'
import type { UserLocation } from '../../lib/geolocation'

const INITIAL_VIEW = {
  longitude: -96.5,
  latitude: 56.0,
  zoom: 3.5,
}

interface ParkMapProps {
  parks: Park[]
  selectedPark: Park | null
  onSelectPark: (park: Park) => void
  onDeselectPark: () => void
  userLocation: UserLocation | null
  distanceLookup: Record<string, number>
  onMapLoad?: () => void
}

export default function ParkMap({ parks, selectedPark, onSelectPark, onDeselectPark, userLocation, distanceLookup, onMapLoad }: ParkMapProps) {
  const mapRef = useRef<MapRef>(null)
  const mapStyle = useMapStyle()
  const initialParkRef = useRef(selectedPark?.id ?? null)
  const [viewState, setViewState] = useState(() =>
    selectedPark
      ? { longitude: selectedPark.lng, latitude: selectedPark.lat, zoom: 10 }
      : INITIAL_VIEW
  )
  const [bounds, setBounds] = useState<BBox | undefined>(undefined)

  const updateBounds = useCallback(() => {
    const map = mapRef.current
    if (map) {
      const b = map.getMap().getBounds()
      const lngPad = (b.getEast() - b.getWest()) * 0.25
      const latPad = (b.getNorth() - b.getSouth()) * 0.25
      setBounds([
        b.getWest() - lngPad,
        b.getSouth() - latPad,
        b.getEast() + lngPad,
        b.getNorth() + latPad,
      ] as BBox)
    }
  }, [])

  const onMove = useCallback((evt: ViewStateChangeEvent) => {
    setViewState(evt.viewState)
    updateBounds()
  }, [updateBounds])

  const onLoad = useCallback(() => {
    updateBounds()
    onMapLoad?.()
  }, [updateBounds, onMapLoad])

  const handleMapClick = useCallback(() => {
    onDeselectPark()
  }, [onDeselectPark])

  const points = useMemo(
    () =>
      parks.map((park) => ({
        type: 'Feature' as const,
        properties: { parkId: park.id },
        geometry: {
          type: 'Point' as const,
          coordinates: [park.lng, park.lat] as [number, number],
        },
      })),
    [parks]
  )

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewState.zoom,
    options: { radius: 75, maxZoom: 10, minPoints: 2 },
  })

  const parkById = useMemo(() => {
    const lookup = new globalThis.Map<string, Park>()
    for (const park of parks) {
      lookup.set(park.id, park)
    }
    return lookup
  }, [parks])

  useEffect(() => {
    if (!selectedPark || !mapRef.current) return
    // Skip animation for a park that was already selected on mount (back navigation)
    if (initialParkRef.current === selectedPark.id) {
      initialParkRef.current = null
      return
    }
    mapRef.current.flyTo({
      center: [selectedPark.lng, selectedPark.lat],
      zoom: 10,
      duration: 1200,
      padding: { top: 50, bottom: 50, left: 50, right: 380 },
    })
  }, [selectedPark])

  const scaleLabel = useMemo(() => {
    const metersPerPx = 156543.03392 * Math.cos((viewState.latitude * Math.PI) / 180) / Math.pow(2, viewState.zoom)
    const km = (metersPerPx * 80) / 1000 // approximate for ~80px reference width
    const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000]
    const nice = steps.find((s) => s >= km) ?? steps[steps.length - 1]
    return `${nice} km`
  }, [viewState.zoom, viewState.latitude])

  const handleZoomToCluster = useCallback(
    (longitude: number, latitude: number, zoom: number) => {
      mapRef.current?.flyTo({ center: [longitude, latitude], zoom, duration: 500 })
    },
    []
  )

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={onMove}
      onLoad={onLoad}
      onClick={handleMapClick}
      style={{ width: '100%', height: '100%' }}
      mapStyle={mapStyle}
      maxBounds={[[-145, 40], [-50, 85]]}
    >
      {/* Custom scale — fixed, matches header controls */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm rounded-xl shadow-sm px-3 py-1.5">
        <span className="text-xs font-medium text-charcoal-light dark:text-dark-text-secondary">{scaleLabel}</span>
      </div>

      {/* Custom map controls — matches header button style */}
      <div className="absolute bottom-12 right-4 flex flex-col items-center gap-2 z-10">
        <button
          type="button"
          onClick={() => mapRef.current?.getMap().zoomIn({ duration: 200 })}
          className="bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm rounded-xl shadow-sm p-2.5 text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-cream hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Zoom in"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.getMap().zoomOut({ duration: 200 })}
          className="bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm rounded-xl shadow-sm p-2.5 text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-cream hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Zoom out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
      {userLocation && <UserLocationMarker location={userLocation} />}
      {clusters.map((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates
        const props = cluster.properties

        if ('cluster' in props && props.cluster) {
          return (
            <ClusterMarker
              key={`cluster-${props.cluster_id}`}
              longitude={lng}
              latitude={lat}
              pointCount={props.point_count}
              clusterId={props.cluster_id as number}
              supercluster={supercluster!}
              onZoomToCluster={handleZoomToCluster}
            />
          )
        }

        const park = parkById.get((props as { parkId: string }).parkId)
        if (!park) return null

        return (
          <ParkMarker
            key={park.id}
            park={park}
            onClick={onSelectPark}
            isSelected={selectedPark?.id === park.id}
            distance={distanceLookup[park.id]}
          />
        )
      })}
    </Map>
  )
}
