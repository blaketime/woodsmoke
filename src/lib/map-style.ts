import type { StyleSpecification } from 'maplibre-gl'
import { themeOverrides } from './map-theme'

const LIBERTY_URL = 'https://tiles.openfreemap.org/styles/liberty'

export function applyThemeOverrides(style: StyleSpecification): StyleSpecification {
  return {
    ...style,
    layers: style.layers.map((layer) => {
      const overrides = themeOverrides[layer.id]
      if (!overrides) return layer
      const result = { ...layer } as Record<string, unknown>
      if (overrides.paint) {
        result.paint = { ...(layer.paint as Record<string, unknown>), ...overrides.paint }
      }
      if (overrides.layout) {
        result.layout = { ...(layer.layout as Record<string, unknown>), ...overrides.layout }
      }
      return result as typeof layer
    }),
  }
}

export async function fetchWoodsmokeStyle(): Promise<StyleSpecification> {
  const res = await fetch(LIBERTY_URL)
  if (!res.ok) throw new Error(`Failed to fetch map style: ${res.status}`)
  const style: StyleSpecification = await res.json()
  return applyThemeOverrides(style)
}
