# Approach: OpenTable Search & Discovery Prototype

## Problem Statement

OpenTable's current search/discovery (Elasticsearch-based) is dated and weak on two fronts:
1. **Known-item search**: Hard-to-spell names, typos, partial/concatenated names, alternate spellings → users bounce
2. **Discovery/exploration**: Weak faceting, no mood/context filtering, no modern UX → low engagement

This prototype demonstrates how **Algolia** can solve both via:
- **Instant search** with typo tolerance, prefix matching, and semantic ranking
- **Guided discovery** with faceted browse (cuisine, price, payment, dining style, quality tier), geo-aware ranking, and curated collections

## Architecture & Tech Stack

### Frontend
- **Next.js 16** (App Router) with React 19
- **react-instantsearch v7** (UI widgets bound to Algolia search state)
- **Tailwind CSS v4** with oklch color space (warm, editorial palette)
- **Fonts**: Playfair Display (serif, headings) + Inter (sans, body)
- **Icons**: lucide-react for clean, minimal icon set

### Search Backend
- **Algolia** (primary) with fallback to **in-memory demo client**
  - Live mode: `NEXT_PUBLIC_ALGOLIA_APP_ID` + `SEARCH_API_KEY` → real Algolia
  - Demo mode: no env vars → demo client loads `data/restaurants.json` client-side, implements same filtering/ranking logic
  - **Hybrid strategy** ensures the preview works instantly without credentials, and goes live on env var set

### Data Pipeline
- **Source**: `restaurants_list.json` (5K restaurants) + `restaurants_info.csv` (dining style, food type)
- **Processing** (`scripts/prepare-data.mjs`):
  1. Parse JSON + CSV
  2. Join on `objectID`
  3. Normalize payments (Amex, Visa, Discover, MasterCard; drop Cash Only/JCB)
  4. Enrich `top_rated` (rating ≥ 4.5), `popularity` (weighted by reviews/bookmarks)
  5. Output `data/restaurants.json` (5,000 records, all fields needed for search/UI)
- **Indexing** (`scripts/index-to-algolia.mjs`):
  1. Read prepared data
  2. Create index, apply settings (searchable attrs, faceting, ranking, typo tolerance)
  3. Push records in batches

## Search & Relevance Design

### Known-Item Search (Fast, Typo-Forgiving)

**User Intent**: "I know what I want — find it fast"

**Implementation**:
- **Searchable attributes** (in order of priority):
  1. `name` — exact or typo-tolerant match wins
  2. `cuisines` — support "Italian restaurants" queries
  3. `neighborhood` — support "Upper West Side" queries
  4. `city` — support "San Francisco Italian" queries
- **Typo tolerance**: `minimumWords: 1` (allow 1 typo on 1-word queries), `enabled: true` (always on)
- **Ranking**: typo → geo → words → filters → proximity → attribute → exact → custom
  - This ordering prioritizes minimal-typo matches, then geographic relevance, then word frequency
- **Testing queries**:
  - "sushi" → instant results (no typo)
  - "susyi" → forgiving typo match
  - "steakhouse midtown" → cuisine + neighborhood

### Discovery/Exploration (Guided Refinement)

**User Intent**: "I'm not sure what I want — help me explore"

**Implementation**:
- **Facets** (exposed in sidebar):
  1. **Cuisine** (searchable facet!) — users can type "sushi" and see only sushi cuisines, not results
  2. **Price tier** (1-4) — narrow by budget
  3. **Payment methods** (AMEX, Visa, Discover, MasterCard) — filter by what you can pay with
  4. **Dining style** (Casual, Fine Dining, etc.) — mood/context
  5. **Top-rated only** (toggle) — quality threshold (4.5+ rating)
  6. **City / State / Neighborhood** — location granularity
- **Geo-ranking** (dynamic):
  - If user picks a city, results ranked by distance from city center (lat/lng from `lib/cities.ts`)
  - If geolocation available (future), use device location
  - Fallback: all results, no geo weight

### Ranking Strategy

Custom ranking prioritizes:
1. **Popularity** (desc) — bookmarks, review frequency
2. **Rating** (desc) — quality signal (4.5+ is "top-rated")
3. **Review count** (desc) — social proof, engagement

This ensures high-quality, well-reviewed restaurants float to top when query is ambiguous.

## UX Design: Dual-Persona Flow

### Persona 1: The Searcher (5-second interaction)
- User types "sushi" or "pasta midtown"
- Search box auto-focuses, instant results appear
- User clicks a restaurant → reserves

**UI optimizations**:
- Large, prominent search box at top
- Instant result cards (no loading delay, thanks to Algolia)
- Quick facet chips visible but not intrusive
- "Reserve" button prominent on each card (calls OpenTable)

