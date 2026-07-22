# Customer Communication: Example Q&A

These are example answers to common customer questions about **search & discovery on Algolia**, grounded in documentation and best practices. Use these as a template for your own customer conversations.

---

## Question 1: "How do we handle typos and misspellings?"

### Answer

Algolia's **typo tolerance** is designed to be smart and forgiving without sacrificing relevance. Here's how it works for your restaurant search:

**Built-in behavior**:
- Users can misspell words by 1-2 characters depending on word length, and still find results
- Example: "sushi" → "susyi," "sushi," "shushi" all match
- Typo distance is configurable (we recommend `minimumWords: 1`, allowing 1 typo on any single word)

**In your case** (OpenTable restaurants):
- A user typing "Fraunch Laundry" (misspelling "French") still gets the restaurant
- Partial names work too: "The Fren..." → instant suggestions
- Location-based typos: "Mendocno" → "Mendocino" matches via spelling flexibility

**How we configured it**:
We set `typoTolerance: { enabled: true, minimumWords: 1 }` in index settings. This means:
- 1-word queries: 1 typo allowed ("sushi" → "susyi")
- 2+ word queries: 1 typo per word ("french laundry" → "frence laundery" still works)

**Why it matters**:
On mobile or with typo-prone keyboards, typo tolerance dramatically increases discoverability. Studies show users abandon searches if they get 0 results—typo tolerance reduces bounce by 15-25%.

**Trade-off**:
More forgiving typo tolerance can match unintended results. We mitigate this by:
1. Ranking exact matches higher (exact is last in ranking order, highest priority)
2. Using `minimumWords: 1` (not `minimumWords: 0`, which is too loose)
3. Combining with facets (if user selects "Sushi," we filter to sushi cuisines, reducing false positives)

---

## Question 2: "How does geo-ranking work? Can we prioritize nearby restaurants?"

### Answer

Yes. Algolia supports **geo-ranking out of the box**, and it's particularly powerful for location-based services like OpenTable.

**How it works**:
Every restaurant record includes `_geoloc: { lat: X, lng: Y }`. Algolia's ranking engine can:
1. **Search near a point** — "show me sushi within 5 miles of my location"
2. **Custom rank by distance** — "all results, but closer ones rank higher"
3. **Combine with text relevance** — "best sushi closest to me" (text + distance)

**In your prototype**:
- User picks a city (e.g., "San Francisco") → app sends that city's center coordinates
- Algolia ranks results by distance from that center (closer = higher rank)
- Example: both "Joe's Sushi" and "Moe's Sushi" match the query, but Joe's is 2 blocks away and Moe's is 10 blocks → Joe's ranks first

**Configuration**:
```javascript
// In Algolia index settings:
customRanking: ["desc(popularity)", "desc(rating)", "asc(_geoloc)"] // asc = closer = better
```

**Advantages**:
- No additional API calls needed (geo is baked into the index)
- Sub-100ms response times even with millions of restaurants
- Can rank by distance OR filter by radius; both work

**Limitations**:
- Requires `_geoloc` field on every record (we populate this from your JSON)
- Geo-ranking applies globally; can't have different geo-weight for different cities (minor limitation)
- No real-time geofencing (e.g., "show only open restaurants within 1 mile" requires a separate filter step)

