/**
 * algolia.ts — picks the search client at runtime.
 *
 *  - If NEXT_PUBLIC_ALGOLIA_APP_ID + NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY exist,
 *    use the REAL Algolia client (production path).
 *  - Otherwise fall back to the in-memory demo client so the preview works
 *    with zero configuration.
 */
import { liteClient as algoliasearch } from "algoliasearch/lite"
import { demoSearchClient } from "./demo-search-client"

const APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID
const SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY

export const INDEX_NAME = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "restaurants"

export const isLiveAlgolia = Boolean(APP_ID && SEARCH_KEY)

export const searchClient = isLiveAlgolia
  ? algoliasearch(APP_ID as string, SEARCH_KEY as string)
  : (demoSearchClient as unknown as ReturnType<typeof algoliasearch>)
