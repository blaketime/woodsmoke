import type { StyleSpecification } from 'maplibre-gl'
import { themeOverrides, themeOverridesDark } from './map-theme'

const LIBERTY_URL = 'https://tiles.openfreemap.org/styles/liberty'

let cachedBaseStyle: StyleSpecification | null = null

export function applyThemeOverrides(
  style: StyleSpecification,
  dark: boolean = false,
): StyleSpecification {
  const overrides = dark ? themeOverridesDark : themeOverrides
  return {
    ...style,
    layers: style.layers.map((layer) => {
      const layerOverrides = overrides[layer.id]
      if (!layerOverrides) return layer
      const result = { ...layer } as Record<string, unknown>
      if (layerOverrides.paint) {
        result.paint = { ...(layer.paint as Record<string, unknown>), ...layerOverrides.paint }
      }
      if (layerOverrides.layout) {
        result.layout = { ...(layer.layout as Record<string, unknown>), ...layerOverrides.layout }
      }
      return result as typeof layer
    }),
  }
}

export async function fetchWoodsmokeStyle(dark: boolean = false): Promise<StyleSpecification> {
  if (!cachedBaseStyle) {
    const res = await fetch(LIBERTY_URL)
    if (!res.ok) throw new Error(`Failed to fetch map style: ${res.status}`)
    cachedBaseStyle = await res.json()
  }
  return applyThemeOverrides(cachedBaseStyle!, dark)
}
