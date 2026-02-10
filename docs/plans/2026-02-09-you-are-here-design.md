# "You Are Here" — Location Marker & Distance Badges

**Date:** 2026-02-09
**Status:** Approved

## Summary

Add a "you are here" marker to the map using IP-based geolocation, show distance badges on park markers, and allow sorting parks by nearest.

## Location Detection

- Use **ip-api.com** free endpoint to estimate user location on page load
- Endpoint: `http://ip-api.com/json/?fields=lat,lon,city,regionName`
- Fires once via `useEffect` in `Home.tsx`
- 2-second timeout — if it fails, the feature silently doesn't appear
- No browser permission prompt required
- Accuracy: city level (~10-50 km), sufficient for "nearest parks"
- New utility: `getUserLocation()` in `src/lib/geolocation.ts` returning `{ lat: number; lng: number; city?: string } | null`

## Map Marker

- New `UserLocationMarker.tsx` component in `src/components/Map/`
- Pulsing dot: 12px circle in rust (#C4663A) with animated ring
- Label below: detected city name (e.g. "Toronto") or "You are here" fallback
- Renders above park markers, below selected park panel
- Non-interactive (click does nothing)

## Distance Badges

- Haversine formula in `getDistance()` utility in `src/lib/geolocation.ts`
- Each unclustered `ParkMarker` shows a distance badge below the park name (e.g. "245 km")
- Formatting: under 1,000 km = "245 km", over 1,000 km = "1.2k km"
- Styled in charcoal with reduced opacity
- Cluster markers do NOT show distance
- Distances computed once via `useMemo`, passed as `Record<string, number>` lookup

## Sort by Nearest

- New "Sort by" toggle pills in `FilterBar`: "Default" | "Nearest"
- Styled to match existing National/Provincial type filter pills
- Sorts filtered parks array by distance ascending
- "Nearest" pill only rendered when user location is available
- Park panel shows distance line (e.g. "245 km from you") below park name

## File Changes

### New Files
| File | Purpose | ~Lines |
|------|---------|--------|
| `src/lib/geolocation.ts` | `getUserLocation()` + `getDistance()` | ~40 |
| `src/components/Map/UserLocationMarker.tsx` | Pulsing location dot | ~30 |

### Modified Files
| File | Change |
|------|--------|
| `src/pages/Home.tsx` | Location fetch, distance computation, sort state |
| `src/components/Map/ParkMap.tsx` | Render `UserLocationMarker` |
| `src/components/Map/ParkMarker.tsx` | Accept + render distance badge |
| `src/components/FilterBar.tsx` | Add "Sort by: Nearest" toggle |
| `src/components/ParkPanel.tsx` | Show distance line |
| `src/index.css` | Pulse animation keyframes |

### Not Touched
Park data, types, weather, packing list, routing, park detail page.
