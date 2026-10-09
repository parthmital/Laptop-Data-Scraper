# Research notes

## K2 Horizon 3.7B inference interface (2026-10-09)

**Brief.** Verify how K2 Horizon 3.7B can run on Kaggle GPU T4 x2 before building the normalisation stage: weights,
dtype, libraries, chat template, reasoning controls, structured-output support.

**Findings (from the files themselves, opened and read on 2026-10-09).**

| Fact                | Value                                                                                                                                                    | Source                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
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

## Indian laptop retailers: access, robots.txt and terms (2026-10-09)

**Brief.** Choose retailers that can be scraped politely and lawfully for a personal research prototype, and learn
where each page keeps the data the pipeline needs.

**Findings.**

| Site             | robots.txt (fetched 2026-10-09)                                                  | Terms                                                                                                                                                              | Page data                                                                                                                                 | Decision                                                  |
| ---------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Reliance Digital | `User-agent: *` allows `/product/`; blocks query strings (`/*?*`), cart, profile | Terms page renders client-side; could not be reviewed automatically                                                                                                | Server-rendered `__INITIAL_STATE__` JSON: spec table, images, seller, effective price, MRP, `sellable`; JSON-LD Product                   | Used, slow crawl                                          |
| Vijay Sales      | allows `/p/`; blocks cart, checkout, profile                                     | FAQ terms: personal, non-commercial use; no copying or republishing; no data-stream interception                                                                   | JSON-LD Product, title, meta keywords, `data-final-price`, `data-mrp`, gallery images; spec table loaded client-side from an internal API | Used (server-rendered data only; internal API not called) |
| Amazon.in        | detailed rules                                                                   | Not re-verified: the Conditions of Use page returned HTTP 503 to automated fetches on 2026-10-09; from prior knowledge, they prohibit robots and data-mining tools | not probed                                                                                                                                | Not used                                                  |
| Flipkart         | product pages not blocked                                                        | Terms of Use: no "deep-link", "page-scrape", "robot", "spider" or other automatic device to access, acquire, copy or monitor the platform                          | not probed                                                                                                                                | Not used                                                  |
| Croma            | `robots.txt` returns HTTP 403 (Akamai "Access Denied")                           | not reviewed                                                                                                                                                       | not reachable                                                                                                                             | Not used                                                  |
| MD Computers     | allows product pages                                                             | not reviewed                                                                                                                                                       | sells components, almost no laptops                                                                                                       | Not used                                                  |

Data-quality observations from 22 snapshots (all reproduced in `fixtures/`):

- Reliance Digital JSON-LD reports `InStock` for items whose page state says `sellable: false` (quantity 0).
- One Reliance Digital IdeaPad lists 8 GB RAM in the title and description but 16 GB in the spec table and JSON-LD name.
- One Reliance Digital HP Victus page shows model `15-fa2654TX` in the title but `15-FB3364AX` in the spec table, and
  another spec table has the CPU typo `16320H` for `13620H`.
- Reliance Digital "Net Weight" is the packed commodity weight, not the laptop weight.
- Vijay Sales sells "Store Display Unit" items whose JSON-LD still says `NewCondition`.

**Caveat.** This is not legal advice. Keep the notebook, its outputs and the fixtures dataset private, and review each
site's current terms before any wider use.

**Sources (opened or fetched).**

- `https://www.reliancedigital.in/robots.txt`, `https://www.vijaysales.com/robots.txt`, `https://www.flipkart.com/robots.txt`,
  `https://www.amazon.in/robots.txt`, `https://www.croma.com/robots.txt` (403), `https://www.mdcomputers.in/robots.txt`
- Vijay Sales terms of use: https://www.vijaysales.com/faqs?faq=terms-of-use
- Flipkart terms of use: https://www.flipkart.com/pages/terms
- Amazon.in Conditions of Use (HTTP 503 to automated fetch, not read): https://www.amazon.in/gp/help/customer/display.html?nodeId=200545940
- Reliance Digital terms page (no server-rendered text): https://www.reliancedigital.in/c/terms-of-use
- Sitemaps: `https://www.reliancedigital.in/sitemap.xml`, `https://www.vijaysales.com/sitemap-index.xml`
