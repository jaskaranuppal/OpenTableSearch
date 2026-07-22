/**
 * prepare-data.mjs
 * ---------------------------------------------------------------------------
 * Joins + cleans the two raw OpenTable source files into a single, index-ready
 * JSON array written to data/restaurants.json.
 *
 *   resources/dataset/restaurants_list.json   (core record, geo, payments)
 *   resources/dataset/restaurants_info.csv    (food_type, ratings, price, ...)
 *
 * Join key: objectID (verified 1:1 in this dataset).
 *
 * The output is consumed by BOTH:
 *   - scripts/index-to-algolia.mjs   (pushes to a real Algolia index)
 *   - the Next.js app in DEMO MODE    (so the preview works with no creds)
 *
 * Run: node scripts/prepare-data.mjs
 * ---------------------------------------------------------------------------
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  cleanString,
  toNumber,
  normalizePayments,
  normalizePhone,
  normalizeCuisines,
  priceLabel,
  popularityScore,
} from "./lib/normalize.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const LIST_PATH = path.join(ROOT, "resources/dataset/restaurants_list.json")
const CSV_PATH = path.join(ROOT, "resources/dataset/restaurants_info.csv")
const OUT_PATH = path.join(ROOT, "data/restaurants.json")

/** Minimal, dependency-free parser for the semicolon-delimited info CSV. */
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/)
  const header = lines[0].split(";").map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const cells = line.split(";")
    const row = {}
    header.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim()
    })
    return row
  })
}

function main() {
  if (!fs.existsSync(LIST_PATH) || !fs.existsSync(CSV_PATH)) {
    console.error(
      `[prepare-data] Missing source files. Expected:\n  ${LIST_PATH}\n  ${CSV_PATH}`,
    )
    process.exit(1)
  }

  console.log("[prepare-data] reading sources...")
  const list = JSON.parse(fs.readFileSync(LIST_PATH, "utf8"))
  const csvRows = parseCsv(fs.readFileSync(CSV_PATH, "utf8"))

  // Index CSV info by objectID for an O(1) join.
  const infoById = new Map()
  for (const row of csvRows) infoById.set(String(row.objectID), row)

  const stats = {
    total: list.length,
    joined: 0,
    missingInfo: 0,
    missingGeo: 0,
    droppedPayments: new Set(),
  }

  const records = list.map((r) => {
    const id = String(r.objectID)
    const info = infoById.get(id)
    if (info) stats.joined++
    else stats.missingInfo++

    // payments — strict normalization; track what we drop for the report.
    for (const p of r.payment_options || []) {
      if (normalizePayments([p]).length === 0) stats.droppedPayments.add(p)
    }
    const payment_types = normalizePayments(r.payment_options)

    // cuisines come from the CSV food_type.
    const cuisines = normalizeCuisines(info?.food_type)
    const cuisine = cuisines[0] || "Restaurant"

    const rating = toNumber(info?.stars_count)
    const review_count = toNumber(info?.reviews_count) ?? 0

    // price: JSON `price` int is source of truth; label derived canonically.
    const price_tier = toNumber(r.price)
    const price_label = priceLabel(price_tier, info?.price_range)

    // geo: only attach _geoloc when coordinates are valid.
    const lat = toNumber(r._geoloc?.lat)
    const lng = toNumber(r._geoloc?.lng)
    const hasGeo = lat !== null && lng !== null
    if (!hasGeo) stats.missingGeo++

    return {
      objectID: id,
      name: cleanString(r.name),
      address: cleanString(r.address),
      area: cleanString(r.area),
      city: cleanString(r.city),
      state: cleanString(r.state),
      postal_code: cleanString(r.postal_code),
      country: cleanString(r.country) || "US",
      neighborhood: cleanString(info?.neighborhood),

      cuisines,
      cuisine,
      dining_style: cleanString(info?.dining_style),

      price_tier,
      price_label,

      payment_types,

      rating: rating !== null ? Math.round(rating * 10) / 10 : null,
      review_count,
      top_rated: (rating ?? 0) >= 4.5,

      popularity: popularityScore(rating, review_count),

      image_url: cleanString(r.image_url),
      reserve_url: cleanString(r.reserve_url),
      mobile_reserve_url: cleanString(r.mobile_reserve_url),

      phone: normalizePhone(info?.phone_number || r.phone),

      ...(hasGeo ? { _geoloc: { lat, lng } } : {}),
    }
  })

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, JSON.stringify(records))

  // Report — useful to narrate in the technical debrief.
  const cuisineSet = new Set()
  const paymentSet = new Set()
  records.forEach((r) => {
    r.cuisines.forEach((c) => cuisineSet.add(c))
    r.payment_types.forEach((p) => paymentSet.add(p))
  })

  console.log("[prepare-data] ----------------------------------------")
  console.log(`  records written : ${records.length}`)
  console.log(`  joined w/ CSV   : ${stats.joined}`)
  console.log(`  missing CSV info: ${stats.missingInfo}`)
  console.log(`  missing geo     : ${stats.missingGeo}`)
  console.log(`  unique cuisines : ${cuisineSet.size}`)
  console.log(`  payment exposed : ${[...paymentSet].sort().join(", ")}`)
  console.log(`  payment dropped : ${[...stats.droppedPayments].sort().join(", ") || "(none)"}`)
  console.log(`  output          : ${path.relative(ROOT, OUT_PATH)}`)
}

main()
