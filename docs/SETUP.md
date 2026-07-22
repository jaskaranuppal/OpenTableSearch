# OpenTable × Algolia — Setup & Indexing

## Overview

This is a modern restaurant discovery & search interface built with **Next.js**, **react-instantsearch**, and **Algolia**. It demonstrates:
- Typo-forgiving, fast text search for known-item queries
- Faceted discovery for explorers (by cuisine, price, dining style, payment methods, quality tier)
- Geo-aware ranking prioritizing nearby restaurants
- A dual-persona UX serving both quick searchers and browsers

## Prerequisites

1. **Node.js** 18+ and **pnpm**
2. **Algolia account** — sign up free at algolia.com (put "Interview Candidate" in company field)
3. **Real dataset files** — `resources/dataset/restaurants_list.json` and `resources/dataset/restaurants_info.csv`

## Local Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Prepare Data

The project includes a data pipeline that joins the two source files, cleans payment values, and enriches records:

```bash
# This runs automatically when you follow the indexing step,
# but you can manually prep the data with:
node scripts/prepare-data.mjs
# Outputs: data/restaurants.json (5,000 cleaned records)
```

**Data processing logic:**
- **Join**: `restaurants_list.json` (ID, name, location, geo, contact, cuisine, price, payments) + `restaurants_info.csv` (ID, dining_style, food_type)
- **Normalization**: Payment methods mapped to canonical values (Amex → American Express; Carte Blanche + Diners Club → Discover; Cash Only/JCB/Pay with OpenTable dropped)
- **Enrichment**: `top_rated` boolean (rating ≥ 4.5), `popularity` score (bookmarks/reviews), `price_label` friendly text
- **Output fields**: name, address, area, city, state, postal_code, country, phone, neighborhood, cuisines, dining_style, price_tier, price_label, payment_types, rating, review_count, top_rated, popularity, image_url, reserve_url, _geoloc

### 3. Configure Algolia Credentials

Create `.env.development.local`:

```bash
NEXT_PUBLIC_ALGOLIA_APP_ID=<YOUR_APP_ID>
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=<YOUR_SEARCH_ONLY_API_KEY>
ALGOLIA_ADMIN_API_KEY=<YOUR_ADMIN_API_KEY>
NEXT_PUBLIC_ALGOLIA_INDEX_NAME=restaurants
```

Find your credentials in Algolia Dashboard → **Settings → API Keys**:
- App ID: top of page
- Search-Only API Key: copy directly; safe for browser (public)
- Admin API Key: use for indexing only; keep secret

### 4. Index Data to Algolia

```bash
node scripts/index-to-algolia.mjs
```

This script:
1. Reads the prepared data
2. Creates/overwrites the `restaurants` index
3. Applies tuned **relevance settings**:
   - **Searchable attributes**: name, cuisines, cuisine (for facet search), neighborhood, city, dining_style
   - **Custom ranking**: popularity (desc) → rating (desc) → review_count (desc)
   - **Faceting**: cuisines, payment_types, price_tier, dining_style, city, state, neighborhood, top_rated
   - **Typo tolerance**: `minimumWords: 1` (allow 1-word typos), `enabled: true`
   - **Ranking strategy**: typo → geo → words → filters → proximity → attribute → exact → custom
4. Reports success (should index ~5,000 records in seconds)

If you see `Index restaurants does not exist`, ensure `ALGOLIA_ADMIN_API_KEY` is set and valid.

### 5. Run the Dev Server

```bash
pnpm dev
```

Open http://localhost:3000 — you should see the search interface with live restaurants.

**Fallback behavior**: If `NEXT_PUBLIC_ALGOLIA_APP_ID` is not set, the app uses an in-memory demo client (same features, sourced from `data/restaurants.json`). This allows preview & testing without credentials.

## Demo Mode (No Algolia Credentials)

If you want to preview without credentials:
1. Remove/don't set `NEXT_PUBLIC_ALGOLIA_APP_ID` and `NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY`
2. `pnpm dev`
3. The app auto-falls back to the in-memory client, using the prepared dataset

All search features work identically: typo tolerance, faceting, geo-ranking, filtering.

## Production Deployment

### Vercel (Recommended)

```bash
git push origin main
# Vercel auto-deploys; add env vars in Settings → Environment Variables:
NEXT_PUBLIC_ALGOLIA_APP_ID
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
```

The Admin API key is **not needed** at runtime (only for indexing). Store it securely elsewhere.

### Other Platforms

1. Build: `pnpm build`
2. Start: `pnpm start`
3. Set env vars in your platform's settings

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Index restaurants does not exist" | Algolia not indexed, or credentials missing/wrong | Ensure `ALGOLIA_ADMIN_API_KEY` is set, then run `node scripts/index-to-algolia.mjs` |
| "0 restaurants" in live mode | Index exists but is empty | Re-run the indexing script; check for errors |
| No results in demo mode | Demo client didn't load data | Ensure `data/restaurants.json` exists; check console for import errors |
| Typos not forgiving | Typo tolerance disabled | Index settings were reset; re-run indexing script |

## File Structure

```
.
├── app/
│   ├── page.tsx           # Main entry point
│   ├── layout.tsx         # Root layout, fonts, theme
│   └── globals.css        # Theme tokens (oklch colors), Tailwind config
├── components/discovery/
│   ├── discovery-app.tsx  # InstantSearch root
│   ├── top-bar.tsx        # Header with brand, search box, location picker
│   ├── search-box.tsx     # Searchbox widget
│   ├── location-picker.tsx # Geo-location + city picker
│   ├── filters.tsx        # Refinement list: cuisine, price, payment, dining style, top-rated
│   ├── active-filters.tsx # Active refinement display (chips)
│   ├── restaurant-card.tsx # Result card component
│   ├── results.tsx        # Hits + pagination + empty state
│   ├── collections.tsx    # Editorial browse (Italian, Steakhouse, etc.)
│   └── demo-badge.tsx     # "Running on demo data" notice
├── lib/
│   ├── algolia.ts         # Client selector (live vs. demo)
│   ├── demo-search-client.ts # Fallback in-memory client
│   ├── types.ts           # Restaurant type definition
│   ├── cities.ts          # City presets with geo centers
│   └── cuisine-image.ts   # Cuisine → cover image mapping
├── scripts/
│   ├── prepare-data.mjs   # Join + clean CSV/JSON
│   ├── index-to-algolia.mjs # Index to Algolia with settings
│   └── lib/normalize.mjs   # Payment + schema normalization
├── resources/dataset/
│   ├── restaurants_list.json   # Source: full restaurant data
│   └── restaurants_info.csv    # Source: dining style + food type
├── data/
│   └── restaurants.json    # Prepared, indexed-ready data
└── docs/
    ├── SETUP.md           # This file
    ├── APPROACH.md        # Architecture & decisions
    └── COMMUNICATION_ANSWERS.md # Customer Q&A
```

## Next Steps

1. ✅ Index the data
2. ✅ Run the app locally
3. Test the UX:
   - Search for a restaurant (e.g., "pasta," "sushi," misspellings like "eatilian")
   - Use filters: select a cuisine, adjust price range, filter by payment type
   - Pick a city to geo-rank results
   - Click "Reserve" to open OpenTable (if `reserve_url` is populated)
4. Prepare for the customer call: review APPROACH.md and COMMUNICATION_ANSWERS.md
5. Deploy to Vercel when ready

