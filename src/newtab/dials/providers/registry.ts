import type {Provider, SiteContext, Suggestions} from '#/newtab/dials/providers/types'
import {maskIconProvider} from '#/newtab/dials/providers/maskIcon'
import {svgFaviconProvider} from '#/newtab/dials/providers/svgFavicon'
import {wikipediaProvider} from '#/newtab/dials/providers/wikipedia'
import {webManifestProvider} from '#/newtab/dials/providers/webManifest'
import {metaColorsProvider} from '#/newtab/dials/providers/metaColors'
import {svgColorsProvider} from '#/newtab/dials/providers/svgColors'

// Registered providers, in priority order (first = preferred in the UI).
// Add a new source by dropping a file in this folder and listing it here.
// svgColorsProvider runs at a later stage so it can read the logos the others
// found (see `stage` in types.ts).
export const PROVIDERS: Provider[] = [
  maskIconProvider,
  svgFaviconProvider,
  wikipediaProvider,
  webManifestProvider,
  metaColorsProvider,
  svgColorsProvider
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

  // Run providers stage by stage: same-stage in parallel, later stages see the
  // accumulated results so far via ctx.collected.
  let collected = empty()
  for (const stage of stagesOf(PROVIDERS)) {
    const ctx: SiteContext = {url, doc, fetchText: deps.fetchText, collected}
    const results = await Promise.all(
      stage.map((provider) =>
        provider.collect(ctx).catch(() => ({}) as Partial<Suggestions>)
      )
    )
    collected = merge([collected, ...results])
  }

  return collected
}

// Providers grouped by ascending stage number (default stage 0).
function stagesOf(providers: Provider[]): Provider[][] {
  const byStage = new Map<number, Provider[]>()
  for (const provider of providers) {
    const stage = provider.stage ?? 0
    const group = byStage.get(stage) ?? []
    group.push(provider)
    byStage.set(stage, group)
  }
  return [...byStage.keys()].sort((a, b) => a - b).map((s) => byStage.get(s)!)
}

function merge(results: Array<Partial<Suggestions>>): Suggestions {
  const icons = new Map<string, IconOf>()
  for (const result of results) {
    for (const icon of result.icons || []) {
      const key = icon.svg.replace(/\s+/g, '')
      if (!icons.has(key)) icons.set(key, icon)
    }
  }
  const colors = dedupeColors(results.flatMap((result) => result.colors || []))
  return {icons: [...icons.values()], colors}
}

function dedupeColors(colors: ColorOf[]): ColorOf[] {
  const seen = new Map<string, ColorOf>()
  for (const color of colors) {
    const key = color.color.toLowerCase()
    if (!seen.has(key)) seen.set(key, color)
  }
  return [...seen.values()]
}

type IconOf = Suggestions['icons'][number]
type ColorOf = Suggestions['colors'][number]
