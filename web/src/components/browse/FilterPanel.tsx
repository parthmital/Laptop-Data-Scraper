"use client";

import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { Accordion } from "radix-ui";
import { useState } from "react";

import {
	FILTER_GROUPS,
	PARAM,
	parseRange,
	type Facet,
	type Range,
} from "@/catalogue/filters";
import { formatInr, formatInrShort } from "@/catalogue/format";
import {
	clearFilters,
	setFlag,
	setRange,
	toggleOption,
} from "@/catalogue/url-state";
import { Checkbox } from "@/components/ui/Checkbox";
import { RangeField } from "@/components/ui/RangeField";
import { Switch } from "@/components/ui/Switch";

import { useFilterNavigation } from "./FilterNavigation";
import styles from "./browse.module.css";

const OPEN_BY_DEFAULT = ["deal", "brand", "processor", "graphics"];
const VISIBLE_OPTIONS = 8;

/** Common budgets in rupees, one click each; the slider and typed fields stay for anything else. */
const PRICE_PRESETS: Range[] = [
	{ min: null, max: 50000 },
	{ min: 50000, max: 80000 },
	{ min: 80000, max: 120000 },
	{ min: 120000, max: null },
];

function presetLabel({ min, max }: Range): string {
	if (min == null) return `Under ${formatInr(max!)}`;
	if (max == null) return `Over ${formatInr(min)}`;
	return `${formatInr(min)} to ${formatInr(max)}`;
}

/** The same budget in short Indian form, so two buttons sit side by side with room to breathe. */
function presetShortLabel({ min, max }: Range): string {
	if (min == null) return `Under ${formatInrShort(max!)}`;
	if (max == null) return `Over ${formatInrShort(min)}`;
	return `${formatInrShort(min)} – ${formatInrShort(max)}`;
}

export function FilterPanel({
	facets,
	catalogueSize,
}: {
	facets: Facet[];
	catalogueSize: number;
}) {
	const { params, navigate } = useFilterNavigation();
	const hasFilters =
		facets.some((f) => params.has(f.id)) || params.has(PARAM.query);
	const shownGroups = FILTER_GROUPS.filter((g) =>
		facets.some((f) => f.group === g.id),
	).map((g) => g.id);
	const activeGroups = shownGroups.filter((id) =>
		facets.some((f) => f.group === id && params.has(f.id)),
	);
	const [open, setOpen] = useState<string[]>(() => [
		...new Set([...OPEN_BY_DEFAULT, ...activeGroups]),
	]);
	const allOpen = shownGroups.every((id) => open.includes(id));

	return (
		<div className={styles.panel}>
			<div className={styles.panelHead}>
				<h2 className={styles.panelTitle}>Filters</h2>
				<div className={styles.panelActions}>
					<button
						type="button"
						className={styles.textButton}
						onClick={() => setOpen(allOpen ? [] : shownGroups)}
					>
						{allOpen ? (
							<ChevronsDownUp size={14} aria-hidden />
						) : (
							<ChevronsUpDown size={14} aria-hidden />
						)}
						{allOpen ? "Collapse all" : "Expand all"}
					</button>
					{hasFilters && (
						<>
							<span className={styles.actionDivider} aria-hidden />
							<button
								type="button"
								className={styles.textButton}
								onClick={() => navigate(clearFilters(params))}
							>
								Clear filters
							</button>
						</>
					)}
				</div>
			</div>
			<Accordion.Root type="multiple" value={open} onValueChange={setOpen}>
				{FILTER_GROUPS.map((group) => {
					const groupFacets = facets.filter((f) => f.group === group.id);
					if (!groupFacets.length) return null;
					const active = groupFacets.filter((f) => params.has(f.id)).length;
					return (
						<Accordion.Item
							key={group.id}
							value={group.id}
							className={styles.group}
						>
							<Accordion.Header asChild>
								<h3>
									<Accordion.Trigger className={styles.groupTrigger}>
										<span>{group.label}</span>
										{active > 0 && (
											<span className={styles.activeDot}>{active}</span>
										)}
										<ChevronDown
											size={14}
											className={styles.chevron}
											aria-hidden
										/>
									</Accordion.Trigger>
								</h3>
							</Accordion.Header>
							<Accordion.Content className={styles.groupBody}>
								<div className={styles.groupInner}>
									{groupFacets.map((facet) => (
										<FacetControl
											key={facet.id}
											facet={facet}
											catalogueSize={catalogueSize}
											// "Brand" inside "Brand" would repeat the group's own heading.
											showLabel={facet.label !== group.label}
										/>
									))}
								</div>
							</Accordion.Content>
						</Accordion.Item>
					);
				})}
			</Accordion.Root>
			<div className={styles.unstated}>
				<Switch
					label="Include laptops with missing specs"
					description="Many store listings leave specs out. Turn this on to keep those laptops when you filter on a spec they don't state."
					checked={params.get(PARAM.unstated) === "1"}
					onCheckedChange={(on) =>
						navigate(setFlag(params, PARAM.unstated, on))
					}
				/>
			</div>
		</div>
	);
}

