# Research notes

## K2 Horizon 3.7B inference interface (2026-10-09)

**Brief.** Verify how K2 Horizon 3.7B can run on Kaggle GPU T4 x2 before building the normalisation stage: weights,
dtype, libraries, chat template, reasoning controls, structured-output support.

**Findings (from the files themselves, opened and read on 2026-10-09).**

| Fact                | Value                                                                                                                                                     | Source                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Architecture        | `K2HorizonForCausalLM`, `model_type: k2_horizon`, dense (num_experts 0), 36 layers, hidden 2560, 32 heads / 8 KV heads, vocab 250,624, untied embeddings  | `config.json`               |
| Stored size         | 10.1 GB BF16 (about 5.05 B stored parameters; the card calls it "3.7B-core")                                                                              | HF file listing, model card |
| Loading             | `trust_remote_code=True`; validated with Transformers 5.15.0, PyTorch 2.13.0, Safetensors 0.8.0                                                           | model card                  |
| Attention           | eager, SDPA, flash and flex supported; flash-attn not required; no custom kernels                                                                         | `modeling_k2_horizon.py`    |
| Numerics            | RMSNorm, softmax and RoPE upcast to float32 internally                                                                                                    | `modeling_k2_horizon.py`    |
| Forward API         | standard `DynamicCache` KV cache, `logits_to_keep` supported                                                                                              | `modeling_k2_horizon.py`    |
| EOS ids             | `[1, 250019]`                                                                                                                                             | `generation_config.json`    |
| Reasoning           | always on; `reasoning_effort` in `high` / `medium` / `low` opens `<ifm\|think>` / `<ifm\|think_fast>` / `<ifm\|think_faster>`; no way to disable thinking | `chat_template.jinja`       |
| Card recommendation | `reasoning_effort="high"`, temperature 1.0, top_p 0.95, at least 32,768 output tokens; "truncated reasoning is a failed response"                         | model card                  |
| Structured output   | no JSON mode described; tool calls support `json`, `xml`, `xml_typed` formats via vLLM/SGLang parsers                                                     | model card                  |
| GGUF                | official GGUF exists but needs an unmerged llama.cpp PR or the MBZUAI-IFM fork                                                                            | GGUF model card             |
| Licence             | Apache-2.0                                                                                                                                                | model card                  |

**Confirmed on Kaggle (run `20261009T192530Z`, `outputs/metrics/model_interface.json`).** Model commit
`d6e5432c59637093c0e125e791d89ea4a0b53559` loaded with Transformers 5.15.0 and torch 2.11.0+cu128; vocabulary 250,624;
EOS ids `[1, 250019]` (`<|ifm|endoftext|>`, `<|ifm|im_end|>`); thinking open and close tag ids 250052 and 250053; the
`low` generation prompt ends with `<ifm|think_faster>`. FP16 logits were finite on both T4s (max |logit| 20.6), with
9.43 GiB allocated per GPU after loading.

**Decisions.**

- Use Transformers (the validated path) with FP16 weights, one replica per T4. T4 has no fast BF16; FP16 range risk is
  handled by a logits sanity check with an FP32 fallback split across both GPUs.
- Use `reasoning_effort="low"` with a 512-token budget instead of the card's 32k-token `high` setting, because a
  32k-token generation per listing is impractical on a T4. Truncation is counted and reported. This departs from the
  card's evaluation recommendation, so quality at higher budgets is not claimed. In run `20261009T192530Z` no thinking
  block was truncated: the model closed it after one token on 109 of 113 listings, and 4 retries ran without thinking.
- Implement constrained decoding in the notebook (top-k filtering against per-field grammars, KV-cache rollback) rather
  than adding a grammar library, because Transformers has no JSON-schema mode and compatibility of external grammar
  libraries with this custom tokenizer could not be verified offline.
- vLLM and SGLang were not used: their K2 Horizon support and T4 (compute capability 7.5) behaviour could not be verified.

**Sources (opened).**

