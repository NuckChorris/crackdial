import {DEFAULT_COLOR} from '#/newtab/shared/storage'

export const KAGI_ORIGIN = 'https://kagi.com'
export const KAGI_SEARCH = `${KAGI_ORIGIN}/search?q=`
export const KAGI_AUTOSUGGEST = `${KAGI_ORIGIN}/autosuggest?q=`

// Accept bare hosts ("youtube.com") and full URLs alike.
export function normalizeUrl(url: string): string {
  const trimmed = (url || '').trim()
  if (!trimmed) return ''
  return /^[a-z][\w+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function newId(): string {
  if (globalThis.crypto && crypto.randomUUID) return crypto.randomUUID()
  return `dial-${Math.floor(performance.now() * 1000)}`
}

/** Return a copy of `list` with the item at index `from` moved to index `to`. */
export function arrayMove<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

// <input type="color"> only accepts #rrggbb; fall back when a stored value
// (or absent value) doesn't match.
export function toHex(color: string | undefined): string {
  return /^#[0-9a-fA-F]{6}$/.test(color || '') ? (color as string) : DEFAULT_COLOR
}
