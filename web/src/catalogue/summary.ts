// The handful of specs people compare first, as short label and value pairs for result cards and the laptop page.

import { formatNumber, formatStorage } from "./format";
import type { Laptop } from "./types";

export interface KeySpec {
	label: string;
	value: string;
}

const num = (v: unknown) => (typeof v === "number" ? v : null);
const str = (v: unknown) => (typeof v === "string" && v ? v : null);

/** Unstated specs are left out; `extended` adds the specs only the laptop page has room for. */
export function keySpecs(l: Laptop, extended = false): KeySpec[] {
	const s = l.specs;
	const ram = num(s.ram_gb);
	const storage = num(s.storage_gb);
	const vram = num(s.gpu_vram_gb);
	const size = num(s.display_size_in);
	const weight = num(s.weight_kg);
	const battery = num(s.battery_wh);
	const resolution = str(s.display_resolution)?.replace("x", "×");
	const join = (...parts: (string | number | null | undefined)[]) =>
		parts.filter((p) => p != null && p !== "").join(" ");

	const cpu = str(s.cpu_model) ?? l.derived.cpuFamily;
	const specs: (KeySpec | null)[] = [
		cpu ? { label: "Processor", value: cpu } : null,
		ram != null
			? { label: "Memory", value: join(`${ram} GB`, str(s.ram_type)) }
			: null,
		storage != null
			? {
					label: "Storage",
					value: join(formatStorage(storage), str(s.storage_type)),
				}
			: null,
		l.derived.gpu
			? {
					label: "Graphics",
					value: join(l.derived.gpu, vram ? `${vram} GB` : null),
				}
			: null,
		size != null
			? {
					label: "Display",
					value: join(
						`${formatNumber(size)}″`,
						resolution,
						num(s.display_refresh_hz) ? `${s.display_refresh_hz} Hz` : null,
						str(s.display_panel),
					),
				}
			: null,
		weight != null
			? { label: "Weight", value: `${formatNumber(weight)} kg` }
			: null,
	];
	if (extended)
		specs.push(
			battery != null
				? { label: "Battery", value: `${formatNumber(battery)} Wh` }
				: null,
			l.derived.os ? { label: "Operating system", value: l.derived.os } : null,
		);
	return specs.filter((x): x is KeySpec => x != null);
}
