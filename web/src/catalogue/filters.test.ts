import { describe, expect, it } from "vitest";

import { browse, parseRange, parseState, type Facet } from "./filters";
import { laptop, offer } from "./test-fixtures";

const catalogue = [
	laptop("a", { brand: "HP", ram_gb: 16, weight_kg: 1.4 }, [
		offer({ priceInr: 60000 }),
	]),
	laptop("b", { brand: "HP", ram_gb: 8, weight_kg: null }, [
		offer({ priceInr: 40000 }),
	]),
	laptop("c", { brand: "Dell", ram_gb: 16, weight_kg: 2.1 }, [
		offer({ priceInr: 50000, availability: "out_of_stock" }),
	]),
];

const facet = (facets: Facet[], id: string) => facets.find((f) => f.id === id)!;
const keys = (result: { laptops: { key: string }[] }) =>
	result.laptops.map((l) => l.key);

describe("parseState", () => {
	it("reads repeated options, ranges, flags and paging", () => {
		const state = parseState({
			brand: ["HP", "Dell"],
			price: "40000-",
			stock: "1",
			page: "2",
			sort: "nope",
		});
		expect(state.selections.get("brand")).toEqual(["HP", "Dell"]);
		expect(state.selections.get("price")).toEqual({ min: 40000, max: null });
		expect(state.selections.get("stock")).toBe(true);
		expect(state.page).toBe(2);
		expect(state.sort).toBe("price-asc");
	});
	it("rejects malformed ranges", () => {
		expect(parseRange("abc")).toBeNull();
		expect(parseRange("-")).toBeNull();
	});
});

describe("browse", () => {
	it("sorts buyable laptops first, then by price", () => {
		expect(keys(browse(catalogue, parseState({})))).toEqual(["b", "a", "c"]);
	});

	it("counts each option as if its own filter were not applied", () => {
		const result = browse(catalogue, parseState({ brand: "HP", ram: "16" }));
		expect(keys(result)).toEqual(["a"]);
		const brand = facet(result.facets, "brand");
		expect(brand.kind === "options" && brand.options).toEqual([
			{ value: "HP", label: "HP", count: 1 },
			{ value: "Dell", label: "Dell", count: 1 },
		]);
	});

	it("hides laptops that do not state a filtered spec unless asked", () => {
		expect(keys(browse(catalogue, parseState({ weight: "-2" })))).toEqual([
			"a",
		]);
		expect(
			keys(browse(catalogue, parseState({ weight: "-2", unstated: "1" }))),
		).toEqual(["b", "a"]);
	});

	it("reports how many laptops state a spec and drops specs nobody states", () => {
		const { facets } = browse(catalogue, parseState({}));
		expect(facet(facets, "weight").stated).toBe(2);
		expect(facets.find((f) => f.id === "gpu_w")).toBeUndefined();
	});

	it("searches model codes ignoring hyphens", () => {
		const withModel = [
			...catalogue,
			laptop("d", { model_number: "G615JHR-S5005WS", ram_gb: 16 }),
		];
		expect(
			keys(browse(withModel, parseState({ q: "g615jhrs5005ws" }))),
		).toEqual(["d"]);
	});

	it("clamps the page to the last page", () => {
		expect(browse(catalogue, parseState({ page: "9" })).page).toBe(1);
	});
});
