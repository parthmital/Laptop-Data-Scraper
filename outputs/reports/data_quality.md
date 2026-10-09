# Data-quality report (20261009T175113Z)

## Listings per site

| site            | listings | normalised | needs_review |
| --------------- | -------- | ---------- | ------------ |
| reliancedigital | 43       | 43         | 11           |
| vijaysales      | 9        | 9          | 1            |

## Match status

| match_status              | listings |
| ------------------------- | -------- |
| auto_matched              | 12       |
| needs_review              | 12       |
| single_listing            | 27       |
| unmatched_no_model_number | 1        |

## Availability and condition (latest offer)

| site            | availability | condition    | n   |
| --------------- | ------------ | ------------ | --- |
| reliancedigital | in_stock     | new          | 39  |
| reliancedigital | out_of_stock | new          | 4   |
| vijaysales      | in_stock     | new          | 1   |
| vijaysales      | out_of_stock | display_unit | 1   |
| vijaysales      | out_of_stock | new          | 7   |

## Listings missing a price

| site            | n   |
| --------------- | --- |
| reliancedigital | 1   |

## Price signal disagreements

| listing_id              | flags_json                                                           |
| ----------------------- | -------------------------------------------------------------------- |
| reliancedigital:9677787 | ["availability_signals_disagree:state=out_of_stock,jsonld=in_stock"] |
| reliancedigital:8981436 | ["availability_signals_disagree:state=out_of_stock,jsonld=in_stock"] |
| reliancedigital:8981440 | ["availability_signals_disagree:state=out_of_stock,jsonld=in_stock"] |
| reliancedigital:9336052 | ["availability_signals_disagree:state=out_of_stock,jsonld=in_stock"] |

## Fetch outcomes (all runs)

| site            | outcome                   | n   |
| --------------- | ------------------------- | --- |
| reliancedigital | fetched_new_content       | 30  |
| reliancedigital | sitemap_fetched           | 18  |
| vijaysales      | sitemap_robots_disallowed | 1   |

## Failures by stage (this run)

| stage    | n   |
| -------- | --- |
| discover | 1   |

## Pending review

| relation                             | n   |
| ------------------------------------ | --- |
| same_model_number_incompatible_specs | 1   |

## Field fill rate after grounding (share of listings with a value)

| field              | reliancedigital | vijaysales |
| ------------------ | --------------- | ---------- |
| brand              | 1.0             | 1.0        |
| colour             | 0.95            | 0.0        |
| cpu_brand          | 0.98            | 1.0        |
| cpu_family         | 0.88            | 1.0        |
| cpu_model          | 0.79            | 0.11       |
| display_panel      | 0.16            | 0.0        |
| display_refresh_hz | 0.0             | 0.0        |
| display_resolution | 0.88            | 0.0        |
| display_size_in    | 0.0             | 0.0        |
| gpu_model          | 0.81            | 1.0        |
| gpu_type           | 0.86            | 0.78       |
| gpu_vram_gb        | 0.0             | 0.0        |
| model_number       | 0.98            | 1.0        |
| ms_office          | 0.79            | 1.0        |
| os                 | 0.93            | 1.0        |
| ram_gb             | 0.0             | 0.0        |
| ram_type           | 0.28            | 0.11       |
| series             | 1.0             | 1.0        |
| storage_gb         | 0.0             | 0.0        |
| storage_type       | 0.86            | 0.11       |
| touchscreen        | 0.72            | 0.0        |
