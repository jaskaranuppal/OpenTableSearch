"use client"

import { useState } from "react"
import { InstantSearch, Configure } from "react-instantsearch"
import { searchClient, INDEX_NAME, isLiveAlgolia } from "@/lib/algolia"
import type { GeoPoint } from "@/lib/types"
import { TopBar } from "./top-bar"
import { Filters } from "./filters"
import { Results } from "./results"
import { ActiveFilters } from "./active-filters"
import { Collections } from "./collections"
import { DemoBadge } from "./demo-badge"

export function DiscoveryApp() {
  const [location, setLocation] = useState<{ label: string; point: GeoPoint } | null>(null)

  return (
    <InstantSearch
      searchClient={searchClient}
      indexName={INDEX_NAME}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure
        hitsPerPage={12}
        {...(location
          ? { aroundLatLng: `${location.point.lat},${location.point.lng}`, aroundRadius: "all" as const }
          : {})}
      />

      <div className="min-h-screen bg-background">
        <TopBar location={location} onLocationChange={setLocation} />

        <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <Collections />

          <div className="mt-8 flex flex-col gap-8 lg:flex-row">
            <aside className="lg:w-72 lg:flex-shrink-0">
              <div className="lg:sticky lg:top-24">
                <Filters />
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              <ActiveFilters location={location} onClearLocation={() => setLocation(null)} />
              <Results locationActive={Boolean(location)} />
            </div>
          </div>
        </main>

        {!isLiveAlgolia && <DemoBadge />}
      </div>
    </InstantSearch>
  )
}
