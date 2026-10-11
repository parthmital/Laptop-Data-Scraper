// Filter definitions, matching, facet counts, sorting and paging for the browse page.
// Every filter is defined once here; the URL format and the filter panel are derived from these definitions.

import { resolutionHeight } from "./normalise";
import type { SpecKey } from "./specs";
import type { Laptop } from "./types";

export const FILTER_GROUPS = [
	{ id: "deal", label: "Price and stores" },
	{ id: "brand", label: "Brand" },
	{ id: "processor", label: "Processor" },
	{ id: "memory", label: "Memory and storage" },
	{ id: "graphics", label: "Graphics" },
	{ id: "display", label: "Display" },
	{ id: "power", label: "Battery and portability" },
	{ id: "features", label: "Features and software" },
] as const;

export type FilterGroupId = (typeof FILTER_GROUPS)[number]["id"];

interface BaseDef {
	id: string;
	label: string;
	group: FilterGroupId;
	hint?: string;
}

interface OptionsDef extends BaseDef {
	kind: "options";
	values: (l: Laptop) => string[];
	order?: (a: string, b: string) => number;
	format?: (value: string) => string;
}

interface RangeDef extends BaseDef {
	kind: "range";
	value: (l: Laptop) => number | null;
	step: number;
	unit?: string;
	money?: boolean;
}

interface FlagDef extends BaseDef {
	kind: "flag";
	value: (l: Laptop) => boolean | null;
}

export type FilterDef = OptionsDef | RangeDef | FlagDef;

const num = (key: SpecKey) => (l: Laptop) => {
	const v = l.specs[key];
	return typeof v === "number" ? v : null;
};
const bool = (key: SpecKey) => (l: Laptop) => {
	const v = l.specs[key];
	return typeof v === "boolean" ? v : null;
};
const one = (value: string | number | boolean | null | undefined): string[] =>
	value == null || value === "" ? [] : [String(value)];
const spec = (key: SpecKey) => (l: Laptop) =>
	one(l.specs[key] as string | number | null);

const numeric = (a: string, b: string) => Number(a) - Number(b);
const byList = (list: string[]) => (a: string, b: string) => {
	const ia = list.indexOf(a);
	const ib = list.indexOf(b);
	return (
		(ia < 0 ? list.length : ia) - (ib < 0 ? list.length : ib) ||
		a.localeCompare(b)
	);
};
const unit = (u: string) => (v: string) => `${v} ${u}`;
const storageFormat = (v: string) =>
	Number(v) >= 1024 ? `${Number(v) / 1024} TB` : `${v} GB`;

