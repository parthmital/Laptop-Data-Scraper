import { describe, expect, it } from "vitest";

import { discountPct, summarisePrice } from "./pricing";
import { offer } from "./test-fixtures";

describe("discountPct", () => {
	it("rounds the saving off MRP", () =>
		expect(discountPct(159990, 215990)).toBe(26));
	it("is null without a saving", () =>
		expect(discountPct(1000, 1000)).toBeNull());
});

describe("summarisePrice", () => {
	const cheapOut = offer({
		listingId: "a",
		priceInr: 40000,
		availability: "out_of_stock",
	});
	const inStock = offer({ listingId: "b", priceInr: 45000 });
	const compared = offer({ listingId: "c", priceInr: 47000 });

	it("prefers the pipeline's compared offer", () => {
		expect(summarisePrice([cheapOut, inStock, compared], "c")).toMatchObject({
			kind: "compared",
			listingId: "c",
		});
	});
	it("falls back to the cheapest buyable offer", () => {
		expect(summarisePrice([cheapOut, inStock], null)).toMatchObject({
			kind: "in_stock",
			amountInr: 45000,
		});
	});
	it("shows the last seen price when nothing is buyable", () => {
		expect(summarisePrice([cheapOut], null)).toMatchObject({
			kind: "last_seen",
			amountInr: 40000,
		});
	});
	it("ignores delisted offers", () => {
		expect(summarisePrice([offer({ freshness: "delisted" })], null)).toBeNull();
	});
});