- Model card: https://huggingface.co/IFM/K2-Horizon-3.7B
- Files: `config.json`, `generation_config.json`, `modeling_k2_horizon.py`, `chat_template.jinja` from the same repository
- GGUF card: https://huggingface.co/IFM/K2-Horizon-3.7B-GGUF
- Artificial Analysis page: https://artificialanalysis.ai/models/k2-horizon-3-7b (creator, release date September
  2026, Apache-2.0, open weights; its context-length figures are inconsistent between sections)

## Laptop data sources: access, robots.txt and terms (2026-10-09, extended 2026-10-10)

**Brief.** Choose sources of laptop listings, prices and specifications (including power limits, battery, weight and
benchmarks) that can be collected politely and lawfully for a personal research prototype, with no API credentials
available, and learn where each page keeps the data. Bot protections and access controls are never bypassed.

**Scope.** Indian retailers, manufacturer stores and specification references, and component and benchmark sites.
robots.txt files fetched with the pipeline's User-Agent on 2026-10-09 and 2026-10-10 (saved under
`.agent-local/downloads/robots*/`); terms pages opened on the same dates. Not legal advice.

**Findings.**

| Source                                                   | robots.txt                                                                                                       | Terms (as read)                                                                                                                                                                             | Page data                                                                                                                                                                                                          | Decision                                                             |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Reliance Digital                                         | `User-agent: *` allows `/product/`; blocks query strings (`/*?*`), cart, profile                                 | Terms page renders client-side; could not be reviewed automatically                                                                                                                         | Server-rendered `__INITIAL_STATE__`: spec table, images, seller, effective price, MRP, `sellable`; JSON-LD                                                                                                         | Used, slow crawl                                                     |
| Vijay Sales                                              | allows `/p/`; blocks cart, checkout, profile                                                                     | Personal, non-commercial use; no copying or republishing; no data-stream interception                                                                                                       | JSON-LD, title, keywords, `data-final-price`, `data-mrp`, gallery; spec table via an internal API (not called)                                                                                                     | Used (server-rendered data only)                                     |
| HP Store India                                           | `User-agent: *` allows product pages; lists `products_url_in_en.txt` (81 laptop URLs on 2026-10-10) as a sitemap | Site terms (revised March 2015): use invited "for Your personal and business purposes"; Acceptable Use Policy forbids "high volume automated means (including robots, spiders, scripts...)" | Server-rendered spec table (cores, threads, boost clock, cache, RAM speed, VRAM type, brightness, gamut, battery Wh and cells, adapter W, weight, dimensions, Wi-Fi), sale price, MRP, stock label, product number | **Added 2026-10-10**, low volume (same 6 s+ spacing and per-run cap) |
| Amazon.in                                                | detailed rules                                                                                                   | Not re-verified (Conditions of Use returned HTTP 503 on 2026-10-09); from prior knowledge, robots and data mining are prohibited                                                            | not probed                                                                                                                                                                                                         | Not used                                                             |
| Flipkart                                                 | product pages not blocked                                                                                        | No "deep-link", "page-scrape", "robot", "spider" or other automatic device                                                                                                                  | not probed                                                                                                                                                                                                         | Not used                                                             |
| Croma                                                    | robots.txt returns HTTP 403 (Akamai "Access Denied")                                                             | not reviewed                                                                                                                                                                                | not reachable                                                                                                                                                                                                      | Not used                                                             |
| Poorvika                                                 | allows product pages; two sitemaps                                                                               | "expressly not permitted to download any part of our website"; no commercial use                                                                                                            | not probed                                                                                                                                                                                                         | Not used                                                             |
| Tata CLiQ                                                | allows most paths                                                                                                | Terms page renders client-side; not found                                                                                                                                                   | Client-rendered single-page app; data only through internal APIs                                                                                                                                                   | Not used                                                             |
| Bajaj Electronics                                        | allows `/laptop`                                                                                                 | No terms page found (`/terms-conditions` 404); `sitemap.xml` empty                                                                                                                          | Server-rendered category pages                                                                                                                                                                                     | Not used (terms unknown, no discovery path)                          |
| JioMart, MSI (in, global), Lenovo, PrimeABGB, ASUS store | HTTP 403, Cloudflare challenge or DataDome captcha on robots.txt                                                 | not reviewed                                                                                                                                                                                | bot walls                                                                                                                                                                                                          | Not used (never bypassed)                                            |
| Dell India                                               | allows most shop paths                                                                                           | Copyright notice: no part may be "stored in an information retrieval system without the prior written permission of Dell"                                                                   | not probed                                                                                                                                                                                                         | Not used                                                             |
| Apple                                                    | allows most paths                                                                                                | No "deep-link", "page-scrape", "robot", "spider" or other automatic device (updated 2009-11-20)                                                                                             | not probed                                                                                                                                                                                                         | Not used                                                             |
| ASUS (www.asus.com)                                      | allows most paths                                                                                                | Prohibits "data mining, robots, or similar data gathering and/or extraction tools" (updated 2015-03-04)                                                                                     | not probed                                                                                                                                                                                                         | Not used                                                             |
| Lenovo PSREF                                             | robots.txt 404                                                                                                   | Not found (client-rendered app with an auth module)                                                                                                                                         | Data only through internal APIs                                                                                                                                                                                    | Not used                                                             |
| Intel (ARK specs, power)                                 | product paths allowed for some bots                                                                              | Terms (2024-06-21) forbid automated bots or web scraping and data mining without written permission                                                                                         | not probed                                                                                                                                                                                                         | Not used                                                             |
| NVIDIA (laptop GPU power ranges)                         | allows all for `*`                                                                                               | Terms (2026-07-15) forbid "any robot, spider, scraper, crawler, data mining tool"                                                                                                           | One page was fetched by an automated tool before the terms were read; its data is **not used** anywhere                                                                                                            | Not used                                                             |
| Notebookcheck, Geekbench Browser, PassMark (benchmarks)  | robots allow most paths                                                                                          | Notebookcheck imprint returned 403 to an automated fetch; Geekbench and PassMark terms not reviewed                                                                                         | Review measurements and user-submitted results                                                                                                                                                                     | Not used; no permitted benchmark source found                        |
| Smartprix, 91mobiles, Gadgets360                         | various                                                                                                          | not reviewed                                                                                                                                                                                | Secondary aggregators of retailer data                                                                                                                                                                             | Not used (secondary data, unclear rights)                            |