export const FILTERS: FilterDef[] = [
	{
		id: "price",
		label: "Price",
		group: "deal",
		kind: "range",
		value: (l) => l.price?.amountInr ?? null,
		step: 1000,
		money: true,
	},
	{
		id: "stock",
		label: "In stock now",
		group: "deal",
		kind: "flag",
		value: (l) => l.inStock,
		hint: "At least one store has it in stock, checked within 7 days.",
	},
	{
		id: "discount",
		label: "Discount off MRP",
		group: "deal",
		kind: "range",
		value: (l) => l.price?.discountPct ?? null,
		step: 1,
		unit: "%",
	},
	{
		id: "store",
		label: "Store",
		group: "deal",
		kind: "options",
		values: (l) => [
			...new Set(
				l.offers
					.filter((o) => o.freshness !== "delisted")
					.map((o) => o.storeName),
			),
		],
	},
	{
		id: "multi",
		label: "Sold by 2 or more stores",
		group: "deal",
		kind: "flag",
		value: (l) => new Set(l.offers.map((o) => o.site)).size > 1,
	},
	{
		id: "condition",
		label: "Condition",
		group: "deal",
		kind: "options",
		values: (l) => [...new Set(l.offers.flatMap((o) => one(o.condition)))],
		format: (v) =>
			v === "display_unit" ? "Store display unit" : v === "new" ? "New" : v,
		order: byList(["new", "display_unit"]),
	},
	{
		id: "brand",
		label: "Brand",
		group: "brand",
		kind: "options",
		values: spec("brand"),
	},
	{
		id: "cpu_brand",
		label: "Processor brand",
		group: "processor",
		kind: "options",
		values: spec("cpu_brand"),
	},
	{
		id: "cpu",
		label: "Processor family",
		group: "processor",
		kind: "options",
		values: (l) => one(l.derived.cpuFamily),
	},
	{
		id: "cores",
		label: "Cores",
		group: "processor",
		kind: "range",
		value: num("cpu_cores"),
		step: 1,
	},
	{
		id: "threads",
		label: "Threads",
		group: "processor",
		kind: "range",
		value: num("cpu_threads"),
		step: 1,
	},
	{
		id: "boost",
		label: "Boost clock",
		group: "processor",
		kind: "range",
		value: num("cpu_boost_ghz"),
		step: 0.1,
		unit: "GHz",
	},
	{
		id: "cache",
		label: "Cache",
		group: "processor",
		kind: "range",
		value: num("cpu_cache_mb"),
		step: 1,
		unit: "MB",
	},
	{
		id: "cpu_w",
		label: "Processor power limit",
		group: "processor",
		kind: "range",
		value: num("cpu_tdp_w"),
		step: 1,
		unit: "W",
		hint: "The wattage this laptop runs its processor at, only when the listing states it.",
	},
	{
		id: "ram",
		label: "RAM",
		group: "memory",
		kind: "options",
		values: spec("ram_gb"),
		order: numeric,
		format: unit("GB"),
	},
	{
		id: "ram_type",
		label: "RAM type",
		group: "memory",
		kind: "options",
		values: spec("ram_type"),
		order: byList(["DDR4", "LPDDR4X", "DDR5", "LPDDR5", "LPDDR5X"]),
	},
	{
		id: "ram_speed",
		label: "RAM speed",
		group: "memory",
		kind: "range",
		value: num("ram_speed_mts"),
		step: 100,
		unit: "MT/s",
	},
	{
		id: "ram_upgrade",
		label: "RAM can be upgraded",
		group: "memory",
		kind: "flag",
		value: (l) => l.derived.ramUpgradeable,
		hint: "Maximum supported RAM is above what is installed.",
	},
	{
		id: "storage",
		label: "Storage",
		group: "memory",
		kind: "options",
		values: spec("storage_gb"),
		order: numeric,
		format: storageFormat,
	},
	{
		id: "storage_type",
		label: "Storage type",
		group: "memory",
		kind: "options",
		values: spec("storage_type"),
	},
	{
		id: "gpu_kind",
		label: "Graphics type",
		group: "graphics",
		kind: "options",
		values: (l) => one(l.derived.gpuKind),
		format: (v) => (v === "dedicated" ? "Dedicated" : "Integrated"),
	},
	{
		id: "gpu",
		label: "Graphics",
		group: "graphics",
		kind: "options",
		values: (l) => one(l.derived.gpu),
	},
	{
		id: "vram",
		label: "Video memory",
		group: "graphics",
		kind: "options",
		values: spec("gpu_vram_gb"),
		order: numeric,
		format: unit("GB"),
	},
	{
		id: "vram_type",
		label: "Video memory type",
		group: "graphics",
		kind: "options",
		values: spec("gpu_vram_type"),
		order: byList(["GDDR5", "GDDR6", "GDDR6X", "GDDR7"]),
	},
	{
		id: "gpu_w",
		label: "Graphics power (TGP)",
		group: "graphics",
		kind: "range",
		value: num("gpu_tgp_w"),
		step: 5,
		unit: "W",
		hint: "The same GPU is much faster at a higher TGP. Only shown when the listing states it.",
	},
	{
		id: "size",
		label: "Screen size",
		group: "display",
		kind: "range",
		value: num("display_size_in"),
		step: 0.1,
		unit: "in",
	},
	{
		id: "res",
		label: "Resolution",
		group: "display",
		kind: "options",
		values: (l) => one(l.derived.resolution),
		order: (a, b) =>
			resolutionHeight(a) - resolutionHeight(b) || a.localeCompare(b),
	},
	{
		id: "refresh",
		label: "Refresh rate",
		group: "display",
		kind: "range",
		value: num("display_refresh_hz"),
		step: 1,
		unit: "Hz",
	},
	{
		id: "panel",
		label: "Panel",
		group: "display",
		kind: "options",
		values: spec("display_panel"),
	},
	{
		id: "nits",
		label: "Brightness",
		group: "display",
		kind: "range",
		value: num("display_brightness_nits"),
		step: 10,
		unit: "nits",
	},
	{
		id: "gamut",
		label: "Colour gamut",
		group: "display",
		kind: "options",
		values: (l) => one(l.derived.gamut),
	},
	{
		id: "touch",
		label: "Touchscreen",
		group: "display",
		kind: "flag",
		value: bool("touchscreen"),
	},
	{
		id: "battery",
		label: "Battery capacity",
		group: "power",
		kind: "range",
		value: num("battery_wh"),
		step: 1,
		unit: "Wh",
	},
	{
		id: "cells",
		label: "Battery cells",
		group: "power",
		kind: "options",
		values: spec("battery_cells"),
		order: numeric,
	},
	{
		id: "weight",
		label: "Weight",
		group: "power",
		kind: "range",
		value: num("weight_kg"),
		step: 0.01,
		unit: "kg",
	},
	{
		id: "thickness",
		label: "Thickness",
		group: "power",
		kind: "range",
		value: num("thickness_mm"),
		step: 0.1,
		unit: "mm",
	},
	{
		id: "charger",
		label: "Charger",
		group: "power",
		kind: "range",
		value: num("adapter_w"),
		step: 5,
		unit: "W",
	},
	{
		id: "cooling",
		label: "Cooling",
		group: "power",
		kind: "options",
		values: spec("cooling"),
	},
	{
		id: "wifi",
		label: "Wi-Fi",
		group: "features",
		kind: "options",
		values: spec("wifi_standard"),
		order: byList(["Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E", "Wi-Fi 7"]),
	},
	{
		id: "backlit",
		label: "Backlit keyboard",
		group: "features",
		kind: "flag",
		value: bool("backlit_keyboard"),
	},
	{
		id: "os",
		label: "Operating system",
		group: "features",
		kind: "options",
		values: (l) => one(l.derived.os),
	},
	{
		id: "office",
		label: "Microsoft Office included",
		group: "features",
		kind: "flag",
		value: bool("ms_office"),
		hint: "A trial or a version sold separately does not count.",
	},
];

