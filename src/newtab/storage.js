// Cross-browser persistent storage for speed dials.
// chrome.storage.local exists in Chromium browsers and Firefox alike; we fall
// back to browser.storage.local just in case, and to in-memory defaults if no
// extension storage API is present (e.g. previewing the page as a plain file).

const KEY = 'speedDials'

export const DEFAULT_COLOR = '#2b2f3a'

const DEFAULT_DIALS = [
  {
    id: 'seed-youtube',
    name: 'YouTube',
    url: 'https://youtube.com',
    color: '#FF0000',
    svg: '<svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>'
  },
  {
    id: 'seed-github',
    name: 'GitHub',
    url: 'https://github.com',
    color: '#24292e',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
  },
  {
    id: 'seed-reddit',
    name: 'Reddit',
    url: 'https://reddit.com',
    color: '#FF4500',
    svg: '<svg viewBox="0 0 24 24" fill="white"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z"/></svg>'
  },
  {
    id: 'seed-wikipedia',
    name: 'Wikipedia',
    url: 'https://wikipedia.org',
    color: '#2b2f3a',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
  }
]

const area =
  (globalThis.chrome && chrome.storage && chrome.storage.local) ||
  (globalThis.browser && browser.storage && browser.storage.local) ||
  null

const clone = (dials) => dials.map((d) => ({...d}))

export function loadDials() {
  return new Promise((resolve) => {
    if (!area) return resolve(clone(DEFAULT_DIALS))

    area.get(KEY, (res) => {
      const stored = res && res[KEY]
      if (Array.isArray(stored)) return resolve(stored)

      // First run: seed defaults and persist them.
      const seed = clone(DEFAULT_DIALS)
      area.set({[KEY]: seed}, () => resolve(seed))
    })
  })
}

export function saveDials(dials) {
  return new Promise((resolve) => {
    if (!area) return resolve()
    area.set({[KEY]: dials}, () => resolve())
  })
}
