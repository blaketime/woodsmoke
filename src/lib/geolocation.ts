export interface UserLocation {
  lat: number
  lng: number
  city?: string
}

export async function getUserLocation(): Promise<UserLocation | null> {
  // 1. Try the browser Geolocation API (accurate, requires permission)
  const browserLoc = await getBrowserLocation()
  if (browserLoc) return browserLoc

  // 2. Fall back to IP-based geolocation over HTTPS
  return getIpLocation()
}

function getBrowserLocation(): Promise<UserLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 300_000 }
    )
  })
}

async function getIpLocation(): Promise<UserLocation | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const res = await fetch('https://ipwho.is/', {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) return null

    const data = await res.json()
    if (!data.success || typeof data.latitude !== 'number' || typeof data.longitude !== 'number')
      return null

    return {
      lat: data.latitude,
      lng: data.longitude,
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
