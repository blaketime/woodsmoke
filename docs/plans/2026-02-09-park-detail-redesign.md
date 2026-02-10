# Park Detail Page Redesign

## Problem

The current ParkDetail page is a vertical stack of 8 identical `bg-white/60 p-6 rounded-2xl` cards on cream. It's monotonous, uncohesive, and buries the planning tools (weather, campgrounds, packing) under decorative content. The page serves trip planning but doesn't feel like a planner.

## Design Goals

- Break the "blocks above blocks" monotony with two distinct visual zones
- Prioritise planning tools (weather, campgrounds, packing list) — make them always accessible
- Keep the topo/outdoor aesthetic but make the layout feel modern and purposeful
- No changes to child component internals (WeatherForecast, PackingList, etc.)

## Layout: Two-Column Magazine Style

### Desktop (lg+)

Two columns: **left (~60%)** for park identity, **right (~40%)** as a sticky planning toolkit.

### Left Column — Park Identity

- **Hero image**: Tall (~50vh), flush to content area top, no padding above
- **Park name + type badge + province**: Frosted-glass strip overlaid at bottom of hero image (not a separate card)
- **Description**: Plain text on cream background, no card wrapper. Subtle sage rule line above. Editorial feel.
- **Season dates**: Small detail line below description — "Open May 15 – Oct 15" in charcoal-light
- **Activities**: Sage-tinted pills flowing inline after the season line, not in a separate card
- **Booking CTA**: Full-width rust button at the end of the left column

Visual feel: calm, editorial, confident. No boxes. Just image → text → tags → action.

### Right Column — Planning Toolkit

Sits on `bg-white/40` with a subtle left border in `sage/20`. Sticky positioning so it stays visible while scrolling the left column.

1. **Date range picker** — compact, at the top. Drives everything below it.
2. **Weather forecast** — compact vertical list (one row per day: date, icon, high/low, precip). Fire danger and alerts appear as inline coloured accent bars within relevant days, not as separate banner components.
3. **Campground selector** — segmented control/tab strip for 2-3 campgrounds, dropdown if more. Selected campground details in a single line (terrain, bear country, sites). Amenities as tiny icon dots, not text pills.
4. **Packing list** — fills remaining space. Collapsible categories remain but tighter/more compact.

### Mobile (below lg)

Single column, but not a naive stack:

- **Hero image**: Full-bleed edge-to-edge with name overlay
- **Description, season, activities, booking CTA**: Flow as body content on cream
- **Planning toolkit** (weather, campgrounds, packing): Below editorial content
- **Sticky bottom tab bar**: Three icons — cloud (weather), tent (campground), backpack (packing). Tapping smooth-scrolls to that section.
- **Date range picker**: Pins to top of planning section

## What Changes

| Before | After |
|--------|-------|
| 8 identical white boxes stacked vertically | 2 distinct zones with different visual treatments |
| Hero image and title in separate cards | Merged — title overlays hero image |
| Description, activities, booking each in own card | Flow as unwrapped editorial content |
| Planning tools buried in scroll | Sticky sidebar on desktop, sticky nav tab on mobile |
| Weather as horizontal card scroll | Compact vertical rows |
| Campground cards in a grid | Segmented control / tab strip |

## Files Modified

- `src/pages/ParkDetail.tsx` — full rewrite of the layout/structure (the only significant change)
- `src/index.css` — any new utility animations or styles needed

## Files NOT Modified

- `src/components/WeatherForecast.tsx` — keep internals, may adjust props if needed
- `src/components/PackingList.tsx` — keep internals
- `src/components/DateRangePicker.tsx` — keep internals
- All other child components — no changes

## Out of Scope

- Park data changes
- Weather API changes
- Packing logic changes
- Navigation/routing changes
