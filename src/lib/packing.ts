import type { Park, WeatherDay, PackingItem, PackingCategory, FireDangerLevel } from './types'

// ── Weather analysis ────────────────────────────────────────────────

interface WeatherStats {
  coldestMin: number
  hottestMax: number
  rainyDays: number
  snowDays: number
  stormDays: number
  totalDays: number
}

const SNOW_CODES = [71, 73, 75, 77, 85, 86]
const STORM_CODES = [95, 96, 99]

function analyzeWeather(forecast: WeatherDay[]): WeatherStats {
  if (forecast.length === 0) {
    return { coldestMin: 15, hottestMax: 20, rainyDays: 0, snowDays: 0, stormDays: 0, totalDays: 0 }
  }

  return {
    coldestMin: Math.min(...forecast.map(d => d.tempMin)),
    hottestMax: Math.max(...forecast.map(d => d.tempMax)),
    rainyDays: forecast.filter(d => d.precipProbability >= 50).length,
    snowDays: forecast.filter(d => SNOW_CODES.includes(d.weatherCode)).length,
    stormDays: forecast.filter(d => STORM_CODES.includes(d.weatherCode)).length,
    totalDays: forecast.length,
  }
}

// ── Item builder ────────────────────────────────────────────────────

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

class PackingListBuilder {
  private items = new Map<string, PackingItem>()

  add(name: string, category: PackingCategory, reason?: string) {
    const id = `${category}:${slugify(name)}`
    const existing = this.items.get(id)

    if (existing) {
      if (reason && existing.reason) {
        if (!existing.reason.includes(reason)) {
          existing.reason = `${existing.reason} + ${reason}`
        }
      } else if (reason && !existing.reason) {
        existing.reason = reason
      }
    } else {
      this.items.set(id, { id, name, category, reason, checked: false })
    }
  }

  remove(name: string, category: PackingCategory) {
    const id = `${category}:${slugify(name)}`
    this.items.delete(id)
  }

  toArray(): PackingItem[] {
    const order: PackingCategory[] = [
      'shelter_sleep', 'clothing', 'cooking_food', 'safety_navigation', 'extras',
    ]
    return Array.from(this.items.values()).sort((a, b) => {
      const ai = order.indexOf(a.category)
      const bi = order.indexOf(b.category)
      if (ai !== bi) return ai - bi
      // Items without a reason (base essentials) first within category
      if (!a.reason && b.reason) return -1
      if (a.reason && !b.reason) return 1
      return a.name.localeCompare(b.name)
    })
  }
}

// ── Rule pipeline ───────────────────────────────────────────────────

function addBaseEssentials(b: PackingListBuilder) {
  // Shelter & Sleep
  b.add('Tent', 'shelter_sleep')
  b.add('Sleeping bag', 'shelter_sleep')
  b.add('Sleeping pad', 'shelter_sleep')
  b.add('Pillow', 'shelter_sleep')

  // Cooking & Food
  b.add('Camp stove', 'cooking_food')
  b.add('Fuel canister', 'cooking_food')
  b.add('Pot', 'cooking_food')
  b.add('Utensils', 'cooking_food')
  b.add('Plates & bowls', 'cooking_food')
  b.add('Cooler', 'cooking_food')
  b.add('Dish soap', 'cooking_food')
  b.add('Trash bags', 'cooking_food')

  // Safety & Navigation
  b.add('First aid kit', 'safety_navigation')
  b.add('Headlamp + batteries', 'safety_navigation')
  b.add('Knife / multi-tool', 'safety_navigation')
  b.add('Matches / lighter', 'safety_navigation')

  // Clothing
  b.add('Base layers', 'clothing')
  b.add('Hiking socks (x2)', 'clothing')
  b.add('Sturdy shoes', 'clothing')

  // Extras
  b.add('Toilet paper', 'extras')
  b.add('Towel', 'extras')
  b.add('Insect repellent', 'extras')
}

