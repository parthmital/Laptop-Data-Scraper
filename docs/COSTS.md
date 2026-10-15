# Costs, revenue and financial sustainability

What the proposed service would cost each month, which alternatives were compared, and how it can pay for itself
from affiliate revenue without changing what PickPCParts recommends. Part of the [proposal](../PROPOSAL.md).

Every figure is an estimate with its assumptions stated. Prices were read on 2026-10-15 unless noted; sources are in
[RESEARCH.md](../RESEARCH.md#pickpcparts-deployment-hosting-apis-and-costs-2026-10-15). Recheck them before
committing: two of the providers below changed their prices or free allowances during 2026.

## Contents

- [Assumptions](#assumptions)
- [Monthly cost by deployment option](#monthly-cost-by-deployment-option)
- [Component choices compared](#component-choices-compared)
- [Unit costs](#unit-costs)
- [Cost guardrails](#cost-guardrails)
- [Revenue model](#revenue-model)
- [Keeping the mission intact](#keeping-the-mission-intact)

## Assumptions

| Assumption                      | Value                                   | Basis                                                                                                                            |
| ------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Exchange rate                   | 1 USD = ₹96; 1 EUR = ₹110               | USD/INR 96.5 on a currency page read 2026-10-15 (undated); EUR from 0.87 EUR per USD (August 2026 price list)                    |
| Taxes                           | Excluded                                | Foreign services may attract GST; check with whoever pays the bills                                                              |
| Current platform cost           | ₹10,000 a month                         | Stated by the PickPCParts team; breakdown not known                                                                              |
| Traffic                         | 100,000 visits a month, 3 pages a visit | Visits stated by the team; pages per visit assumed                                                                               |
| Catalogue size (Phase 2)        | 6,000 listings from about 20 sources    | Assumption for sizing; the prototype has 113                                                                                     |
| New or changed listings a month | 500 to 2,000                            | Assumption; only these reach the LLM                                                                                             |
| LLM input per listing           | 2,200 tokens                            | Measured: mean prompt 2,200 tokens over 113 listings (`llm_normalisations.prompt_tokens`)                                        |
| LLM output per listing          | 500 tokens                              | Assumption for a hosted model writing the full JSON; the prototype's decoder generated 70 on average because code wrote the keys |

## Monthly cost by deployment option

| Item                                        | A: existing PickPCParts server | B: dedicated small server | C: Oracle Always Free |
| ------------------------------------------- | ------------------------------ | ------------------------- | --------------------- |
| Server                                      | ₹0 (uses spare capacity)       | About ₹660 (Hetzner CX23) | ₹0                    |
| CDN and DNS (Cloudflare free plan)          | ₹0                             | ₹0                        | ₹0                    |
| Backups (Cloudflare R2, under 10 GB)        | ₹0                             | ₹0                        | ₹0                    |
| Job monitoring (Healthchecks.io, 20 checks) | ₹0                             | ₹0                        | ₹0                    |
| Alerts (Discord webhook)                    | ₹0                             | ₹0                        | ₹0                    |
| CI (GitHub Actions)                         | ₹0                             | ₹0                        | ₹0                    |
| LLM for new or changed listings             | About ₹25 to ₹100              | About ₹25 to ₹100         | About ₹25 to ₹100     |
| Marketplace and affiliate APIs              | ₹0                             | ₹0                        | ₹0                    |
| **Total**                                   | **About ₹25 to ₹100**          | **About ₹700 to ₹800**    | **About ₹25 to ₹100** |

Notes:

- **A** is recommended if the server has about 1 GB of RAM and a little CPU to spare: the measured web app used about
  170 MB with today's catalogue and about 420 MB with a 3,150-laptop catalogue, and the pipeline jobs are short. It
  adds no new provider, account or bill.
- **B** is the fallback. Hetzner CX23: 2 vCPU, 4 GB RAM, 40 GB disk, €5.49 plus €0.50 for IPv4, excluding VAT
  (August 2026 price list; Hetzner raised cloud prices in April and June 2026). Its servers are in Europe, the USA and
  Singapore; latency to India matters little because Cloudflare serves cached pages from India.
- **C** costs nothing but carries risk: Oracle's documentation now gives 2 OCPUs and 12 GB of Arm compute for Always
  Free, after reports in mid-2026 that it was cut from 4 OCPUs and 24 GB, with some instances shut down. Use it only
  with backups that make moving away a one-hour job.
- **One-time costs.** None in money. Engineering time is the real cost: Phase 1 is roughly four to six weeks of
  part-time volunteer work (an estimate, not measured).
- **The initial backfill** of a 6,000-listing catalogue through the LLM costs about ₹270 once (₹135 with batch
  processing).

## Component choices compared

### Hosting the web app

| Option                              | Monthly cost                                                                | Fits this app?                                                                                                                                                                                                           |
| ----------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Existing PickPCParts server (Caddy) | ₹0 extra                                                                    | Yes: `next start` behind Caddy, reading a local SQLite file                                                                                                                                                              |
| Small VPS (Hetzner CX23)            | About ₹660                                                                  | Yes                                                                                                                                                                                                                      |
| Oracle Always Free (Arm)            | ₹0                                                                          | Yes, with the risks above                                                                                                                                                                                                |
| Vercel Hobby                        | ₹0                                                                          | **No.** Hobby is "restricted to non-commercial personal use only", and "affiliate linking is the primary purpose of the site" is listed as commercial use. Serverless functions also cannot share one local SQLite file. |
| Cloudflare Workers                  | ₹0 (100,000 requests a day, 10 ms CPU each) or about ₹480 (paid minimum $5) | Not without a rewrite: no `node:sqlite`, so data would move to D1 (free: 5 million rows read a day). Loading the whole 3,000-row catalogue per request would hit that limit at about 1,600 requests a day.               |

### Database

| Option                        | Cost      | Verdict                                                                                       |
| ----------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| SQLite file (current)         | ₹0        | **Chosen.** One scheduled writer, many readers; nothing to operate; backup is copying a file. |
| PostgreSQL on the same server | ₹0        | Later, if several processes must write at once. Adds a service to run, tune and back up.      |
| Managed PostgreSQL            | Varies    | Not needed at this size; free tiers commonly limit storage or pause idle databases.           |
| Cloudflare D1                 | ₹0 to low | Only with the Workers rewrite above.                                                          |

### LLM normalisation

| Option                                            | Cost a month (500 to 2,000 listings)          | Operations                                                                                                                                                | Verdict                                                                                                                |
| ------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Rules only, no LLM                                | ₹0                                            | None                                                                                                                                                      | Possible for stores with spec tables or feeds (rules alone: accuracy 0.79, precision 1.0); fields in titles stay empty |
| Hosted small model (Claude Haiku 5.5 priced here) | About ₹23 to ₹90 (half with batch processing) | Scheduled, no GPU                                                                                                                                         | **Chosen**, if it matches the prototype's accuracy on the 29 fixtures                                                  |
| K2 Horizon 3.7B on Kaggle T4 x2 (prototype)       | ₹0                                            | Manual runs; Kaggle's scheduling is daily, weekly or monthly, and scheduling GPU notebooks was not supported at launch (2021; current status unconfirmed) | Keep for evaluation and as a free fallback                                                                             |
| Same model on a CPU server                        | ₹0 extra                                      | Speed not measured; official GGUF needs an unmerged llama.cpp change                                                                                      | Not recommended until measured                                                                                         |
| Rented GPU                                        | Hundreds to thousands of rupees               | Another account and machine                                                                                                                               | Rejected: the workload is minutes a month                                                                              |

Price used: Claude Haiku 5.5 at $0.10 per million input tokens and $0.50 per million output tokens (Anthropic
pricing as of 2026-10-06); the Message Batches API halves this. Any hosted model with structured JSON output fits the
same slot; the validator and grounding step stay the same whichever model is used.

### Monitoring, backups and scheduling

| Need           | Chosen                                                                        | Free allowance                                               | Alternatives and why not                                                                                           |
| -------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Job heartbeats | Healthchecks.io                                                               | 20 checks, 100 log entries each                              | Self-hosting the same open-source tool is possible but is another service to keep alive                            |
| Alerts         | Discord webhook to a maintainers' channel                                     | Free                                                         | Email needs a sending service                                                                                      |
| Uptime check   | Healthchecks.io check fed by a GitHub Actions schedule in a public repository | Public repositories run standard runners free                | UptimeRobot's free plan: reports conflict on whether commercial use is allowed                                     |
| Backups        | Litestream plus daily snapshots to Cloudflare R2                              | 10 GB-month, 1 million writes, 10 million reads, free egress | Oracle Object Storage (10 to 20 GB free, depending on account type) is fine too if option C is used                |
| Scheduling     | systemd timers                                                                | Built in                                                     | GitHub Actions cron: free, but store sites may block its cloud IPs, and the database would have to travel each run |
| Web analytics  | Cloudflare analytics plus `outbound_clicks`                                   | Free                                                         | Third-party trackers add privacy cost for users                                                                    |

## Unit costs

| Unit                                             | Cost                                                                                                  |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| One listing through the hosted LLM               | About ₹0.045 (₹0.023 with batch processing)                                                           |
| 1,000 page views                                 | About ₹0 on option A or C; about ₹2.50 on option B at 300,000 views a month, falling as traffic grows |
| 1 GB of backups beyond 10 GB on R2               | $0.015 a month, about ₹1.4                                                                            |
| One more partner store on Shopify or WooCommerce | ₹0 running cost, no code (a row in `sites`)                                                           |
| One more partner store connected by feed         | ₹0 running cost                                                                                       |
| One more store connected by page collection      | ₹0 running cost, plus upkeep when its pages change                                                    |

## Cost guardrails

- Set a monthly spend limit in the LLM provider's console (for example ₹300), and keep the pipeline's own cap
  (`MAX_LISTINGS_TO_NORMALISE`, 250 per run today).
- Send only new or changed text to the model; the prototype already caches results by input hash and versions.
- Keep a free fallback: if the API budget is used up, listings keep their rule values and the LLM step catches up
  next month or on Kaggle.
- Review each free tier's terms yearly; this proposal names the one in use for each job so a change is easy to spot.

## Revenue model

Monthly affiliate revenue from the laptop section is roughly:

```text
revenue = laptop sessions x click-out rate x purchase rate after click x average order value x commission rate
```

None of these are known for PickPCParts yet; the scenarios below are illustrative, not forecasts. Replace them with
real numbers from the outbound click counts (Roadmap item 1.5) and the affiliate dashboards.

| Input                       | Low     | Moderate | Basis                                                                                                                                                     |
| --------------------------- | ------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Click-out rate              | 5%      | 8%       | Assumption                                                                                                                                                |
| Purchase rate after a click | 0.5%    | 0.5%     | Assumption; affiliate cookies are short (Cuelinks lists a 1-day cookie)                                                                                   |
| Average order value         | ₹60,000 | ₹60,000  | Assumption; below the prototype's median in-stock price of ₹1,27,990 (61 offers, raised by HP Store's premium models)                                     |
| Commission                  | 1%      | 2%       | Network pages list 2.5% for Reliance Digital (EarnKaro) and a third-party blog lists 2.5% for laptops on Amazon.in; actual rates vary by store and change |
| Revenue per laptop session  | ₹0.15   | ₹0.48    | Product of the above                                                                                                                                      |

| Laptop sessions a month | Low     | Moderate |
| ----------------------- | ------- | -------- |
| 10,000                  | ₹1,500  | ₹4,800   |
| 30,000                  | ₹4,500  | ₹14,400  |
| 100,000                 | ₹15,000 | ₹48,000  |

Break-even:

| Option                    | Monthly cost | Laptop sessions needed (low) | Laptop sessions needed (moderate) |
| ------------------------- | ------------ | ---------------------------- | --------------------------------- |
| A: existing server        | About ₹100   | About 700                    | About 210                         |
| B: dedicated small server | About ₹800   | About 5,300                  | About 1,700                       |

Even in the low scenario, option A pays for itself at a few hundred laptop sessions a month. The bigger financial
effect is likely indirect: maintainers spend less time on price updates, and more stores with fresh prices make
the section more useful, which brings visits. Neither effect is measured here.

What reduces revenue, and how the design handles it:

- Many stores have no affiliate programme. Show them anyway; ranking by price is what users trust.
- Returns and cancellations reverse commissions; dashboards report this. Use net figures.
- Amazon's API eligibility needs 10 qualifying sales in 30 days. If PickPCParts is below that, link to Amazon without a
  price rather than show stale Amazon prices.

### Sponsored placements

Affiliate links are not the only income. Observed on 2026-10-15: the PickPCParts home page carries placements labelled
"Sponsored", served through its own click-tracking links (`?pcp_ad_click=...&placement=premium_header`). The laptop
section can reuse the same mechanism for a clearly labelled sponsored slot. Revenue from it is not estimated here;
the team knows its rates. The rule below about ranking applies to it too.

## Keeping the mission intact

Rules the code and data should enforce:

- Ranking and "Best price" depend only on price, stock, condition and freshness, never on commission or sponsorship.
  The current `lowest_prices` logic already ignores both. Sponsored slots stay separate from results and labelled.
- Show every store that has a fresh offer, with or without an affiliate programme.
- Disclose affiliate links on the page and mark them `rel="sponsored nofollow"`.
- Count clicks without personal data: no IP addresses, no cookies set for tracking.
- Publish the data sources and their check times, as the spec sheet already does per value.
