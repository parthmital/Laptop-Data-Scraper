"use client";

import { X } from "lucide-react";

import { PARAM, parseRange, type Facet } from "@/catalogue/filters";
import { formatRangeValue } from "@/catalogue/format";
import {
	clearFilters,
	setFlag,
	setParam,
	setRange,
	toggleOption,
} from "@/catalogue/url-state";

import { useFilterNavigation } from "./FilterNavigation";
import styles from "./browse.module.css";

interface Chip {
	key: string;
	label: string;
	remove: (p: URLSearchParams) => URLSearchParams;
}

function rangeText(
	facet: Extract<Facet, { kind: "range" }>,
	raw: string,
): string | null {
	const range = parseRange(raw);
	if (!range) return null;
	const f = (n: number) => formatRangeValue(n, facet);
	if (range.min != null && range.max != null)
		return `${f(range.min)} to ${f(range.max)}`;
	return range.min != null
		? `at least ${f(range.min)}`
		: `up to ${f(range.max!)}`;
}

export function ActiveFilters({ facets }: { facets: Facet[] }) {
	const { params, navigate } = useFilterNavigation();
	const chips: Chip[] = [];
	const query = params.get(PARAM.query);
	if (query)
		chips.push({
			key: "q",
			label: `“${query}”`,
			remove: (p) => setParam(p, PARAM.query, null),
		});
	for (const facet of facets) {
		if (facet.kind === "options") {
			for (const value of params.getAll(facet.id)) {
				const label =
					facet.options.find((o) => o.value === value)?.label ?? value;
				chips.push({
					key: `${facet.id}:${value}`,
					label: `${facet.label}: ${label}`,
					remove: (p) => toggleOption(p, facet.id, value),
				});
			}
		} else if (facet.kind === "range") {
			const raw = params.get(facet.id);
			const text = raw && rangeText(facet, raw);
			if (text)
				chips.push({
					key: facet.id,
					label: `${facet.label}: ${text}`,
					remove: (p) => setRange(p, facet.id, null),
				});
		} else if (params.get(facet.id) === "1") {
			chips.push({
				key: facet.id,
				label: facet.label,
				remove: (p) => setFlag(p, facet.id, false),
			});
		}
	}
	if (!chips.length) return null;
	return (
		<ul className={styles.chips} aria-label="Active filters">
			{chips.map((chip) => (
				<li key={chip.key}>
					<button
						type="button"
						className={styles.chip}
						onClick={() => navigate(chip.remove(params))}
						aria-label={`Remove ${chip.label}`}
					>
						{chip.label}
						<X size={14} aria-hidden />
					</button>
				</li>
			))}
			{chips.length > 1 && (
				<li>
					<button
						type="button"
						className={styles.textButton}
						onClick={() => navigate(clearFilters(params))}
					>
						Clear all
					</button>
				</li>
			)}
		</ul>
	);
}
