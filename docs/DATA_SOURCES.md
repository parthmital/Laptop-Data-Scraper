# Data sources and integrations

How the proposed service would get laptop listings, prices and specifications from Amazon, Flipkart, PickPCParts'
partner stores and other retailers, with the access rules, limits, reliability and cost of each. Part of the
[proposal](../PROPOSAL.md).

External facts were read on 2026-10-09, 2026-10-10 and 2026-10-15; sources and quotes are in
[RESEARCH.md](../RESEARCH.md). This is not legal advice; confirm each store's current terms before connecting it.

## Contents

- [Source types, ranked](#source-types-ranked)
- [Marketplaces: Amazon and Flipkart](#marketplaces-amazon-and-flipkart)
- [Partner stores](#partner-stores)
- [Stores collected by the prototype](#stores-collected-by-the-prototype)
- [Stores that cannot be collected](#stores-that-cannot-be-collected)
- [Affiliate networks](#affiliate-networks)
- [Collector interface](#collector-interface)
- [Matching across sources](#matching-across-sources)
- [Adding a new store](#adding-a-new-store)

## Source types, ranked

| Rank | Source type                                                                          | Reliability                                | Freshness possible                   | Running cost | Engineering cost per store                                 | Permission                                                |
| ---- | ------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------ | ------------ | ---------------------------------------------------------- | --------------------------------------------------------- |
| 1    | Partner store's platform catalogue (Shopify `/products.json`, WooCommerce Store API) | High: the platform's own structured format | Every few hours                      | ₹0           | None per store: two collectors cover 52 of the 65 partners | Explicit, by the store (it needs no work from them)       |
| 2    | Partner product feed (CSV or XML at a URL)                                           | High: a stable, documented format          | As often as the store updates it     | ₹0           | Near zero after the generic feed collector                 | Explicit, by the store                                    |
| 3    | Marketplace affiliate API (Flipkart, Amazon)                                         | High, subject to programme eligibility     | Hours (delta feeds, on-demand calls) | ₹0           | One collector per marketplace                              | By the programme's terms                                  |
| 4    | Polite page collection (the prototype)                                               | Medium: breaks when a page layout changes  | Daily at 6 s per request per host    | ₹0           | One adapter per store, plus upkeep                         | Only where robots.txt and terms allow, ideally in writing |
| 5    | Community reports                                                                    | Varies; needs review                       | Whenever someone reports             | ₹0           | One form and the review page                               | The reporter's                                            |

The prototype implements only rank 4. Ranks 1, 2, 3 and 5 are proposed.

## Marketplaces: Amazon and Flipkart

Both marketplaces forbid collecting their pages with robots or scrapers (Flipkart's terms quoted in RESEARCH.md;
Amazon's Conditions of Use could not be re-read automatically and are taken from prior knowledge). The only
acceptable route is each one's affiliate API.

### Amazon.in: Creators API (replaces PA-API 5)

| Item           | What is known (2026-10-15)                                                                                                                                                                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status         | Amazon's documentation says Product Advertising API 5.0 "has been deprecated" and the Creators API is "the supported successor". Third-party guides report PA-API calls now get HTTP 403.                                                                              |
| Eligibility    | Enrolled in Associates for the target marketplace and "at least 10 qualifying sales within the past 30 days" (Amazon's Creators API introduction). Third-party guides say access is suspended after 30 days without sales and that each marketplace counts separately. |
| India          | India appears in the documentation's country selector, but support for amazon.in was not confirmed from the pages read.                                                                                                                                                |
| Authentication | OAuth 2.0 credentials created in Associates Central (third-party migration guides; old PA-API keys do not carry over).                                                                                                                                                 |
| Rate limits    | Not stated in the pages read. Design for low request rates: look up only products already in the catalogue, in batches, a few times a day.                                                                                                                             |
| Data           | Offers (price, availability), titles, images, identifiers. Specification detail is limited, so specs should come from other sources and be matched by model or part number.                                                                                            |
| Cost           | ₹0. The real cost is the 10-sales eligibility threshold.                                                                                                                                                                                                               |

**Recommendation.** Check eligibility on Associates Central for amazon.in (Phase 0, item 0.3). Until eligible, link to
Amazon without showing a price, so the catalogue never shows an unverified Amazon price.

### Flipkart: Affiliate API 1.0

| Item           | What is known (2026-10-15)                                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoints      | Product Feed Listing (categories with full and delta feed links), Product Feed (500 products per page), Delta Feed (only products changed since a version), Top Selling, Search by keyword, Search by product ID, CSV feed downloads. |
| Data           | `maximumRetailPrice`, `flipkartSellingPrice`, `flipkartSpecialPrice`, `inStock`, `isAvailable`, `keySpecs`, `detailedSpecs`, `specificationList`, images, brand, seller name and rating, shipping charges.                            |
| Authentication | `Fk-Affiliate-Id` and `Fk-Affiliate-Token` headers. Feed URLs carry `expiresAt` and `sig` and "are valid for 10 hours only"; product URLs must carry the `affid` parameter.                                                           |
| Rate limits    | Not stated in the pages read.                                                                                                                                                                                                         |
| Status         | The documentation is still published, but it dates from 2016 and no 2026 notice confirming the API was found. Confirm in the affiliate dashboard before building.                                                                     |
| Cost           | ₹0.                                                                                                                                                                                                                                   |

**Recommendation.** If access works, Flipkart is the best single source to add: the delta feed gives price changes
for a whole category with few requests, and `detailedSpecs` feeds the spec rules directly. Collector design: fetch
the laptop category's delta feed every 6 hours, store each page raw, map fields, then run the usual matching.

## Partner stores

PickPCParts lists 65 partner retailers (as given by the team on 2026-10-15). Their websites were taken from the
[PickPCParts retailer directory](https://pickpcparts.in/retailers/) and checked on 2026-10-15 with two one-off scripts
(not committed): robots.txt, the store's home page, one product from the platform's public catalogue endpoint, and a
search for "laptop". At most 6 requests per store, one store at a time, 1.5 s apart, with an honest User-Agent.
Nothing was collected beyond that.

### What the check found

| Finding                                                                                          | Stores |
| ------------------------------------------------------------------------------------------------ | ------ |
| Shopify, public `/products.json` answered, not blocked by robots.txt                             | 32     |
| WooCommerce, public Store API (`/wp-json/wc/store/v1/products`) answered, not blocked            | 20     |
| WooCommerce, Store API answered but robots.txt disallows `/wp-json/` (PC Hub Shop)               | 1      |
| WooCommerce, Store API did not answer (NCL Computer)                                             | 1      |
| OpenCart (Vedant Computers, The IT Depot, TLG Gaming)                                            | 3      |
| Custom or unidentified platform (ALTF4 Gear, Easy Shoppi, National PC, Computech Store, LebyoPC) | 5      |
| Cloudflare challenge on every request (Aula India, M D Computers)                                | 2      |
| Timed out (Kryptronix Gaming)                                                                    | 1      |
| **Total**                                                                                        | **65** |

What it means:

- **52 of the 65 partners (80%) can be connected by two generic collectors**, one for Shopify and one for
  WooCommerce, with no code per store and no work for the store beyond saying yes. Adding such a store is a row in
  `sites`.
- **The 21 WooCommerce partners whose Store API answered list 53,399 products**; a full refresh is 544 requests of 100
  products. Spread across stores in parallel at the usual 6 s per host, the largest (Ads Store, 12,112 products, 122
  requests) takes about 12 minutes. Shopify catalogue sizes were not counted.
- **The partners are mostly component and peripheral stores.** Laptops turned up at only 8: KRG KART, Prime ABGB, Ads
  Store, SCL Gaming, GamesNComps, EZPZ Solutions, Vishal Peripherals and PC Studio (counts in the table are lower
  bounds). So for the laptop section, partner stores are a supplement and Flipkart, Amazon and laptop retailers stay
  necessary. For PickPCParts as a whole, the same collectors could take over price updates for the component and
  peripheral catalogue, which is where most of the manual work is.
- **Prime ABGB** answered normally on 2026-10-15, although its robots.txt returned HTTP 403 to the prototype's access
  review on 2026-10-09. Access may depend on time or network; ask the store rather than rely on either result.

Caveats:

- **Consent first.** These endpoints are public, but the catalogue is the store's. WooCommerce documents the Store
  API as "an unauthenticated API" for "customer-facing" product functionality. Shopify's `/products.json` is a
  storefront endpoint that themes use; it is not documented as a data API, and Shopify's community forum says it
  "isn't intended to be used as a replacement to the Admin APIs". Ask each partner, record the answer in
  `sites.permission_note`, and stop if a store says no.
- **The laptop counts are lower bounds.** Shopify search returns at most 10 suggestions; WooCommerce search was read
  up to 100 results. A title counted as a laptop only if it names a processor and is not RAM, an accessory or an item
  "for laptop".
- **A one-day snapshot.** Platforms and robots.txt change; the collectors re-check robots.txt every run.

### Fields each platform returns

Checked on one product from each platform (Vishal Peripherals on Shopify, Prime ABGB on WooCommerce):

| Prototype field                   | Shopify `/products.json`            | WooCommerce Store API                                          |
| --------------------------------- | ----------------------------------- | -------------------------------------------------------------- |
| `seller_listings.site_product_id` | `id` (and each variant's `id`)      | `id`                                                           |
| `seller_listings.title`           | `title` plus variant `title`        | `name`                                                         |
| `seller_listings.url`             | `/products/` + `handle`             | `permalink`                                                    |
| `seller_listings.image_urls_json` | `images`                            | `images`                                                       |
| `price_history.price_inr`         | variant `price`                     | `prices.price` (in paise: divide by 10^`currency_minor_unit`)  |
| `price_history.mrp_inr`           | variant `compare_at_price`          | `prices.regular_price`                                         |
| `price_history.availability`      | variant `available`                 | `is_in_stock`, `stock_availability`                            |
| Brand, part number                | `vendor`, variant `sku`             | `brands`, `sku`                                                |
| LLM input text and spec rules     | `body_html`, `product_type`, `tags` | `description`, `short_description`, `attributes`, `categories` |
| Change detection                  | `updated_at`                        | Compare prices and stock with the last observation             |

Neither returns a barcode (GTIN), so matching relies on SKU, model and part numbers as today.

### Per-store results

| Store              | Website                 | Platform         | Public catalogue endpoint                    | Laptops found                 | Suggested route                         |
| ------------------ | ----------------------- | ---------------- | -------------------------------------------- | ----------------------------- | --------------------------------------- |
| Vedant Computers   | vedantcomputers.com     | OpenCart         | None standard                                | Not checked                   | Feed                                    |
| Aarna Computers    | aarnacomputers.com      | WooCommerce      | Store API answered (5,217 products)          | None in search                | WooCommerce Store API, with consent     |
| Ads Store          | adsstore.in             | WooCommerce      | Store API answered (12,112 products)         | 30 of first 100 (389 matches) | WooCommerce Store API, with consent     |
| Ajazz              | ajazz.in                | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| ALTF4 Gear         | altf4gear.com           | Custom (Next.js) | None standard                                | Not checked                   | Feed                                    |
| Amkette            | amkette.com             | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Ant Esports        | antesports.com          | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Aula India         | aulaindia.com           | -                | Not checked: Cloudflare challenge (HTTP 403) | Not checked                   | Feed; the challenge is not bypassed     |
| Avika Retails      | avikaretails.com        | WooCommerce      | Store API answered (1,177 products)          | None in search                | WooCommerce Store API, with consent     |
| Computech Store    | computechstore.in       | Not identified   | None standard                                | Not checked                   | Feed                                    |
| Cosmic Byte        | thecosmicbyte.com       | WooCommerce      | Store API answered (212 products)            | None in search                | WooCommerce Store API, with consent     |
| CREDKEYS           | credkeys.com            | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| CtrlShiftStore     | ctrlshiftstore.com      | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Cybeart            | cybeart.in              | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Easy Shoppi        | easyshoppi.com          | Custom (Next.js) | None standard                                | Not checked                   | Feed                                    |
| Elitehubs          | elitehubs.com           | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| EZPZ Solutions     | ezpzsolutions.in        | WooCommerce      | Store API answered (5,163 products)          | 10 of first 61 (61 matches)   | WooCommerce Store API, with consent     |
| GamesNComps        | gamesncomps.com         | WooCommerce      | Store API answered (2,868 products)          | 14 of first 59 (59 matches)   | WooCommerce Store API, with consent     |
| Gameunctrl         | gameunctrl.com          | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Genesis PC         | genesispc.in            | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Get Right PC       | getrightpc.com          | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Hardware Corpus    | hardwarecorpus.in       | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Hardware Nest      | hardwarenest.in         | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| HotShiftPC         | hotshiftpc.com          | WooCommerce      | Store API answered (258 products)            | None in search                | WooCommerce Store API, with consent     |
| KC Computers       | kccomputers.co.in       | WooCommerce      | Store API answered (464 products)            | None in search                | WooCommerce Store API, with consent     |
| KEEBSMOD           | keebsmod.com            | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Keychron India     | keychron.in             | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Kreo Tech          | kreo-tech.com           | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| KRG KART           | krgkart.com             | WooCommerce      | Store API answered (1,555 products)          | 87 of first 100 (116 matches) | WooCommerce Store API, with consent     |
| Kryptronix Gaming  | kryptronix.in           | -                | Not checked: site timed out                  | Not checked                   | Recheck; then feed or platform endpoint |
| LebyoPC            | lebyopc.com             | Not identified   | None standard                                | Not checked                   | Feed                                    |
| Lethal Black       | lethalblack.com         | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| M D Computers      | mdcomputers.in          | -                | Not checked: Cloudflare challenge (HTTP 403) | Not checked                   | Feed; the challenge is not bypassed     |
| MECKEYS            | meckeys.com             | WooCommerce      | Store API answered (1,063 products)          | None in search                | WooCommerce Store API, with consent     |
| Mehta Brothers     | mehtabrothers.in        | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| National PC        | nationalpc.in           | Custom (Next.js) | None standard                                | Not checked                   | Feed                                    |
| NCL Computer       | nclcomputer.com         | WooCommerce      | Store API did not answer                     | Not checked                   | Feed                                    |
| Neo Macro          | neomacro.in             | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Network IT Store   | networkitstore.in       | WooCommerce      | Store API answered (370 products)            | None in search                | WooCommerce Store API, with consent     |
| Nexus Infosys      | mynexusinfosys.com      | WooCommerce      | Store API answered (762 products)            | None in search                | WooCommerce Store API, with consent     |
| Ninja Dog          | ninjadog.in             | WooCommerce      | Store API answered (45 products)             | None in search                | WooCommerce Store API, with consent     |
| NMPC               | nmpc.in                 | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| OnlySSD            | onlyssd.com             | WooCommerce      | Store API answered (585 products)            | None in search                | WooCommerce Store API, with consent     |
| PC Hub Shop        | pchubshop.com           | WooCommerce      | Store API answered; robots.txt disallows it  | None in search                | Feed or written permission              |
| PC Studio          | pcstudio.in             | WooCommerce      | Store API answered (2,411 products)          | 3 of first 8 (8 matches)      | WooCommerce Store API, with consent     |
| Portronics         | portronics.com          | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Prime ABGB         | primeabgb.com           | WooCommerce      | Store API answered (6,374 products)          | 72 of first 100 (568 matches) | WooCommerce Store API, with consent     |
| QuickIn Computers  | quickincomputers.com    | WooCommerce      | Store API answered (65 products)             | None in search                | WooCommerce Store API, with consent     |
| Redragon           | redragon.in             | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Royalkludge        | royalkludge.in          | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Ryugear            | ryugear.in              | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| SCL Gaming         | sclgaming.in            | WooCommerce      | Store API answered (9,221 products)          | 20 of first 51 (51 matches)   | WooCommerce Store API, with consent     |
| StacksKB           | stackskb.com            | WooCommerce      | Store API answered (236 products)            | None in search                | WooCommerce Store API, with consent     |
| The IT Depot       | theitdepot.com          | OpenCart         | None standard                                | Not checked                   | Feed                                    |
| THOCKSHOP          | thethockshop.com        | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| TLG Gaming         | tlggaming.com           | OpenCart         | None standard                                | Not checked                   | Feed                                    |
| TPSTech            | tpstech.in              | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| TVS Electronics    | store.tvselectronics.in | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| URX                | urx.co.in               | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Varmilo India      | varmiloindia.com        | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Viper PC           | viperpc.in              | WooCommerce      | Store API answered (492 products)            | None in search                | WooCommerce Store API, with consent     |
| Vishal Peripherals | vishalperipherals.com   | Shopify          | `/products.json` answered                    | 9 of first 10 results         | Shopify catalogue, with consent         |
| VRKAA              | vrkaa.com               | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Waimers            | waimers.in              | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |
| Zebronics          | zebronics.com           | Shopify          | `/products.json` answered                    | None in search                | Shopify catalogue, with consent         |

### Stores without a usable endpoint

For the 13 stores marked "Feed" or "Recheck", ask for one of these, in order of preference:

1. **The product feed they already make for Google Shopping** (Google Merchant Center format), as a URL. Required
   attributes in that format include `id`, `title`, `link`, `image_link`, `price`, `availability`, `brand` (for new
   products) and `gtin` or `mpn`; `sale_price` and `condition` are also defined. Many store platforms, including
   OpenCart with an extension, can produce this without development work.
2. **A CSV export** with at least: product id, title, URL, price, MRP, availability, brand, model or part number.
3. **A shared spreadsheet** the store updates, published as CSV. Lowest effort for small stores; least reliable.

Mapping a Merchant Center feed to the prototype's tables:

| Feed attribute                        | Prototype field                                    |
| ------------------------------------- | -------------------------------------------------- |
| `id`                                  | `seller_listings.site_product_id`                  |
| `title`, `description`                | LLM input text; `seller_listings.title`            |
| `link`                                | `seller_listings.url`                              |
| `image_link`, `additional_image_link` | `seller_listings.image_urls_json`                  |
| `price`, `sale_price`                 | `price_history.mrp_inr`, `price_history.price_inr` |
| `availability`                        | `price_history.availability`                       |
| `condition`                           | `seller_listings.condition`                        |
| `brand`, `mpn`, `gtin`                | `brand`, `part_number`; `gtin` (proposed column)   |

One generic feed collector covers every partner that sends this format. Adding a partner is then a row in `sites`
with the feed URL, not new code.

## Stores collected by the prototype

Chosen for a personal, non-commercial prototype. Their terms matter more once the data supports a site that earns
affiliate revenue.

| Store            | Data quality (measured in the last run)                                              | Terms as read                                                                                     | Use in production                                                              |
| ---------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Reliance Digital | Full spec table; 18.5 rule-extracted fields per listing on average                   | robots.txt allows `/product/`; terms page renders client-side and could not be read automatically | Ask for permission or a feed; keep the slow crawl meanwhile only if they agree |
| Vijay Sales      | No server-rendered spec table; 1.0 rule field per listing; the LLM fills most fields | Personal, non-commercial use only; no copying or republishing                                     | Not without written permission or a feed                                       |
| HP Store India   | Full spec table; 33.1 rule fields per listing                                        | Acceptable Use Policy forbids "high volume automated means"                                       | Low volume only, or a feed from HP                                             |

## Stores that cannot be collected

From the prototype's access review (RESEARCH.md, 2026-10-09 and 2026-10-10):

- Terms forbid robots, scraping or storage: Flipkart, Amazon.in, Apple, ASUS, Intel, NVIDIA, Dell India, Poorvika.
- Bot walls or HTTP 403 on robots.txt: Croma, JioMart, MSI, Lenovo, the ASUS store, and PrimeABGB on 2026-10-09
  (PrimeABGB answered normally on 2026-10-15; see [Partner stores](#partner-stores)). Partners Aula India and M D
  Computers showed a Cloudflare challenge on 2026-10-15. Bot protection is never bypassed, and paid scraping proxies
  that exist to get past it are rejected for the same reason.
- Data only through internal APIs: Tata CLiQ, Lenovo PSREF.

For any of these, the route is the store's feed, affiliate programme or written permission.

## Affiliate networks

Indian affiliate networks such as Cuelinks and EarnKaro turn ordinary store links into affiliate links for many
merchants at once. Cuelinks lists over 1,000 merchants and offers a JavaScript link converter and an API; EarnKaro
lists Reliance Digital at 2.5% and Croma at up to 5% (slab-based) (third-party and network pages, 2026-10-15). They
solve **monetisation**, not **data**: no product feeds for these stores were found. Use them in the outbound redirect
for stores without a direct programme, and compare their rates with direct programmes.

## Collector interface

A proposed common shape, so feeds, APIs and page adapters feed the same downstream stages:

```python
class Collector(Protocol):
    site: str

    def discover(self) -> Iterable[str]:
        """Product ids or URLs to look at in this run, oldest-verified first."""

    def fetch(self, item: str) -> RawRecord:
        """One raw response, stored before parsing (feed page, API response or HTML)."""

    def extract(self, raw: RawRecord) -> list[ListingRecord]:
        """Listings with price, MRP, availability, condition, identifiers and spec text."""
```

The existing adapters already split page work this way (discovery from sitemaps, `PoliteFetcher`, per-site
extraction), so page collectors move over with little change. Every collector writes through the same upsert
functions, so the idempotent, resumable behaviour of the prototype is kept.

Limits applied by the collectors:

| Collector           | Limit                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Platform catalogues | robots.txt checked each run; pages of 100 (WooCommerce) or 250 (Shopify) products; at least 6 s per host; stop on HTTP 403, 429 or a challenge page (proposed) |
| Feeds               | One download per partner per run; `If-None-Match` and `If-Modified-Since`; 50 MB cap (proposed)                                                                |
| APIs                | The provider's documented limits once known; exponential backoff on HTTP 429 and 5xx; per-run request budget                                                   |
| Pages               | robots.txt, at least 6 s plus jitter per host, at most 80 fetches per host per run, circuit breaker after 5 failures or a bot wall (all existing)              |

## Matching across sources

The existing matcher merges listings automatically only when both have a model code or part number and their
critical specs (CPU, RAM, storage, GPU, display size, stated power limits) are compatible. Everything else goes to
the review queue. Feeds and APIs improve this because they usually carry identifiers:

- GTIN (barcode) where present: exact match, safest.
- MPN or part number (for example HP's `DL5J5PA#ACJ`): exact match within a brand.
- Model number plus critical specs: the current rule.

Measured on the 29 fixtures: 6 correct merges, 0 wrong merges, 1 missed (an inferred display resolution blocked it).

## Adding a new store

1. Read its robots.txt and terms, or get written permission. Record the result in `sites.permission_note`.
2. If it runs Shopify or WooCommerce and agrees, add a `sites` row with the platform and base URL; done.
3. Otherwise prefer a feed. If it sends a Merchant Center or CSV feed, add a `sites` row with the feed URL; done.
4. If it is a marketplace API, add credentials to the server's environment file and enable its collector.
5. If only pages are allowed, write an adapter with fixtures: save 3 to 5 real product pages to `fixtures/snapshots/`,
   label them in `fixtures/ground_truth.json`, and make the adapter pass before enabling it.
6. Add the store's affiliate template, if any.
7. Watch the first scheduled runs: extraction failure rate, missing prices and match candidates for that store.
