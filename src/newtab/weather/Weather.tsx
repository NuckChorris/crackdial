import {useEffect, useState} from 'preact/hooks'
import {KAGI_SEARCH} from '#/newtab/shared/util'
import {
  conditionLabel,
  loadCachedWeather,
  refreshWeather,
  weatherKind,
  WEATHER_TTL,
  type Weather as WeatherData
} from '#/newtab/weather/data'
import {WeatherGlyph} from '#/newtab/weather/icons'
import * as styles from './Weather.module.css'

// Unobtrusive top-left current-conditions chip. Shows the last cached reading
// instantly, refreshes from geolocation + Open-Meteo if it's stale, then keeps
// refreshing every WEATHER_TTL (15 min) while the tab stays open. Clicking
// searches Kagi for "weather". Renders nothing until there's something to show
// — denied geolocation just leaves the corner empty.
export function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(loadCachedWeather)

  useEffect(() => {
    let live = true
    // Track the latest reading so each refresh can reuse its city (skipping the
    // reverse-geocode) when the device hasn't moved.
    let current = loadCachedWeather()

    const tick = () => {
      refreshWeather(current).then((next) => {
        if (live && next) {
          current = next
          setWeather(next)
        }
      })
    }

    // Refresh now if the cached reading is missing or stale, then on a timer.
    // Well under Open-Meteo's limits: one call per 15 min is ~2,900/month.
    if (!current || Date.now() - current.fetchedAt >= WEATHER_TTL) tick()
    const timer = setInterval(tick, WEATHER_TTL)

    return () => {
      live = false
      clearInterval(timer)
    }
  }, [])

  if (!weather) return null

  const condition = conditionLabel(weather.code)
  const temp = `${weather.temp}${weather.unit}`
  const label = weather.city
    ? `${condition}, ${temp} in ${weather.city}. Search Kagi for weather`
    : `${condition}, ${temp}. Search Kagi for weather`

  return (
    <a
      class={styles.widget}
      href={KAGI_SEARCH + 'weather'}
      title={`${condition} · ${temp}`}
      aria-label={label}
    >
      <span class={styles.icon}>
        <WeatherGlyph kind={weatherKind(weather.code, weather.isDay)} />
      </span>
      <span class={styles.info}>
        {weather.city && <span class={styles.city}>{weather.city}</span>}
        <span class={styles.temp}>{temp}</span>
      </span>
    </a>
  )
}