Data-quality observations from the 29 fixture snapshots (all reproduced in `fixtures/`):

- Reliance Digital JSON-LD reports `InStock` for items whose page state says `sellable: false` (quantity 0).
- One Reliance Digital IdeaPad lists 8 GB RAM in the title and description but 16 GB in the spec table and JSON-LD name.
- One Reliance Digital HP Victus page shows model `15-fa2654TX` in the title but `15-FB3364AX` in the spec table, and
  another spec table has the CPU typo `16320H` for `13620H` (the title says 13620H).
- Reliance Digital "Net Weight" is the packed commodity weight, not the laptop weight; HP separates "Weight" from
  "Package weight".
- Vijay Sales sells "Store Display Unit" items whose JSON-LD still says `NewCondition`.
- HP Store "Regular price" (MRP) is often more than twice the sale price (for example 4,46,289.99 vs 2,19,990.00).
- None of the 29 pages states a CPU TDP or a GPU TGP; HP states processor cores, threads and boost clock, battery,
  adapter, weight and dimensions for every laptop.
- From Kaggle on 2026-10-09 (run `20261009T175113Z`), Vijay Sales sitemap discovery returned no URLs, while the same
  requests from India returned HTTP 200. In the next Kaggle run the same day (`20261009T192530Z`) discovery worked
  from Kaggle (426 laptop URLs, 30 new pages fetched without errors), so the earlier failure was transient or
  IP-dependent; the cause is not confirmed.
- In run `20261009T192530Z`, HP Store returned a persistent HTTP 500 for 6 OmniBook product pages from Kaggle
  (`outputs/logs/pipeline.log`); 24 other HP pages were fetched.

**Recommendation.** Use Reliance Digital, Vijay Sales and HP Store India, all at 6 s or more per request with per-run
caps. Keep power-limit and benchmark fields empty unless a source states them; add a source only after its robots.txt
and terms are read. With credentials, the official Amazon Product Advertising API or Flipkart Affiliate API would be
the next sources to evaluate (not evaluated here: no credentials).