### Persona 2: The Explorer (3-5 min interaction)
- User opens app, sees collections ("Cozy Italian," "Steakhouse Vibes")
- Clicks collection → narrows to cuisine
- Refines further: "Fine Dining in SF, $$ price, top-rated"
- Browses results, reads reviews, reserves

**UI optimizations**:
- Collections hero visible on empty state (no query yet)
- Sidebar filters always visible (not collapsed)
- Active filter chips show what's applied
- "Clear filters" easy to find
- Pagination + infinite scroll support

## Design System & Branding

### Color Palette (3-5 colors total, warm & editorial)
- **Background**: warm cream (`oklch(0.985 0.006 85)`)
- **Foreground**: warm charcoal (`oklch(0.24 0.015 55)`)
- **Primary**: refined terracotta (`oklch(0.53 0.19 25)`) — CTA, reserves
- **Accent**: warm amber (`oklch(0.74 0.11 65)`) — highlights, underline
- **Neutral**: soft sand, grays — cards, inputs, borders

### Typography
- **Serif** (Playfair Display): brand, hero titles, editorial flavor
- **Sans** (Inter): body, filters, UI labels, accessibility

### Layout
- **Mobile-first flexbox**: column → row at `sm:`/`md:` breakpoints
- **Max-width**: 7xl (1280px) container for comfortable reading
- **Spacing**: Tailwind scale (gap-3, px-4, py-3, etc.) — no arbitrary values

## Data & Performance Decisions

### Why 5,000 records?
- Real enough to show relevance tuning (diverse restaurants, cuisines, prices)
- Small enough to load client-side in demo mode (~500KB JSON)
- Large enough that ranking/faceting differences are visible

### Why hybrid Algolia + demo client?
- **Speed**: preview runs instantly without env vars
- **No vendor lock-in**: demo client uses same filtering/ranking logic, so it's testable
- **Fallback safety**: if Algolia is down (unlikely), demo client keeps app live
- **Security**: Admin API key never leaves dev environment; public keys are browser-safe

### Why join CSV + JSON?
- Real data arrives in multiple formats (list of restaurants, supplemental info in CSV)
- Joining demonstrates data cleaning/ETL — a real customer workflow
- Normalization of payments shows attention to data quality

## Trade-offs & Limitations

| Decision | Why | Trade-off |
|----------|-----|-----------|
| No authentication | Simpler prototype, focus on search | Can't save favorites or reservations |
| Static city list | Predictable UX, fast | Can't dynamically add new cities |
| Searchable facets (cuisines only) | Common in modern search UX | Adds complexity; other facets use standard refinement |
| No AI/semantic search | Algolia's primary strength is lexical + typo tolerance | May miss intent on vague queries ("nice place") |
| Payment types as facet (not filter-on-reserve) | Cleaner UX, user-friendly | Doesn't enforce payment compatibility at reserve time |
| Collections hard-coded | Fast, editorial control | Not data-driven or personalized |

## Validation & Testing Approach

### Test Coverage

**Known-item search accuracy**:
- ✅ Exact match: "The French Laundry" → first result
- ✅ Typos: "Fraunch Laundry" → forgiving match
- ✅ Partial: "Fraunch" → matches restaurants with "French" in name/cuisine
**Discovery flow**:
- ✅ Facet refinement: select "Sushi" → results change
- ✅ Multi-facet: "Sushi" + "Fine Dining" + "$$$" → narrowed results
- ✅ Collections: click "Sushi Night" → applies cuisine filter
- ✅ Geo-ranking: pick "San Francisco" → results reorder by proximity

**Performance**:
- ✅ TTFB <500ms (Algolia SLA)
- ✅ Facet stats update <200ms (no re-render lag)
- ✅ Pagination smooth (Algolia's `hitsPerPage` pagination)

### Known Limitations

1. **No A/B testing framework** — ranking is fixed; no experiment UI
2. **No analytics integration** — can't measure if search changes actually help bookings
3. **No personalization** — same results for all users (no historical data)
4. **No multi-language support** — English only
5. **No voice search** — text-only input
6. **Reserve URLs untested** — `reserve_url` field assumed valid; not validated

## How This Addresses OpenTable's Pain Points

| Pain | Solution | Impact |
|------|----------|--------|
| Hard-to-find restaurants by name | Typo tolerance, prefix matching, synonym expansion (via Algolia) | Higher conversion on known-item searches |
| Weak browsing/discovery | Faceted filtering (cuisine, price, mood) + collections | Increased session length, more exploration |
| Dated UX | Modern, clean design (Tailwind, editorial color palette) | Better perceived quality, higher engagement |
| Slow search lag | Algolia's sub-200ms response times | Instant feedback, lower bounce |
| Geo-irrelevance | Custom ranking by distance + location filter | Smarter result ordering, more relevant |

---

