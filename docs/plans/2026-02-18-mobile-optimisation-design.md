# Mobile Optimisation — Surgical Fixes

**Date:** 2026-02-18
**Scope:** High-impact only — 4 targeted fixes for mobile UX issues on the Home/map page.
**Constraint:** Desktop must remain untouched.

---

## Fix 1: Header filter overflow

**Problem:** Filter pills expand inline (`max-w-[800px]`, `whitespace-nowrap`) in the header row, pushing content off-screen on mobile.

**Solution:** On mobile (`< sm`), render open filters as a second row below the header bar instead of inline beside the toggle. The header row stays compact: `[Woodsmoke] [theme] [filters-toggle] [search-toggle]`. Filter pills appear in a full-width row underneath with horizontal scroll, same frosted-glass style.

**Files:** `src/pages/Home.tsx`

## Fix 2: FlyTo padding for bottom sheet

**Problem:** `flyTo` uses `padding: { right: 380 }` (desktop sidebar offset). On mobile the panel is a bottom sheet covering ~60vh, so the selected marker lands underneath it.

**Solution:** At flyTo time, check `window.innerWidth < 640`. If mobile, use `padding: { top: 50, bottom: window.innerHeight * 0.6, left: 50, right: 50 }`. Desktop keeps `right: 380`.

**Files:** `src/components/Map/ParkMap.tsx`

## Fix 3: Panel top gap

**Problem:** Drag handle div (`pt-2 pb-1`) above the image creates an ugly cream bar with map bleeding through `rounded-t-2xl` corners.

**Solution:** Move the hero image to be the first child of the panel (before drag handle). Overlay the drag handle on top of the image with absolute positioning and semi-transparent pill. `rounded-t-2xl` clips the image naturally — no gap. Falls back to current layout if no image.

**Files:** `src/components/ParkPanel.tsx`

## Fix 4: Search dropdown overflow

**Problem:** Search results dropdown (`w-72`) overflows viewport on narrow phones.

**Solution:** Add `max-w-[calc(100vw-2rem)]` to the dropdown container.

**Files:** `src/pages/Home.tsx`