**Caveat.** This is not legal advice. Keep the notebook, its outputs and the fixtures dataset private, and review each
site's current terms before any wider use.

**Sources (opened or fetched).**

- robots.txt of every host in the table (2026-10-09/10).
- HP: terms of use https://www.hp.com/in-en/terms-of-use.html; Acceptable Use Policy https://www.hp.com/us-en/acceptable-use-policy.html; product URL file https://www.hp.com/in-en/shop/media/facets_url/products_url_in_en.txt
- Vijay Sales terms of use: https://www.vijaysales.com/faqs?faq=terms-of-use
- Flipkart terms of use: https://www.flipkart.com/pages/terms
- Poorvika terms: https://www.poorvika.com/terms-and-conditions
- Dell India site terms: https://www.dell.com/en-in/lp/legal/site-terms-of-use
- Apple website terms: https://www.apple.com/legal/internet-services/terms/site.html
- ASUS terms of use notice: https://www.asus.com/terms_of_use_notice_privacy_policy/official-site/
- Intel terms of use: https://www.intel.com/content/www/us/en/legal/terms-of-use.html
- NVIDIA terms of service: https://www.nvidia.com/en-us/about-nvidia/terms-of-service/
- Amazon.in Conditions of Use (HTTP 503 to automated fetch, not read): https://www.amazon.in/gp/help/customer/display.html?nodeId=200545940
- Reliance Digital terms page (no server-rendered text): https://www.reliancedigital.in/c/terms-of-use
- Sitemaps: `https://www.reliancedigital.in/sitemap.xml`, `https://www.vijaysales.com/sitemap-index.xml`

## PickPCParts deployment: hosting, APIs and costs (2026-10-15)

**Brief.** Choose the cheapest reliable way to run the pipeline and web app for PickPCParts, a community site funded by
affiliate links (about ₹10,000 a month in running costs and 100,000 visits a month, as stated by its team), and find
how Amazon, Flipkart and partner stores can supply data. Decisions are recorded in [PROPOSAL.md](PROPOSAL.md),
[docs/COSTS.md](docs/COSTS.md) and [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md).

**Scope.** Official documentation and pricing pages first; third-party guides only where official pages were silent,
and labelled as such. Searched and read on 2026-10-15. Not legal or tax advice.

**Findings.**

