# "You Are Here" Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add IP-based "you are here" marker to the map with distance badges on park markers and a "sort by nearest" filter.

**Architecture:** Fetch user location from ip-api.com on page load, store in React state, compute Haversine distances to all parks, pipe distances through to markers and filters. All new logic lives in `src/lib/geolocation.ts`; UI changes span the map marker, park markers, filter bar, and park panel.

**Tech Stack:** React, MapLibre GL via react-map-gl, ip-api.com (free, no key), Haversine formula, Tailwind CSS v4.

**Design doc:** `docs/plans/2026-02-09-you-are-here-design.md`

---

### Task 1: Create geolocation utilities

**Files:**
- Create: `src/lib/geolocation.ts`

**Step 1: Create `src/lib/geolocation.ts` with `getUserLocation` and `getDistance`**

```ts
export interface UserLocation {
  lat: number
  lng: number
  city?: string
}

export async function getUserLocation(): Promise<UserLocation | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)

    const res = await fetch('http://ip-api.com/json/?fields=lat,lon,city', {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) return null

    const data = await res.json()
    if (typeof data.lat !== 'number' || typeof data.lon !== 'number') return null

    return {
      lat: data.lat,
      lng: data.lon,
      city: data.city || undefined,
    }
  } catch {
    return null
  }
}

/** Haversine distance in kilometres between two lat/lng points. */
export function getDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Format distance for display: "245 km" or "1.2k km". */
export function formatDistance(km: number): string {
  if (km < 1000) return `${Math.round(km)} km`
  return `${(km / 1000).toFixed(1)}k km`
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}
```

**Step 2: Verify the file compiles**

Run: `cd /Users/blakecyze/Documents/AvatoneRepo/woodsmoke && npx tsc --noEmit src/lib/geolocation.ts`
Expected: No errors (or run the dev server and check for no red squiggles).

**Step 3: Commit**

```bash
git add src/lib/geolocation.ts
git commit -m "feat: add geolocation utilities (IP lookup + Haversine distance)"
```

---

### Task 2: Add pulse animation CSS

**Files:**
- Modify: `src/index.css` (append after line 80)

**Step 1: Add the pulse-ring keyframes and utility class to `src/index.css`**

Append after the `.animate-slide-up` block (after line 80):

```css
/* User location pulse animation */
@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}

.animate-pulse-ring {
  animation: pulse-ring 1.5s ease-out infinite;
}
```

**Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: add pulse-ring animation for user location marker"
```

---

### Task 3: Create UserLocationMarker component

**Files:**
- Create: `src/components/Map/UserLocationMarker.tsx`

**Step 1: Create the marker component**

```tsx
import { Marker } from 'react-map-gl/maplibre'
import type { UserLocation } from '../../lib/geolocation'

interface UserLocationMarkerProps {
  location: UserLocation
}

