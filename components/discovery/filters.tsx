"use client"

import { useState } from "react"
import {
  useRefinementList,
  useToggleRefinement,
  useClearRefinements,
  useCurrentRefinements,
} from "react-instantsearch"
import { Search, SlidersHorizontal, Star } from "lucide-react"

export function Filters() {
  const { items: currentItems } = useCurrentRefinements()
  const { refine: clearAll } = useClearRefinements()
  const hasRefinements = currentItems.length > 0

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
          <SlidersHorizontal className="size-4 text-primary" aria-hidden="true" />
          Refine
        </h2>
        {hasRefinements && (
          <button
            type="button"
            onClick={() => clearAll()}
            className="text-xs font-medium text-primary hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <TopRatedToggle />
      <CuisineFilter />
      <PriceFilter />
      <DiningStyleFilter />
      <PaymentFilter />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}

function CuisineFilter() {
  const { items, refine, searchForItems } = useRefinementList({
    attribute: "cuisines",
    limit: 8,
    showMore: true,
    showMoreLimit: 30,
    sortBy: ["count:desc", "name:asc"],
  })
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? items : items.slice(0, 8)

  return (
    <Section title="Cuisine">
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5">
        <Search className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          onChange={(e) => searchForItems(e.target.value)}
          placeholder="Search cuisines"
          aria-label="Search cuisines"
          className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
      <ul className="space-y-1.5">
        {visible.map((item) => (
          <li key={item.label}>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={item.isRefined}
                onChange={() => refine(item.value)}
                className="size-4 accent-[var(--primary)]"
              />
              <span className="flex-1 text-foreground">{item.label}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{item.count}</span>
            </label>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-muted-foreground">No matches</li>}
      </ul>
      {items.length > 8 && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="mt-2 text-xs font-medium text-primary hover:underline"
        >
          {showAll ? "Show less" : "Show more"}
        </button>
      )}
    </Section>
  )
}

const PRICE_LABELS: Record<string, string> = { "1": "$", "2": "$$", "3": "$$$", "4": "$$$$" }

function PriceFilter() {
  const { items, refine } = useRefinementList({ attribute: "price_tier", sortBy: ["name:asc"] })
  const byValue = new Map(items.map((i) => [i.value, i]))

  return (
    <Section title="Price">
      <div className="grid grid-cols-4 gap-2">
        {["1", "2", "3", "4"].map((tier) => {
          const item = byValue.get(tier)
          const refined = item?.isRefined
          return (
            <button
              key={tier}
              type="button"
              disabled={!item}
              onClick={() => item && refine(item.value)}
              className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
                refined
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary/40"
              }`}
              aria-pressed={refined}
            >
              {PRICE_LABELS[tier]}
            </button>
          )
        })}
      </div>
    </Section>
  )
}

function PaymentFilter() {
  const { items, refine } = useRefinementList({ attribute: "payment_types", sortBy: ["name:asc"] })
  // Enforce the canonical order regardless of facet count ordering.
  const ORDER = ["AMEX", "Visa", "MasterCard", "Discover"]
  const sorted = [...items].sort((a, b) => ORDER.indexOf(a.label) - ORDER.indexOf(b.label))

  return (
    <Section title="Accepted cards">
      <div className="flex flex-wrap gap-2">
        {sorted.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => refine(item.value)}
            aria-pressed={item.isRefined}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              item.isRefined
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:border-primary/40"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </Section>
  )
}

function DiningStyleFilter() {
  const { items, refine } = useRefinementList({
    attribute: "dining_style",
    sortBy: ["count:desc", "name:asc"],
  })
  if (items.length === 0) return null
  return (
    <Section title="Dining style">
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.label}>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={item.isRefined}
                onChange={() => refine(item.value)}
                className="size-4 accent-[var(--primary)]"
              />
              <span className="flex-1 text-foreground">{item.label}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{item.count}</span>
            </label>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function TopRatedToggle() {
  const { value, refine } = useToggleRefinement({ attribute: "top_rated", on: true })
  return (
    <Section title="Quality">
      <label className="flex cursor-pointer items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-foreground">
          <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
          Top rated only (4.5+)
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={value.isRefined}
          onClick={() => refine({ isRefined: value.isRefined })}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            value.isRefined ? "bg-primary" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition-transform ${
              value.isRefined ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </label>
    </Section>
  )
}
