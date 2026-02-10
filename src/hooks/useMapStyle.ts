import { useEffect, useRef, useState } from 'react'
import type { StyleSpecification } from 'maplibre-gl'
import { fetchWoodsmokeStyle } from '../lib/map-style'

const LIBERTY_URL = 'https://tiles.openfreemap.org/styles/liberty'

export function useMapStyle(): string | StyleSpecification {
  const [style, setStyle] = useState<string | StyleSpecification>(LIBERTY_URL)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    fetchWoodsmokeStyle().then(setStyle).catch(() => {
      // Liberty URL fallback — already set as default
    })
  }, [])

  return style
}