export default function UserLocationMarker({ location }: UserLocationMarkerProps) {
  return (
    <Marker longitude={location.lng} latitude={location.lat} anchor="center">
      <div className="flex flex-col items-center pointer-events-none">
        <div className="relative flex items-center justify-center">
          {/* Pulsing ring */}
          <div className="absolute w-3 h-3 rounded-full bg-rust/40 animate-pulse-ring" />
          {/* Solid dot */}
          <div className="w-3 h-3 rounded-full bg-rust border-2 border-white shadow-md" />
        </div>
        <div className="mt-1 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap bg-charcoal/80 text-white">
          {location.city ?? 'You are here'}
        </div>
      </div>
    </Marker>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/Map/UserLocationMarker.tsx
git commit -m "feat: add UserLocationMarker component with pulsing dot"
```

---

### Task 4: Wire up location fetch and distance computation in Home.tsx

**Files:**
- Modify: `src/pages/Home.tsx`

**Step 1: Add imports**

At the top of `src/pages/Home.tsx`, after the existing imports, add:

```ts
import { useState, useMemo, useEffect } from 'react'  // add useEffect to existing import
import { getUserLocation, getDistance, type UserLocation } from '../lib/geolocation'
```

(The existing `import { useState, useMemo } from 'react'` on line 1 needs `useEffect` added.)

**Step 2: Add location state and fetch**

Inside the `Home` component, after the `requiredAmenities` state (line 19), add:

```ts
const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
const [sortByNearest, setSortByNearest] = useState(false)

useEffect(() => {
  getUserLocation().then(setUserLocation)
}, [])
```

**Step 3: Add distance lookup**

After the `filteredParks` useMemo block (after line 45), add:

```ts
const distanceLookup = useMemo(() => {
  if (!userLocation) return {} as Record<string, number>
  const lookup: Record<string, number> = {}
  for (const p of typedParks) {
    lookup[p.id] = getDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
  }
  return lookup
}, [userLocation])
```

**Step 4: Add sorted parks**

After `distanceLookup`, add:

```ts
const sortedParks = useMemo(() => {
  if (!sortByNearest || !userLocation) return filteredParks
  return [...filteredParks].sort(
    (a, b) => (distanceLookup[a.id] ?? 0) - (distanceLookup[b.id] ?? 0)
  )
}, [filteredParks, sortByNearest, userLocation, distanceLookup])
```

**Step 5: Update FilterBar props**

In the JSX, update the `<FilterBar>` component to pass new props:

```tsx
<FilterBar
  parkType={parkType}
  onParkTypeChange={setParkType}
  province={province}
  onProvinceChange={setProvince}
  requiredAmenities={requiredAmenities}
  onRequiredAmenitiesChange={setRequiredAmenities}
  onClearAll={clearAllFilters}
  sortByNearest={sortByNearest}
  onSortByNearestChange={setSortByNearest}
  hasUserLocation={userLocation !== null}
/>
```

**Step 6: Update ParkMap props**

Change the `<ParkMap>` JSX to pass `sortedParks`, `userLocation`, and `distanceLookup`:

```tsx
<ParkMap
  parks={sortedParks}
  selectedPark={selectedPark}
  onSelectPark={setSelectedPark}
  onDeselectPark={() => {
    setSelectedPark(null)
    sessionStorage.removeItem('woodsmoke:lastParkId')
  }}
  userLocation={userLocation}
  distanceLookup={distanceLookup}
/>
```

**Step 7: Update ParkPanel props**

Change the `<ParkPanel>` JSX to pass distance:

```tsx
{selectedPark && (
  <ParkPanel
    park={selectedPark}
    onClose={() => {
      setSelectedPark(null)
      sessionStorage.removeItem('woodsmoke:lastParkId')
    }}
    distance={distanceLookup[selectedPark.id]}
  />
)}
```

**Step 8: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: wire up location fetch, distance lookup, and sort state in Home"
```

---

### Task 5: Update ParkMap to render UserLocationMarker and pass distances

**Files:**
- Modify: `src/components/Map/ParkMap.tsx`

**Step 1: Add imports and update props interface**

Add import at top:

```ts
import UserLocationMarker from './UserLocationMarker'
import type { UserLocation } from '../../lib/geolocation'
```

Update the `ParkMapProps` interface:

```ts
interface ParkMapProps {
  parks: Park[]
  selectedPark: Park | null
  onSelectPark: (park: Park) => void
  onDeselectPark: () => void
  userLocation: UserLocation | null
  distanceLookup: Record<string, number>
}
```

Update the destructure:

```ts
export default function ParkMap({ parks, selectedPark, onSelectPark, onDeselectPark, userLocation, distanceLookup }: ParkMapProps) {
```

**Step 2: Pass distance to ParkMarker**

In the clusters `.map()`, where `ParkMarker` is rendered (around line 147), add the `distance` prop:

```tsx
<ParkMarker
  key={park.id}
  park={park}
  onClick={onSelectPark}
  isSelected={selectedPark?.id === park.id}
  distance={distanceLookup[park.id]}
/>
```

**Step 3: Render UserLocationMarker**

Inside the `<Map>` component, after `<NavigationControl />` (line 124) and before the clusters `.map()`, add:

```tsx
{userLocation && <UserLocationMarker location={userLocation} />}
```

**Step 4: Commit**

```bash
git add src/components/Map/ParkMap.tsx
git commit -m "feat: render user location marker and pass distances to park markers"
```

---

### Task 6: Add distance badge to ParkMarker

**Files:**
- Modify: `src/components/Map/ParkMarker.tsx`

**Step 1: Add import and update props**

Add import at top:

```ts
import { formatDistance } from '../../lib/geolocation'
```

Update the interface:

```ts
interface ParkMarkerProps {
  park: Park
  onClick: (park: Park) => void
  isSelected: boolean
  distance?: number
}
```

Update the destructure:

```ts
export default function ParkMarker({ park, onClick, isSelected, distance }: ParkMarkerProps) {
```

**Step 2: Add distance badge below the park name label**

After the park name `<div>` (the one ending at line 52), add:

```tsx
{distance !== undefined && (
  <div className="px-1.5 py-0.5 rounded text-[9px] text-charcoal/50 whitespace-nowrap">
    {formatDistance(distance)}
  </div>
)}
```

So the full button contents become: icon circle → park name label → distance badge.

**Step 3: Commit**

```bash
git add src/components/Map/ParkMarker.tsx
git commit -m "feat: add distance badge to park markers"
```

---

### Task 7: Add "Sort by: Nearest" toggle to FilterBar

**Files:**
- Modify: `src/components/FilterBar.tsx`

**Step 1: Update the FilterBar interface and destructure**

Add three new props to `FilterBarProps`:

```ts
interface FilterBarProps {
  parkType: 'all' | 'national' | 'provincial'
  onParkTypeChange: (type: 'all' | 'national' | 'provincial') => void
  province: Province | 'all'
  onProvinceChange: (province: Province | 'all') => void
  requiredAmenities: Amenity[]
  onRequiredAmenitiesChange: (amenities: Amenity[]) => void
  onClearAll: () => void
  sortByNearest: boolean
  onSortByNearestChange: (sort: boolean) => void
  hasUserLocation: boolean
}
```

Update the destructure to include:

```ts
export default function FilterBar({
  parkType,
  onParkTypeChange,
  province,
  onProvinceChange,
  requiredAmenities,
  onRequiredAmenitiesChange,
  onClearAll,
  sortByNearest,
  onSortByNearestChange,
  hasUserLocation,
}: FilterBarProps) {
```

**Step 2: Add the sort toggle pills**

After the park type pills `<div>` (after line 95, after the closing `</div>` of the `flex gap-1` div), add:

```tsx
{/* Sort by nearest — only shown when location available */}
{hasUserLocation && (
  <div className="flex gap-1 border-l border-cream-dark/50 pl-2">
    <button
      type="button"
      onClick={() => onSortByNearestChange(!sortByNearest)}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        sortByNearest
          ? 'bg-rust text-white'
          : 'bg-white/60 text-charcoal-light hover:bg-white/80'
      }`}
    >
      Nearest
    </button>
  </div>
)}
```

**Step 3: Commit**

```bash
git add src/components/FilterBar.tsx
git commit -m "feat: add sort-by-nearest toggle to filter bar"
```

---

### Task 8: Show distance in ParkPanel

**Files:**
- Modify: `src/components/ParkPanel.tsx`

**Step 1: Add import and update props**

Add import:

```ts
import { formatDistance } from '../lib/geolocation'
```

Update the interface:

```ts
interface ParkPanelProps {
  park: Park
  onClose: () => void
  distance?: number
}
```

Update the destructure:

```ts
export default function ParkPanel({ park, onClose, distance }: ParkPanelProps) {
```

**Step 2: Add distance display**

In the "Location & Season" section (around line 110-119), after the `<span>` containing the `MapPin` and `park.province`, add:

```tsx
{distance !== undefined && (
  <span className="flex items-center gap-1 text-rust">
    {formatDistance(distance)} away
  </span>
)}
```

**Step 3: Commit**

```bash
git add src/components/ParkPanel.tsx
git commit -m "feat: show distance in park panel"
```

---

### Task 9: Verify everything works end-to-end

**Step 1: Start the dev server**

Run: `cd /Users/blakecyze/Documents/AvatoneRepo/woodsmoke && npm run dev`

**Step 2: Check for TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Manual verification checklist**

- [ ] Map loads with a pulsing rust dot at user's estimated location
- [ ] City name (or "You are here") label appears below the dot
- [ ] Park markers show distance badges (e.g. "245 km")
- [ ] Distance badges don't appear on cluster markers
- [ ] "Nearest" pill appears in filter bar
- [ ] Clicking "Nearest" pill highlights it in rust
- [ ] Park panel shows "X km away" line
- [ ] If IP geolocation fails (e.g. ad blocker), map works normally with no errors — "Nearest" pill doesn't appear, no distance badges, no location marker

**Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```
