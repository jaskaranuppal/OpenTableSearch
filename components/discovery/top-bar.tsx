"use client"

import type { GeoPoint } from "@/lib/types"
import { SearchBox } from "./search-box"
import { LocationPicker } from "./location-picker"
import { UtensilsCrossed } from "lucide-react"

type Props = {
  location: { label: string; point: GeoPoint } | null
  onLocationChange: (loc: { label: string; point: GeoPoint } | null) => void
}

export function TopBar({ location, onLocationChange }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UtensilsCrossed className="size-5" aria-hidden="true" />
          </span>
          <span className="hidden font-serif text-xl font-semibold tracking-tight sm:block">
            OpenTable
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="min-w-0 flex-1">
            <SearchBox />
          </div>
          <LocationPicker location={location} onChange={onLocationChange} />
        </div>
      </div>
    </header>
  )
}
