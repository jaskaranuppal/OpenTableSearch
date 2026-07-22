"use client"

import Image from "next/image"
import { useSearchBox, useCurrentRefinements } from "react-instantsearch"

const COLLECTIONS = [
  { title: "Cozy Italian", subtitle: "Pasta & wood-fired pizza", term: "italian", image: "/images/cuisine/italian.png" },
  { title: "Sushi & Ramen", subtitle: "Japanese favorites", term: "japanese", image: "/images/cuisine/asian.png" },
  { title: "Taco Night", subtitle: "Vibrant Mexican", term: "mexican", image: "/images/cuisine/mexican.png" },
  { title: "Steak & Grill", subtitle: "Steakhouse classics", term: "steakhouse", image: "/images/cuisine/american.png" },
  { title: "Mediterranean", subtitle: "Mezze & fresh herbs", term: "mediterranean", image: "/images/cuisine/mediterranean.png" },
  { title: "Plant-Based", subtitle: "Vegan & seafood-light", term: "vegan", image: "/images/cuisine/plants.png" },
]

export function Collections() {
  const { query, refine } = useSearchBox()
  const { items } = useCurrentRefinements()

  // Discovery surface: only show when the user hasn't started narrowing down.
  if (query || items.length > 0) return null

  return (
    <section aria-label="Explore collections" className="pt-8">
      <div className="mb-6 max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">Discover</p>
        <h1 className="mt-2 text-balance font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
          Find your next table.
        </h1>
        <p className="mt-3 text-pretty text-base text-muted-foreground">
          Search by name, or explore by cuisine, mood, and neighborhood. Start with a collection below,
          set your location, and refine to taste.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {COLLECTIONS.map((c) => (
          <button
            key={c.title}
            type="button"
            onClick={() => refine(c.term)}
            className="group relative flex aspect-[3/2] flex-col justify-end overflow-hidden rounded-2xl border border-border text-left"
          >
            <Image
              src={c.image || "/placeholder.svg"}
              alt={c.title}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
            <div className="relative p-4">
              <h3 className="font-serif text-lg font-semibold text-background">{c.title}</h3>
              <p className="text-sm text-background/80">{c.subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
