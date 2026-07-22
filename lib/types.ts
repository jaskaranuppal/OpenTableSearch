export type GeoPoint = { lat: number; lng: number }

/**
 * The canonical, cleaned record shape that is indexed into Algolia and
 * returned by the search client. Produced by scripts/prepare-data.mjs from the
 * two raw source files (restaurants_list.json + restaurants_info.csv).
 */
export type Restaurant = {
  objectID: string
  name: string
  address: string
  area: string
  city: string
  state: string
  postal_code: string
  country: string
  neighborhood: string

  /** Cleaned + split cuisines, used for search and faceting. */
  cuisines: string[]
  /** Primary cuisine (first of `cuisines`), handy for compact display. */
  cuisine: string
  /** e.g. "Fine Dining", "Casual Elegant" — facetable. */
  dining_style: string

  /** 2 | 3 | 4 in this dataset. Used for filtering + custom ranking. */
  price_tier: number | null
  /** Human label, e.g. "$30 and under". */
  price_label: string

  /** Normalized to exactly: AMEX | Visa | MasterCard | Discover. */
  payment_types: string[]

  /** stars_count from the CSV. */
  rating: number | null
  /** reviews_count from the CSV. */
  review_count: number
  /** Enrichment: rating >= 4.5. Facetable toggle for discovery. */
  top_rated: boolean

  /** Custom ranking score: blends rating quality + review volume. */
  popularity: number

  image_url: string
  reserve_url: string
  mobile_reserve_url: string

  _geoloc?: GeoPoint

  // Injected at query time:
  _highlightResult?: { name?: { value: string } }
  __distanceKm?: number
}
