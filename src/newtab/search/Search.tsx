import {useEffect, useRef, useState} from 'preact/hooks'
import {BoltIcon, ClearIcon, SearchIcon} from '#/newtab/shared/icons'
import {KAGI_AUTOSUGGEST, KAGI_ORIGIN, KAGI_SEARCH} from '#/newtab/shared/util'
import * as styles from './Search.module.css'

// One row of Kagi's /autosuggest response. Plain query suggestions are
// {t, txt: null, img: null, k: 'kagi'}; entity rows (films, books, bang
// headers) add an `img` thumbnail and a `txt` subtitle; bang rows add a `goto`
// path (e.g. "/search?q=…+site:github.com").
interface Suggestion {
  t: string
  txt?: string | null
  img?: string | null
  goto?: string | null
  k?: string
}

// Where a chosen suggestion sends you: its own `goto` (resolved against
// kagi.com, and only if it's a same-origin path) or a plain Kagi search for `t`.
function suggestionHref(item: Suggestion): string {
  if (item.goto && item.goto.startsWith('/')) return KAGI_ORIGIN + item.goto
  return KAGI_SEARCH + encodeURIComponent(item.t)
}

// The "Quick Answer" row (orange bolt): Kagi appends one when the query could
// take a trailing "?". The exact `k` isn't documented, so detect known kinds
// and fall back to a no-link suggestion whose text ends in "?".
function isQuickAnswer(item: Suggestion): boolean {
  if (item.img) return false
  const k = (item.k || '').toLowerCase()
  if (k === 'ai' || k === 'qa' || k === 'quick' || k === 'quick_answer') return true
  return !item.goto && item.t.trimEnd().endsWith('?')
}

export function Search() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<Suggestion[]>([])
  const [active, setActive] = useState(-1)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const open = focused && items.length > 0

  // Debounced autosuggest, credentialed so the logged-in Kagi session drives
  // results (bangs, entities, personalization). Each keystroke aborts the prior.
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setItems([])
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(KAGI_AUTOSUGGEST + encodeURIComponent(q), {
          credentials: 'include',
          signal: controller.signal
        })
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data)) {
          setItems(data as Suggestion[])
          setActive(-1)
        }
      } catch {
        // Aborted or network/parse error — leave the prior list untouched.
      }
    }, 120)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  // Keep the keyboard-highlighted row in view as it moves past the fold.
  useEffect(() => {
    if (active < 0) return
    document
      .getElementById(`search-suggest-${active}`)
      ?.scrollIntoView({block: 'nearest'})
  }, [active])

  const go = (item: Suggestion) => {
    window.location.href = suggestionHref(item)
  }

  const clearQuery = () => {
    setQuery('')
    setItems([])
    inputRef.current?.focus()
  }

  const onSubmit = (event: Event) => {
    event.preventDefault()
    // Enter with a highlighted suggestion goes there; otherwise raw search.
    if (active >= 0 && items[active]) {
      go(items[active])
      return
    }
    const trimmed = query.trim()
    if (trimmed) window.location.href = KAGI_SEARCH + encodeURIComponent(trimmed)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setItems([])
      setActive(-1)
      return
    }
    if (!open) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((a) => (a + 1 >= items.length ? 0 : a + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((a) => (a - 1 < 0 ? items.length - 1 : a - 1))
    }
  }

  return (
    <form
      class={`${styles.search}${open ? ` ${styles.open}` : ''}`}
      role="search"
      onSubmit={onSubmit}
    >
      <div class={styles.bar}>
        <input
          ref={inputRef}
          class={styles.input}
          type="search"
          placeholder="Search with Kagi"
          autocomplete="off"
          spellcheck={false}
          aria-label="Search with Kagi"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-suggest"
          aria-activedescendant={
            active >= 0 ? `search-suggest-${active}` : undefined
          }
          value={query}
          onInput={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {query && (
          <>
            <button
              type="button"
              class={styles.action}
              aria-label="Clear search"
              // Keep input focus so the dropdown doesn't blur shut on click.
              onMouseDown={(event) => event.preventDefault()}
              onClick={clearQuery}
            >
              <ClearIcon />
            </button>
            <span class={styles.sep} aria-hidden="true" />
          </>
        )}
        <button type="submit" class={styles.action} aria-label="Search">
          <SearchIcon />
        </button>
      </div>

      {open && (
        <div class={styles.panel}>
          <ul class={styles.list} id="search-suggest" role="listbox">
            {items.map((item, i) => {
              const quick = isQuickAnswer(item)
              return (
                <li
                  key={i}
                  id={`search-suggest-${i}`}
                  role="option"
                  aria-selected={i === active}
                  class={`${styles.item}${i === active ? ` ${styles.active}` : ''}`}
                  // mousedown (not click) fires before blur; preventDefault keeps
                  // focus so navigation isn't pre-empted by the list closing.
                  onMouseDown={(event) => {
                    event.preventDefault()
                    go(item)
                  }}
                  onMouseEnter={() => setActive(i)}
                >
                  <span class={`${styles.icon}${quick ? ` ${styles.bolt}` : ''}`}>
                    {item.img ? (
                      <img
                        src={item.img}
                        alt=""
                        loading="lazy"
                        onError={(event) => {
                          ;(event.currentTarget as HTMLImageElement).style.display =
                            'none'
                        }}
                      />
                    ) : quick ? (
                      <BoltIcon />
                    ) : (
                      <SearchIcon />
                    )}
                  </span>
                  <span class={styles.main}>
                    <span class={styles.title}>{item.t}</span>
                    {item.txt && <span class={styles.sub}>{item.txt}</span>}
                  </span>
                </li>
              )
            })}
          </ul>

          <div class={styles.hints}>
            <span class={styles.hint}>
              <kbd>?</kbd> at the end of your query triggers Quick Answer
            </span>
            <span class={styles.hint}>
              <kbd>@</kbd> limit search results to a specific website
            </span>
            <span class={styles.hint}>
              <kbd>!</kbd> search result on a specific site
            </span>
          </div>
        </div>
      )}
    </form>
  )
}
