// Builders for unit tests only.

import { derive } from "./normalise";
import { isBuyable, summarisePrice } from "./pricing";
import { SPEC_KEYS, type Specs } from "./specs";
import type { Laptop, Offer } from "./types";

export function offer(overrides: Partial<Offer> = {}): Offer {
	return {
		listingId: "store:1",
		site: "store",
		storeName: "Store",
		sellerName: null,
		title: null,
		url: "https://example.com/1",
		condition: "new",
		availability: "in_stock",
		priceInr: 50000,
		mrpInr: 60000,
		lastVerifiedAt: "2026-10-09T10:00:00+00:00",
		freshness: "fresh",
		matchReason: null,
		...overrides,
	};
}

export function laptop(
	key: string,
	specs: Partial<Specs> = {},
	offers: Offer[] = [offer()],
): Laptop {
	const full = {
		...(Object.fromEntries(SPEC_KEYS.map((k) => [k, null])) as Specs),
		...specs,
	};
	return {
		key,
		slug: key,
		name: key,
		matchStatus: "single_listing",
		powerLimitsKnown: false,
		specs: full,
		sources: {},
		offers,
		price: summarisePrice(offers, null),
		inStock: offers.some(isBuyable),
		images: [],
		derived: derive(full),
		reviewNotes: [],
	};
}
