# Mobile Optimisation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the 4 highest-impact mobile UX issues on the Home/map page so the app feels usable on phones.

**Architecture:** Surgical CSS/layout changes to 3 existing files. No new components, no new dependencies. Desktop must remain pixel-identical.

**Tech Stack:** React, Tailwind CSS v4 (responsive prefixes: `sm:` = 640px+), MapLibre GL JS

---

### Task 1: Fix header filter overflow on mobile

**Files:**
- Modify: `src/pages/Home.tsx:154-193` (filter section in header)

**Step 1: Hide inline filter expansion on mobile**

In `src/pages/Home.tsx`, find the filter expansion container (the `<div>` with `transition-[max-width,opacity,height]`). Add `hidden sm:block` so it only shows on desktop:

```tsx
{/* Desktop inline filters — hidden on mobile */}
<div
  className={`hidden sm:block transition-[max-width,opacity,height] duration-300 ease-in-out ${
    filtersOpen ? 'max-w-[800px] opacity-100 h-9' : 'max-w-0 h-0 opacity-0'
  } ${filtersExpanded ? 'overflow-visible' : 'overflow-hidden'}`}
>
  <div className="flex items-center gap-2 px-3 py-1.5 whitespace-nowrap">
    <FilterBar
      parkType={parkType}
      onParkTypeChange={setParkType}
      province={province}
      onProvinceChange={setProvince}
      requiredAmenities={requiredAmenities}
      onRequiredAmenitiesChange={setRequiredAmenities}
      onClearAll={clearAllFilters}
      nearbyOnly={nearbyOnly}
      onNearbyOnlyChange={setNearbyOnly}
      hasUserLocation={userLocation !== null}
    />
  </div>
</div>
```

**Step 2: Add mobile filter row below header**

After the closing `</div>` of the `flex items-center justify-between gap-3` container (line ~250), add a mobile-only filter row inside the `<header>`:

```tsx
{/* Mobile filter row — below header icons */}
{filtersOpen && (
  <div className="sm:hidden mt-3 pointer-events-auto animate-slide-up">
    <div className="bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm rounded-xl shadow-sm px-3 py-2 flex items-center gap-2 overflow-x-auto">
      <FilterBar
        parkType={parkType}
        onParkTypeChange={setParkType}
        province={province}
        onProvinceChange={setProvince}
        requiredAmenities={requiredAmenities}
        onRequiredAmenitiesChange={setRequiredAmenities}
        onClearAll={clearAllFilters}
        nearbyOnly={nearbyOnly}
        onNearbyOnlyChange={setNearbyOnly}
        hasUserLocation={userLocation !== null}
      />
    </div>
  </div>
)}
```

**Step 3: Verify visually**

Run: `npm run dev`
Open Chrome DevTools, toggle mobile viewport (375px width).
- Tap filter icon → filter pills appear in row below header, horizontally scrollable
- Tap filter icon again → row disappears
- Resize to desktop → filters expand inline as before (no change)

**Step 4: Commit**

```
git add src/pages/Home.tsx
git commit -m "fix(mobile): filters drop to second row below header on small screens"
```

---

### Task 2: Fix flyTo padding for mobile bottom sheet

**Files:**
- Modify: `src/components/Map/ParkMap.tsx:105-110` (flyTo call)

**Step 1: Make flyTo padding responsive**

Replace the current `flyTo` call:

```tsx
// Current:
mapRef.current.flyTo({
  center: [selectedPark.lng, selectedPark.lat],
  zoom: 10,
  duration: 1200,
  padding: { top: 50, bottom: 50, left: 50, right: 380 },
})
```

With:

```tsx
const isMobile = window.innerWidth < 640
mapRef.current.flyTo({
  center: [selectedPark.lng, selectedPark.lat],
  zoom: 10,
  duration: 1200,
  padding: isMobile
    ? { top: 50, bottom: Math.round(window.innerHeight * 0.6), left: 50, right: 50 }
    : { top: 50, bottom: 50, left: 50, right: 380 },
})
```

**Step 2: Verify visually**

Run dev server, mobile viewport.
- Tap a park marker → map animates so marker is centred in the visible space above the bottom sheet
- Resize to desktop → marker still offsets right for sidebar panel

**Step 3: Commit**

```
git add src/components/Map/ParkMap.tsx
git commit -m "fix(mobile): centre selected marker above bottom sheet instead of sidebar offset"
```

---

### Task 3: Fix panel top gap — image bleeds to top edge

**Files:**
- Modify: `src/components/ParkPanel.tsx:70-88` (drag handle + hero image)

**Step 1: Restructure panel top**

Replace the current drag handle + hero image section (lines 70-88):

```tsx
{/* Mobile drag handle */}
<div className="flex justify-center pt-2 pb-1 sm:hidden">
  <div className="w-10 h-1 rounded-full bg-charcoal/20 dark:bg-cream/20" />
</div>

{/* Hero thumbnail */}
{park.imageUrl && (
  <div className="h-32 overflow-hidden relative">
    {!imageLoaded && <Skeleton className="absolute inset-0 rounded-none" />}
    <img
      ref={imgRef}
      src={park.imageUrl}
      alt={park.name}
      className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={() => setImageLoaded(true)}
    />
  </div>
)}
```

With:

```tsx
{/* Hero image with overlaid drag handle (mobile) */}
{park.imageUrl ? (
  <div className="h-36 sm:h-32 overflow-hidden relative">
    {!imageLoaded && <Skeleton className="absolute inset-0 rounded-none" />}
    <img
      ref={imgRef}
      src={park.imageUrl}
      alt={park.name}
      className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={() => setImageLoaded(true)}
    />
    {/* Mobile drag handle — overlaid on image */}
    <div className="absolute top-0 left-0 right-0 flex justify-center pt-2 pb-1 sm:hidden">
      <div className="w-10 h-1 rounded-full bg-white/50" />
    </div>
  </div>
) : (
  /* Fallback drag handle when no image */
  <div className="flex justify-center pt-2 pb-1 sm:hidden">
    <div className="w-10 h-1 rounded-full bg-charcoal/20 dark:bg-cream/20" />
  </div>
)}
```

Key changes:
- Image is now first child → fills rounded corners, no gap
- Drag handle overlays the image with `absolute` positioning and `bg-white/50` for visibility
- Mobile image is `h-36` (slightly taller for more visual impact), desktop stays `h-32`
- No-image fallback preserves the original drag handle

**Step 2: Verify visually**

Mobile viewport:
- Tap a park with an image → panel slides up, image fills to the very top with rounded corners, subtle drag handle pill overlaid
- No cream gap between map and image
- Desktop: panel still looks the same (drag handle was already `sm:hidden`, image height unchanged at `h-32`)

**Step 3: Commit**

```
git add src/components/ParkPanel.tsx
git commit -m "fix(mobile): hero image bleeds to panel top, drag handle overlays image"
```

---

### Task 4: Fix search dropdown overflow

**Files:**
- Modify: `src/pages/Home.tsx:224` (search results dropdown)

**Step 1: Constrain dropdown width**

Find the search results dropdown container:

```tsx
<div className="absolute top-full right-0 mt-2 w-72 bg-white/95 ...">
```

Add `max-w-[calc(100vw-2rem)]`:

```tsx
<div className="absolute top-full right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white/95 ...">
```

**Step 2: Verify visually**

Mobile viewport (375px):
- Open search, type a query → dropdown fits within viewport with 1rem padding each side
- Desktop: dropdown still `w-72` as before

**Step 3: Commit**

```
git add src/pages/Home.tsx
git commit -m "fix(mobile): constrain search dropdown to viewport width"
```
