"use client"

import { useCurrentRefinements } from "react-instantsearch"
import type { GeoPoint } from "@/lib/types"
import { X, MapPin } from "lucide-react"

const ATTR_LABEL: Record<string, string> = {
  cuisines: "Cuisine",
  payment_types: "Card",
  price_tier: "Price",
  dining_style: "Style",
  top_rated: "Quality",
}
const PRICE_LABELS: Record<string, string> = { "1": "$", "2": "$$", "3": "$$$", "4": "$$$$" }

function chipLabel(attr: string, value: string, label: string): string {
  const prefix = ATTR_LABEL[attr] ?? attr
  if (attr === "price_tier") return `${prefix}: ${PRICE_LABELS[String(value)] ?? label}`
  if (attr === "top_rated") return "Top rated (4.5+)"
  return `${prefix}: ${label}`
}

type Props = {
  location: { label: string; point: GeoPoint } | null
  onClearLocation: () => void
}

export function ActiveFilters({ location, onClearLocation }: Props) {
  const { items } = useCurrentRefinements()
  const chips = items.flatMap((item) =>
    item.refinements.map((r) => ({
      key: `${item.attribute}-${r.value}`,
      label: chipLabel(item.attribute, String(r.value), r.label),
      remove: () => item.refine(r),
    })),
  )

  if (chips.length === 0 && !location) return null

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {location && (
        <button
          type="button"
          onClick={onClearLocation}
          className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <MapPin className="size-3" aria-hidden="true" />
          Near {location.label}
          <X className="size-3" aria-hidden="true" />
        </button>
      )}
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.remove}
          className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-border"
        >
          {chip.label}
          <X className="size-3" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
