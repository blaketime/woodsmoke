# Fire Danger Integration — Design

**Date:** 2026-02-09
**Status:** Approved

## Overview

Integrate Canadian Forest Fire Weather Index (FWI) data into the park detail page, displaying fire danger levels alongside the existing weather forecast and connecting it to the alert system and packing list generator.

## Data Source

Open-Meteo already powers all weather data. The `daily` parameter accepts `fire_weather_index`, available on both the forecast and archive endpoints. No new API, no new keys — just an extra field on existing requests.

### FWI to Danger Level Mapping

Standard Canadian thresholds:

| FWI Score | Level      | Colour              |
|-----------|------------|----------------------|
| 0–5       | Low        | `#87946F` (sage)     |
| 5–12      | Moderate   | `#D4A843` (amber)    |
| 12–22     | High       | `#E07832` (orange)   |
| 22–38     | Very High  | `#C4663A` (rust/red) |
| 38+       | Extreme    | `#8B2500` (dark red) |

### Type Changes

Add to `WeatherDay`:

```ts
fireWeatherIndex: number | null
fireDangerLevel: 'low' | 'moderate' | 'high' | 'very_high' | 'extreme'
```

## Display

### Summary Banner

A `FireDangerBanner` component inside the Weather card, between `DateRangePicker` and `WeatherAlerts`.

- **Left:** `Flame` icon (Lucide) tinted to danger colour
- **Centre:** "Fire Danger: **{Level}**" with coloured level text
- **Right:** Contextual message — "Campfires likely permitted" (Low/Moderate) or "Campfire bans may be in effect" (High+)
- **Background:** Subtle tinted wash at ~10% opacity, rounded pill — matches weather source banner styling

Shows peak danger level across the selected date range. Always visible (reassuring at Low, prominent at High+).

### Per-Day Dots

Each day card in `WeatherForecast` gets a small coloured circle (8px) in the corner with a `title` attribute showing the level name. No extra text — the banner provides context, the dots show progression across the trip.

## Alerts Integration

Two new fire alert tiers in `generateAlerts()`:

- **High / Very High** — `severity: 'warning'`: "Fire danger is elevated — campfire restrictions may be in effect. Check with park staff before lighting fires and never leave a fire unattended."
- **Extreme** — `severity: 'danger'`: "Extreme fire danger — campfire bans are highly likely. Bring a camp stove for cooking and avoid all open flames."

Feeds into the existing `WeatherAlerts` component unchanged.

## Packing List Integration

In `generatePackingList()`, fire danger drives two adjustments:

- **High or above:** Remove "firewood" and "fire starters". Add "camp stove + fuel canister" to `cooking_food` with reason "Fire restrictions likely — bring a stove for cooking."
- **Extreme:** Additionally add "battery lantern" to `extras` with reason "Open flame restrictions — skip candles and lanterns with real flames."

## Files Changed

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add `fireWeatherIndex` and `fireDangerLevel` to `WeatherDay` |
| `src/lib/weather.ts` | Add `fire_weather_index` to API calls, add `getFwiDangerLevel()` helper, add fire alerts in `generateAlerts()` |
| `src/lib/packing.ts` | Add fire-aware packing rules |
| `src/components/FireDangerBanner.tsx` | New component: summary banner |
| `src/components/WeatherForecast.tsx` | Add coloured fire danger dot to each day card |

Five files touched, one new component. All existing components (WeatherAlerts, PackingList, ParkDetail) work unchanged.