function addWeatherItems(b: PackingListBuilder, stats: WeatherStats) {
  // Cold weather (≤ 5°C)
  if (stats.coldestMin <= 5) {
    const reason = `Lows down to ${stats.coldestMin}°C`
    b.add('Warm hat', 'clothing', reason)
    b.add('Gloves', 'clothing', reason)
    b.add('Insulated jacket', 'clothing', reason)
    b.add('Thermal base layers', 'clothing', reason)
  }

  // Extreme cold (≤ -5°C)
  if (stats.coldestMin <= -5) {
    const reason = `Extreme cold — lows to ${stats.coldestMin}°C`
    b.add('Four-season sleeping bag', 'shelter_sleep', reason)
    b.add('Insulated sleeping pad', 'shelter_sleep', reason)
    b.add('Balaclava', 'clothing', reason)
    b.add('Hand warmers', 'clothing', reason)
  }

  // Rain
  if (stats.rainyDays >= 1) {
    const reason = `Rain likely on ${stats.rainyDays} of ${stats.totalDays} days`
    b.add('Rain jacket', 'clothing', reason)
    b.add('Rain pants', 'clothing', reason)
    b.add('Pack rain cover', 'clothing', reason)
    b.add('Tarp', 'shelter_sleep', reason)
  }

  // Snow
  if (stats.snowDays >= 1) {
    const reason = `Snow expected on ${stats.snowDays} day${stats.snowDays > 1 ? 's' : ''}`
    b.add('Waterproof boots', 'clothing', reason)
    b.add('Gaiters', 'clothing', reason)
  }

  // Hot weather (≥ 28°C)
  if (stats.hottestMax >= 28) {
    const reason = `Highs up to ${stats.hottestMax}°C`
    b.add('Sun hat', 'clothing', reason)
    b.add('Sunscreen', 'clothing', reason)
    b.add('Extra water bottles', 'cooking_food', reason)
    b.add('Electrolyte packets', 'cooking_food', reason)
  }

  // Storms
  if (stats.stormDays >= 1) {
    const reason = 'Thunderstorms in forecast'
    b.add('Extra tent stakes', 'shelter_sleep', reason)
    b.add('Emergency whistle', 'safety_navigation', reason)
  }
}

function addAmenityItems(b: PackingListBuilder, amenities: Set<string>, bearCountry: boolean) {
  if (!amenities.has('potable_water')) {
    const reason = 'No potable water on site'
    b.add('Water filter', 'cooking_food', reason)
    b.add('Purification tablets', 'cooking_food', reason)
    b.add('Extra water containers', 'cooking_food', reason)
  }

  if (!amenities.has('fire_pit')) {
    b.add('Extra stove fuel', 'cooking_food', 'No fire pits — stove is your only heat source')
  }

  if (!amenities.has('flush_toilets') && !amenities.has('vault_toilets')) {
    const reason = 'No toilets on site'
    b.add('Trowel', 'extras', reason)
    b.add('Waste bags', 'extras', reason)
  }

  if (!amenities.has('electricity')) {
    b.add('Portable battery pack', 'extras', 'No electricity on site')
  }

  if (amenities.has('fire_pit')) {
    b.add('Fire starter', 'cooking_food', 'Fire pits available')
    b.add('Firewood gloves', 'cooking_food', 'Fire pits available')
  }

  // Bear country
  if (bearCountry) {
    b.add('Bear spray', 'safety_navigation', 'Bear country')
    if (amenities.has('bear_locker')) {
      b.add('Bear canister or hang kit', 'safety_navigation', 'Bear country — lockers available on site')
    } else {
      b.add('Bear canister or hang kit', 'safety_navigation', 'Bear country — no lockers, bring your own storage')
    }
  }
}

