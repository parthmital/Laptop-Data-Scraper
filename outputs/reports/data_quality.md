# Data-quality report (20261009T192530Z)

## Listings per site

| site            | listings | normalised | needs_review |
| --------------- | -------- | ---------- | ------------ |
| hpstore         | 31       | 31         | 0            |
| reliancedigital | 43       | 43         | 3            |
| vijaysales      | 39       | 39         | 1            |

## Match status

| match_status              | listings |
| ------------------------- | -------- |
| auto_matched              | 12       |
| needs_review              | 4        |
| single_listing            | 90       |
| unmatched_no_model_number | 7        |

## Availability and condition (latest offer)

| site            | availability | condition    | n   |
| --------------- | ------------ | ------------ | --- |
| hpstore         | in_stock     | new          | 22  |
| hpstore         | out_of_stock | new          | 4   |
| hpstore         | unknown      | new          | 5   |
| reliancedigital | in_stock     | new          | 39  |
| reliancedigital | out_of_stock | new          | 4   |
| vijaysales      | in_stock     | new          | 2   |
| vijaysales      | out_of_stock | display_unit | 21  |
| vijaysales      | out_of_stock | new          | 16  |

## Freshness of current offers

| site            | freshness | offers | min_age_h | max_age_h |
| --------------- | --------- | ------ | --------- | --------- |
| hpstore         | fresh     | 31     | 0.2       | 1.4       |
| reliancedigital | fresh     | 43     | 0.3       | 6.5       |
| vijaysales      | fresh     | 39     | 0.4       | 6.5       |

## Spec values by origin (rule or LLM)

| site            | origin | values_n |
| --------------- | ------ | -------- |
| hpstore         | llm    | 35       |
| hpstore         | rule   | 1026     |
| reliancedigital | llm    | 178      |
| reliancedigital | rule   | 794      |
| vijaysales      | llm    | 444      |
| vijaysales      | rule   | 39       |

## Listings missing a price

| site            | n   |
| --------------- | --- |
| hpstore         | 1   |
| reliancedigital | 1   |
| vijaysales      | 1   |

## Price signal disagreements

| listing_id               | flags_json                                                           |
| ------------------------ | -------------------------------------------------------------------- |
| reliancedigital:9677787  | ["availability_signals_disagree:state=out_of_stock,jsonld=in_stock"] |
| reliancedigital:8981436  | ["availability_signals_disagree:state=out_of_stock,jsonld=in_stock"] |
| reliancedigital:8981440  | ["availability_signals_disagree:state=out_of_stock,jsonld=in_stock"] |
| reliancedigital:10615350 | ["mrp_discount_above_50%"]                                           |
| reliancedigital:10608317 | ["mrp_discount_above_50%"]                                           |
| reliancedigital:9336052  | ["availability_signals_disagree:state=out_of_stock,jsonld=in_stock"] |
| vijaysales:258274        | ["mrp_discount_above_50%"]                                           |
| hpstore:DL5J5PA#ACJ      | ["mrp_discount_above_50%"]                                           |
| hpstore:DV2S1PA#ACJ      | ["mrp_discount_above_50%"]                                           |
| hpstore:DQ1H6PA#ACJ      | ["mrp_discount_above_50%"]                                           |
| hpstore:D88PPPA#ACJ      | ["mrp_discount_above_50%"]                                           |
| reliancedigital:10615351 | ["mrp_discount_above_50%"]                                           |
| hpstore:BK6N6PA#ACJ      | ["mrp_discount_above_50%"]                                           |

## Fetch outcomes (all runs)

| site            | outcome             | n   |
| --------------- | ------------------- | --- |
| hpstore         | error               | 6   |
| hpstore         | fetched_new_content | 24  |
| hpstore         | sitemap_fetched     | 1   |
| reliancedigital | fetched_new_content | 30  |
| reliancedigital | sitemap_fetched     | 18  |
| vijaysales      | fetched_new_content | 30  |
| vijaysales      | sitemap_fetched     | 2   |

## Failures by stage (this run)

| stage | n   |
| ----- | --- |
| fetch | 6   |

## Pending review

| relation                             | n   |
| ------------------------------------ | --- |
| same_config_no_model_number          | 1   |
| same_model_number_incompatible_specs | 1   |

## Field fill rate after grounding (share of listings with a value)

| field                   | hpstore | reliancedigital | vijaysales |
| ----------------------- | ------- | --------------- | ---------- |
| adapter_w               | 1.0     | 0.51            | 0.0        |
| backlit_keyboard        | 0.94    | 0.72            | 0.03       |
| battery_cells           | 1.0     | 0.67            | 0.0        |
| battery_wh              | 1.0     | 0.33            | 0.0        |
| brand                   | 1.0     | 1.0             | 1.0        |
| colour                  | 1.0     | 0.95            | 0.18       |
| cooling                 | 0.0     | 0.0             | 0.0        |
| cpu_base_ghz            | 0.1     | 0.86            | 0.0        |
| cpu_boost_ghz           | 1.0     | 0.67            | 0.0        |
| cpu_brand               | 1.0     | 0.98            | 0.92       |
| cpu_cache_mb            | 1.0     | 0.72            | 0.0        |
| cpu_cores               | 1.0     | 0.37            | 0.05       |
| cpu_family              | 1.0     | 0.93            | 0.97       |
| cpu_model               | 1.0     | 0.84            | 0.15       |
| cpu_tdp_w               | 0.0     | 0.0             | 0.0        |
| cpu_threads             | 1.0     | 0.09            | 0.0        |
| display_brightness_nits | 1.0     | 0.07            | 0.0        |
| display_color_gamut     | 1.0     | 0.05            | 0.0        |
| display_panel           | 0.97    | 0.14            | 0.13       |
| display_refresh_hz      | 0.19    | 0.0             | 0.05       |
| display_resolution      | 1.0     | 0.93            | 0.36       |
| display_size_in         | 1.0     | 0.98            | 0.85       |
| gpu_model               | 1.0     | 0.84            | 0.74       |
| gpu_tgp_w               | 0.0     | 0.05            | 0.0        |
| gpu_type                | 1.0     | 0.86            | 0.46       |
| gpu_vram_gb             | 0.55    | 0.33            | 0.21       |
| gpu_vram_type           | 0.55    | 0.16            | 0.0        |
| model_number            | 0.32    | 0.98            | 0.85       |
| ms_office               | 0.81    | 0.79            | 0.54       |
| os                      | 1.0     | 0.95            | 0.9        |
| part_number             | 1.0     | 0.0             | 0.0        |
| ram_gb                  | 1.0     | 0.98            | 0.97       |
| ram_max_gb              | 0.0     | 0.16            | 0.0        |
| ram_speed_mts           | 1.0     | 0.21            | 0.0        |
| ram_type                | 1.0     | 0.6             | 0.1        |
| series                  | 1.0     | 1.0             | 0.95       |
| storage_gb              | 1.0     | 0.98            | 0.97       |
| storage_type            | 1.0     | 0.95            | 0.97       |
| thickness_mm            | 1.0     | 0.0             | 0.0        |
| touchscreen             | 0.81    | 0.74            | 0.03       |
| weight_kg               | 1.0     | 0.0             | 0.0        |
| wifi_standard           | 1.0     | 0.21            | 0.0        |
