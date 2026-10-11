import type { Offer, PriceKind, PriceSummary } from "./types";

export function discountPct(
	price: number | null,
	mrp: number | null,
): number | null {
	if (price == null || mrp == null || mrp <= price) return null;
	return Math.round(((mrp - price) / mrp) * 100);
}

/** Purchasable now: listed, recently verified, in stock and priced. */
export function isBuyable(offer: Offer): boolean {
	return (
		offer.freshness === "fresh" &&
		offer.availability === "in_stock" &&
		offer.priceInr != null
	);
}

function cheapest(offers: Offer[]): Offer | undefined {
	return offers
		.filter((o) => o.priceInr != null)
		.sort(
			(a, b) =>
				a.priceInr! - b.priceInr! ||
				b.lastVerifiedAt.localeCompare(a.lastVerifiedAt),
		)[0];
}

/**
 * Picks the headline price. The pipeline's lowest_prices row wins; it only covers new, in-stock, fresh offers
 * of confirmed matches. Otherwise the cheapest buyable offer is shown as unconfirmed, then the last seen price.
 */
export function summarisePrice(
	offers: Offer[],
	comparedListingId: string | null,
): PriceSummary | null {
	const listed = offers.filter((o) => o.freshness !== "delisted");
	const compared = comparedListingId
		? listed.find((o) => o.listingId === comparedListingId)
		: undefined;
	const candidates: [PriceKind, Offer | undefined][] = [
		["compared", compared],
		["in_stock", cheapest(listed.filter(isBuyable))],
		["last_seen", cheapest(listed)],
	];
	for (const [kind, offer] of candidates) {
		if (!offer || offer.priceInr == null) continue;
		return {
			kind,
			amountInr: offer.priceInr,
			mrpInr: offer.mrpInr,
			discountPct: discountPct(offer.priceInr, offer.mrpInr),
			listingId: offer.listingId,
			storeName: offer.storeName,
			url: offer.url,
			lastVerifiedAt: offer.lastVerifiedAt,
			freshness: offer.freshness,
		};
	}
	return null;
}

/** Offers ordered for display: buyable first, then by price. */
export function sortOffers(offers: Offer[]): Offer[] {
	return [...offers].sort(
		(a, b) =>
			Number(isBuyable(b)) - Number(isBuyable(a)) ||
			(a.priceInr ?? Infinity) - (b.priceInr ?? Infinity),
	);
}
