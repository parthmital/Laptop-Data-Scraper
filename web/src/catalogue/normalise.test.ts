import { describe, expect, it } from "vitest";

import {
	cpuFamilyLabel,
	gamutLabel,
	gpuKind,
	gpuLabel,
	isLaptop,
	osLabel,
	resolutionLabel,
} from "./normalise";
import type { Specs } from "./specs";

describe("cpuFamilyLabel", () => {
	it.each([
		["Intel Core Ultra 7", null, "Intel Core Ultra 7"],
		["Core Ultra 7", "Core Ultra 7 155H", "Intel Core Ultra 7"],
		["Core i5", null, "Intel Core i5"],
		["Intel Core 5", null, "Intel Core 5"],
		["AMD Ryzen 7", "Ryzen 7 7445HS", "AMD Ryzen 7"],
		["AMD Ryzen AI 7 PRO", null, "AMD Ryzen AI 7"],
		["AMD Ryzen AI Max+ PRO", null, "AMD Ryzen AI Max"],
		["Snapdragon X Elite", null, "Snapdragon X Elite"],
		["Qualcomm Snapdragon X2 Plus", null, "Snapdragon X2 Plus"],
		["Apple M5 Chip", null, "Apple M5"],
		[null, "Core i7-14650HX", "Intel Core i7"],
		[null, null, null],
	])("%s / %s gives %s", (family, model, expected) => {
		expect(cpuFamilyLabel(family, model)).toBe(expected);
	});
});

describe("gpuLabel", () => {
	it.each([
		["NVIDIA GeForce RTX 5050 8GB GDDR7", "NVIDIA GeForce RTX 5050"],
		["Rtx5060", "NVIDIA GeForce RTX 5060"],
		["NVIDIA GeForce RTX-5050", "NVIDIA GeForce RTX 5050"],
		[
			"NVIDIA RTX PRO 2000 Blackwell Generation Laptop GPU",
			"NVIDIA RTX PRO 2000 Blackwell",
		],
		["NVIDIA RTX 500 Ada Generation Laptop GPU", "NVIDIA RTX 500 Ada"],
		["Integrated Intel Arc 130T GPU", "Intel Arc 130T"],
		["Intel ARC Graphics", "Intel Arc"],
		["Intel Iris Xe", "Intel Iris Xe"],
		["Integrated Intel UHD Graphics", "Intel UHD"],
		["AMD Radeon 860M Graphics", "AMD Radeon 860M"],
		["Qualcomm Adreno GPU Integrated", "Qualcomm Adreno"],
		["Integrated", null],
		[null, null],
	])("%s gives %s", (model, expected) => {
		expect(gpuLabel(model)).toBe(expected);
	});
});

describe("gpuKind", () => {
	it("keeps a stated type", () =>
		expect(gpuKind("integrated", "NVIDIA GeForce RTX 4050")).toBe(
			"integrated",
		));
	it("treats NVIDIA as dedicated", () =>
		expect(gpuKind(null, "NVIDIA GeForce RTX 4050")).toBe("dedicated"));
	it("leaves AMD Radeon unknown", () =>
		expect(gpuKind(null, "AMD Radeon")).toBeNull());
});

describe("display and software labels", () => {
	it("names resolutions", () => {
		expect(resolutionLabel("1920x1200")).toBe("1920 × 1200 WUXGA");
		expect(resolutionLabel("1900x1080")).toBe("1900 × 1080");
	});
	it("normalises gamut spelling", () => {
		expect(gamutLabel("100% DCI-P3")).toBe("100% DCI-P3");
		expect(gamutLabel("62.5% sRGB")).toBe("62.5% sRGB");
		expect(gamutLabel("Wide colour (P3)")).toBe("DCI-P3, coverage not stated");
	});
	it("marks a Windows edition that is not stated", () => {
		expect(osLabel("Windows 11")).toBe("Windows 11 (edition not stated)");
		expect(osLabel("Windows 11 Pro")).toBe("Windows 11 Pro");
	});
});

describe("isLaptop", () => {
	const blank = {} as Specs;
	it("rejects accessories with no processor, RAM or storage", () =>
		expect(isLaptop(blank)).toBe(false));
	it("accepts a listing with RAM only", () =>
		expect(isLaptop({ ...blank, ram_gb: 16 })).toBe(true));
});
