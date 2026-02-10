export interface Campground {
  name: string
  sites: number
  amenities: Amenity[]
  terrain: string
  bearCountry: boolean
}

export type Amenity =
  | 'fire_pit'
  | 'potable_water'
  | 'flush_toilets'
  | 'vault_toilets'
  | 'showers'
  | 'swimming'
  | 'trails'
  | 'boat_launch'
  | 'bear_locker'
  | 'electricity'
  | 'wheelchair_accessible'
  | 'playground'
  | 'laundry'
  | 'dump_station'

export interface Park {
  id: string
  name: string
  province: Province
  type: 'national' | 'provincial' | 'territorial'
  lat: number
  lng: number
  description: string
  season: {
    open: string
    close: string
  }
  imageUrl?: string
  bookingUrl: string
  campgrounds: Campground[]
  activities: Activity[]
}

export type Province =
  | 'British Columbia'
  | 'Alberta'
  | 'Saskatchewan'
  | 'Manitoba'
  | 'Ontario'
  | 'Quebec'
  | 'New Brunswick'
  | 'Nova Scotia'
  | 'Prince Edward Island'
  | 'Newfoundland and Labrador'
  | 'Yukon'
  | 'Northwest Territories'
  | 'Nunavut'

export type Activity =
  | 'hiking'
  | 'canoeing'
  | 'kayaking'
  | 'fishing'
  | 'swimming'
  | 'wildlife_viewing'
  | 'cycling'
  | 'rock_climbing'
  | 'cross_country_skiing'
  | 'snowshoeing'
  | 'surfing'
  | 'scuba_diving'
  | 'stargazing'
  | 'photography'

export type WeatherDataSource = 'forecast' | 'historical'

export interface WeatherDateRange {
  startDate: string // ISO YYYY-MM-DD
  endDate: string   // ISO YYYY-MM-DD
}

export type FireDangerLevel = 'low' | 'moderate' | 'high' | 'very_high' | 'extreme'

export interface WeatherDay {
  date: string
  tempMax: number
  tempMin: number
  precipProbability: number
  weatherCode: number
  weatherDescription: string
  dataSource?: WeatherDataSource
  fireWeatherIndex: number | null
  fireDangerLevel: FireDangerLevel
}

export interface PackingItem {
  id: string
  name: string
  category: PackingCategory
  reason?: string
  checked: boolean
}

export type PackingCategory =
  | 'shelter_sleep'
  | 'clothing'
  | 'cooking_food'
  | 'safety_navigation'
  | 'extras'