const FILTER_BY_ID = new Map(FILTERS.map((f) => [f.id, f]));

export const SORTS = [
	{ id: "price-asc", label: "Lowest price" },
	{ id: "price-desc", label: "Highest price" },
	{ id: "discount", label: "Biggest discount" },
	{ id: "weight", label: "Lightest" },
	{ id: "battery", label: "Largest battery" },
	{ id: "stores", label: "Most stores" },
] as const;

export type SortId = (typeof SORTS)[number]["id"];

export const PAGE_SIZE = 24;

// Query parameter names that are not filters.
export const PARAM = {
	query: "q",
	sort: "sort",
	page: "page",
	unstated: "unstated",
} as const;

export interface Range {
	min: number | null;
	max: number | null;
}

export type Selection = string[] | Range | true;

export interface FilterState {
	query: string;
	sort: SortId;
	page: number;
	includeUnstated: boolean;
	selections: Map<string, Selection>;
}

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

function parseNumber(s: string | undefined): number | null {
	if (s == null || s.trim() === "") return null;
	const n = Number(s);
	return Number.isFinite(n) ? n : null;
}

/** Ranges are written as `min-max` with either side optional. */
export function parseRange(raw: string): Range | null {
	const match = raw.match(/^([\d.]*)-([\d.]*)$/);
	if (!match) return null;
	const range = { min: parseNumber(match[1]), max: parseNumber(match[2]) };
	return range.min == null && range.max == null ? null : range;
}

export function formatRange(range: Range): string {
	return `${range.min ?? ""}-${range.max ?? ""}`;
}

