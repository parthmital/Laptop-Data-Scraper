// Folds the free-text spellings sellers use into one label per filter option.
// Only spelling is normalised; nothing is inferred that the listing does not state.

import type { Derived } from "./types";
import type { Specs } from "./specs";

function text(value: unknown): string | null {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function cpuFamilyLabel(family: unknown, model: unknown): string | null {
	const source = [text(family), text(model)].filter(Boolean).join(" ");
	if (!source) return null;
	const s = source.replace(/[-_]/g, " ");
	const rules: [RegExp, (m: RegExpMatchArray) => string][] = [
		[/core\s*ultra\s*(\d)/i, (m) => `Intel Core Ultra ${m[1]}`],
		[/core\s*i(\d)/i, (m) => `Intel Core i${m[1]}`],
		[/core\s*(\d)\b/i, (m) => `Intel Core ${m[1]}`],
		[/ryzen\s*ai\s*max/i, () => "AMD Ryzen AI Max"],
		[/ryzen\s*ai\s*(\d)/i, (m) => `AMD Ryzen AI ${m[1]}`],
		[/ryzen\s*(\d)/i, (m) => `AMD Ryzen ${m[1]}`],
		[
			/snapdragon\s*x2\s*(elite|plus)/i,
			(m) => `Snapdragon X2 ${titleCase(m[1]!)}`,
		],
		[
			/snapdragon\s*x\s*(elite|plus)/i,
			(m) => `Snapdragon X ${titleCase(m[1]!)}`,
		],
		[
			/\bm(\d)(\s*(pro|max))?\b/i,
			(m) => `Apple M${m[1]}${m[3] ? ` ${titleCase(m[3])}` : ""}`,
		],
	];
	for (const [pattern, label] of rules) {
		const match = s.match(pattern);
		if (match) return label(match);
	}
	return text(family);
}

function titleCase(word: string): string {
	return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function gpuLabel(model: unknown): string | null {
	const raw = text(model);
	if (!raw) return null;
	const s = raw.toLowerCase().replace(/[-_]/g, " ");
	const rules: [RegExp, (m: RegExpMatchArray) => string][] = [
		[/rtx\s*pro\s*(\d{3,4})/, (m) => `NVIDIA RTX PRO ${m[1]} Blackwell`],
		[/rtx\s*(\d{3,4})\s*ada/, (m) => `NVIDIA RTX ${m[1]} Ada`],
		[/rtx\s*(\d{4})/, (m) => `NVIDIA GeForce RTX ${m[1]}`],
		[/arc\s*(1\d0[tv])/, (m) => `Intel Arc ${m[1]!.toUpperCase()}`],
		[/\barc\b/, () => "Intel Arc"],
		[/iris\s*xe/, () => "Intel Iris Xe"],
		[/\buhd\b/, () => "Intel UHD"],
		[/intel\s*graphics/, () => "Intel Graphics"],
		[/radeon\s*(\d{3}m)/, (m) => `AMD Radeon ${m[1]!.toUpperCase()}`],
		[/radeon/, () => "AMD Radeon"],
		[/adreno|qualcomm/, () => "Qualcomm Adreno"],
		[/apple|m\d\s*gpu/, () => "Apple GPU"],
	];
	for (const [pattern, label] of rules) {
		const match = s.match(pattern);
		if (match) return label(match);
	}
	// "Integrated" alone names no GPU.
	return /^integrated$/.test(s) ? null : raw;
}

/** NVIDIA laptop GPUs are always discrete, so the label decides when the listing omits the type. */
export function gpuKind(
	type: unknown,
	label: string | null,
): Derived["gpuKind"] {
	if (type === "integrated" || type === "dedicated") return type;
	if (!label) return null;
	if (label.startsWith("NVIDIA")) return "dedicated";
	if (/^(Intel|Qualcomm|Apple)/.test(label)) return "integrated";
	return null;
}

export function osLabel(os: unknown): string | null {
	const value = text(os);
	if (!value) return null;
	if (/^windows 11$/i.test(value)) return "Windows 11 (edition not stated)";
	return value;
}

const RESOLUTION_NAMES: Record<string, string> = {
	"1366x768": "HD",
	"1920x1080": "Full HD",
	"1920x1200": "WUXGA",
	"2560x1440": "QHD",
	"2560x1600": "WQXGA",
	"2880x1800": "2.8K",
	"2880x1920": "3K",
	"3840x2160": "4K UHD",
	"3840x2400": "WQUXGA",
};

export function resolutionLabel(resolution: unknown): string | null {
	const value = text(resolution);
	const match = value?.match(/^(\d{3,4})\s*x\s*(\d{3,4})$/i);
	if (!match) return value;
	const key = `${match[1]}x${match[2]}`;
	const name = RESOLUTION_NAMES[key];
	return `${match[1]} × ${match[2]}${name ? ` ${name}` : ""}`;
}

/** Vertical pixels, for sorting resolution options. */
export function resolutionHeight(label: string): number {
	return Number(label.match(/×\s*(\d+)/)?.[1] ?? 0);
}

export function gamutLabel(gamut: unknown): string | null {
	const value = text(gamut);
	if (!value) return null;
	const pct = value.match(
		/(\d+(?:\.\d+)?)\s*%\s*(srgb|dci[\s-]*p3|p3|ntsc|adobe\s*rgb)/i,
	);
	if (pct) {
		const space = pct[2]!.toLowerCase().replace(/[\s-]+/g, "");
		const names: Record<string, string> = {
			srgb: "sRGB",
			dcip3: "DCI-P3",
			p3: "DCI-P3",
			ntsc: "NTSC",
			adobergb: "Adobe RGB",
		};
		return `${pct[1]}% ${names[space] ?? pct[2]}`;
	}
	if (/p3/i.test(value)) return "DCI-P3, coverage not stated";
	return value;
}

export function derive(specs: Specs): Derived {
	const gpu = gpuLabel(specs.gpu_model);
	const ram = specs.ram_gb;
	const ramMax = specs.ram_max_gb;
	return {
		cpuFamily: cpuFamilyLabel(specs.cpu_family, specs.cpu_model),
		gpu,
		gpuKind: gpuKind(specs.gpu_type, gpu),
		os: osLabel(specs.os),
		resolution: resolutionLabel(specs.display_resolution),
		gamut: gamutLabel(specs.display_color_gamut),
		ramUpgradeable:
			typeof ram === "number" && typeof ramMax === "number"
				? ramMax > ram
				: null,
	};
}

/**
 * The pipeline's discovery occasionally picks up accessories (a webcam, a speaker).
 * A laptop states at least one of processor, RAM or storage.
 */
export function isLaptop(specs: Specs): boolean {
	return (
		specs.cpu_family != null ||
		specs.cpu_model != null ||
		specs.ram_gb != null ||
		specs.storage_gb != null
	);
}
