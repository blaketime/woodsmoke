# Dark Mode Toggle — Design

**Date:** 2026-02-12
**Status:** Approved

## Overview

Add a dark mode toggle to Woodsmoke that respects the user's OS preference (`prefers-color-scheme`) but allows manual override. The dark theme uses a warm inversion of the existing palette to preserve brand identity. The map switches to a dark style with black water and lighter land.

## Decisions

- **Approach:** Tailwind `dark:` variant classes on components + `dark` class on `<html>`
- **State source:** OS preference as default, manual toggle persisted in `localStorage`
- **Toggle placement:** Header bar (Sun/Moon icon), same glass-morphic style as search/filter buttons
- **Palette direction:** Warm inversion — dark browns/charcoals for backgrounds, cream for text
- **Map:** Second overrides object (`themeOverridesDark`) — water becomes `#000000`, land lightens

## Theme State Management

React context (`ThemeContext`) in `src/lib/theme.tsx`:

- Stores user preference: `'light' | 'dark' | 'system'`
- Reads from `localStorage('woodsmoke:theme')` on mount, defaults to `'system'`
- Resolves effective mode via `window.matchMedia('(prefers-color-scheme: dark)')`
- Listens for OS changes when in `'system'` mode
- Toggles `dark` class on `<html>`
- Exposes `useTheme()` hook returning `{ mode, effectiveMode, setMode }`

## Toggle Button

- Sun/Moon icon in the header bar (both Home and ParkDetail pages)
- Clicking cycles: system -> light -> dark -> system
- Icon reflects effective mode (Sun = light, Moon = dark)
- Style: `bg-white/90 dark:bg-charcoal/90 backdrop-blur-sm rounded-xl shadow-sm`

## Dark UI Palette

| Token            | Light              | Dark                |
|------------------|--------------------|---------------------|
| Page background  | `#F5F0E8` (cream)  | `#1A1A18`           |
| Surface / cards  | `white/90`         | `#2D2B28`           |
| Primary text     | `#2D2D2D`          | `#F5F0E8`           |
| Secondary text   | `#4A4A4A`          | `#B0A898`           |
| Borders          | `#E8E0D4`          | `#3A3835`           |
| Sage accent      | unchanged          | slightly brightened  |
| Rust accent      | unchanged          | slightly brightened  |
| Paper grain      | `opacity: 0.03`    | `opacity: 0.02`     |

## Dark Map Style

Second overrides object (`themeOverridesDark`) in `src/lib/map-theme.ts`:

- **Water:** `#000000` (pure black)
- **Background/land:** `#2A2826` (warm dark)
- **Roads:** Subtle light lines on dark background
- **Labels:** Light text with dark halos
- **Parks:** Faint sage glow on dark
- **Boundaries:** Brown accent, slightly lightened

The `useMapStyle` hook accepts theme from context. On theme change, applies appropriate overrides to the cached Liberty style.

## Tailwind Configuration

Enable class-based dark mode in Tailwind v4 via `@custom-variant` in `src/index.css`:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

## Component Changes

All ~14 component files + 2 pages get `dark:` variants. Key patterns:

- `bg-white/90` -> `bg-white/90 dark:bg-[#2D2B28]/90`
- `text-charcoal` -> `text-charcoal dark:text-cream`
- `bg-cream` -> `bg-cream dark:bg-[#1A1A18]`
- `border-cream-dark` -> `border-cream-dark dark:border-[#3A3835]`

## Files Touched

- `src/index.css` — dark variant config, dark base styles, paper grain dark override
- `src/lib/theme.tsx` — new: ThemeContext + useTheme hook
- `src/lib/map-theme.ts` — add `themeOverridesDark` export
- `src/lib/map-style.ts` — accept theme param
- `src/hooks/useMapStyle.ts` — consume theme context
- `src/App.tsx` — wrap with ThemeProvider
- `src/pages/Home.tsx` — toggle button + dark: classes
- `src/pages/ParkDetail.tsx` — toggle button + dark: classes
- `src/components/**/*.tsx` — dark: classes on all components
