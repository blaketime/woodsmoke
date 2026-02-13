import { useEffect, useRef, useState } from 'react'
import type { StyleSpecification } from 'maplibre-gl'
import { fetchWoodsmokeStyle } from '../lib/map-style'
import { useTheme } from '../lib/theme'

const LIBERTY_URL = 'https://tiles.openfreemap.org/styles/liberty'

export function useMapStyle(): string | StyleSpecification {
  const { effectiveMode } = useTheme()
  const isDark = effectiveMode === 'dark'
  const [style, setStyle] = useState<string | StyleSpecification>(LIBERTY_URL)
  const fetched = useRef(false)

  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true
      fetchWoodsmokeStyle(isDark).then(setStyle).catch(() => {})
    } else {
      fetchWoodsmokeStyle(isDark).then(setStyle).catch(() => {})
    }
  }, [isDark])

  return style
}
