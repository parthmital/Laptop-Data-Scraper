import { describe, expect, it } from "vitest";

import { keySpecs } from "./summary";
import { laptop } from "./test-fixtures";

describe("keySpecs", () => {
	const full = laptop("a", {
		cpu_model: "Core i5-13420H",
		ram_gb: 16,
		ram_type: "DDR5",
		storage_gb: 1024,
		storage_type: "SSD",
		display_size_in: 15.6,
		display_resolution: "1920x1080",
		display_refresh_hz: 144,
		weight_kg: 1.8,
		battery_wh: 70,
	});

	it("labels and formats the compared specs", () =>
		expect(keySpecs(full)).toEqual([
			{ label: "Processor", value: "Core i5-13420H" },
			{ label: "Memory", value: "16 GB DDR5" },
			{ label: "Storage", value: "1 TB SSD" },
			{ label: "Display", value: "15.6″ 1920×1080 144 Hz" },
			{ label: "Weight", value: "1.8 kg" },
		]));
	it("adds battery only when extended", () =>
		expect(keySpecs(full, true).map((s) => s.label)).toContain("Battery"));
	it("leaves unstated specs out", () =>
		expect(keySpecs(laptop("b", { ram_gb: 8 }))).toEqual([
			{ label: "Memory", value: "8 GB" },
		]));
});