| Topic                        | Finding                                                                                                                                                                                                                                                                                                                                                                                             | Source quality                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| PickPCParts hosting          | `pickpcparts.in` and `laptops.pickpcparts.in` answer with `Server: cloudflare` and `Via: 1.1 Caddy`                                                                                                                                                                                                                                                                                                 | Observed with `curl -I`                                                    |
| Amazon PA-API 5              | "has been deprecated"; the Creators API "is the supported successor"; no shutdown date on the page. Third-party guides cite April 30 or May 15, 2026 and HTTP 403 for old calls                                                                                                                                                                                                                     | Official; dates third-party and conflicting                                |
| Amazon Creators API          | Requires Associates enrolment for the target marketplace and "at least 10 qualifying sales within the past 30 days". India support, rate limits and caching rules not stated on the pages read                                                                                                                                                                                                      | Official (US documentation)                                                |
| Flipkart Affiliate API 1.0   | Product, delta, top-selling, search and CSV feeds; fields include MRP, selling and special price, `inStock`, `keySpecs`, `detailedSpecs`; header authentication; URLs "valid for 10 hours only"; 500 per batch; `affid` must be appended. Docs date from 2016; no 2026 status notice found                                                                                                          | Official, dated                                                            |
| Amazon.in laptop commission  | 2.5% for "PCs, Laptops, Tablets"                                                                                                                                                                                                                                                                                                                                                                    | Third-party blog; the official table could not be fetched                  |
| Indian affiliate networks    | EarnKaro: Reliance Digital 2.5%, Croma up to 5% (slab-based). Cuelinks: over 1,000 merchants, link-converting script, API, 1-day cookie                                                                                                                                                                                                                                                             | Network pages and a third-party directory                                  |
| Oracle Always Free           | Ampere A1: "the first 1,500 OCPU hours and 9,000 GB hours per month", "equivalent to 2 OCPUs and 12 GB of memory"; 200 GB block storage; 10 TB outbound a month. Reports say this was cut from 4 OCPUs and 24 GB in mid-2026 (dates conflict: June 15 or August 18)                                                                                                                                 | Official limits; change history from InfoQ and blogs                       |
| Hetzner Cloud                | August 2026 price list: CX23 (2 vCPU, 4 GB, 40 GB) €5.49 + €0.50 IPv4; CAX11 €5.99 + €0.50; excluding VAT. Prices rose in April and June 2026. The official page showed no prices to the fetch tool                                                                                                                                                                                                 | Third-party price list; official page for plans and locations              |
| Vercel Hobby                 | "restricted to non-commercial personal use only"; commercial use includes "Affiliate linking is the primary purpose of the site" (page updated 2026-09-14)                                                                                                                                                                                                                                          | Official                                                                   |
| Cloudflare Workers and D1    | Free: 100,000 requests a day, 10 ms CPU per invocation; paid minimum $5 a month with 10 million requests. D1 free: 5 million rows read and 100,000 written a day, 5 GB                                                                                                                                                                                                                              | Official                                                                   |
| Cloudflare R2                | Free: 10 GB-month, 1 million Class A and 10 million Class B operations a month, free egress; then $0.015 per GB-month                                                                                                                                                                                                                                                                               | Official                                                                   |
| Cloudflare cache             | Edge TTL can "Ignore cache-control header and use this TTL"; Origin Cache Control is on for Free plans. Whether Cache Rules can cache HTML on the Free plan was not stated on the page read                                                                                                                                                                                                         | Official                                                                   |
| GitHub Actions               | Standard runners free in public repositories; 2,000 minutes a month for private repositories on GitHub Free                                                                                                                                                                                                                                                                                         | Official                                                                   |
| Kaggle                       | Notebooks can be scheduled daily, weekly or monthly. Scheduling GPU notebooks was not supported at launch (2021); current status not confirmed. GPU quota widely reported as about 30 hours a week                                                                                                                                                                                                  | Official docs (summary), 2021 announcement, third-party guides             |
| Healthchecks.io              | Free Hobbyist plan: 20 checks, 100 log entries per check; no commercial-use restriction stated                                                                                                                                                                                                                                                                                                      | Official                                                                   |
| UptimeRobot                  | Reports conflict on whether the free plan allows commercial use since late 2024                                                                                                                                                                                                                                                                                                                     | Third-party, conflicting; not relied on                                    |
| Litestream                   | "A standalone disaster recovery tool for SQLite" replicating to a file or S3; Apache-2.0                                                                                                                                                                                                                                                                                                            | Official repository                                                        |
| Google Merchant Center feeds | Required: `id`, `title`, `link`, `image_link`, `price`, `availability`, `brand` (new products), `gtin` or `mpn`; `condition` when used or refurbished                                                                                                                                                                                                                                               | Official                                                                   |
| Claude Haiku 5.5 pricing     | $0.10 per million input tokens, $0.50 per million output tokens; batch processing at 50%                                                                                                                                                                                                                                                                                                            | Anthropic model table cached 2026-10-06                                    |
| PickPCParts main site        | WordPress (robots.txt disallows `/wp-admin/`); home page shows "Sponsored" placements via `?pcp_ad_click=` links and Amazon affiliate links                                                                                                                                                                                                                                                         | Observed                                                                   |
| 65 partner stores            | Websites from https://pickpcparts.in/retailers/. Shopify with public `/products.json`: 32. WooCommerce with public Store API: 21 (one disallowed by robots.txt). OpenCart: 3. Custom or unidentified: 5. Cloudflare challenge: 2. Timed out: 1. One WooCommerce Store API did not answer. Laptops found at 8 stores. Per-store table in [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md#partner-stores) | Observed with one-off scripts, at most 6 requests per store                |
| Prime ABGB access            | Answered normally on 2026-10-15 (home page and Store API), unlike the HTTP 403 on robots.txt recorded on 2026-10-09                                                                                                                                                                                                                                                                                 | Observed; cause unknown                                                    |
| WooCommerce Store API        | "This is an unauthenticated API"; public endpoints "for the development of customer-facing cart, checkout, and product functionality"; rate limits not stated                                                                                                                                                                                                                                       | Official                                                                   |
| Shopify `/products.json`     | Public storefront endpoint; `limit` up to 250; not documented as a data API; a Shopify community answer says it "isn't intended to be used as a replacement to the Admin APIs"                                                                                                                                                                                                                      | Community forum and third-party write-ups; behaviour observed on 32 stores |
| USD to INR                   | 96.5 on a currency page (undated); used as ₹96                                                                                                                                                                                                                                                                                                                                                      | Weak; recheck before budgeting                                             |