export function parseState(params: SearchParamsRecord): FilterState {
	const all = (key: string) => {
		const v = params[key];
		return v == null ? [] : Array.isArray(v) ? v : [v];
	};
	const first = (key: string) => all(key)[0];
	const selections = new Map<string, Selection>();
	for (const def of FILTERS) {
		const values = all(def.id).filter(Boolean);
		if (!values.length) continue;
		if (def.kind === "options") selections.set(def.id, [...new Set(values)]);
		else if (def.kind === "flag") selections.set(def.id, true);
		else {
			const range = parseRange(values[0]!);
			if (range) selections.set(def.id, range);
		}
	}
	const sort = SORTS.find((s) => s.id === first(PARAM.sort))?.id ?? "price-asc";
	const page = Math.max(1, Math.floor(parseNumber(first(PARAM.page)) ?? 1));
	return {
		query: (first(PARAM.query) ?? "").trim().slice(0, 200),
		sort,
		page,
		includeUnstated: first(PARAM.unstated) === "1",
		selections,
	};
}

function valueOf(
	def: FilterDef,
	laptop: Laptop,
): string[] | number | boolean | null {
	if (def.kind === "options") {
		const values = def.values(laptop);
		return values.length ? values : null;
	}
	return def.value(laptop);
}

function matches(
	def: FilterDef,
	laptop: Laptop,
	selection: Selection,
	includeUnstated: boolean,
): boolean {
	const value = valueOf(def, laptop);
	if (value == null) return includeUnstated;
	if (def.kind === "options")
		return (value as string[]).some((v) => (selection as string[]).includes(v));
	if (def.kind === "flag") return value === true;
	const n = value as number;
	const { min, max } = selection as Range;
	return (min == null || n >= min) && (max == null || n <= max);
}

