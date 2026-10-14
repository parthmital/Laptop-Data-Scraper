import { describe, expect, it } from "vitest";

import { formatInrShort } from "./format";

describe("formatInrShort", () => {
	it("uses thousands below a lakh", () =>
		expect(formatInrShort(50000)).toBe("₹50K"));
	it("uses lakhs from 1,00,000", () =>
		expect(formatInrShort(120000)).toBe("₹1.2L"));
	it("keeps small amounts whole", () =>
		expect(formatInrShort(999)).toBe("₹999"));
});
