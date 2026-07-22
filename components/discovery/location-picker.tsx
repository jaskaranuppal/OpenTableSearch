"use client"

import { useEffect, useRef, useState } from "react"
import { CITIES } from "@/lib/cities"
import type { GeoPoint } from "@/lib/types"
import { MapPin, ChevronDown, LocateFixed, Check } from "lucide-react"

type Props = {
  location: { label: string; point: GeoPoint } | null
  onChange: (loc: { label: string; point: GeoPoint } | null) => void
}

export function LocationPicker({ location, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [locating, setLocating] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  function useMyLocation() {
    if (!("geolocation" in navigator)) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          label: "Near me",
          point: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        })
        setLocating(false)
        setOpen(false)
      },
      () => {
        // Graceful fallback: default to the first preset city if denied/unavailable.
        onChange({ label: CITIES[0].label, point: CITIES[0].point })
        setLocating(false)
        setOpen(false)
      },
      { timeout: 8000 },
    )
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/40"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <MapPin className="size-4 text-primary" aria-hidden="true" />
        <span className="hidden max-w-28 truncate sm:inline">
          {location ? location.label : "Anywhere"}
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-56 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-secondary disabled:opacity-60"
          >
            <LocateFixed className="size-4" aria-hidden="true" />
            {locating ? "Locating…" : "Use my location"}
          </button>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setOpen(false)
            }}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
          >
            <span>Anywhere</span>
            {!location && <Check className="size-4 text-primary" aria-hidden="true" />}
          </button>
          {CITIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => {
                onChange({ label: c.label, point: c.point })
                setOpen(false)
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
            >
              <span>{c.label}</span>
              {location?.label === c.label && <Check className="size-4 text-primary" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
