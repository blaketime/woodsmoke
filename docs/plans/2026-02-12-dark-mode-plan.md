# Dark Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a dark mode toggle that respects OS preference, persists user choice, and applies a warm-inverted dark theme to both the UI and the MapLibre map.

**Architecture:** A `ThemeContext` in React manages the mode (`system`/`light`/`dark`), toggles a `.dark` class on `<html>`, and persists to localStorage. Tailwind v4's `@custom-variant dark` directive enables `dark:` utility classes. The map gets a second set of colour overrides (`themeOverridesDark`) that the `useMapStyle` hook selects based on theme context.

**Tech Stack:** React context, Tailwind CSS v4 `@custom-variant`, MapLibre GL JS style overrides, localStorage, `window.matchMedia`.

---

## Task 1: Tailwind dark variant + CSS base dark styles

**Files:**
- Modify: `src/index.css`

**Step 1: Add `@custom-variant` directive**

Add immediately after the `@import "tailwindcss";` line:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

**Step 2: Add dark colour tokens to `@theme`**

Add these inside the existing `@theme { ... }` block, after `--color-rust-dark`:

```css
  /* Dark mode palette */
  --color-dark-bg: #1A1A18;
  --color-dark-surface: #2D2B28;
  --color-dark-border: #3A3835;
  --color-dark-text-secondary: #B0A898;
```

**Step 3: Add dark base overrides**

Add a `.dark body` rule after the existing `body { ... }` block:

```css
.dark body {
  background-color: var(--color-dark-bg);
  color: var(--color-cream);
}
```

**Step 4: Reduce paper grain opacity in dark mode**

Update the `#root::before` rule — add a `.dark` variant. After the existing `#root::before { ... }` block, add:

```css
.dark #root::before {
  opacity: 0.02;
}
```

**Step 5: Update MapLibre attribution for dark mode**

After the existing `.maplibregl-ctrl-attrib { ... }` rule, add:

```css
.dark .maplibregl-ctrl-attrib {
  background: rgba(26, 26, 24, 0.7) !important;
  color: var(--color-dark-text-secondary) !important;
}

.dark .maplibregl-ctrl-attrib a {
  color: var(--color-dark-text-secondary) !important;
}

.dark .maplibregl-ctrl-attrib a:hover {
  color: var(--color-rust-light) !important;
}
```

**Step 6: Update dark Skeleton pulse colour**

After the existing `input[type="checkbox"]` rule, add:

```css
.dark input[type="checkbox"] {
  accent-color: var(--color-sage-light);
}
```

**Step 7: Verify dev server runs**

Run: `cd /Users/blakecyze/Documents/AvatoneRepo/woodsmoke && npm run dev`
Expected: Compiles without errors. No visual changes yet (no `.dark` class applied).

**Step 8: Commit**

```bash
git add src/index.css
git commit -m "feat: add Tailwind v4 dark variant and dark base styles"
```

---

## Task 2: ThemeContext + useTheme hook

**Files:**
- Create: `src/lib/theme.tsx`

**Step 1: Create the theme context file**

Create `src/lib/theme.tsx` with the following content:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type ThemeMode = 'system' | 'light' | 'dark'
type EffectiveTheme = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  effectiveMode: EffectiveTheme
  setMode: (mode: ThemeMode) => void
  cycleMode: () => void
}