/** Below this share of the catalogue, a filter says how few laptops state its spec. */
const LOW_COVERAGE = 0.9;

function Coverage({
	facet,
	catalogueSize,
}: {
	facet: Facet;
	catalogueSize: number;
}) {
	if (facet.stated >= catalogueSize * LOW_COVERAGE) return null;
	return (
		<span className={styles.coverage}>
			Stated for {facet.stated} of {catalogueSize}
		</span>
	);
}

function FacetControl({
	facet,
	catalogueSize,
	showLabel,
}: {
	facet: Facet;
	catalogueSize: number;
	showLabel: boolean;
}) {
	const { params, navigate } = useFilterNavigation();
	const [expanded, setExpanded] = useState(false);

	if (facet.kind === "flag") {
		return (
			<div className={styles.facet}>
				<Switch
					label={facet.label}
					description={facet.hint}
					count={facet.count}
					checked={params.get(facet.id) === "1"}
					disabled={facet.count === 0 && !params.has(facet.id)}
					onCheckedChange={(on) => navigate(setFlag(params, facet.id, on))}
				/>
				<Coverage facet={facet} catalogueSize={catalogueSize} />
			</div>
		);
	}

	const header = (
		<div className={styles.facetHead}>
			{showLabel && <h4 className={styles.facetLabel}>{facet.label}</h4>}
			<Coverage facet={facet} catalogueSize={catalogueSize} />
		</div>
	);

	if (facet.kind === "range") {
		const raw = params.get(facet.id);
		const selected = raw ? parseRange(raw) : null;
		return (
			<div className={styles.facet}>
				{header}
				{facet.hint && <p className={styles.facetHint}>{facet.hint}</p>}
				{facet.id === "price" && (
					<PricePresets
						bounds={facet.bounds}
						selected={selected}
						onSelect={(range) => navigate(setRange(params, facet.id, range))}
					/>
				)}
				<RangeField
					key={raw ?? ""}
					label={facet.label}
					bounds={facet.bounds}
					step={facet.step}
					unit={facet.unit}
					money={facet.money}
					selected={selected}
					onCommit={(range) => navigate(setRange(params, facet.id, range))}
				/>
			</div>
		);
	}

	const chosen = params.getAll(facet.id);
	const visible =
		expanded || facet.options.length <= VISIBLE_OPTIONS + 2
			? facet.options
			: facet.options.filter(
					(o, i) => i < VISIBLE_OPTIONS || chosen.includes(o.value),
				);
	return (
		<div className={styles.facet}>
			{header}
			{facet.hint && <p className={styles.facetHint}>{facet.hint}</p>}
			<div role="group" aria-label={facet.label}>
				{visible.map((option) => {
					const checked = chosen.includes(option.value);
					return (
						<Checkbox
							key={option.value}
							label={option.label}
							count={option.count}
							checked={checked}
							disabled={option.count === 0 && !checked}
							onCheckedChange={() =>
								navigate(toggleOption(params, facet.id, option.value))
							}
						/>
					);
				})}
			</div>
			{visible.length < facet.options.length || expanded ? (
				<button
					type="button"
					className={styles.textButton}
					onClick={() => setExpanded((e) => !e)}
				>
					{expanded ? "Show fewer" : `Show all ${facet.options.length}`}
				</button>
			) : null}
		</div>
	);
}

function PricePresets({
	bounds,
	selected,
	onSelect,
}: {
	bounds: { min: number; max: number };
	selected: Range | null;
	onSelect: (range: Range | null) => void;
}) {
	// Only budgets that overlap the catalogue's prices are worth offering.
	const presets = PRICE_PRESETS.filter(
		(p) => (p.min ?? 0) < bounds.max && (p.max ?? Infinity) > bounds.min,
	);
	return (
		<div className={styles.presets} role="group" aria-label="Budget">
			{presets.map((preset) => {
				const on =
					(selected?.min ?? null) === preset.min &&
					(selected?.max ?? null) === preset.max;
				return (
					<button
						key={presetLabel(preset)}
						type="button"
						className={styles.preset}
						aria-pressed={on}
						aria-label={presetLabel(preset)}
						onClick={() => onSelect(on ? null : preset)}
					>
						{presetShortLabel(preset)}
					</button>
				);
			})}
		</div>
	);
}