function searchText(laptop: Laptop): string {
	const s = laptop.specs;
	return [
		laptop.name,
		s.series,
		s.model_number,
		s.part_number,
		s.cpu_model,
		laptop.derived.cpuFamily,
		s.gpu_model,
		laptop.derived.gpu,
		...laptop.offers.map((o) => o.title),
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();
}

function matchesQuery(laptop: Laptop, query: string): boolean {
	if (!query) return true;
	const haystack = searchText(laptop);
	const compact = haystack.replace(/[\s-]/g, "");
	return query
		.toLowerCase()
		.split(/\s+/)
		.every(
			(token) =>
				haystack.includes(token) || compact.includes(token.replace(/-/g, "")),
		);
}

interface OptionFacet {
	value: string;
	label: string;
	count: number;
}

interface FacetBase {
	id: string;
	label: string;
	group: FilterGroupId;
	hint?: string;
	/** Laptops in the whole catalogue that state this spec. */
	stated: number;
}

export type Facet =
	| (FacetBase & {
			kind: "options";
			options: OptionFacet[];
			selected: string[];
	  })
	| (FacetBase & {
			kind: "range";
			bounds: Range & { min: number; max: number };
			step: number;
			unit?: string;
			money?: boolean;
			selected: Range | null;
	  })
	| (FacetBase & { kind: "flag"; count: number; selected: boolean });

export interface BrowseResult {
	facets: Facet[];
	laptops: Laptop[];
	total: number;
	catalogueSize: number;
	page: number;
	pageCount: number;
}

const roundDown = (n: number, step: number) => Math.floor(n / step) * step;
const roundUp = (n: number, step: number) => Math.ceil(n / step) * step;
const decimals = (step: number) => (String(step).split(".")[1] ?? "").length;
const fix = (n: number, step: number) => Number(n.toFixed(decimals(step)));

function buildFacet(
	def: FilterDef,
	catalogue: Laptop[],
	pool: Laptop[],
	state: FilterState,
): Facet | null {
	const selection = state.selections.get(def.id);
	const stated = catalogue.filter((l) => valueOf(def, l) != null).length;
	if (stated === 0 && !selection) return null;
	const base = {
		id: def.id,
		label: def.label,
		group: def.group,
		hint: def.hint,
		stated,
	};

	if (def.kind === "options") {
		// Options keep a fixed order (catalogue frequency) so they do not jump around while filtering.
		const frequency = new Map<string, number>();
		for (const l of catalogue)
			for (const v of def.values(l))
				frequency.set(v, (frequency.get(v) ?? 0) + 1);
		const counts = new Map<string, number>(
			[...frequency.keys()].map((v) => [v, 0]),
		);
		for (const l of pool)
			for (const v of def.values(l)) counts.set(v, (counts.get(v) ?? 0) + 1);
		const selected = (selection as string[] | undefined) ?? [];
		for (const v of selected) if (!counts.has(v)) counts.set(v, 0);
		const order =
			def.order ??
			((a: string, b: string) =>
				(frequency.get(b) ?? 0) - (frequency.get(a) ?? 0) ||
				a.localeCompare(b));
		const options = [...counts.keys()].sort(order).map((value) => ({
			value,
			label: def.format?.(value) ?? value,
			count: counts.get(value) ?? 0,
		}));
		return { ...base, kind: "options", options, selected };
	}
	if (def.kind === "flag") {
		return {
			...base,
			kind: "flag",
			count: pool.filter((l) => def.value(l) === true).length,
			selected: selection === true,
		};
	}
	const values = catalogue.map(def.value).filter((v): v is number => v != null);
	const min = values.length
		? fix(roundDown(Math.min(...values), def.step), def.step)
		: 0;
	const max = values.length
		? fix(roundUp(Math.max(...values), def.step), def.step)
		: 0;
	return {
		...base,
		kind: "range",
		bounds: { min, max },
		step: def.step,
		unit: def.unit,
		money: def.money,
		selected: (selection as Range | undefined) ?? null,
	};
}

type SortKey = (l: Laptop) => number | null;

const SORT_KEYS: Record<SortId, [SortKey, 1 | -1]> = {
	"price-asc": [(l) => l.price?.amountInr ?? null, 1],
	"price-desc": [(l) => l.price?.amountInr ?? null, -1],
	discount: [(l) => l.price?.discountPct ?? null, -1],
	weight: [
		(l) => (typeof l.specs.weight_kg === "number" ? l.specs.weight_kg : null),
		1,
	],
	battery: [
		(l) => (typeof l.specs.battery_wh === "number" ? l.specs.battery_wh : null),
		-1,
	],
	stores: [(l) => new Set(l.offers.map((o) => o.site)).size, -1],
};

/** Buyable laptops first, then the chosen key, unknown values last, then name for a stable order. */
function sortLaptops(laptops: Laptop[], sort: SortId): Laptop[] {
	const [key, direction] = SORT_KEYS[sort];
	return [...laptops].sort((a, b) => {
		const buyable = Number(b.inStock) - Number(a.inStock);
		if (buyable) return buyable;
		const ka = key(a);
		const kb = key(b);
		if (ka == null || kb == null)
			return ka == null && kb == null
				? a.name.localeCompare(b.name)
				: ka == null
					? 1
					: -1;
		return (ka - kb) * direction || a.name.localeCompare(b.name);
	});
}

export function browse(catalogue: Laptop[], state: FilterState): BrowseResult {
	const searched = catalogue.filter((l) => matchesQuery(l, state.query));
	const active = [...state.selections].flatMap(([id, selection]) => {
		const def = FILTER_BY_ID.get(id);
		return def ? [{ def, selection }] : [];
	});
	// Which active filters each laptop fails; a facet counts laptops failing no filter but its own.
	const failures = new Map(
		searched.map((l) => [
			l,
			active
				.filter(
					({ def, selection }) =>
						!matches(def, l, selection, state.includeUnstated),
				)
				.map(({ def }) => def.id),
		]),
	);
	const passingExcept = (id: string) =>
		searched.filter((l) => {
			const failed = failures.get(l)!;
			return failed.length === 0 || (failed.length === 1 && failed[0] === id);
		});

	const facets = FILTERS.map((def) =>
		buildFacet(def, catalogue, passingExcept(def.id), state),
	).filter((f): f is Facet => f != null);
	const results = sortLaptops(
		searched.filter((l) => failures.get(l)!.length === 0),
		state.sort,
	);
	const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
	const page = Math.min(state.page, pageCount);
	return {
		facets,
		laptops: results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
		total: results.length,
		catalogueSize: catalogue.length,
		page,
		pageCount,
	};
}
