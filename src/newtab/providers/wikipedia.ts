import type {IconSuggestion, Provider} from '#/newtab/providers/types'
import {fetchSvg} from '#/newtab/providers/helpers'

// Wikipedia/Wikidata as a brand-logo source. Major sites have a Wikipedia
// redirect from their domain (reddit.com -> Reddit). We surface two logos that
// can differ:
//   1. The infobox logo shown on the article (recovered as the original SVG from
//      its rasterized thumbnail URL).
//   2. The Wikidata "logo image" (P154) for the article's item.
// Flow uses origin=* on every call (CORS-enabled), so it works regardless of
// host permissions.

type FetchText = (url: string) => Promise<string | null>

const MAX_WIKIDATA_LOGOS = 2

interface ArticlePage {
  title?: string
  missing?: unknown
  pageprops?: {wikibase_item?: string}
}
interface QueryPages<T> {
  query?: {pages?: Record<string, T>}
}
interface Claim {
  mainsnak?: {datavalue?: {value?: unknown}}
}
interface ClaimsResponse {
  claims?: {P154?: Claim[]}
}
interface ImageInfoPage {
  title?: string
  imageinfo?: Array<{url?: string}>
}
interface ParseResponse {
  parse?: {text?: {'*'?: string}}
}

export const wikipediaProvider: Provider = {
  name: 'wikipedia',
  async collect({url, fetchText}) {
    const article = await resolveArticle(fetchText, candidateTitles(url))
    if (!article) return {}

    // The infobox logo and the Wikidata logo are independent — fetch in parallel.
    const [infoboxUrl, wikidataNames] = await Promise.all([
      infoboxLogoUrl(fetchText, article.title),
      article.qid ? logoFilenames(fetchText, article.qid) : Promise.resolve<string[]>([])
    ])

    const urls = [
      ...(infoboxUrl ? [infoboxUrl] : []),
      ...(await fileUrls(fetchText, wikidataNames.slice(0, MAX_WIKIDATA_LOGOS)))
    ]

    const icons: IconSuggestion[] = []
    const seen = new Set<string>()
    for (const fileUrl of urls) {
      if (seen.has(fileUrl)) continue
      seen.add(fileUrl)
      const svg = await fetchSvg(fetchText, fileUrl)
      if (svg) icons.push({svg, source: 'wikipedia'})
    }
    return {icons}
  }
}

function api(host: string, params: Record<string, string>): string {
  const query = new URLSearchParams({format: 'json', origin: '*', ...params})
  return `https://${host}/w/api.php?${query.toString()}`
}

// Major sites redirect from their domain ("reddit.com"); the bare name
// ("reddit") is a fallback.
function candidateTitles(url: URL): string[] {
  const host = url.hostname.replace(/^www\./, '')
  const name = host.split('.')[0]
  return [...new Set([host, name])].filter(Boolean)
}

async function parseJson<T>(fetchText: FetchText, url: string): Promise<T | null> {
  const raw = await fetchText(url)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

// First candidate that maps to a real article -> its title (+ Wikidata id).
async function resolveArticle(
  fetchText: FetchText,
  titles: string[]
): Promise<{title: string; qid?: string} | null> {
  for (const candidate of titles) {
    const data = await parseJson<QueryPages<ArticlePage>>(
      fetchText,
      api('en.wikipedia.org', {
        action: 'query',
        redirects: '1',
        prop: 'pageprops',
        ppprop: 'wikibase_item',
        titles: candidate
      })
    )
    for (const page of Object.values(data?.query?.pages ?? {})) {
      if (page.title && !('missing' in page)) {
        return {title: page.title, qid: page.pageprops?.wikibase_item}
      }
    }
  }
  return null
}

// The article's infobox logo, recovered as the original SVG. Wikipedia renders
// the logo <img> as a PNG thumbnail whose URL embeds the source filename:
//   .../commons/thumb/b/b4/Reddit_logo.svg/220px-Reddit_logo.svg.png
// -> .../commons/b/b4/Reddit_logo.svg
async function infoboxLogoUrl(
  fetchText: FetchText,
  title: string
): Promise<string | null> {
  const data = await parseJson<ParseResponse>(
    fetchText,
    api('en.wikipedia.org', {
      action: 'parse',
      page: title,
      prop: 'text',
      section: '0',
      redirects: '1'
    })
  )
  const html = data?.parse?.text?.['*']
  if (!html) return null

  const doc = new DOMParser().parseFromString(html, 'text/html')
  // First SVG-backed image in the infobox — skips PNG/JPG screenshots and maps.
  for (const img of doc.querySelectorAll('.infobox img')) {
    const original = thumbToOriginalSvg(img.getAttribute('src'))
    if (original) return original
  }
  return null
}

function thumbToOriginalSvg(src: string | null): string | null {
  if (!src) return null
  const url = src.startsWith('//') ? `https:${src}` : src
  if (!/\/thumb\/.*\.svg\//i.test(url)) return null
  return url.replace('/thumb/', '/').replace(/(\.svg)\/[^/]+$/i, '$1')
}

// P154 (logo image) filenames, preferring a square mark over a wide wordmark.
async function logoFilenames(fetchText: FetchText, qid: string): Promise<string[]> {
  const data = await parseJson<ClaimsResponse>(
    fetchText,
    api('www.wikidata.org', {action: 'wbgetclaims', entity: qid, property: 'P154'})
  )
  const names = (data?.claims?.P154 ?? [])
    .map((claim) => claim.mainsnak?.datavalue?.value)
    .filter((value): value is string => typeof value === 'string')
  return names.sort((a, b) => wordmarkRank(a) - wordmarkRank(b))
}

function wordmarkRank(name: string): number {
  return /wordmark|lettermark|text/i.test(name) ? 1 : 0
}

// Resolve Commons File: titles to their real file URLs (one batched call).
async function fileUrls(
  fetchText: FetchText,
  filenames: string[]
): Promise<string[]> {
  if (!filenames.length) return []
  const data = await parseJson<QueryPages<ImageInfoPage>>(
    fetchText,
    api('commons.wikimedia.org', {
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url',
      titles: filenames.map((name) => `File:${name}`).join('|')
    })
  )
  const byTitle = new Map<string, string>()
  for (const page of Object.values(data?.query?.pages ?? {})) {
    const fileUrl = page.imageinfo?.[0]?.url
    if (page.title && fileUrl) byTitle.set(page.title, fileUrl)
  }
  return filenames
    .map((name) => byTitle.get(`File:${name}`))
    .filter((value): value is string => Boolean(value))
}
