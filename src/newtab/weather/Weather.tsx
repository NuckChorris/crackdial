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
// instantly, then refreshes from geolocation + Open-Meteo if it's stale.
// Clicking searches Kagi for "weather". Renders nothing until there's
// something to show — denied geolocation just leaves the corner empty.
export function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(loadCachedWeather)

  useEffect(() => {
    const cached = loadCachedWeather()
    if (cached && Date.now() - cached.fetchedAt < WEATHER_TTL) return
    let live = true
    refreshWeather(cached).then((next) => {
      if (live && next) setWeather(next)
    })
    return () => {
      live = false
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