**Measured in this repository (2026-10-15).** Production build on Node.js 24.15.0, Windows 11, Intel Core
i7-9750H, one process: 52.7 requests a second at 105 laptops (p50 19 ms) and 13.4 to 15.4 requests a second at 3,150
synthetic laptops (p50 76 ms at one concurrent request). Dynamic pages are sent with `Cache-Control: private,
no-cache, no-store, max-age=0, must-revalidate`. Method and full table in [PROPOSAL.md](PROPOSAL.md#scalability).

**Recommendation.** Run on PickPCParts' existing server if it has spare capacity, otherwise a small VPS; keep SQLite;
cache HTML at Cloudflare; use a hosted small model for new listings only; back up with Litestream to R2; monitor with
Healthchecks.io and Discord. Integrate partner feeds and the Flipkart Affiliate API first, the Amazon Creators API once
eligible. Vercel Hobby is ruled out by its terms; Oracle Always Free is usable but no longer a safe default.

**What would raise confidence.** The PickPCParts cost breakdown and affiliate statistics; confirmation from the
Flipkart and Amazon dashboards that API access works; a benchmark run on the target server.

**Sources (opened).**

- Amazon Creators API: https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation and
  https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction
- Third-party Amazon migration reports (dates, HTTP 403): search results from https://blog.freshstore.com/amazon-creators-api-pa-api-retirement/
  and https://www.keywordrush.com/blog/amazon-creator-api-what-changed-and-how-to-switch/ (summaries, not opened)
- Flipkart Affiliate API reference: https://affiliate.flipkart.com/api-docs/af_prod_ref.html
- Amazon.in commission (third-party, search summary): https://www.wscubetech.com/blog/affiliate-marketing-amazon/
- EarnKaro (search summaries): https://earnkaro.com/blog/reliance-digital-affiliate-program/,
  https://earnkaro.com/blog/croma-affiliate-program; Cuelinks (directory): https://uppromote.com/affiliate-directory/cuelinks/
- Oracle Always Free resources: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm;
  change report (search summary): https://infoq.com/news/2026/07/oracle-cloud-free-tier-limits/
- Hetzner: https://www.hetzner.com/cloud/regular-performance/; price list: https://kimmo.suominen.com/stuff/cpc-2026-08.txt
- Vercel fair use guidelines: https://vercel.com/docs/limits/fair-use-guidelines
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/; R2 pricing:
  https://developers.cloudflare.com/r2/pricing/; cache rule settings:
  https://developers.cloudflare.com/cache/how-to/cache-rules/settings/
- GitHub Actions billing: https://docs.github.com/en/billing/concepts/product-billing/github-actions
- Kaggle scheduling (search summary): https://www.kaggle.com/discussions/product-feedback/273569
- Healthchecks.io pricing: https://healthchecks.io/pricing/
- Litestream: https://github.com/benbjohnson/litestream
- Google Merchant Center product data specification: https://support.google.com/merchants/answer/7052112
- USD/INR (search summary): https://pluang.com/en/tools/currency-converter/usd-inr
- PickPCParts retailer directory: https://pickpcparts.in/retailers/
- WooCommerce Store API: https://developer.woocommerce.com/docs/apis/store-api/
- Shopify `/products.json` (community, search summary): https://community.shopify.com/t/how-to-paginate-or-get-a-list-of-all-products-using-domain-com-products-json/99991
