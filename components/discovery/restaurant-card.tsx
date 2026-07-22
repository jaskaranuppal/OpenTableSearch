"use client"

import Image from "next/image"
import { useState } from "react"
import type { Restaurant } from "@/lib/types"
import { cuisineImage } from "@/lib/cuisine-image"
import { Star, MapPin, CalendarCheck } from "lucide-react"

type HitRestaurant = Restaurant & {
  _highlightResult?: { name?: { value: string } }
}

export function RestaurantCard({ hit }: { hit: HitRestaurant }) {
  const highlighted = hit._highlightResult?.name?.value ?? hit.name
  const distance = hit.__distanceKm
  // OpenTable restaurant images (with a cuisine-based fallback if one 404s).
  const [imgFailed, setImgFailed] = useState(false)
  const imgSrc = !imgFailed && hit.image_url ? hit.image_url : cuisineImage(hit.cuisines)

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <Image
          src={imgSrc || "/placeholder.svg"}
          alt={`${hit.name} — ${hit.cuisines.join(", ")}`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          unoptimized
          onError={() => setImgFailed(true)}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {hit.price_label && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur">
            {hit.price_label}
          </span>
        )}
        {typeof distance === "number" && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-semibold text-primary-foreground backdrop-blur">
            <MapPin className="size-3" aria-hidden="true" />
            {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-serif text-lg font-semibold leading-tight text-foreground"
            // Algolia returns sanitized highlight HTML (<mark>).
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
          {hit.rating != null && (
            <span className="flex flex-shrink-0 items-center gap-1 rounded-md bg-accent/20 px-1.5 py-0.5 text-sm font-semibold text-foreground">
              <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
              {hit.rating.toFixed(1)}
            </span>
          )}
        </div>

        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">
            {hit.neighborhood ? `${hit.neighborhood}, ` : ""}
            {hit.city}
          </span>
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {hit.cuisines.slice(0, 2).map((c) => (
            <span key={c} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
              {c}
            </span>
          ))}
          {hit.dining_style && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
              {hit.dining_style}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="text-xs tabular-nums text-muted-foreground">
            {hit.review_count.toLocaleString()} reviews
          </span>
          <a
            href={hit.reserve_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <CalendarCheck className="size-3.5" aria-hidden="true" />
            Reserve
          </a>
        </div>
      </div>
    </article>
  )
}
