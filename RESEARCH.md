# Research notes

## K2 Horizon 3.7B inference interface (2026-10-09)

**Brief.** Verify how K2 Horizon 3.7B can run on Kaggle GPU T4 x2 before building the normalisation stage: weights,
dtype, libraries, chat template, reasoning controls, structured-output support.

**Findings (from the files themselves, opened and read on 2026-10-09).**

| Fact                | Value                                                                                                                                                    | Source                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------ | ------------------------------------------ | --------------------- |
| Architecture        | `K2HorizonForCausalLM`, `model_type: k2_horizon`, dense (num_experts 0), 36 layers, hidden 2560, 32 heads / 8 KV heads, vocab 250,624, untied embeddings | `config.json`               |
| Stored size         | 10.1 GB BF16 (about 5.05 B stored parameters; the card calls it "3.7B-core")                                                                             | HF file listing, model card |
| Loading             | `trust_remote_code=True`; validated with Transformers 5.15.0, PyTorch 2.13.0, Safetensors 0.8.0                                                          | model card                  |
| Attention           | eager, SDPA, flash and flex supported; flash-attn not required; no custom kernels                                                                        | `modeling_k2_horizon.py`    |
| Numerics            | RMSNorm, softmax and RoPE upcast to float32 internally                                                                                                   | `modeling_k2_horizon.py`    |
| Forward API         | standard `DynamicCache` KV cache, `logits_to_keep` supported                                                                                             | `modeling_k2_horizon.py`    |
| EOS ids             | `[1, 250019]`                                                                                                                                            | `generation_config.json`    |
| Reasoning           | always on; `reasoning_effort` in `high` / `medium` / `low` opens `<ifm                                                                                   | think>`/`<ifm               | think_fast>`/`<ifm | think_faster>`; no way to disable thinking | `chat_template.jinja` |
| Card recommendation | `reasoning_effort="high"`, temperature 1.0, top_p 0.95, at least 32,768 output tokens; "truncated reasoning is a failed response"                        | model card                  |
| Structured output   | no JSON mode described; tool calls support `json`, `xml`, `xml_typed` formats via vLLM/SGLang parsers                                                    | model card                  |
| GGUF                | official GGUF exists but needs an unmerged llama.cpp PR or the MBZUAI-IFM fork                                                                           | GGUF model card             |
| Licence             | Apache-2.0                                                                                                                                               | model card                  |

**Decisions.**

- Use Transformers (the validated path) with FP16 weights, one replica per T4. T4 has no fast BF16; FP16 range risk is
  handled by a logits sanity check with an FP32 fallback split across both GPUs.
- Use `reasoning_effort="low"` with a 512-token budget instead of the card's 32k-token `high` setting, because a
  32k-token generation per listing is impractical on a T4. Truncation is counted and reported. This departs from the
  card's evaluation recommendation, so quality at higher budgets is not claimed.
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
- From Kaggle on 2026-10-09, Vijay Sales sitemap discovery returned no URLs, while the same requests from India
  returned HTTP 200 (a cloud-IP block is the likely cause; not confirmed).

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
