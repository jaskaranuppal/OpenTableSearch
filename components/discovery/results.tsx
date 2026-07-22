"use client"

import { useHits, useStats, usePagination, useSearchBox } from "react-instantsearch"
import type { Restaurant } from "@/lib/types"
import { RestaurantCard } from "./restaurant-card"
import { ChevronLeft, ChevronRight, SearchX, Navigation } from "lucide-react"

export function Results({ locationActive }: { locationActive: boolean }) {
  const { items } = useHits<Restaurant>()
  const { nbHits, processingTimeMS } = useStats()
  const { query } = useSearchBox()

  return (
    <section aria-label="Search results">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            {query ? (
              <>Results for “{query}”</>
            ) : locationActive ? (
              "Nearest to you"
            ) : (
              "Popular right now"
            )}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {nbHits.toLocaleString()} {nbHits === 1 ? "restaurant" : "restaurants"}
            <span className="text-muted-foreground/60"> · found in {processingTimeMS} ms</span>
          </p>
        </div>
        {locationActive && (
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <Navigation className="size-3.5" aria-hidden="true" />
            Ranked by distance
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((hit) => (
            <RestaurantCard key={hit.objectID} hit={hit} />
          ))}
        </div>
      )}

      <Pagination />
    </section>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
        <SearchX className="size-6 text-muted-foreground" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">No restaurants found</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {query
          ? `We couldn't find a match for “${query}”. Try fewer filters, a broader term, or a different spelling.`
          : "Try adjusting your filters to see more results."}
      </p>
    </div>
  )
}

function Pagination() {
  const { pages, currentRefinement, nbPages, isFirstPage, isLastPage, refine } = usePagination({
    padding: 1,
  })
  if (nbPages <= 1) return null

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        type="button"
        disabled={isFirstPage}
        onClick={() => refine(currentRefinement - 1)}
        className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:border-primary/40 disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => refine(page)}
          aria-current={page === currentRefinement}
          className={`flex size-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
            page === currentRefinement
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:border-primary/40"
          }`}
        >
          {page + 1}
        </button>
      ))}
      <button
        type="button"
        disabled={isLastPage}
        onClick={() => refine(currentRefinement + 1)}
        className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:border-primary/40 disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}
