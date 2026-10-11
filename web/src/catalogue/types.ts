import type { SpecKey, Specs } from "./specs";

export type Availability = "in_stock" | "out_of_stock" | "unknown";
export type Freshness = "fresh" | "stale" | "delisted";

/** A seller listing's latest verified page version (pipeline view v_current_offers). */
export interface Offer {
	listingId: string;
	site: string;
	storeName: string;
	sellerName: string | null;
	title: string | null;
	url: string;
	condition: string | null;
	availability: Availability;
	priceInr: number | null;
	mrpInr: number | null;
	lastVerifiedAt: string;
	freshness: Freshness;
	matchReason: string | null;
}

/**
 * How the headline price was chosen:
 * - compared: the pipeline's lowest comparable offer (new, in stock, fresh, confirmed match)
 * - in_stock: in stock and fresh, but not compared across stores because the match is unconfirmed
 * - last_seen: nothing purchasable; the cheapest current listing price
 */
export type PriceKind = "compared" | "in_stock" | "last_seen";

export interface PriceSummary {
	kind: PriceKind;
	amountInr: number;
	mrpInr: number | null;
	discountPct: number | null;
	listingId: string;
	storeName: string;
	url: string;
	lastVerifiedAt: string;
	freshness: Freshness;
}

export interface FieldSource {
	listingId: string;
	origin: string;
}

/** A listing the pipeline could not confirm as the same or a different laptop. */
export interface ReviewNote {
	otherSlug: string | null;
	otherName: string;
	relation: string;
	reasons: string[];
}

export interface Derived {
	cpuFamily: string | null;
	gpu: string | null;
	gpuKind: "integrated" | "dedicated" | null;
	os: string | null;
	resolution: string | null;
	gamut: string | null;
	ramUpgradeable: boolean | null;
}

export interface Laptop {
	key: string;
	slug: string;
	name: string;
	matchStatus: string | null;
	powerLimitsKnown: boolean;
	specs: Specs;
	sources: Partial<Record<SpecKey, FieldSource[]>>;
	offers: Offer[];
	price: PriceSummary | null;
	inStock: boolean;
	images: string[];
	derived: Derived;
	reviewNotes: ReviewNote[];
}

export interface CatalogueMeta {
	runId: string | null;
	runFinishedAt: string | null;
	stores: { site: string; name: string; baseUrl: string | null }[];
	excludedNonLaptops: number;
}

export interface Catalogue {
	laptops: Laptop[];
	meta: CatalogueMeta;
}
