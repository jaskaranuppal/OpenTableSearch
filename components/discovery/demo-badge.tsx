"use client"

import { useState } from "react"
import { Info, X } from "lucide-react"

export function DemoBadge() {
  const [open, setOpen] = useState(true)
  if (!open) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-border bg-popover p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 size-4 flex-shrink-0 text-primary" aria-hidden="true" />
        <div className="flex-1 text-sm">
          <p className="font-medium text-foreground">Running in demo mode</p>
          <p className="mt-0.5 text-muted-foreground">
            Add your Algolia keys (<code className="text-xs">NEXT_PUBLIC_ALGOLIA_APP_ID</code> +{" "}
            <code className="text-xs">NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY</code>) and run the indexing
            script to switch to live Algolia. Search behavior mirrors the tuned index config.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Dismiss"
          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
