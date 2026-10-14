import { describe, expect, it } from "vitest";

import { pageList } from "./url-state";

describe("pageList", () => {
	it("lists every page when there are few", () =>
		expect(pageList(3, 5)).toEqual([1, 2, 3, 4, 5]));
	it("keeps first, last and neighbours with gaps between", () =>
		expect(pageList(6, 12)).toEqual([1, null, 5, 6, 7, null, 12]));
	it("has no gap next to the first page", () =>
		expect(pageList(1, 4)).toEqual([1, 2, null, 4]));
});
