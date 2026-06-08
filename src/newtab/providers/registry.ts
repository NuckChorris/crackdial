import type {Provider, Suggestions} from '#/newtab/providers/types'
import {maskIconProvider} from '#/newtab/providers/maskIcon'
import {svgFaviconProvider} from '#/newtab/providers/svgFavicon'
import {wikipediaProvider} from '#/newtab/providers/wikipedia'
import {webManifestProvider} from '#/newtab/providers/webManifest'
import {metaColorsProvider} from '#/newtab/providers/metaColors'

// Registered providers, in priority order (first = preferred in the UI).
// Add a new source by dropping a file in this folder and listing it here.
export const PROVIDERS: Provider[] = [
  maskIconProvider,
  svgFaviconProvider,
  wikipediaProvider,
  webManifestProvider,
  metaColorsProvider
]

export interface GatherDeps {
  fetchText: (url: string) => Promise<string | null>
  parseHtml: (html: string) => Document
}

export const defaultDeps: GatherDeps = {
  fetchText: async (target) => {
    try {
      const res = await fetch(target, {credentials: 'omit'})
      return res.ok ? await res.text() : null
    } catch {
      return null
    }
  },
  parseHtml: (html) => new DOMParser().parseFromString(html, 'text/html')
}

const empty = (): Suggestions => ({icons: [], colors: []})

/**
 * Fetch the site's homepage, run every provider against it, and merge the
 * results. `deps` is injectable so the pipeline can be tested without network.
 */
export async function gatherSuggestions(
  rawUrl: string,
  deps: GatherDeps = defaultDeps
): Promise<Suggestions> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return empty()
  }

  // Don't abort if the homepage can't be fetched: URL-only providers (e.g.
  // Wikipedia) still work, and document-based ones just find nothing in an
  // empty document.
  const html = await deps.fetchText(url.href)
  const doc = deps.parseHtml(html ?? '')
  const ctx = {url, doc, fetchText: deps.fetchText}

  const results = await Promise.all(
    PROVIDERS.map((provider) =>
      provider.collect(ctx).catch(() => ({}) as Partial<Suggestions>)
    )
  )

  return merge(results)
}

function merge(results: Array<Partial<Suggestions>>): Suggestions {
  const icons = new Map<string, IconOf>()
  const colors = new Map<string, ColorOf>()

  for (const result of results) {
    for (const icon of result.icons || []) {
      const key = icon.svg.replace(/\s+/g, '')
      if (!icons.has(key)) icons.set(key, icon)
    }
    for (const color of result.colors || []) {
      const key = color.color.toLowerCase()
      if (!colors.has(key)) colors.set(key, color)
    }
  }

  return {icons: [...icons.values()], colors: [...colors.values()]}
}

type IconOf = Suggestions['icons'][number]
type ColorOf = Suggestions['colors'][number]
