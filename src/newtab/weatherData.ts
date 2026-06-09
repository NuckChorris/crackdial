// Current-weather logic for the corner indicator: geolocation → Open-Meteo
// conditions → reverse-geocoded city name, plus the WMO-code → icon/label
// mapping the widget renders. Network failures and denied geolocation resolve
// to null so the widget simply stays absent (it's meant to be unobtrusive).

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast'
// BigDataCloud's client endpoint reverse-geocodes coordinates to a place name
// with no API key and permissive CORS — Open-Meteo's own geocoding is
// forward-only (name → coords), so it can't name the user's location.
const REVERSE_GEOCODE = 'https://api.bigdatacloud.net/data/reverse-geocode-client'

const CACHE_KEY = 'weather:last'
// Below this age a cached reading is shown as-is without hitting the network.
export const WEATHER_TTL = 15 * 60 * 1000
// Reuse the cached city name while the device hasn't moved ~10km, so a refresh
// usually skips the reverse-geocode call.
const SAME_PLACE_DEG = 0.15

// The nine glyphs the widget can show — see weatherIcons.tsx. Clear/partly
// split day vs night; everything else is time-agnostic.
export type WeatherKind =
  | 'clear-day'
  | 'clear-night'
  | 'partly-day'
  | 'partly-night'
  | 'cloud'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'storm'

export interface Weather {
  lat: number
  lon: number
  city: string
  temp: number // rounded, in `unit`
  unit: string // e.g. "°F" — from Open-Meteo's current_units
  code: number // WMO weather code
  isDay: boolean
  fetchedAt: number // epoch ms
}

// Countries that report temperature in Fahrenheit; everyone else gets Celsius.
const FAHRENHEIT_REGIONS = new Set(['US', 'BS', 'BZ', 'KY', 'LR', 'PW', 'FM', 'MH'])

function unitForLocale(): 'fahrenheit' | 'celsius' {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region
    return region && FAHRENHEIT_REGIONS.has(region) ? 'fahrenheit' : 'celsius'
  } catch {
    return 'celsius'
  }
}

/** WMO weather code → which glyph to draw (night-aware for clear/partly). */
export function weatherKind(code: number, isDay: boolean): WeatherKind {
  if (code <= 1) return isDay ? 'clear-day' : 'clear-night'
  if (code === 2) return isDay ? 'partly-day' : 'partly-night'
  if (code === 3) return 'cloud'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 95) return 'storm'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  // 51–67 drizzle/rain/freezing, 80–82 rain showers.
  if (code >= 51) return 'rain'
  return 'cloud'
}

const LABELS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent rain showers',
  85: 'Snow showers',
  86: 'Snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with hail'
}

export function conditionLabel(code: number): string {
  return LABELS[code] ?? 'Weather'
}

/** localStorage-backed last reading; survives across new-tab opens. */
export function loadCachedWeather(): Weather | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Weather
    return typeof data?.temp === 'number' && typeof data?.city === 'string'
      ? data
      : null
  } catch {
    return null
  }
}

function saveCachedWeather(weather: Weather): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(weather))
  } catch {
    // Private mode / quota — the in-memory state still drives this session.
  }
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('no geolocation'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 10 * 60 * 1000
    })
  })
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = `${REVERSE_GEOCODE}?latitude=${lat}&longitude=${lon}&localityLanguage=en`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`reverse geocode ${res.status}`)
  const data = await res.json()
  return data.city || data.locality || data.principalSubdivision || data.countryName || ''
}

/**
 * Geolocate, fetch current conditions, and resolve a city name (reusing
 * `prev`'s when the device hasn't moved). Returns null on any failure — denied
 * permission, offline, etc. — so callers keep whatever they already showed.
 */
export async function refreshWeather(prev: Weather | null): Promise<Weather | null> {
  let position: GeolocationPosition
  try {
    position = await getPosition()
  } catch {
    return null
  }
  const {latitude: lat, longitude: lon} = position.coords

  const unit = unitForLocale()
  const url =
    `${OPEN_METEO}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,is_day&temperature_unit=${unit}`

  let current: {temperature_2m: number; weather_code: number; is_day: number}
  let units: {temperature_2m: string}
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`open-meteo ${res.status}`)
    const data = await res.json()
    current = data.current
    units = data.current_units
  } catch {
    return null
  }

  const moved =
    !prev ||
    Math.abs(prev.lat - lat) > SAME_PLACE_DEG ||
    Math.abs(prev.lon - lon) > SAME_PLACE_DEG
  let city = prev?.city ?? ''
  if (moved || !city) {
    try {
      city = await reverseGeocode(lat, lon)
    } catch {
      // Keep any prior city; a blank one just hides that line.
    }
  }

  const weather: Weather = {
    lat,
    lon,
    city,
    temp: Math.round(current.temperature_2m),
    unit: units?.temperature_2m ?? '°',
    code: current.weather_code,
    isDay: current.is_day === 1,
    fetchedAt: Date.now()
  }
  saveCachedWeather(weather)
  return weather
}
