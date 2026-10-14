# Design: Laptop Ledger web app

The web app in `web/` is a price comparison tool for laptops sold in India. Its first screen is the catalogue with
filters; there is no landing page. Users come to narrow the catalogue to an exact configuration, see the cheapest
place to buy it, and go to that store.

## Visual language

The palette and system fonts come from Apple's MacBook Pro page (https://www.apple.com/macbook-pro/, read on 12 Oct
2026), extracted with [designlang](https://github.com/Manavarya09/design-extract) v13.3.2. The layout, sizes and
component shapes follow product-tool conventions instead, because the first version, which copied Apple's marketing
scale (17 to 40 px type, 18 to 28 px tile radii, pill buttons), read as a showcase rather than a tool.

| Kept from Apple                                             | Tool conventions instead of Apple's marketing page                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `#f5f5f7` page, white surfaces, `#1d1d1f` text, `#000` dark | 12 to 28 px type scale with 14 px controls                         |
| `#0071e3` blue for actions, `#0066cc`/`#2997ff` links       | 8 px control radius, 12 px card radius; pills only for switches    |
| SF Pro on Apple devices, Inter elsewhere                    | two control heights (32 and 40 px) on a 4 px spacing scale         |
| easing `cubic-bezier(0.28, 0.11, 0.32, 1)`, 240 and 400 ms  | bordered cards and panels instead of shadows; hover strengthens it |
| tech specs layout: group name left, fields right, hairlines | flat filter column divided by hairlines, not a floating tile       |

Not taken: full-bleed imagery, gradients, video, display type and translucent bars.

## Signature idea: honest specs

Store listings leave many specs out (power limits, refresh rate, weight). Instead of hiding that, the interface shows
it everywhere:

- a filter whose spec fewer than 90% of laptops state says so beside its label ("Stated for 58 of 105");
  well-covered filters stay quiet so the note stands out where it matters;
- filters exclude laptops that do not state a filtered spec, unless the user turns on "Include laptops with missing
  specs" (an advanced switch, so it sits at the end of the panel);
- filters for specs no listing states are not shown at all (for example processor power limit and cooling in the
  current run), and appear automatically once the pipeline collects them;
- the spec sheet says how many of the 42 fields the stores state, lists those with their source (spec table key,
  page data, or the extraction model) and store, and a "Show N missing specs" switch reveals the rest as "Not
  stated".

## Palette

Light values apply by default; dark values apply under `prefers-color-scheme: dark`. All colours are tokens in
`web/src/app/globals.css`.

| Token                                           | Light                           | Dark                            | Role                                               |
| ----------------------------------------------- | ------------------------------- | ------------------------------- | -------------------------------------------------- |
| `--ink`                                         | `#1d1d1f`                       | `#f5f5f7`                       | text                                               |
| `--ink-2`, `--ink-3`                            | `#424245`, `#6e6e73`            | `#d2d2d7`, `#98989d`            | secondary text; meta text, counts, unstated values |
| `--paper`                                       | `#f5f5f7`                       | `#000000`                       | page background                                    |
| `--surface`, `--surface-2`                      | `#ffffff`, `#f5f5f7`            | `#1d1d1f`, `#2a2a2d`            | tiles, panels, inputs; hover and quiet fills       |
| `--fill`                                        | `#e8e8ed`                       | `#333336`                       | chips, secondary pills, slider track               |
| `--line`, `--line-strong`                       | `#e8e8ed`, `#d2d2d7`            | `#333336`, `#48484c`            | dividers; control borders and section hairlines    |
| `--accent`, `--accent-hover`, `--accent-active` | `#0071e3`, `#0077ed`, `#006edb` | same                            | primary buttons, checked controls, slider fill     |
| `--on-accent`                                   | `#ffffff`                       | `#ffffff`                       | text and ticks on `--accent`                       |
| `--link`                                        | `#0066cc`                       | `#2997ff`                       | text buttons, back link, hovered row title         |
| `--focus`                                       | `#0071e3`                       | `#2997ff`                       | focus rings, caret                                 |
| `--green`, `--green-tint`                       | `#007d1b`, `#e6f6e8`            | `#30d158`, `#0f2a16`            | best price, discounts, in stock                    |
| `--amber`, `--amber-tint`, `--notice-text`      | `#b64400`, `#fff4ec`, `#7a2e00` | `#ff9f0a`, `#2e1f08`, `#ffd59e` | out of stock, out-of-date prices, notices          |
| `--image-bg`, `--image-ink`                     | `#fafafc`, `#6e6e73`            | `#f5f5f7`, `#6e6e73`            | photo tiles and their placeholder icon             |

Blue means "act" and green means money saved or availability; neither decorates. Photo tiles stay light in the dark
theme because store photos have white backgrounds.

Nothing in the app is translucent or blurred; the filter drawer's overlay is a plain dim.

The page sets `<meta name="darkreader-lock">` so the Dark Reader extension does not restyle it: the app has its own
dark theme, and the extension's DOM edits caused React hydration warnings.

## Type

`-apple-system, BlinkMacSystemFont, "SF Pro Text"` (and `"SF Pro Display"`) so Apple devices render SF Pro; Inter,
loaded with `next/font`, for every other platform; then Segoe UI and system UI. Model codes use `ui-monospace, "SF
Mono"`, then IBM Plex Mono. Body text tracks at `-0.011em`; headings at `-0.015em` to `-0.02em`.

| Token         | Size  | Use                                                                   |
| ------------- | ----- | --------------------------------------------------------------------- |
| `--text-xs`   | 12 px | spec labels, hints, coverage notes, tags, provenance, footer          |
| `--text-sm`   | 13 px | meta lines, filter labels, MRP, store line, chips, text buttons       |
| `--text-base` | 14 px | controls, filter options, spec values, offers, notices                |
| `--text-md`   | 15 px | body, lede, filter panel title, card titles below 720 px, spec groups |
| `--text-lg`   | 17 px | card titles, offer prices, empty state, section titles below 900 px   |
| `--text-xl`   | 22 px | card prices, section titles, page and laptop titles on small screens  |
| `--text-2xl`  | 28 px | "Compare laptop prices", laptop title, headline price                 |

Weights: 400 body, 500 values and buttons, 600 titles and prices. Prices and counts use tabular figures in the body font. Font size never scales
with viewport width; breakpoints switch steps.

## Spacing, sizes and breakpoints

- Spacing tokens `--space-1` to `--space-12` (4, 8, 12, 16, 20, 24, 32, 48 px); nothing uses an off-scale value.
- Two control heights: `--control-sm` 32 px (presets, number fields, checkbox rows; text buttons 28 px) and
  `--control` 40 px (search, sort, Filters, primary and store buttons). On touch screens (`pointer: coarse`) rows,
  presets, chips, pages and store buttons grow to 40 to 52 px so every target reaches 44 px with its spacing.
- Radii: `--radius-sm` 6 px (checkbox rows, chips, tags, text buttons), `--radius` 8 px (every control),
  `--radius-lg` 12 px (cards, panels, popovers, gallery). Switches are the only pills.
- A 56 px site bar (brand mark and "Laptop Ledger", linking home) with a hairline under it opens every page and is
  not sticky. Page gutters 24 px, 16 px below 1024 px.
- Browse: 264 px filter column (sticky, scrolls on its own, scrollbar shown only on hover) and the results column,
  32 px apart, max width 1440 px. Above the results: title and one-line lede, then search and sort on one line, then
  the count and active chips on one line.
- Result cards: 144 px photo; title over a key-spec grid (`auto-fill`, 140 px minimum columns: label over value);
  184 px price column behind a hairline. 16 px padding, 12 px between cards. Below 720 px the photo and title share
  the first line, specs take two columns, and the price sits under a hairline with the cue on the right.
- Detail: photo column capped at 560 px beside the summary (title, price panel, key-spec panel), then "Where to buy"
  and the spec sheet, 48 px apart (32 px below 900 px), max width 1440 px to line up with the site bar.

| Width        | Browse                                                            | Detail                                   |
| ------------ | ----------------------------------------------------------------- | ---------------------------------------- |
| 1024 px +    | filter column                                                     | two columns                              |
| 720-1023 px  | filters in a drawer opened from the Filters button beside search  | two columns down to 900 px, then stacked |
| below 720 px | search on its own line, Filters and Sort below; cards stack price | price panel and spec fields stack        |
| below 480 px | Previous and Next become icon buttons so the page numbers fit     | same                                     |

Checked at 320, 390, 820, 1440 and 1920 px in both themes with no horizontal scroll.

## Cursors

Set once in `globals.css`, because `all: unset` on custom controls drops the browser defaults: pointer on links,
buttons, labels and every button-like ARIA role; text on inputs; not-allowed on disabled controls. Text field shells
(search, number fields) show the text cursor over their padding too, and a click there focuses the field. Checkbox
and switch rows stretch their label over the row, so the whole row is clickable and shows the pointer. Slider tracks
show the pointer; thumbs show grab and grabbing.

## Components

All controls are custom and built on Radix primitives (`radix-ui`) for keyboard support, focus management and ARIA.
No native select, checkbox, range, dialog or tooltip is visible.

| Component               | File                                   | States styled                                                                                                               |
| ----------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Primary button          | `.button-primary` in `app/globals.css` | 40 px, 8 px radius; default, hover, pressed, focus-visible                                                                  |
| Secondary button        | `.secondaryButton`, `.storeButton`     | bordered surface; hover strengthens the border, focus-visible                                                               |
| Checkbox row with count | `components/ui/Checkbox.tsx`           | whole row clickable; hover fill, pressed, focus-visible, checked (tick pops in), disabled                                   |
| Switch row              | `components/ui/Switch.tsx`             | whole row clickable; off, hover, on, focus-visible, disabled                                                                |
| Range with typed ends   | `components/ui/RangeField.tsx`         | ringed thumbs: hover halo, grab, pressed, focus-visible; "to" between fields; commit on Enter/blur                          |
| Select (sort)           | `components/ui/Select.tsx`             | bordered 40 px trigger: hover, open (accent border, chevron turns); highlighted, selected items                             |
| Filter panel, groups    | `components/browse/FilterPanel.tsx`    | sticky head with Expand all and Clear filters split by a hairline, groups collapse and open, active count badge             |
| Budget presets          | `components/browse/FilterPanel.tsx`    | 2 by 2 grid of 32 px buttons, short labels (₹50K, ₹1.2L); hover, pressed, selected (accent tint and border, `aria-pressed`) |
| Filter drawer           | `components/browse/FilterDrawer.tsx`   | slides in and out, focus trap, Escape and overlay close, live result count                                                  |
| Active filter chips     | `components/browse/ActiveFilters.tsx`  | 28 px; hover, focus-visible                                                                                                 |
| Search box              | `components/browse/SearchBox.tsx`      | hover, focus (accent border and ring), clear button; debounced                                                              |
| Result card             | `components/browse/LaptopRow.tsx`      | rise-in, hover (stronger border, soft shadow, chevron nudge), focus-within ring; card is the link                           |
| Pagination              | `components/browse/Pagination.tsx`     | bordered Previous and Next, numbered pages with gaps; hover, current page (filled, `aria-current`)                          |
| Empty results           | `components/browse/EmptyResults.tsx`   | search only: "Clear search"; filters: "Clear all filters", "Include laptops with missing specs"                             |
| Price note              | `components/laptop/PriceNote.tsx`      | best price, in stock but unconfirmed match, out of stock, out of date                                                       |
| Price panel             | `app/laptops/[slug]/page.tsx`          | price, MRP and note on the left, store button on the right or below                                                         |
| Key-spec panel          | `app/laptops/[slug]/page.tsx`          | bordered two-column list under the price panel                                                                              |
| Offers list             | `components/laptop/OffersTable.tsx`    | lowest offer tagged (only with 2+ stores), stock tones, bordered store buttons                                              |
| Gallery                 | `components/laptop/Gallery.tsx`        | photo fades in on change, selected thumbnail (2 px accent border), failed images removed                                    |
| Spec sheet              | `components/laptop/SpecSheet.tsx`      | stated values with sources; "Show N missing specs" switch reveals muted fields and groups                                   |

Pending navigation dims the results (`data-pending`) while controls update optimistically.

## Icons and motion

- Icons: `lucide-react` only, 14 to 16 px, stroke icons, always `aria-hidden` next to text.
- Motion: `cubic-bezier(0.28, 0.11, 0.32, 1)` everywhere. 240 ms for hover, toggles, chevrons, popovers and closing
  the drawer; 400 ms for entrances (cards, gallery, summary, opening the drawer); 120 ms press feedback. Entrances
  use opacity and an 8 px rise only; hover never moves a card. `prefers-reduced-motion` turns animations and transitions off.

## Copy

- "Best price" (laptop page) and "Lowest of N stores" (result card) only for the pipeline's lowest comparable offer
  (new, in stock, checked within 7 days, confirmed match) when two or more stores sell the laptop. With one store
  the price just names it. Other prices say why they are not compared or that the laptop is out of stock.
- "Clear filters" wherever filters are removed together ("Clear all filters" in the empty state).
- "Where to buy" for the offers section; "Include laptops with missing specs" for the coverage switch.
- "Store" for Reliance Digital, Vijay Sales and HP Store India; "Sold by" only when the seller differs from the store.
- "Not stated" for a spec no listing gives; never "N/A" or a guess.
- Buttons name the destination: "View at Reliance Digital". Apple's "Buy" is not used because the app does not sell.

## Decisions

- **Apple's colours, a tool's shapes.** The palette, fonts and easing come from the extracted tokens. Sizes, radii
  and spacing follow one compact system, because Apple's marketing scale made the catalogue feel like a toy.
- **One system, no one-offs.** Every size is a token (two control heights, three radii, an 8-step spacing scale), so
  controls that sit side by side always match.
- **Expand all / Collapse all.** Eight groups of filters make a long panel, so the panel head (sticky inside the
  sidebar and the drawer) has one toggle that opens or closes every group. Collapsed, all groups fit on one screen.
- **Neighbours never merge.** Controls that sit side by side are either different kinds (a chip and a text button)
  or at least 8 px apart; two text buttons in a row get a hairline between them.
- **No repeated headings.** A filter whose label equals its group's name ("Brand" in Brand, "Graphics" in Graphics)
  shows only the group heading.
- **No sticky bars.** Every pixel of height goes to results and specs; the site bar scrolls away. The store button
  stays in the price panel and in each offer row.
- **Say what the site is.** The first screen names the product, the job ("Compare laptop prices") and the stores, so
  a first-time visitor knows what the numbers mean before reading a card.
- **Labelled key specs, not a spec string.** A dot-separated line made users parse every row; label-over-value cells
  line up from card to card, so differences show at a glance.
- **Budget first.** Price is the first decision most buyers make, so four common Indian budgets are one click; the
  slider and typed fields (with Indian digit grouping) remain for exact ranges.
- **Advanced last.** The missing-specs switch changes how every filter behaves, which matters only once a spec filter
  is on, so it moved from the top of the panel to the end.
- **Missing specs on request.** The full 42-field sheet buried the stated values among "Not stated" rows; the count
  in the section head keeps the gaps honest and the switch shows them.
- **System SF Pro first.** SF Pro cannot be served on the web, so Apple devices use it from the system and other
  platforms get Inter, the closest open face.
- **Server-side filtering with URL state.** Every filter is a query parameter, so results are shareable and the
  back button works; the server computes results and facet counts, which keeps the client small as the catalogue
  grows.
- **Disjunctive facet counts.** Each option's count assumes its own filter is not applied, so users see what
  selecting another option would add.
- **Fixed option order.** Options are ordered by catalogue frequency (or natural order for sizes and versions) and
  do not move while filtering.
- **Normalised option labels.** Sellers spell the same thing differently ("Core Ultra 7" and "Intel Core Ultra 7",
  "Rtx5060" and "NVIDIA GeForce RTX 5060 Laptop GPU"); filters group them. The spec sheet keeps the stored value.
- **Hotlinked images.** Product photos load directly from the stores with `no-referrer`, not through `next/image`,
  so the app never copies or re-serves store content.
