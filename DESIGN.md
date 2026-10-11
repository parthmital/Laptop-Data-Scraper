# Design: Laptop Ledger web app

The web app in `web/` is a price comparison tool for laptops sold in India. Its first screen is the catalogue with
filters; there is no landing page. Users come to narrow the catalogue to an exact configuration, see the cheapest
place to buy it, and go to that store.

## Visual language

The look follows Apple's MacBook Pro product page (https://www.apple.com/macbook-pro/, read on 12 Oct 2026). Tokens
were extracted from the live page with [designlang](https://github.com/Manavarya09/design-extract) v13.3.2
(`--dark --responsive --interactions --motion-runtime`) and then adapted for a dense tool:

| Taken from Apple                                              | Adapted here                                                        |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| `#f5f5f7` page, white tiles, `#1d1d1f` text, `#000` dark page | same values; secondary text darkened to `#424245`/`#6e6e73` for AA  |
| `#0071e3` blue for every action, `#0066cc`/`#2997ff` links    | blue for actions, selected controls and focus; nothing else is blue |
| SF Pro Text and Display, tight tracking, 600 headlines        | system SF Pro on Apple devices, Inter elsewhere                     |
| 44 px dark global nav, 52 px sticky local nav with "Buy" pill | no top bars at all; page title and actions live in the page         |
| 18 to 28 px tile radii, 980 px pill buttons                   | rows and panels 18 px, price capsule and offers 28 px, pill buttons |
| easing `cubic-bezier(0.28, 0.11, 0.32, 1)`, 240 and 400 ms    | same easing; 240 ms for state, 400 ms for entrances                 |
| scroll reveals: opacity and 16 px rise, 20 to 30 ms stagger   | result rows rise in with a 30 ms stagger, capped at 8 rows          |
| tech specs page: group name left, fields right, hairlines     | spec sheet uses the same layout                                     |

Not taken: full-bleed marketing imagery, gradients, video and very large display type (56 to 80 px). The catalogue is
a tool, so content density wins over spectacle.

## Signature idea: honest specs

Store listings leave many specs out (power limits, refresh rate, weight). Instead of hiding that, the interface shows
it everywhere:

- every filter shows how many laptops in the catalogue state that spec (`58/105` with a small bar);
- filters exclude laptops that do not state a filtered spec, unless the user turns on "Include laptops that don't
  state a filtered spec";
- filters for specs no listing states are not shown at all (for example processor power limit and cooling in the
  current run), and appear automatically once the pipeline collects them;
- the spec sheet lists all 42 fields, shows "Not stated" for gaps, and gives every value its source (spec table key,
  page data, or the extraction model) and store.

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

Nothing in the app is translucent: with no navigation bars there is nothing for content to scroll under. The filter
drawer's overlay is the only blur.

The page sets `<meta name="darkreader-lock">` so the Dark Reader extension does not restyle it: the app has its own
dark theme, and the extension's DOM edits caused React hydration warnings.

## Type

`-apple-system, BlinkMacSystemFont, "SF Pro Text"` (and `"SF Pro Display"` for headings) so Apple devices render SF
Pro; Inter, loaded with `next/font`, for every other platform; then Segoe UI and system UI. Model codes and coverage
counts use `ui-monospace, "SF Mono"`, then IBM Plex Mono. Body text tracks at `-0.022em`, as Apple's does at 17 px.

| Token        | Size  | Use                                                                |
| ------------ | ----- | ------------------------------------------------------------------ |
| (caption)    | 12 px | footer, tags, coverage counts, provenance                          |
| `--text-xs`  | 13 px | meta lines, hints, spec labels                                     |
| `--text-sm`  | 15 px | controls, filter options, spec lines, notices                      |
| `--text-md`  | 17 px | body, search, group headings                                       |
| `--text-lg`  | 21 px | row titles and prices, filter groups, spec groups                  |
| `--text-xl`  | 28 px | page title below 720 px, section titles below 900 px, empty state  |
| `--text-2xl` | 40 px | "Laptops" page title, laptop title, headline price, section titles |

Prices use tabular figures. Font size never scales with viewport width; breakpoints switch steps.

## Spacing, grid and breakpoints

- 4 px base. Tiles use 20 to 28 px padding, 12 px between rows, 24 px page gutters (16 px below 720 px), 64 px
  between detail sections (48 px below 900 px).
- No top bars. Both the global bar (store list and check date) and the sticky page bar were removed: they did not help
  anyone filter or buy, and they cost vertical space. The page title, search and actions sit at the top of the page
  and scroll away with it; only the filter sidebar stays in view.
- Browse: 300 px sticky filter tile plus a fluid results column, max width 1440 px.
- Detail: gallery and summary (1.1 : 1), then full-width offers and the spec sheet, max width 1200 px, with an
  "All laptops" link above the gallery.

| Width        | Browse                                                      | Detail                                   |
| ------------ | ----------------------------------------------------------- | ---------------------------------------- |
| 1024 px +    | sidebar filters                                             | two columns                              |
| 720-1023 px  | filters in a drawer opened from the button beside search    | two columns down to 900 px, then stacked |
| below 720 px | rows stack the price under the specs; search and sort stack | price capsule and spec fields stack      |

Checked at 360, 820 and 1440 px in both themes with no horizontal scroll.

## Components

All controls are custom and built on Radix primitives (`radix-ui`) for keyboard support, focus management and ARIA.
No native select, checkbox, range, dialog or tooltip is visible.

| Component                    | File                                   | States styled                                                                                          |
| ---------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Primary button (blue pill)   | `.button-primary` in `app/globals.css` | default, hover, pressed (scale 0.98), focus-visible                                                    |
| Checkbox with count          | `components/ui/Checkbox.tsx`           | default, hover, pressed, focus-visible, checked (tick pops in), disabled                               |
| Switch with description      | `components/ui/Switch.tsx`             | off, on, focus-visible, disabled                                                                       |
| Range slider with typed ends | `components/ui/RangeField.tsx`         | drag, hover halo, pressed, focus-visible, typed value committed on Enter or blur                       |
| Select (sort)                | `components/ui/Select.tsx`             | pill trigger hover, pressed, open (chevron turns), highlighted and selected items                      |
| Filter panel and groups      | `components/browse/FilterPanel.tsx`    | collapsed, open (height animates), Expand all / Collapse all, active count badge, "Show all N" options |
| Filter drawer                | `components/browse/FilterDrawer.tsx`   | slides in and out, focus trap, Escape and overlay close, live result count                             |
| Active filter chips          | `components/browse/ActiveFilters.tsx`  | hover, pressed, focus-visible                                                                          |
| Search box                   | `components/browse/SearchBox.tsx`      | hover, focus (blue ring), clear button; debounced                                                      |
| Result row                   | `components/browse/LaptopRow.tsx`      | rise-in, hover lift and photo zoom, focus-within ring; whole row is the link                           |
| Empty results                | `components/browse/EmptyResults.tsx`   | "Clear all filters" (primary) and "Include unstated specs"                                             |
| Price note                   | `components/laptop/PriceNote.tsx`      | best price, in stock but unconfirmed match, out of stock, out of date                                  |
| Price capsule                | `app/laptops/[slug]/page.tsx`          | price, MRP and note on the left, store button on the right or below                                    |
| Offers list                  | `components/laptop/OffersTable.tsx`    | lowest offer tagged (only with 2+ stores), stock tones, outline store pills                            |
| Gallery                      | `components/laptop/Gallery.tsx`        | photo fades in on change, selected thumbnail, failed images removed                                    |
| Spec sheet                   | `components/laptop/SpecSheet.tsx`      | stated values with sources, muted "Not stated"                                                         |

Pending navigation dims the results (`data-pending`) while controls update optimistically. 36 px pills (sort, the
drawer trigger) extend their hit area to 44 px with a pseudo-element.

## Icons and motion

- Icons: `lucide-react` only, 14 to 18 px, stroke icons, always `aria-hidden` next to text.
- Motion: `cubic-bezier(0.28, 0.11, 0.32, 1)` everywhere. 240 ms for hover, toggles, chevrons, popovers and closing
  the drawer; 400 ms for entrances (rows, gallery, summary, opening the drawer); 120 ms press feedback. Entrances
  use opacity and a 16 px rise only. `prefers-reduced-motion` turns animations and transitions off.

## Copy

- "Best price" only for the pipeline's lowest comparable offer (new, in stock, checked within 7 days, confirmed
  match). Other prices say why they are not compared or that the laptop is out of stock.
- "Store" for Reliance Digital, Vijay Sales and HP Store India; "Sold by" only when the seller differs from the store.
- "Not stated" for a spec no listing gives; never "N/A" or a guess.
- Buttons name the destination: "View at Reliance Digital". Apple's "Buy" is not used because the app does not sell.

## Decisions

- **Apple's language, not Apple's page.** The palette, type, radii, motion and navigation pattern come from the
  extracted tokens; the layout stays a filter-and-results tool because users arrive to compare, not to be sold to.
- **Expand all / Collapse all.** Eight groups of filters make a long panel, so the panel head (sticky inside the
  sidebar and the drawer) has one toggle that opens or closes every group. Collapsed, all groups fit on one screen.
- **No repeated headings.** A filter whose label equals its group's name ("Brand" in Brand, "Graphics" in Graphics)
  shows only the group heading; its coverage count stays on the right.
- **No sticky bars.** Apple pins a local nav with a "Buy" pill; this app does not, because every pixel of height goes
  to results and specs. The store button stays in the price capsule and in each offer row.
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
