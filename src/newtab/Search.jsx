import {SearchIcon} from './icons.jsx'
import {KAGI_SEARCH} from './util.js'

export function Search() {
  const onSubmit = (event) => {
    event.preventDefault()
    const query = event.currentTarget.q.value.trim()
    if (query) window.location.href = KAGI_SEARCH + encodeURIComponent(query)
  }

  return (
    <form class="search" role="search" onSubmit={onSubmit}>
      <span class="search_icon">
        <SearchIcon />
      </span>
      <input
        class="search_input"
        name="q"
        type="search"
        placeholder="Search with Kagi"
        autocomplete="off"
        spellcheck={false}
        aria-label="Search with Kagi"
      />
    </form>
  )
}
