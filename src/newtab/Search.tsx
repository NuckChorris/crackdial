import {useState} from 'preact/hooks'
import {SearchIcon} from '#/newtab/icons'
import {KAGI_SEARCH} from '#/newtab/util'

export function Search() {
  const [query, setQuery] = useState('')

  const onSubmit = (event: Event) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (trimmed) window.location.href = KAGI_SEARCH + encodeURIComponent(trimmed)
  }

  return (
    <form class="search" role="search" onSubmit={onSubmit}>
      <span class="search_icon">
        <SearchIcon />
      </span>
      <input
        class="search_input"
        type="search"
        placeholder="Search with Kagi"
        autocomplete="off"
        spellcheck={false}
        aria-label="Search with Kagi"
        value={query}
        onInput={(event) => setQuery(event.currentTarget.value)}
      />
    </form>
  )
}
