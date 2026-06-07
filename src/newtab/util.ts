import {DEFAULT_COLOR} from '#/newtab/storage.ts'

export const KAGI_SEARCH = 'https://kagi.com/search?q='

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

// <input type="color"> only accepts #rrggbb; fall back when a stored value
// (or absent value) doesn't match.
export function toHex(color: string | undefined): string {
  return /^#[0-9a-fA-F]{6}$/.test(color || '') ? (color as string) : DEFAULT_COLOR
}