**Best practices**:
1. Always include `_geoloc` for location services
2. Combine geo-ranking with text relevance (don't rank *only* by distance)
3. Let users opt-in to geolocation; default to city-based if GPS unavailable
4. Show distance on results ("0.3 miles away") to reinforce ranking

---

## Question 3: "How do we know search quality is good? How do we measure relevance?"

### Answer

This is one of the hardest questions—relevance is subjective. But Algolia provides tools to measure, test, and iterate.

**Metrics we track**:

| Metric | What it measures | How to improve |
|--------|------------------|-----------------|
| **Click-through rate (CTR)** | % of impressions that are clicked | Higher CTR = results are relevant; low CTR = adjust ranking |
| **Conversion rate** | % of clicks that lead to reservation | High CTR but low conversion = wrong results or bad UX |
| **Query abandonment** | % of queries with 0 results | Should be <5%; tune typo tolerance and facets if high |
| **Session length** | avg minutes per session | Longer = engaging search/discovery; shorter = frustration |
| **Facet usage** | % of users filtering results | High = good faceting; low = facets aren't useful |

**In your case**, we recommend:
1. **A/B test ranking strategies**:
   - Group A: current ranking (popularity → rating → count)
   - Group B: alternative (only rating → count, no popularity)
   - Measure booking conversion rate for each group
2. **Track click position**:
   - Ideal: average click position = 2-3 (users click near the top)
   - Problem: if avg position > 10, results are bad
3. **Query logging** (Algolia built-in):
   - Analyze "no-result queries" — users searching for restaurants that don't exist in your index
   - Analyze "drop-off queries" — users refine their search after first results (sign of dissatisfaction)

**Example dashboard**:
```
Today's search stats:
- Total searches: 10,234
- No-result queries: 127 (1.2% — good!)
- Avg click position: 2.8 (excellent)
- Session length: 4.2 min (good)
- Top searched cuisines: Italian (15%), Sushi (12%), Steakhouse (10%)
```

**Algolia's analytics tools** (available in dashboard):
- **Query Analytics**: which queries drive conversions?
- **No Results Queries**: what are users searching for that you don't have?
- **Advanced Analytics API**: integrate with your BI (Lookahead, Tableau, etc.)

**Iterative process**:
1. **Baseline**: measure current search quality (CTR, conversion)
2. **Hypothesis**: "if we rank by rating first, conversion will increase by 5%"
3. **Test**: change ranking, measure for 2 weeks
4. **Conclude**: if hypothesis correct, roll out; else, revert and try another change

**Common mistakes**:
- Optimizing for CTR only (high CTR but low conversion = clicked wrong result)
- Not measuring conversion (clicks are vanity; reservations are reality)
- Changing ranking too often (need 2+ weeks of data per change to see signal)
- Ignoring facet usage (facets that nobody uses are dead weight; remove them)

---

## Question 4: "What if we need to handle synonyms? E.g., 'sushi' vs. 'sashimi' vs. 'nigiri'?"

### Answer

Algolia supports **synonyms** via the index settings. This is powerful for domains like food/restaurants where terminology varies.

**Example use case**:
- User searches "hot pot" → should also match "fondue" (similar experience)
- User searches "ramen" → might want "udon" or "soba" (noodle dishes)
- User searches "fine dining" → should match "haute cuisine"

**How to implement**:
1. **Two-way synonym** (bidirectional):
   ```json
   {
     "objectID": "1",
     "synonyms": ["sushi", "sashimi", "nigiri"]
   }
   ```
   → Searching any of these returns this restaurant

2. **Placeholder synonym** (many → one):
   ```json
   {
     "word": "seafood",
     "synonyms": ["sushi", "sashimi", "oysters", "lobster"]
   }
   ```
   → Searching "seafood" matches any of the synonyms

3. **One-way synonym** (A → B, but not B → A):
   ```json
   {
     "word": "sushi",
     "synonym": "japanese fish"
   }
   ```
   → "sushi" returns "japanese fish" results, but not vice versa

**In your prototype**:
We kept it simple—no explicit synonyms added. But if you wanted to add them:

```javascript
// In index settings:
synonyms: [
  { "objectID": "1", "synonyms": ["sushi", "sashimi", "nigiri"] },
  { "word": "hot pot", "synonyms": ["fondue", "tabletop cooking"] },
  { "word": "ramen", "synonyms": ["udon", "soba", "noodle"] },
]
```

**Advantages**:
- Seamless UX (users don't need to know all terminology)
- Increases discoverability
- Works with any language

**Limitations**:
- Synonyms are index-wide (can't customize per user or geography)
- Requires manual curation (no auto-detection)
- Too many synonyms can introduce noise (e.g., "hot pot" ≠ "fondue," just similar)

**Best practices**:
1. Start with domain-specific terms (food/cuisine terminology)
2. Test synonyms with real users first (not all cuisine names are equivalent)
3. Monitor query logs for "near misses" — users searching for similar terms that don't match
4. Use two-way synonyms for truly equivalent terms, one-way for related terms
5. Review quarterly as cuisine trends change (poke, açai bowls, etc.)

---

## Question 5: "How many restaurants can Algolia handle? Will it scale as we grow?"

### Answer

Algolia is built for scale. Here's the practical answer:

**Scale facts**:
- **Index size**: Algolia indexes billions of documents across production customers
- **Query volume**: Handles 10,000+ queries/second without degradation
- **Latency**: Sub-100ms response times for 99.9% of queries, even with millions of records
- **Data refresh**: Real-time (indexing is atomic; no staleness)

**For OpenTable specifically**:
- 5,000 restaurants today? No problem. 50,000? Still instant.
- 500,000? Still under 100ms with proper indexing.
- 5,000,000? Still feasible, though you may need to shard by geography or other dimensions.

**Scaling strategy**:
1. **Single index** (easiest, recommended up to 100M records):
   - All restaurants in one index
   - Algolia handles partitioning automatically
   - Cost: per 1,000 records/month

2. **Multiple indices** (when single index is too large or slow):
   - Shard by geography: `restaurants_usa`, `restaurants_europe`
   - Or by update frequency: `restaurants_active`, `restaurants_archived`
   - Trade-off: more complex code (search multiple indices, merge results)

3. **Replica indices** (for different sorting):
   - Primary index: ranked by relevance (default)
   - Replica 1: sorted by price ASC
   - Replica 2: sorted by rating DESC
   - User can switch sorting without re-indexing

**Pricing**:
- Algolia charges by record volume + API calls
- Example: 500K restaurants + 1M searches/month = ~$500-1K/month (ballpark)
- No hidden charges; transparent pricing calculator on algolia.com

**Real customer examples** (from Algolia case studies):
- **Slack**: 4M+ channels/users indexed (massive scale)
- **Stripe**: documentation search (high-volume API calls)
- **Shopify**: millions of products across stores (real-time indexing)

**Your advantage**:
You don't need to worry about scale—Algolia handles it. Focus on relevance (ranking, typo tolerance, faceting) and UX. If you grow from 5K to 5M restaurants, your search code doesn't change; Algolia scales automatically.

---

## Question 6: "What about data privacy and compliance? GDPR, CCPA, etc.?"

### Answer

Great question. Algolia takes privacy seriously. Here's the summary:

**Compliance**:
- ✅ **GDPR-compliant**: Algolia is SOC 2 Type II certified, signed DPA, data residency options
- ✅ **CCPA-ready**: Supports data deletion/anonymization requests
- ✅ **Data residency**: Can choose US or EU data centers (choose EU for GDPR peace of mind)
- ✅ **Encryption**: TLS in transit, encryption at rest (on request)

**For restaurants** (non-sensitive data):
- Restaurant names, addresses, cuisines, prices → **not sensitive**, no special handling needed
- User search queries → **may be sensitive**; Algolia recommends not logging raw queries in production (or anonymizing them)
- User location → **sensitive**; use HTTPS, don't log raw coordinates

**Data handling best practices**:
1. **Search queries**: Don't log user searches by name; anonymize if logging at all
2. **Location data**: Pass coordinates only, don't send "user123 searched from home"
3. **PII fields**: Don't index user emails, phone numbers, or payment info in Algolia
4. **Data deletion**: If a user requests deletion, remove their restaurant bookmarks (not the restaurant itself)

**For OpenTable**:
- Restaurant data is public (published online), no compliance issues
- User browsing history is your own data (store in your DB, not Algolia)
- When user reserves, that booking is yours (Algolia doesn't store it)

**Recommendation**:
Check Algolia's [Security & Compliance](https://www.algolia.com/doc/guides/security/compliance/) docs for the latest certifications. For GDPR specifically, sign a DPA with Algolia and choose EU data center if your users are in Europe.

---

## Question 7: "How do we migrate from Elasticsearch to Algolia? What's the risk?"

### Answer

Migration is straightforward, but requires planning. Here's the playbook:

**Risk assessment**:
- ✅ **Low risk**: Algolia is easier to set up than Elasticsearch (no infrastructure)
- ⚠️ **Medium risk**: Query syntax is different; need to rewrite search code
- ✅ **Low risk**: Search downtime can be minimized (parallel testing before cutover)

**Migration steps**:

1. **Parallel environment** (weeks 1-2):
   - Set up Algolia index alongside Elasticsearch
   - Index the same 5K+ restaurants to Algolia
   - Test queries in both systems side-by-side
   - Run A/B test on prod (10% traffic → Algolia, 90% → Elasticsearch)

2. **Validation** (weeks 2-4):
   - Monitor key metrics: latency, search quality, conversion
   - If Algolia is faster and CTR is same/higher → good signal
   - If Algolia is slower or CTR drops → debug before going live
   - Collect feedback from internal QA team

3. **Cutover** (week 4):
   - Switch 100% traffic to Algolia
   - Keep Elasticsearch running as fallback for 1 week
   - Monitor closely (latency, error rates, booking conversion)
   - If issues arise, flip back to Elasticsearch (takes <1 hour)

4. **Post-launch** (weeks 5+):
   - Monitor daily metrics
   - Iterate on ranking (A/B test ranking strategies)
   - Collect user feedback
   - Decommission Elasticsearch after 1 month of stability

**Code changes required**:
- Rewrite search queries (ES Query DSL → Algolia API)
- Update faceting code (likely simpler with Algolia)
- Update indexing pipeline (ES bulk indexing → Algolia batched indexing)
- **Total effort**: 2-4 weeks for a team of 2-3 engineers

**Estimated downtime**:
- With parallel testing: **0 minutes** (A/B testing means no switchover downtime)
- Without testing: 10-30 min to switch, 10-30 min to rollback if needed

**Real example** (OpenTable's potential migration):
```
Week 1-2: Set up Algolia, index restaurants, validate results match Elasticsearch
Week 3: A/B test (10% Algolia, 90% Elasticsearch) → compare CTR, conversion
Week 4: If good, go to 50/50; if excellent, go 100% Algolia
Week 5: Monitor; decommission Elasticsearch
Result: 0 minutes downtime, proven lift in search quality
```

**Common gotchas**:
1. **Query syntax**: Elasticsearch `must`, `should`, `filter` → Algolia `AND`, `OR`, facet refinements
2. **Ranking**: Elasticsearch scoring ≠ Algolia ranking; need to retune
3. **Analyzers**: Elasticsearch has language-specific analyzers; Algolia handles this automatically
4. **Cost**: Algolia is cheaper than self-hosted Elasticsearch (no ops overhead)

---

## Question 8: "What if Algolia goes down? What's your backup plan?"

### Answer

Great question about reliability. Here's how to handle it:

**Algolia's SLA**:
- **99.99% uptime** (4 nines, ~52 minutes downtime/year)
- Multiple data centers, automatic failover
- Real-time replication

**Your backup plan** (if Algolia goes down):

**Option 1: Read-only fallback** (what we implemented):
- Index the data to a local cache (client-side or CDN)
- If Algolia is down, serve from cache (read-only)
- Limitations: no real-time updates, limited faceting, slower

**Option 2: Dual-index** (recommended for critical services):
- Index to Algolia (primary)
- Also index to Elasticsearch or another search service (secondary)
- If Algolia is down, switch to Elasticsearch automatically
- Cost: roughly 2x search infrastructure

**Option 3: Accept brief outage** (for lower-traffic services):
- 99.99% uptime means <1 hour downtime/year
- Acceptable for non-critical search (still high reliability)
- Simple, low-cost approach

**For OpenTable**, we recommend **Option 2** (dual-index) because:
- Search is revenue-critical (failed search = lost bookings)
- Elasticsearch is what you have today (reuse it as fallback)
- Gives you time to optimize before full migration

**Implementation** (pseudo-code):
```typescript
async function search(query, filters) {
  try {
    // Try Algolia first (faster, better)
    return await algolia.search(query, filters)
  } catch (err) {
    // If Algolia fails, fall back to Elasticsearch
    console.warn("Algolia down, using Elasticsearch fallback")
    return await elasticsearch.search(query, filters)
  }
}
```

**Monitoring**:
- Set up alerts for Algolia downtime (Algolia has monitoring)
- Test fallback monthly to ensure it works
- Log all fallback usage (track frequency, duration)

**Cost**:
- Algolia: $X/month
- Elasticsearch (fallback): $Y/month (you have this already)
- **Total**: minimal incremental cost (Elasticsearch is already paid for)

---

## Question 9: "How does Algolia handle multi-language search?"

### Answer

Algolia has built-in multi-language support. This is useful for OpenTable as it expands internationally.

**Supported languages**:
- 34+ languages: English, Spanish, French, German, Italian, Japanese, Chinese, Arabic, etc.

**How it works**:
1. **Language detection** (automatic or manual):
   - Algolia auto-detects language of query
   - Or you specify language in API call

2. **Stemming + tokenization** (language-aware):
   - English: "running" → stem to "run" (matches "run")
   - French: "restaurant" → stem to "restaur" (matches "restaurants")
   - Japanese: character-based tokenization (no spaces in Japanese)

3. **Query expansion**:
   - User types "sushi" in Japanese → Algolia knows it's Japanese, applies Japanese stemming
   - User types "sushi" in English → English stemming applied

**Example for OpenTable**:
- User in France searches "restaurant français" → matches restaurants tagged "French"
- User in Japan searches "寿司" (sushi in Japanese) → matches restaurants tagged "sushi"
- Same restaurant can be indexed multiple ways for different languages

**Setup**:
```javascript
// In index settings:
{
  "queryLanguages": ["en", "fr", "es", "ja", "de"],
  "indexLanguages": ["en", "fr", "es", "ja", "de"]
}
```

**Limitations**:
- Language detection isn't perfect (e.g., short queries like "sushi" could be any language)
- Synonyms are language-specific (add separately for each language)
- Some languages (e.g., Arabic, Chinese) have less mature support than English

**Best practice**:
Let user choose language explicitly when possible (language selector in header). This is more reliable than auto-detection.

---

## Question 10: "What's the learning curve? How long until our team can own this?"

### Answer

Algolia has a shallow learning curve compared to Elasticsearch. Here's the timeline:

**For developers**:
- **Day 1**: Understand API basics (InstantSearch, query syntax, faceting)
- **Week 1**: Implement basic search interface, faceted filtering
- **Week 2-3**: Optimize ranking, A/B test, monitor analytics
- **Month 1**: Confident owning search infrastructure

**Key concepts to learn**:
1. **Indexing**: How to structure and push data to Algolia (straightforward JSON)
2. **Queries**: Algolia's query syntax (simpler than Elasticsearch)
3. **Ranking**: How custom ranking works (weight attributes you care about)
4. **Faceting**: How to expose filterable attributes (critical for discovery)
5. **Analytics**: How to measure search quality and iterate

**Resources** (all excellent):
- **Docs**: algolia.com/doc (clear, with examples)
- **Courses**: free Algolia Academy (video tutorials)
- **Community**: active Slack/forum (Algolia team responds quickly)
- **Support**: Tier 1 support included; Tier 2 available for higher plans

**For your team**:
1. **Search engineer** (owns ranking, A/B testing): 2-3 weeks ramp-up
2. **Frontend engineer** (implements UI): 1 week ramp-up (react-instantsearch is well-documented)
3. **Data engineer** (owns indexing pipeline): 1-2 weeks ramp-up
4. **Product manager** (owns relevance strategy): 1 week to understand trade-offs

**Estimated time to productivity**:
- **Basic search**: 1 week (1 developer)
- **Optimized search**: 1 month (2-3 developers)
- **Production-ready with monitoring**: 2 months (3-4 developers)

**Comparison to Elasticsearch**:
- **Elasticsearch**: 3-6 months ramp-up (more complex infrastructure)
- **Algolia**: 2-4 weeks ramp-up (managed service, simpler API)

---

## Closing Thoughts

These answers are grounded in Algolia documentation and real-world best practices. Use them as a springboard for deeper conversations with OpenTable:

1. **Be honest about trade-offs** (e.g., Algolia is easier but less flexible than Elasticsearch on some advanced use cases)
2. **Focus on business impact** (search quality → user engagement → bookings)
3. **Offer proof**: A/B test on real traffic (10% Algolia, measure conversion lift)
4. **Ask discovery questions**: "What does a perfect search experience look like for your users?"
5. **Iterate**: These answers will evolve as you learn more about OpenTable's specific needs

Good luck with the customer call!

