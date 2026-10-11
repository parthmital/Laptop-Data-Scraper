import {
	BOOLEAN_SPECS,
	SPEC_META,
	type SpecKey,
	type SpecValue,
} from "./specs";

const inr = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export const formatInr = (amount: number) => inr.format(amount);
export const formatNumber = (n: number) => number.format(n);

export function formatAge(iso: string, now = Date.now()): string {
	const hours = Math.max(0, (now - Date.parse(iso)) / 3_600_000);
	if (hours < 1) return "less than an hour ago";
	if (hours < 24) return `${Math.floor(hours)} h ago`;
	const days = Math.floor(hours / 24);
	return days === 1 ? "1 day ago" : `${days} days ago`;
}

export function formatStorage(gb: number): string {
	return gb >= 1024 && gb % 1024 === 0 ? `${gb / 1024} TB` : `${gb} GB`;
}

export function formatSpec(key: SpecKey, value: SpecValue): string | null {
	if (value == null) return null;
	if (BOOLEAN_SPECS.has(key)) return value ? "Yes" : "No";
	if (key === "storage_gb" && typeof value === "number")
		return formatStorage(value);
	if (key === "display_resolution" && typeof value === "string")
		return value.replace("x", " × ");
	if (key === "gpu_type" && typeof value === "string")
		return value === "dedicated" ? "Dedicated" : "Integrated";
	const unit = SPEC_META[key].unit;
	const text = typeof value === "number" ? formatNumber(value) : String(value);
	return unit ? `${text} ${unit}` : text;
}

export function formatRangeValue(
	n: number,
	opts: { unit?: string; money?: boolean },
): string {
	if (opts.money) return formatInr(n);
	return opts.unit === "%"
		? `${formatNumber(n)}%`
		: `${formatNumber(n)}${opts.unit ? ` ${opts.unit}` : ""}`;
}

const ORIGIN_LABELS: Record<string, string> = {
	llm: "Read from the listing text by the extraction model",
	"rule:page": "Read from the page's structured data",
	"rule:derived": "Worked out from other stated values",
};

/** Pipeline provenance such as `rule:spec:Processor Related > Processor Model Number`, in words. */
export function describeOrigin(origin: string): string {
	if (origin.startsWith("rule:spec:"))
		return `Spec table: ${origin.slice("rule:spec:".length).replace(/\s*>\s*/g, " › ")}`;
	return (
		ORIGIN_LABELS[origin] ??
		ORIGIN_LABELS[origin.split(":").slice(0, 2).join(":")] ??
		origin
	);
}
