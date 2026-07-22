/**
 * demo-search-client.ts
 * ---------------------------------------------------------------------------
 * A lightweight, in-memory search client that implements just enough of the
 * Algolia `SearchClient` contract for react-instantsearch to work WITHOUT any
 * credentials. It mirrors the real index behavior we configured in
 * scripts/index-to-algolia.mjs:
 *   - searchable name + cuisines + neighborhood + city (typo-tolerant)
 *   - facetFilters (cuisines, payment_types, price_tier, city)
 *   - numericFilters
 *   - disjunctive facet counts (InstantSearch sends the split requests for us)
 *   - geo ranking via aroundLatLng
 *   - custom ranking fallback: popularity → rating → reviews
 *
 * When real Algolia env vars are present, lib/algolia.ts uses the real client
 * instead and this file is never hit.
 */
import type { Restaurant } from "./types"
import data from "@/data/restaurants.json"

const RESTAURANTS = data as unknown as Restaurant[]

const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

/** Small Levenshtein for typo tolerance on individual tokens. */
function editDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (Math.abs(m - n) > 2) return 3
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

function allowedTypos(len: number): number {
  if (len < 3) return 0
  if (len < 7) return 1
  return 2
}

/** Does the record match the (possibly misspelled) query? */
function matchesQuery(r: Restaurant, query: string): boolean {
  const q = norm(query)
  if (!q) return true
  const haystack = [r.name, r.cuisines.join(" "), r.neighborhood, r.city, r.address]
    .map(norm)
    .join(" ")
  const words = haystack.split(/\s+/)
  const terms = q.split(/\s+/).filter(Boolean)
  // Every query term must match some word (prefix OR within typo tolerance).
  return terms.every((term) => {
    if (haystack.includes(term)) return true
    const tol = allowedTypos(term.length)
    return words.some((w) => w.startsWith(term) || editDistance(w, term) <= tol)
  })
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

type FacetFilter = string | string[]

function getFacetValue(r: Restaurant, attr: string): string[] {
  switch (attr) {
    case "cuisines":
      return r.cuisines
    case "payment_types":
      return r.payment_types
    case "price_tier":
      return r.price_tier != null ? [String(r.price_tier)] : []
    case "dining_style":
      return r.dining_style ? [r.dining_style] : []
    case "city":
      return r.city ? [r.city] : []
    case "state":
      return r.state ? [r.state] : []
    case "neighborhood":
      return r.neighborhood ? [r.neighborhood] : []
    case "top_rated":
      return [String(r.top_rated)]
    default:
      return []
  }
}

/** facetFilters is array where inner arrays are OR, outer entries are AND. */
function matchesFacetFilters(r: Restaurant, facetFilters?: FacetFilter[]): boolean {
  if (!facetFilters || facetFilters.length === 0) return true
  return facetFilters.every((clause) => {
    const ors = Array.isArray(clause) ? clause : [clause]
    return ors.some((f) => {
      const negated = f.startsWith("-")
      const raw = negated ? f.slice(1) : f
      const [attr, value] = raw.split(":")
      const has = getFacetValue(r, attr).includes(value)
      return negated ? !has : has
    })
  })
}

/** numericFilters like "price_tier<=3", "rating>=4". */
function matchesNumericFilters(r: Restaurant, numericFilters?: string[]): boolean {
  if (!numericFilters || numericFilters.length === 0) return true
  return numericFilters.every((expr) => {
    const m = expr.match(/^([a-z_]+)\s*(<=|>=|<|>|=)\s*([\d.]+)$/i)
    if (!m) return true
    const [, attr, op, num] = m
    const val = (r as unknown as Record<string, number | null>)[attr]
    if (val == null) return false
    const n = Number(num)
    switch (op) {
      case "<=": return val <= n
      case ">=": return val >= n
      case "<": return val < n
      case ">": return val > n
      case "=": return val === n
      default: return true
    }
  })
}

function parseAround(params: Record<string, unknown>): { lat: number; lng: number } | null {
  const a = params.aroundLatLng as string | undefined
  if (a && typeof a === "string") {
    const [lat, lng] = a.split(",").map((x) => Number(x.trim()))
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
  }
  return null
}

function processRequest(params: Record<string, unknown>) {
  const query = (params.query as string) || ""
  const hitsPerPage = (params.hitsPerPage as number) ?? 20
  const page = (params.page as number) ?? 0
  const facetFilters = params.facetFilters as FacetFilter[] | undefined
  const numericFilters = params.numericFilters as string[] | undefined
  const requestedFacets = (params.facets as string[]) || []
  const around = parseAround(params)

  const t0 = Date.now()

  // 1) filter by query + filters
  let filtered = RESTAURANTS.filter(
    (r) =>
      matchesQuery(r, query) &&
      matchesFacetFilters(r, facetFilters) &&
      matchesNumericFilters(r, numericFilters),
  )

  // 2) rank: geo first if requested, else popularity/rating/reviews
  if (around) {
    filtered = filtered
      .map((r) => ({
        r,
        d: r._geoloc ? haversineKm(around, r._geoloc) : Number.POSITIVE_INFINITY,
      }))
      .sort((a, b) => a.d - b.d || b.r.popularity - a.r.popularity)
      .map(({ r, d }) => ({ ...r, __distanceKm: Number.isFinite(d) ? Math.round(d * 10) / 10 : undefined }))
  } else {
    filtered = [...filtered].sort(
      (a, b) =>
        b.popularity - a.popularity ||
        (b.rating ?? 0) - (a.rating ?? 0) ||
        b.review_count - a.review_count,
    )
  }

  // 3) facet counts on the filtered set (InstantSearch handles disjunctive split)
  const facets: Record<string, Record<string, number>> = {}
  for (const attr of requestedFacets) {
    const counts: Record<string, number> = {}
    for (const r of filtered) {
      for (const v of getFacetValue(r, attr)) counts[v] = (counts[v] ?? 0) + 1
    }
    facets[attr] = counts
  }

  // 4) paginate
  const nbHits = filtered.length
  const nbPages = Math.max(1, Math.ceil(nbHits / hitsPerPage))
  const start = page * hitsPerPage
  const hits = filtered.slice(start, start + hitsPerPage).map((r) => ({
    ...r,
    _highlightResult: {
      name: { value: highlight(r.name, query), matchLevel: query ? "full" : "none", matchedWords: [] },
    },
  }))

  return {
    hits,
    nbHits,
    page,
    nbPages,
    hitsPerPage,
    facets,
    query,
    params: "",
    processingTimeMS: Math.max(1, Date.now() - t0),
    exhaustiveNbHits: true,
    index: (params.indexName as string) || "restaurants",
  }
}

/** Naive highlight wrapper matching Algolia's <mark> convention. */
function highlight(text: string, query: string): string {
  if (!query) return escapeHtml(text)
  const terms = norm(query).split(/\s+/).filter(Boolean)
  let out = escapeHtml(text)
  for (const term of terms) {
    if (!term) continue
    const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig")
    out = out.replace(re, "<mark>$1</mark>")
  }
  return out
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export const demoSearchClient = {
  // react-instantsearch calls this with { requests: [{ indexName, params }] }
  search(requests: { indexName: string; params?: Record<string, unknown> }[]) {
    return Promise.resolve({
      results: requests.map((req) => processRequest({ ...(req.params || {}), indexName: req.indexName })),
    })
  },
  searchForFacetValues() {
    return Promise.resolve([])
  },
}