function addActivityItems(b: PackingListBuilder, activities: string[]) {
  const acts = new Set(activities)

  if (acts.has('hiking')) {
    b.add('Hiking boots', 'clothing', 'Hiking trails available')
    b.add('Trekking poles', 'extras', 'Hiking trails available')
    b.add('Trail map', 'safety_navigation', 'Hiking trails available')
  }

  if (acts.has('canoeing') || acts.has('kayaking')) {
    const label = acts.has('canoeing') && acts.has('kayaking')
      ? 'Canoeing & kayaking'
      : acts.has('canoeing') ? 'Canoeing' : 'Kayaking'
    b.add('Life jacket (PFD)', 'safety_navigation', label)
    b.add('Dry bags', 'extras', label)
    b.add('Waterproof phone pouch', 'extras', label)
  }

  if (acts.has('fishing')) {
    b.add('Fishing rod & tackle', 'extras', 'Fishing available')
    b.add('Fishing licence reminder', 'extras', 'Fishing available — check provincial regulations')
  }

  if (acts.has('swimming')) {
    b.add('Swimsuit', 'clothing', 'Swimming available')
    b.add('Water shoes', 'clothing', 'Swimming available')
    b.add('Quick-dry towel', 'clothing', 'Swimming available')
  }

  if (acts.has('rock_climbing')) {
    b.add('Climbing harness', 'extras', 'Rock climbing available')
    b.add('Climbing helmet', 'extras', 'Rock climbing available')
    b.add('Chalk bag', 'extras', 'Rock climbing available')
  }

  if (acts.has('cross_country_skiing') || acts.has('snowshoeing')) {
    const label = acts.has('cross_country_skiing') && acts.has('snowshoeing')
      ? 'Skiing & snowshoeing'
      : acts.has('cross_country_skiing') ? 'Cross-country skiing' : 'Snowshoeing'
    b.add('Skis or snowshoes', 'extras', label)
    b.add('Winter gaiters', 'extras', label)
  }

  if (acts.has('stargazing')) {
    b.add('Red-light headlamp', 'extras', 'Stargazing')
    b.add('Binoculars', 'extras', 'Stargazing')
  }

  if (acts.has('wildlife_viewing')) {
    b.add('Binoculars', 'extras', 'Wildlife viewing')
    b.add('Camera', 'extras', 'Wildlife viewing')
  }

  if (acts.has('surfing')) {
    b.add('Wetsuit', 'clothing', 'Surfing available')
    b.add('Surf wax', 'extras', 'Surfing available')
  }
}

function addTerrainItems(b: PackingListBuilder, terrain: string) {
  switch (terrain) {
    case 'coastal':
      b.add('Windproof layer', 'clothing', 'Coastal terrain — expect wind')
      b.add('Sand stakes', 'shelter_sleep', 'Coastal terrain — regular stakes may not hold')
      break
    case 'alpine':
      b.add('Extra sun protection', 'clothing', 'Alpine terrain — stronger UV')
      b.add('Warm layers', 'clothing', 'Alpine terrain — temperatures drop fast')
      break
    case 'lakeside':
      b.add('Extra insect repellent', 'extras', 'Lakeside terrain — more bugs near water')
      break
  }
}

function addTripDurationItems(b: PackingListBuilder, days: number) {
  if (days >= 5) {
    const reason = `${days}-day trip`
    b.add('Biodegradable soap', 'extras', reason)
    b.add('Camp towel', 'extras', reason)
    b.add('Repair kit', 'extras', reason)
    b.add('Extra fuel', 'cooking_food', reason)
    b.add('Book or cards', 'extras', reason)
  }
}

function addFireDangerItems(b: PackingListBuilder, forecast: WeatherDay[]) {
  const peakLevel: FireDangerLevel = forecast.reduce<FireDangerLevel>((worst, d) => {
    const levels: FireDangerLevel[] = ['low', 'moderate', 'high', 'very_high', 'extreme']
    const wi = levels.indexOf(worst)
    const di = levels.indexOf(d.fireDangerLevel)
    return di > wi ? d.fireDangerLevel : worst
  }, 'low')

  if (peakLevel === 'high' || peakLevel === 'very_high' || peakLevel === 'extreme') {
    b.remove('Fire starter', 'cooking_food')
    b.remove('Firewood gloves', 'cooking_food')
    b.add('Camp stove + fuel canister', 'cooking_food', 'Fire restrictions likely — bring a stove for cooking')
  }

  if (peakLevel === 'extreme') {
    b.add('Battery lantern', 'extras', 'Open flame restrictions — skip candles and lanterns with real flames')
  }
}

// ── Main export ─────────────────────────────────────────────────────

export function generatePackingList(
  park: Park,
  forecast: WeatherDay[],
  campgroundIndex?: number,
): PackingItem[] {
  const b = new PackingListBuilder()
  const cg = park.campgrounds[campgroundIndex ?? 0]

  // 1. Base essentials
  addBaseEssentials(b)

  // 2. Weather rules
  const stats = analyzeWeather(forecast)
  addWeatherItems(b, stats)

  // 3. Amenity rules
  if (cg) {
    const amenities = new Set(cg.amenities as string[])
    addAmenityItems(b, amenities, cg.bearCountry)

    // 6. Terrain rules
    addTerrainItems(b, cg.terrain)
  }

  // 4–5. Activity rules
  addActivityItems(b, park.activities as string[])

  // 6b. Fire danger rules (runs after amenity items so it can remove fire starters)
  addFireDangerItems(b, forecast)

  // 7. Trip duration
  addTripDurationItems(b, stats.totalDays)

  return b.toArray()
}
