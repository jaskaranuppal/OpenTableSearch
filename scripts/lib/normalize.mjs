/**
 * normalize.mjs — shared cleaning/normalization logic used by the data pipeline.
 * Pure and dependency-free so it is easy to reason about and test.
 */

/** Collapse whitespace and trim. Returns "" for nullish input. */
export function cleanString(v) {
  if (v === null || v === undefined) return ""
  return String(v).replace(/\s+/g, " ").trim()
}

/** Parse a value that may arrive as number OR string. Returns null if invalid. */
export function toNumber(v) {
  if (v === null || v === undefined || v === "") return null
  const n = typeof v === "number" ? v : Number(String(v).trim())
  return Number.isFinite(n) ? n : null
}

/**
 * Payment normalization — STRICT per the assignment.
 * Only these canonical values may be exposed:
 *   AMEX, Visa, Discover, MasterCard
 * Diners Club and Carte Blanche map to Discover.
 * Everything else (JCB, Cash Only, Pay with OpenTable, ...) is dropped so the
 * facet stays clean and trustworthy.
 */
const PAYMENT_MAP = new Map([
  ["amex", "AMEX"],
  ["american express", "AMEX"],
  ["visa", "Visa"],
  ["discover", "Discover"],
  ["mastercard", "MasterCard"],
  ["master card", "MasterCard"],
  ["diners club", "Discover"],
  ["diners", "Discover"],
  ["carte blanche", "Discover"],
])

const CANONICAL_ORDER = ["AMEX", "Visa", "MasterCard", "Discover"]

export function normalizePayments(raw) {
  if (!raw) return []
  const tokens = Array.isArray(raw) ? raw : String(raw).split(/[|,;]+/)
  const set = new Set()
  for (const t of tokens) {
    const mapped = PAYMENT_MAP.get(cleanString(t).toLowerCase())
    if (mapped) set.add(mapped)
  }
  return CANONICAL_ORDER.filter((p) => set.has(p))
}

/** Strip trailing junk letters from phones ("...1114 e", "...0018x"). */
export function normalizePhone(phone) {
  if (!phone) return ""
  return cleanString(String(phone).replace(/[a-zA-Z]+\s*$/g, ""))
}

/**
 * Cuisine normalization → split compound food_type into discrete facets and
 * collapse a few near-duplicates so faceting stays clean.
 *   "Creole / Cajun / Southern" -> ["Creole","Cajun","Southern"]
 *   "Global, International"      -> ["Global","International"]
 *   "Contemporary American"      -> ["American"]
 */
const CUISINE_ALIASES = new Map([
  ["Steak", "Steakhouse"],
  ["Contemporary American", "American"],
  ["Contemporary Italian", "Italian"],
  ["Contemporary Mexican", "Mexican"],
  ["Traditional Mexican", "Mexican"],
  ["Regional Mexican", "Mexican"],
  ["Contemporary French", "French"],
  ["French American", "French"],
  ["Contemporary French / American", "French"],
  ["Contemporary European", "European"],
  ["Modern European", "European"],
  ["Contemporary Asian", "Asian"],
  ["Pan-Asian", "Asian"],
  ["Southeast Asian", "Asian"],
  ["Mexican / Southwestern", "Mexican"],
  ["Southwestern", "Southwest"],
])

export function normalizeCuisines(foodType) {
  if (!foodType) return []
  const set = new Set()
  const out = []
  const parts = String(foodType)
    .split(/[/,]/)
    .map((s) => cleanString(s))
    .filter(Boolean)
  for (const p of parts) {
    const mapped = CUISINE_ALIASES.get(p) || p
    if (!set.has(mapped.toLowerCase())) {
      set.add(mapped.toLowerCase())
      out.push(mapped)
    }
  }
  return out
}

/**
 * Price: the JSON `price` int is the source of truth. Derive a canonical label
 * so it is always consistent regardless of the CSV `price_range` text.
 */
const PRICE_LABELS = new Map([
  [1, "$15 and under"],
  [2, "$30 and under"],
  [3, "$31 to $50"],
  [4, "$50 and over"],
])

export function priceLabel(tier, fallback) {
  const t = Number(tier)
  return PRICE_LABELS.get(t) || cleanString(fallback)
}

/**
 * Custom ranking score. Bayesian shrinkage blends rating quality with review
 * volume so a 5.0 with 3 reviews does not outrank a 4.6 with 3,000 reviews.
 *   C = global rating prior, m = confidence weight (reviews needed to trust).
 */
export function popularityScore(rating, reviews, C = 4.2, m = 50) {
  const r = Number(rating) || 0
  const v = Number(reviews) || 0
  const bayes = (v / (v + m)) * r + (m / (v + m)) * C
  return Math.round((bayes + Math.log10(v + 1) * 0.15) * 1000)
}

export { CANONICAL_ORDER as ALLOWED_PAYMENTS, PRICE_LABELS }
