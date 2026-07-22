/**
 * index-to-algolia.mjs
 * ---------------------------------------------------------------------------
 * Pushes ./data/restaurants.json to Algolia AND configures index settings
 * (searchable attributes, custom ranking, facets, typo tolerance, geo).
 *
 * Requires (set in .env.local or the environment):
 *   NEXT_PUBLIC_ALGOLIA_APP_ID
 *   ALGOLIA_ADMIN_API_KEY          (server-side only — never ship to browser)
 *   NEXT_PUBLIC_ALGOLIA_INDEX_NAME (defaults to "restaurants")
 *
 * Run: node scripts/index-to-algolia.mjs
 */
import fs from "node:fs"
import path from "node:path"
import "dotenv/config"
import { algoliasearch } from "algoliasearch"

const APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY
const INDEX_NAME = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "restaurants"

if (!APP_ID || !ADMIN_KEY) {
  console.error(
    "[index] Missing credentials. Set NEXT_PUBLIC_ALGOLIA_APP_ID and ALGOLIA_ADMIN_API_KEY " +
      "in .env.local, then re-run. (Sign up at algolia.com — put 'Interview Candidate' as company.)",
  )
  process.exit(1)
}

const DATA_FILE = path.join(process.cwd(), "data", "restaurants.json")
if (!fs.existsSync(DATA_FILE)) {
  console.error("[index] data/restaurants.json not found. Run 'node scripts/prepare-data.mjs' first.")
  process.exit(1)
}

const records = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"))
const client = algoliasearch(APP_ID, ADMIN_KEY)

/**
 * Index settings — the "tuning" story for the debrief.
 *
 * searchableAttributes (order = priority):
 *   name first (known-item searchers), then cuisines, then location terms.
 *   `unordered(...)` so a match anywhere in the field counts equally.
 *
 * customRanking:
 *   after textual relevance ties, prefer higher popularity then rating then
 *   more reviews — surfaces trustworthy, high-signal restaurants.
 *
 * attributesForFaceting:
 *   cuisines / payment_types / price_tier / city / neighborhood as filters,
 *   `searchable(cuisines)` so the cuisine facet itself is searchable.
 *
 * typoTolerance / geo:
 *   generous typos for hard-to-spell names; ranking includes `geo` so that a
 *   configured aroundLatLng query ranks nearby results higher.
 */
const settings = {
  searchableAttributes: [
    "unordered(name)",
    "unordered(cuisines)",
    "unordered(neighborhood)",
    "unordered(city)",
    "unordered(address)",
  ],
  attributesForFaceting: [
    "searchable(cuisines)",
    "payment_types",
    "price_tier",
    "dining_style",
    "city",
    "state",
    "neighborhood",
    "top_rated",
  ],
  customRanking: ["desc(popularity)", "desc(rating)", "desc(review_count)"],
  ranking: ["typo", "geo", "words", "filters", "proximity", "attribute", "exact", "custom"],
  attributesToRetrieve: [
    "name", "address", "area", "city", "state", "postal_code", "country", "phone",
    "neighborhood", "cuisines", "cuisine", "dining_style", "price_tier", "price_label",
    "payment_types", "rating", "review_count", "top_rated", "popularity",
    "image_url", "reserve_url", "mobile_reserve_url", "_geoloc",
  ],
  // Hard-to-spell restaurant names benefit from generous typo tolerance.
  typoTolerance: true,
  minWordSizefor1Typo: 3,
  minWordSizefor2Typos: 7,
  ignorePlurals: true,
  removeStopWords: true,
  // Treat "&", "'", "-" gracefully in names like "Prime & Provisions".
  separatorsToIndex: "&'-",
  // Snappier empty/broad queries.
  paginationLimitedTo: 1000,
}

async function run() {
  console.log(`[index] app=${APP_ID} index=${INDEX_NAME} records=${records.length}`)

  // Clear then repopulate so re-runs are idempotent.
  await client.clearObjects({ indexName: INDEX_NAME }).catch(() => {})

  await client.setSettings({ indexName: INDEX_NAME, indexSettings: settings })
  console.log("[index] settings applied")

  const { taskIDs } = await client.saveObjects({ indexName: INDEX_NAME, objects: records })
  for (const taskID of taskIDs) {
    await client.waitForTask({ indexName: INDEX_NAME, taskID })
  }
  console.log(`[index] uploaded ${records.length} records ✓`)

  // Optional: a query-rule style relevance nicety could be added here.
  console.log("[index] done.")
}

run().catch((err) => {
  console.error("[index] failed:", err)
  process.exit(1)
})
