"use client"

import { useRef, useState } from "react"
import { useSearchBox, useHits } from "react-instantsearch"
import type { Restaurant } from "@/lib/types"
import { Search, X, MapPin } from "lucide-react"

export function SearchBox() {
  const { query, refine } = useSearchBox()
  const { items } = useHits<Restaurant>()
  const [value, setValue] = useState(query)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const suggestions = value.trim() ? items.slice(0, 6) : []

  function set(next: string) {
    setValue(next)
    refine(next)
  }

  function pick(r: Restaurant) {
    set(r.name)
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Respect IME composition (CJK): do not act on Enter mid-composition.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (!open || suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, -1))
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault()
      pick(suggestions[active])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-sm transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <Search className="size-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            set(e.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 120)
          }}
          onKeyDown={onKeyDown}
          placeholder="Search restaurants, cuisines, neighborhoods…"
          aria-label="Search restaurants"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              set("")
              setOpen(false)
            }}
            aria-label="Clear search"
            className="flex-shrink-0 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg"
          onMouseDown={() => blurTimer.current && clearTimeout(blurTimer.current)}
          role="listbox"
        >
          {suggestions.map((r, i) => (
            <li key={r.objectID} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(r)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                  i === active ? "bg-secondary" : "hover:bg-secondary"
                }`}
              >
                <Search className="size-3.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{r.name}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="truncate">{r.cuisines[0]}</span>
                  <MapPin className="size-3" aria-hidden="true" />
                  <span className="truncate">{r.city}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