const STORAGE_KEY = 'woodsmoke:theme'
const CYCLE_ORDER: ThemeMode[] = ['system', 'light', 'dark']

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveEffective(mode: ThemeMode): EffectiveTheme {
  return mode === 'system' ? getSystemTheme() : mode
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
    return 'system'
  })
  const [effectiveMode, setEffectiveMode] = useState<EffectiveTheme>(() => resolveEffective(mode))

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem(STORAGE_KEY, newMode)
  }

  const cycleMode = () => {
    const idx = CYCLE_ORDER.indexOf(mode)
    setMode(CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length])
  }

  // Resolve effective theme whenever mode changes or OS preference changes
  useEffect(() => {
    const update = () => setEffectiveMode(resolveEffective(mode))
    update()

    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', update)
      return () => mq.removeEventListener('change', update)
    }
  }, [mode])

  // Toggle .dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', effectiveMode === 'dark')
  }, [effectiveMode])

  return (
    <ThemeContext value={{ mode, effectiveMode, setMode, cycleMode }}>
      {children}
    </ThemeContext>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
```

**Step 2: Verify dev server runs**

Run: `npm run dev`
Expected: Compiles without errors.

**Step 3: Commit**

```bash
git add src/lib/theme.tsx
git commit -m "feat: add ThemeContext and useTheme hook"
```

---

## Task 3: Wrap app with ThemeProvider

**Files:**
- Modify: `src/main.tsx`

**Step 1: Add ThemeProvider wrapping**

Update `src/main.tsx` to import and wrap with `ThemeProvider`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './lib/theme'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

**Step 2: Verify dev server runs**

Run: `npm run dev`
Expected: Compiles. If OS is in dark mode, `.dark` class should appear on `<html>`.

**Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "feat: wrap app with ThemeProvider"
```

---

## Task 4: Create ThemeToggle component

**Files:**
- Create: `src/components/ThemeToggle.tsx`

**Step 1: Create the toggle component**

Create `src/components/ThemeToggle.tsx`:

```tsx
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../lib/theme'

export default function ThemeToggle() {
  const { mode, effectiveMode, cycleMode } = useTheme()

  const Icon = effectiveMode === 'dark' ? Moon : Sun
  const label =
    mode === 'system' ? 'Theme: System' : mode === 'light' ? 'Theme: Light' : 'Theme: Dark'

  return (
    <button
      type="button"
      onClick={cycleMode}
      className="relative p-2.5 rounded-xl text-charcoal-light hover:text-charcoal hover:bg-black/5 dark:text-dark-text-secondary dark:hover:text-cream dark:hover:bg-white/5 transition-colors cursor-pointer"
      aria-label={label}
      title={label}
    >
      <Icon className="w-4 h-4" />
      {mode === 'system' && (
        <Monitor className="absolute bottom-1 right-1 w-2 h-2 text-sage" />
      )}
    </button>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/ThemeToggle.tsx
git commit -m "feat: add ThemeToggle component"
```

---

## Task 5: Dark map theme overrides

**Files:**
- Modify: `src/lib/map-theme.ts`

**Step 1: Add `themeOverridesDark` export**

At the bottom of `src/lib/map-theme.ts`, after the closing `}` of `themeOverrides`, add the full dark overrides object. This mirrors the structure of `themeOverrides` but with inverted colours — black water, warm dark land, light labels:

```ts
export const themeOverridesDark: Record<string, LayerOverride> = {
  // ── Background ───────────────────────────────────────────────
  background: {
    paint: { 'background-color': '#2A2826' },
  },

  // ── Natural earth raster — HIDDEN ────────────────────────────
  natural_earth: {
    layout: { visibility: 'none' },
  },

  // ── Hidden pattern/texture layers ────────────────────────────
  'building-3d': { layout: { visibility: 'none' } },
  landcover_wetland: { layout: { visibility: 'none' } },
  road_area_pattern: { layout: { visibility: 'none' } },

  // ── Water — pure black ────────────────────────────────────────
  water: { paint: { 'fill-color': '#000000' } },
  waterway_tunnel: { paint: { 'line-color': '#0A0A0A' } },
  waterway_river: { paint: { 'line-color': '#0A0A0A' } },
  waterway_other: { paint: { 'line-color': '#0A0A0A' } },

  // ── Water labels ──────────────────────────────────────────────
  waterway_line_label: { paint: { 'text-color': '#4A6A7A' } },
  water_name_point_label: {
    paint: { 'text-color': '#4A6A7A', 'text-halo-color': '#000000', 'text-halo-width': 1.5 },
  },
  water_name_line_label: {
    paint: { 'text-color': '#4A6A7A', 'text-halo-color': '#000000', 'text-halo-width': 1.5 },
  },

  // ── Parks / landcover ─────────────────────────────────────────
  park: { paint: { 'fill-color': 'rgba(135,148,111,0.12)', 'fill-opacity': 1 } },
  park_outline: { paint: { 'line-color': 'rgba(135,148,111,0.15)' } },
  landcover_wood: { paint: { 'fill-color': 'hsla(90,20%,55%,0.08)', 'fill-opacity': 1 } },
  landcover_grass: { paint: { 'fill-color': 'rgba(135,148,111,0.08)', 'fill-opacity': 1 } },
  landcover_ice: { paint: { 'fill-color': 'rgba(60,65,65,0.5)' } },
  landcover_sand: { paint: { 'fill-color': 'rgba(55,50,40,0.4)' } },
  landuse_cemetery: { paint: { 'fill-color': 'rgba(50,55,45,0.3)' } },
  landuse_hospital: { paint: { 'fill-color': 'rgba(55,45,45,0.3)' } },
  landuse_school: { paint: { 'fill-color': 'rgba(50,48,40,0.3)' } },
  landuse_pitch: { paint: { 'fill-color': 'rgba(45,48,40,0.3)' } },
  landuse_track: { paint: { 'fill-color': 'rgba(45,48,40,0.3)' } },
  landuse_residential: { paint: { 'fill-color': 'hsla(35,10%,18%,0.3)' } },

  // ── Roads (subtle light on dark) ──────────────────────────────
  road_motorway: { paint: { 'line-color': '#3A3836' } },
  road_trunk_primary: { paint: { 'line-color': '#353330' } },
  road_secondary_tertiary: { paint: { 'line-color': '#353330' } },
  road_minor: { paint: { 'line-color': '#32302E' } },
  road_link: { paint: { 'line-color': '#353330' } },
  road_service_track: { paint: { 'line-color': '#32302E' } },
  road_path_pedestrian: { paint: { 'line-color': '#302E2C' } },
  road_motorway_link: { paint: { 'line-color': '#3A3836' } },

  // ── Road casings ──────────────────────────────────────────────
  road_motorway_casing: { paint: { 'line-color': '#424038' } },
  road_trunk_primary_casing: { paint: { 'line-color': '#424038' } },
  road_secondary_tertiary_casing: { paint: { 'line-color': '#3E3C36' } },
  road_minor_casing: { paint: { 'line-color': '#3A3836' } },
  road_link_casing: { paint: { 'line-color': '#424038' } },
  road_service_track_casing: { paint: { 'line-color': '#3A3836' } },
  road_motorway_link_casing: { paint: { 'line-color': '#424038' } },

  // ── Tunnels ───────────────────────────────────────────────────
  tunnel_motorway: { paint: { 'line-color': '#343230' } },
  tunnel_trunk_primary: { paint: { 'line-color': '#302E2C' } },
  tunnel_secondary_tertiary: { paint: { 'line-color': '#302E2C' } },
  tunnel_minor: { paint: { 'line-color': '#2E2C2A' } },
  tunnel_motorway_link: { paint: { 'line-color': '#343230' } },
  tunnel_service_track: { paint: { 'line-color': '#2E2C2A' } },
  tunnel_link: { paint: { 'line-color': '#302E2C' } },
  tunnel_path_pedestrian: { paint: { 'line-color': '#2E2C2A' } },

  // ── Tunnel casings ────────────────────────────────────────────
  tunnel_motorway_casing: { paint: { 'line-color': '#3E3C36' } },
  tunnel_trunk_primary_casing: { paint: { 'line-color': '#3E3C36' } },
  tunnel_secondary_tertiary_casing: { paint: { 'line-color': '#3A3836' } },
  tunnel_minor_casing: { paint: { 'line-color': '#343230' } },
  tunnel_link_casing: { paint: { 'line-color': '#3E3C36' } },
  tunnel_service_track_casing: { paint: { 'line-color': '#343230' } },

  // ── Bridges ───────────────────────────────────────────────────
  bridge_motorway: { paint: { 'line-color': '#3A3836' } },
  bridge_trunk_primary: { paint: { 'line-color': '#353330' } },
  bridge_secondary_tertiary: { paint: { 'line-color': '#353330' } },
  bridge_street: { paint: { 'line-color': '#32302E' } },
  bridge_link: { paint: { 'line-color': '#353330' } },
  bridge_service_track: { paint: { 'line-color': '#32302E' } },
  bridge_motorway_link: { paint: { 'line-color': '#3A3836' } },
  bridge_path_pedestrian: { paint: { 'line-color': '#302E2C' } },

  // ── Bridge casings ────────────────────────────────────────────
  bridge_motorway_casing: { paint: { 'line-color': '#424038' } },
  bridge_trunk_primary_casing: { paint: { 'line-color': '#424038' } },
  bridge_secondary_tertiary_casing: { paint: { 'line-color': '#3E3C36' } },
  bridge_street_casing: { paint: { 'line-color': '#3A3836' } },
  bridge_link_casing: { paint: { 'line-color': '#424038' } },
  bridge_service_track_casing: { paint: { 'line-color': '#3A3836' } },
  bridge_motorway_link_casing: { paint: { 'line-color': '#424038' } },
  bridge_path_pedestrian_casing: { paint: { 'line-color': '#3A3836' } },

  // ── Rail ──────────────────────────────────────────────────────
  road_major_rail: { paint: { 'line-color': '#484640' } },
  road_transit_rail: { paint: { 'line-color': '#484640' } },
  road_major_rail_hatching: { paint: { 'line-color': '#484640' } },
  road_transit_rail_hatching: { paint: { 'line-color': '#484640' } },
  tunnel_major_rail: { paint: { 'line-color': '#403E38' } },
  tunnel_transit_rail: { paint: { 'line-color': '#403E38' } },
  tunnel_major_rail_hatching: { paint: { 'line-color': '#403E38' } },
  tunnel_transit_rail_hatching: { paint: { 'line-color': '#403E38' } },
  bridge_major_rail: { paint: { 'line-color': '#484640' } },
  bridge_transit_rail: { paint: { 'line-color': '#484640' } },
  bridge_major_rail_hatching: { paint: { 'line-color': '#484640' } },
  bridge_transit_rail_hatching: { paint: { 'line-color': '#484640' } },

  // ── Aeroways ──────────────────────────────────────────────────
  aeroway_fill: { paint: { 'fill-color': 'rgba(50,48,44,0.4)' } },
  aeroway_runway: { paint: { 'line-color': '#3E3C38' } },
  aeroway_taxiway: { paint: { 'line-color': '#3E3C38' } },

  // ── Buildings ─────────────────────────────────────────────────
  building: { paint: { 'fill-color': '#343230' } },

  // ── Boundaries (lightened brown) ──────────────────────────────
  boundary_2: { paint: { 'line-color': '#A6916F' } },
  boundary_3: { paint: { 'line-color': 'rgba(166,145,111,0.5)' } },
  boundary_disputed: { paint: { 'line-color': '#A6916F' } },

  // ── Country labels ────────────────────────────────────────────
  label_country_1: {
    paint: { 'text-color': '#D0C8B8', 'text-halo-color': '#2A2826', 'text-halo-width': 1.5 },
  },
  label_country_2: {
    paint: { 'text-color': '#D0C8B8', 'text-halo-color': '#2A2826', 'text-halo-width': 1.5 },
  },
  label_country_3: {
    paint: { 'text-color': '#B8B0A0', 'text-halo-color': '#2A2826', 'text-halo-width': 1.5 },
  },

  // ── City / state labels ───────────────────────────────────────
  label_city_capital: {
    paint: { 'text-color': '#D0C8B8', 'text-halo-color': '#2A2826', 'text-halo-width': 1.5 },
  },
  label_city: {
    paint: { 'text-color': '#B8B0A0', 'text-halo-color': '#2A2826', 'text-halo-width': 1.5 },
  },
  label_state: {
    paint: { 'text-color': '#908878', 'text-halo-color': '#2A2826', 'text-halo-width': 1.5 },
  },
  label_town: {
    paint: { 'text-color': '#A8A090', 'text-halo-color': '#2A2826', 'text-halo-width': 1.5 },
  },
  label_village: {
    paint: { 'text-color': '#908878', 'text-halo-color': '#2A2826', 'text-halo-width': 1.5 },
  },
  label_other: {
    paint: { 'text-color': '#787068', 'text-halo-color': '#2A2826', 'text-halo-width': 1.5 },
  },

  // ── POI / road labels ─────────────────────────────────────────
  poi_r1: {
    paint: { 'text-color': '#787068', 'text-halo-color': '#2A2826', 'text-halo-width': 1.5 },
  },
  poi_r7: {
    paint: { 'text-color': '#787068', 'text-halo-color': '#2A2826', 'text-halo-width': 1.5 },
  },
  poi_r20: {
    paint: { 'text-color': '#787068', 'text-halo-color': '#2A2826', 'text-halo-width': 1.5 },
  },
  poi_transit: {
    paint: { 'text-color': '#4A6A7A', 'text-halo-color': '#2A2826', 'text-halo-width': 1.5 },
  },
  airport: {
    paint: { 'text-color': '#787068', 'text-halo-color': '#2A2826', 'text-halo-width': 1.5 },
  },
  'highway-name-path': {
    paint: { 'text-color': '#A6916F', 'text-halo-color': '#2A2826', 'text-halo-width': 1.5 },
  },
  'highway-name-minor': {
    paint: { 'text-color': '#787068', 'text-halo-color': '#2A2826', 'text-halo-width': 1.5 },
  },
  'highway-name-major': {
    paint: { 'text-color': '#908878', 'text-halo-color': '#2A2826', 'text-halo-width': 1.5 },
  },
}
```

**Step 2: Commit**

```bash
git add src/lib/map-theme.ts
git commit -m "feat: add dark mode map theme overrides"
```

---

## Task 6: Update map-style and useMapStyle to support dark mode

**Files:**
- Modify: `src/lib/map-style.ts`
- Modify: `src/hooks/useMapStyle.ts`

**Step 1: Update `map-style.ts` to accept a theme parameter**

Replace the contents of `src/lib/map-style.ts` with:

```ts
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
```

**Step 2: Update `useMapStyle.ts` to consume theme context**

Replace the contents of `src/hooks/useMapStyle.ts` with:

```ts
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
      // Re-apply overrides when theme changes (base style is cached)
      fetchWoodsmokeStyle(isDark).then(setStyle).catch(() => {})
    }
  }, [isDark])

  return style
}
```

**Step 3: Verify dev server runs**

Run: `npm run dev`
Expected: Compiles. If you manually add `class="dark"` to `<html>` in browser devtools, the map should switch to dark style.

**Step 4: Commit**

```bash
git add src/lib/map-style.ts src/hooks/useMapStyle.ts
git commit -m "feat: wire map style to theme context with cached base style"
```

---

## Task 7: Add theme toggle to Home page + dark classes

**Files:**
- Modify: `src/pages/Home.tsx`

**Step 1: Import ThemeToggle**

Add to imports:

```tsx
import ThemeToggle from '../components/ThemeToggle'
```

**Step 2: Add ThemeToggle button to header**

In the header, add the `<ThemeToggle />` component inside the `<div className="flex items-center gap-2 pointer-events-auto">` — insert it as the first child, before the filters `<div>`:

```tsx
<div className="flex items-center gap-2 pointer-events-auto">
  {/* Theme toggle */}
  <div className="bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm rounded-xl shadow-sm">
    <ThemeToggle />
  </div>
  ...
```

**Step 3: Add dark: classes throughout Home.tsx**

Apply these substitutions throughout the file (showing the patterns — apply to ALL matching occurrences):

- `bg-white/90 backdrop-blur-sm` → `bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm`
- `text-charcoal` (exact, not compound like `text-charcoal-light`) → `text-charcoal dark:text-cream`
- `text-charcoal-light` → `text-charcoal-light dark:text-dark-text-secondary`
- `bg-cream` → `bg-cream dark:bg-dark-bg`
- `border-cream-dark` → `border-cream-dark dark:border-dark-border`
- `bg-white/95` → `bg-white/95 dark:bg-dark-surface/95`
- `hover:bg-cream/80` → `hover:bg-cream/80 dark:hover:bg-dark-surface/80`
- `hover:bg-black/5` → `hover:bg-black/5 dark:hover:bg-white/5`
- `text-charcoal-light/50` (placeholder) → `text-charcoal-light/50 dark:text-dark-text-secondary/50`
- `text-charcoal-light/70` → `text-charcoal-light/70 dark:text-dark-text-secondary/70`

For the **loading overlay**, change:
- `bg-cream` → `bg-cream dark:bg-dark-bg`
- `text-charcoal mb-3` → `text-charcoal dark:text-cream mb-3`
- `text-charcoal-light` → `text-charcoal-light dark:text-dark-text-secondary`

For the **map controls** (zoom buttons + scale):
- `bg-white/90 backdrop-blur-sm rounded-xl shadow-sm` → `bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm rounded-xl shadow-sm`
- `hover:bg-gray-100` → `hover:bg-gray-100 dark:hover:bg-white/10`

**Step 4: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: add dark mode toggle and dark classes to Home page"
```

---

## Task 8: Add theme toggle to ParkDetail page + dark classes

**Files:**
- Modify: `src/pages/ParkDetail.tsx`

**Step 1: Import ThemeToggle**

Add to imports:

```tsx
import ThemeToggle from '../components/ThemeToggle'
```

**Step 2: Add ThemeToggle to header**

In both headers (the "not found" header and the main park header), add the toggle. In the `<div>` after `<span className="font-display ...">Woodsmoke</span>`, add:

```tsx
<div className="ml-auto bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm rounded-xl shadow-sm">
  <ThemeToggle />
</div>
```

**Step 3: Add dark: classes throughout ParkDetail.tsx**

Apply these substitutions (all occurrences):

- `bg-cream` → `bg-cream dark:bg-dark-bg`
- `min-h-full bg-cream` → `min-h-full bg-cream dark:bg-dark-bg`
- `bg-white/80 backdrop-blur-sm` → `bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm`
- `border-b border-cream-dark` → `border-b border-cream-dark dark:border-dark-border`
- `text-charcoal` (standalone) → `text-charcoal dark:text-cream`
- `text-charcoal-light` → `text-charcoal-light dark:text-dark-text-secondary`
- `border-cream-dark bg-white` → `border-cream-dark dark:border-dark-border bg-white dark:bg-dark-surface`
- `bg-cream-dark/50` (campground selector bg) → `bg-cream-dark/50 dark:bg-dark-border/50`
- `bg-white text-charcoal shadow-sm` (selected tab) → `bg-white dark:bg-dark-surface text-charcoal dark:text-cream shadow-sm`
- `hover:bg-black/5` → `hover:bg-black/5 dark:hover:bg-white/5`
- `bg-sage/10` → `bg-sage/10 dark:bg-sage/20`
- `lg:border-l lg:border-sage/15` → `lg:border-l lg:border-sage/15 dark:lg:border-sage/25`
- `border-t border-sage/15` → `border-t border-sage/15 dark:border-sage/25`
- `hover:bg-cream-dark` → `hover:bg-cream-dark dark:hover:bg-dark-border`

Mobile sticky tab bar:
- `bg-white/90 backdrop-blur-sm border-t border-cream-dark` → `bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm border-t border-cream-dark dark:border-dark-border`
- `text-charcoal-light hover:text-sage` → `text-charcoal-light dark:text-dark-text-secondary hover:text-sage`

**Step 4: Commit**

```bash
git add src/pages/ParkDetail.tsx
git commit -m "feat: add dark mode toggle and dark classes to ParkDetail page"
```

---

## Task 9: Dark classes on ParkPanel

**Files:**
- Modify: `src/components/ParkPanel.tsx`

**Step 1: Apply dark: classes**

Key substitutions:

- Panel container `bg-cream/95 backdrop-blur-md shadow-2xl` → `bg-cream/95 dark:bg-dark-bg/95 backdrop-blur-md shadow-2xl`
- `border-cream-dark` → `border-cream-dark dark:border-dark-border`
- Mobile drag handle `bg-charcoal/20` → `bg-charcoal/20 dark:bg-cream/20`
- Sticky header `bg-cream/95 backdrop-blur-md border-b border-cream-dark` → `bg-cream/95 dark:bg-dark-bg/95 backdrop-blur-md border-b border-cream-dark dark:border-dark-border`
- `text-charcoal` → `text-charcoal dark:text-cream`
- `text-charcoal-light` → `text-charcoal-light dark:text-dark-text-secondary`
- `hover:bg-cream-dark` → `hover:bg-cream-dark dark:hover:bg-dark-border`
- `bg-white/60` (weather/campground cards) → `bg-white/60 dark:bg-dark-surface/60`
- Booking button `bg-white border border-cream-dark text-charcoal` → `bg-white dark:bg-dark-surface border border-cream-dark dark:border-dark-border text-charcoal dark:text-cream`
- `hover:bg-cream-dark` → `hover:bg-cream-dark dark:hover:bg-dark-border`

**Step 2: Commit**

```bash
git add src/components/ParkPanel.tsx
git commit -m "feat: add dark classes to ParkPanel"
```

---

## Task 10: Dark classes on FilterBar

**Files:**
- Modify: `src/components/FilterBar.tsx`

**Step 1: Apply dark: classes**

Key substitutions:

- Inactive pill `bg-white/60 text-charcoal-light hover:bg-white/80` → `bg-white/60 dark:bg-dark-surface/60 text-charcoal-light dark:text-dark-text-secondary hover:bg-white/80 dark:hover:bg-dark-surface/80`
- Province/amenity dropdown `bg-white rounded-xl shadow-lg border border-cream-dark` → `bg-white dark:bg-dark-surface rounded-xl shadow-lg border border-cream-dark dark:border-dark-border`
- Dropdown items `hover:bg-cream` → `hover:bg-cream dark:hover:bg-dark-border`
- `text-charcoal` → `text-charcoal dark:text-cream`
- `text-charcoal-light` → `text-charcoal-light dark:text-dark-text-secondary`
- `hover:text-rust` → `hover:text-rust dark:hover:text-rust-light`
- `border-cream-dark/50` → `border-cream-dark/50 dark:border-dark-border/50`

**Step 2: Commit**

```bash
git add src/components/FilterBar.tsx
git commit -m "feat: add dark classes to FilterBar"
```

---

## Task 11: Dark classes on DateRangePicker

**Files:**
- Modify: `src/components/DateRangePicker.tsx`

**Step 1: Apply dark: classes**

Key substitutions:

- Trigger button `border border-cream-dark bg-white text-sm text-charcoal` → `border border-cream-dark dark:border-dark-border bg-white dark:bg-dark-surface text-sm text-charcoal dark:text-cream`
- `hover:border-sage/50` → `hover:border-sage/50 dark:hover:border-sage/40`
- `text-charcoal-light` → `text-charcoal-light dark:text-dark-text-secondary`
- Calendar dropdown `bg-white rounded-2xl shadow-lg border border-cream-dark` → `bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-cream-dark dark:border-dark-border`
- `text-charcoal` → `text-charcoal dark:text-cream`
- `hover:bg-cream-dark` → `hover:bg-cream-dark dark:hover:bg-dark-border`
- Day range band `bg-sage/15` → `bg-sage/15 dark:bg-sage/25`
- The gradient backgrounds use `to-sage/15` — change to include dark variants:
  - `from-transparent from-50% to-sage/15 to-50%` — these are inline so add `dark:` variant won't work directly in ternaries. Instead, for the wrapper bg: leave as-is (sage/15 works on both).
- `text-charcoal/20` (disabled) → `text-charcoal/20 dark:text-cream/20`
- `hover:bg-black/5` → `hover:bg-black/5 dark:hover:bg-white/5`

**Step 2: Commit**

```bash
git add src/components/DateRangePicker.tsx
git commit -m "feat: add dark classes to DateRangePicker"
```

---

## Task 12: Dark classes on WeatherForecast + WeatherAlerts + WeatherSourceBanner + FireDangerBanner

**Files:**
- Modify: `src/components/WeatherForecast.tsx`
- Modify: `src/components/WeatherAlerts.tsx`
- Modify: `src/components/WeatherSourceBanner.tsx`
- Modify: `src/components/FireDangerBanner.tsx`

**Step 1: WeatherForecast.tsx**

- `bg-white/60` → `bg-white/60 dark:bg-dark-surface/60`
- `text-charcoal` → `text-charcoal dark:text-cream`
- `text-charcoal-light` → `text-charcoal-light dark:text-dark-text-secondary`
- Error card `bg-rust/10 border border-rust/20` → leave as-is (rust works on both)

**Step 2: WeatherAlerts.tsx**

- Leave as-is — the alert severity styles use sage/rust with opacity backgrounds, which should work on dark backgrounds.

**Step 3: WeatherSourceBanner.tsx**

- `text-brown-dark` → `text-brown-dark dark:text-brown-light`
- `text-charcoal-light/60` → `text-charcoal-light/60 dark:text-dark-text-secondary/60`

**Step 4: FireDangerBanner.tsx**

- `text-charcoal` → `text-charcoal dark:text-cream`
- `text-charcoal-light` → `text-charcoal-light dark:text-dark-text-secondary`

**Step 5: Commit**

```bash
git add src/components/WeatherForecast.tsx src/components/WeatherAlerts.tsx src/components/WeatherSourceBanner.tsx src/components/FireDangerBanner.tsx
git commit -m "feat: add dark classes to weather components"
```

---

## Task 13: Dark classes on PackingList + Skeleton

**Files:**
- Modify: `src/components/PackingList.tsx`
- Modify: `src/components/Skeleton.tsx`

**Step 1: PackingList.tsx**

- `text-charcoal` → `text-charcoal dark:text-cream`
- `text-charcoal-light` → `text-charcoal-light dark:text-dark-text-secondary`
- `bg-cream-dark overflow-hidden` (progress bar bg) → `bg-cream-dark dark:bg-dark-border overflow-hidden`
- `hover:bg-sage/5` → `hover:bg-sage/5 dark:hover:bg-sage/10`

**Step 2: Skeleton.tsx**

- `bg-cream-dark/60` → `bg-cream-dark/60 dark:bg-dark-border/60`

**Step 3: Commit**

```bash
git add src/components/PackingList.tsx src/components/Skeleton.tsx
git commit -m "feat: add dark classes to PackingList and Skeleton"
```

---

## Task 14: Dark classes on map components (ParkMap controls)

**Files:**
- Modify: `src/components/Map/ParkMap.tsx`

**Step 1: Apply dark: classes to map UI controls**

- Scale label: `bg-white/90 backdrop-blur-sm rounded-xl shadow-sm` → `bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm rounded-xl shadow-sm`
- `text-charcoal-light` → `text-charcoal-light dark:text-dark-text-secondary`
- Zoom buttons: `bg-white/90 backdrop-blur-sm rounded-xl shadow-sm` → `bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm rounded-xl shadow-sm`
- `hover:bg-gray-100` → `hover:bg-gray-100 dark:hover:bg-white/10`
- `text-charcoal-light hover:text-charcoal` → `text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-cream`

**Note:** ParkMarker, ClusterMarker, and UserLocationMarker do NOT need dark mode changes — their colours (sage/brown/rust on opaque backgrounds) work well on both light and dark maps.

**Step 2: Commit**

```bash
git add src/components/Map/ParkMap.tsx
git commit -m "feat: add dark classes to map UI controls"
```

---

## Task 15: Final verification and polish

**Step 1: Run dev server and verify**

Run: `npm run dev`

Check in browser:
1. Toggle button cycles: system → light → dark → system
2. Light mode: no visual regressions from current state
3. Dark mode: all UI surfaces are warm dark, text is cream/light, map has black water and dark land
4. OS preference: toggle to "system", then change OS dark mode — app should follow
5. Persistence: set dark mode, refresh page — should remain dark
6. ParkDetail page: header, weather, campgrounds, packing list all dark
7. No white flashes on page transitions

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 3: Run build**

Run: `npm run build`
Expected: Builds successfully.

**Step 4: Commit any final tweaks**

```bash
git add -A
git commit -m "feat: dark mode polish and final tweaks"
```
