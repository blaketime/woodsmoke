# 🏕️ Woodsmoke — Canadian Camping Trip Planner
### woodsmoke.app | DeveloperWeek 2026 Hackathon Build Plan

> *"I wanted to plan a weekend camping trip and had to check Parks Canada for availability, Environment Canada for weather, and then Google what to pack for shoulder season in Gatineau Park. Why isn't this one thing?"*

---

## The Concept

**Woodsmoke** is a beautifully designed webapp that helps you plan camping trips across Canada's national and provincial parks. Select a park on an interactive topo-styled map, explore campground details and amenities, check the weather forecast, and get a smart packing list tailored to your trip.

**Problem:** Planning a camping trip in Canada means juggling 5+ websites — Parks Canada, provincial park sites, weather services, gear checklists, and random blog posts. There's no single, well-designed tool that brings it all together.

**Target user:** Canadian campers (beginner to experienced) planning weekend or multi-day trips.

---

## Visual Direction

**Aesthetic:** Topographic map meets modern field guide

- **Palette:** Muted earth tones — sage green (#87946F), warm brown (#8B7355), cream/off-white (#F5F0E8), charcoal (#2D2D2D), with a rust accent (#C4663A) for CTAs and highlights
- **Typography:** A distinctive serif or slab-serif for headings (e.g. `DM Serif Display`, `Fraunces`, or `Playfair Display`), paired with a clean sans for body text (e.g. `DM Sans` or `Outfit`)
- **Textures:** Subtle paper/grain texture overlays, contour line patterns as decorative elements, maybe a topo-line SVG pattern in backgrounds/cards
- **Map style:** Custom Mapbox style — muted greens/browns, visible terrain/contour lines, minimal labels. Think trail map, not Google Maps
- **Cards/UI:** Slightly rounded, subtle shadows, maybe a torn-paper or stamp-like motif for park badges
- **Iconography:** Line-art style icons for amenities (tent, fire pit, water, outhouse, bear locker, etc.)

**One thing someone will remember:** The map. A full-bleed, beautifully styled topographic map that feels like unfolding a real trail map on a picnic table.

---

## Core Features (MVP)

### 1. Interactive Map View (HOME)
- Full-screen Mapbox GL map with custom topo styling
- Park markers (national + provincial) clustered by zoom level
- Click a marker → slide-in panel with park overview
- Search/filter by province, park type, amenities

### 2. Park Detail Panel / Page
- Park name, province, description, hero image (if available)
- Campground list with amenities (icons): fire pits, potable water, showers, flush toilets, bear lockers, boat launch, trails, swimming, etc.
- Season dates (when open)
- Link to official booking page

### 3. Weather Forecast
- 7-day forecast pulled from Open-Meteo API using park coordinates
- Clean weather cards showing temp high/low, precipitation %, conditions
- Weather-aware alerts: "Rain expected Thursday — bring a tarp" / "Overnight lows near 2°C — bring a cold-weather sleeping bag"

### 4. Smart Packing List Generator
- Based on: trip duration, season/dates, weather forecast, park amenities, activity type
- Categories: Shelter & Sleep, Clothing, Cooking & Food, Safety & Navigation, Extras
- Conditional logic: no potable water → "bring water filter/tablets", bear country → "bear canister or hang kit", rain forecast → "tarp + rain gear", winter → "4-season tent, insulated pad"
- Checkable list UI that feels satisfying to interact with
- Could optionally use an LLM to generate food suggestions / meal plan based on trip length and conditions

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | **Next.js 14** (App Router) |
| Styling | **Tailwind CSS** + custom CSS for textures/effects |
| Map | **Mapbox GL JS** via `react-map-gl` |
| Weather API | **Open-Meteo** (free, no key needed) |
| Packing Logic | Rule-based engine (JS), optionally enhanced with OpenAI/Anthropic API for food/meal suggestions |
| Park Data | **Static JSON dataset** (curated, bundled with app) |
| Fonts | Google Fonts (DM Serif Display + DM Sans, or similar) |
| Icons | Custom SVG line-art or Lucide icons |
| Hosting | **Vercel** (free tier, instant deploy) |

---

## Data Strategy

### Park Dataset (static JSON)
Rather than scraping live, pre-build a curated dataset. This is more reliable and lets you control quality.

**Structure per park:**
```json
{
  "id": "algonquin",
  "name": "Algonquin Provincial Park",
  "province": "Ontario",
  "type": "provincial",
  "lat": 45.5631,
  "lng": -78.2632,
  "description": "Ontario's oldest and most iconic provincial park...",
  "season": { "open": "2025-05-15", "close": "2025-10-15" },
  "imageUrl": "/parks/algonquin.jpg",
  "bookingUrl": "https://reservations.ontarioparks.ca/...",
  "campgrounds": [
    {
      "name": "Mew Lake",
      "sites": 131,
      "amenities": ["fire_pit", "potable_water", "flush_toilets", "showers", "swimming", "trails"],
      "terrain": "forested",
      "bearCountry": true
    }
  ],
  "activities": ["hiking", "canoeing", "fishing", "swimming", "wildlife_viewing"]
}
```

**Target: 30–50 parks** across provinces. Focus on the most popular / well-known ones:
- National: Banff, Jasper, Pacific Rim, Fundy, Gros Morne, Cape Breton Highlands, Algonquin*, Gatineau*, Killarney*, La Mauricie, Riding Mountain, Prince Albert, etc.
- Provincial: Algonquin, Killarney, Gatineau (technically NCC), Garibaldi, Wells Gray, Bon Echo, Sandbanks, Whiteshell, etc.

*You can build this JSON by hand or semi-automate it by pulling from Wikipedia/Parks Canada pages and cleaning up. A couple hours of curation work.*

### Weather (live API)
**Open-Meteo** — completely free, no API key:
```
https://api.open-meteo.com/v1/forecast?latitude=45.56&longitude=-78.26&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=America/Toronto
```

### Packing List (rule-based)
Build a conditions → items mapping:
```js
if (forecast.minTemp < 5) → add("4-season sleeping bag", "insulated sleeping pad", "warm base layers")
if (forecast.precipProbability > 50) → add("rain jacket", "tarp", "dry bags")
if (campground.bearCountry) → add("bear canister or hang kit", "bear spray")
if (!campground.amenities.includes("potable_water")) → add("water filter", "water purification tablets")
```

---

## Suggested File Structure

```
woodsmoke/
├── app/
│   ├── layout.tsx          # Root layout, fonts, global styles
│   ├── page.tsx            # Home — full map view
│   ├── park/
│   │   └── [id]/
│   │       └── page.tsx    # Park detail page
│   └── globals.css         # Tailwind + custom topo textures
├── components/
│   ├── Map/
│   │   ├── ParkMap.tsx     # Main Mapbox map component
│   │   ├── ParkMarker.tsx  # Custom marker with topo styling
│   │   └── ParkPopup.tsx   # Hover/click popup
│   ├── ParkPanel.tsx       # Slide-in detail panel
│   ├── WeatherForecast.tsx # 7-day forecast cards
│   ├── PackingList.tsx     # Generated packing checklist
│   ├── AmenityIcons.tsx    # Icon set for amenities
│   └── ui/                 # Shared UI primitives
├── data/
│   └── parks.json          # Curated park dataset
├── lib/
│   ├── weather.ts          # Open-Meteo API helper
│   ├── packing.ts          # Packing list generation logic
│   └── types.ts            # TypeScript interfaces
├── public/
│   ├── parks/              # Park images
│   ├── textures/           # Topo patterns, paper grain
│   └── icons/              # Custom SVG amenity icons
└── mapbox-style.json       # Custom Mapbox topo style (optional)
```

---

## Rough Timeline (now → Feb 20)

### Days 1–2: Foundation
- [ ] Init Next.js project, Tailwind config, custom color palette & fonts
- [ ] Set up Mapbox with custom topo-style map
- [ ] Build and render park markers from JSON data
- [ ] Basic click interaction (marker → popup/panel)

### Days 3–4: Park Data & Detail View
- [ ] Curate park dataset (30–50 parks with campgrounds + amenities)
- [ ] Build park detail page/panel with amenity icons
- [ ] Province filter / search

### Days 5–6: Weather & Packing
- [ ] Integrate Open-Meteo API
- [ ] Build weather forecast cards component
- [ ] Build packing list generator (rule-based engine)
- [ ] Connect weather → packing logic

### Days 7–8: Polish & Style
- [ ] Topo texture backgrounds, grain overlays, contour line decorations
- [ ] Animations (panel slide-in, list item check-off, map transitions)
- [ ] Responsive design (works on mobile)
- [ ] Edge cases, loading states, empty states

### Days 9–10: Ship
- [ ] Deploy to Vercel
- [ ] Record 2–3 min demo video
- [ ] Write Devpost project page (problem statement, screenshots, tech stack)
- [ ] Submit!

---

## Demo Video Script (2-3 min)

1. **The problem** (15 sec): "Planning a camping trip in Canada means juggling Parks Canada, weather sites, and packing blogs. I built Woodsmoke to bring it all into one beautiful experience."
2. **The map** (30 sec): Show the topo-styled map, zoom around, click a few parks
3. **Park detail** (30 sec): Show campground info, amenities, season dates
4. **Weather** (20 sec): Show forecast integration, weather-aware alerts
5. **Packing list** (30 sec): Show generated list based on conditions, check off items
6. **The design** (15 sec): Quick highlight of the topo aesthetic, textures, typography
7. **Wrap up** (10 sec): "Built solo in 10 days with Next.js, Mapbox, and Open-Meteo. This is Woodsmoke."

---

## Name

**Woodsmoke** — woodsmoke.app ✅ secured

Warm, sensory, unmistakably outdoors. The name evokes the campfire experience and pairs perfectly with the earthy topo aesthetic.

---

## What Will Make This Win

1. **Design quality** — 90% of hackathon submissions look terrible. Yours won't.
2. **Clear problem → solution narrative** — judges hear "I built a to-do app" 50 times. "I built the camping trip planner Canada doesn't have" is instantly compelling. The name Woodsmoke alone sets the tone before you even open the app.
3. **Depth over breadth** — four features that flow together > ten disconnected features
4. **You actually use this** — your enthusiasm and domain knowledge will come through in the demo
5. **Feasibility score** — this genuinely could become a real product. Judges will see that.
