"use client";

import { Slider } from "radix-ui";
import { useState } from "react";

import type { Range } from "@/catalogue/filters";
import { formatRangeValue } from "@/catalogue/format";

import styles from "./ui.module.css";

interface Props {
	label: string;
	bounds: { min: number; max: number };
	step: number;
	unit?: string;
	money?: boolean;
	selected: Range | null;
	onCommit: (range: Range | null) => void;
}

const decimals = (step: number) => (String(step).split(".")[1] ?? "").length;

/** Two-thumb slider with typed bounds. Remount it (key) when the committed selection changes. */
export function RangeField({
	label,
	bounds,
	step,
	unit,
	money,
	selected,
	onCommit,
}: Props) {
	const [value, setValue] = useState<[number, number]>([
		selected?.min ?? bounds.min,
		selected?.max ?? bounds.max,
	]);
	const [drafts, setDrafts] = useState<[string, string] | null>(null);
	const single = bounds.min === bounds.max;

	const commit = ([lo, hi]: [number, number]) => {
		const min = Math.max(bounds.min, Math.min(lo, hi));
		const max = Math.min(bounds.max, Math.max(lo, hi));
		setValue([min, max]);
		onCommit({
			min: min > bounds.min ? min : null,
			max: max < bounds.max ? max : null,
		});
	};

	const commitDraft = () => {
		if (!drafts) return;
		const parse = (s: string, fallback: number) => {
			const n = Number(s.replace(/[^\d.]/g, ""));
			return s.trim() && Number.isFinite(n)
				? Number(n.toFixed(decimals(step)))
				: fallback;
		};
		setDrafts(null);
		commit([parse(drafts[0], bounds.min), parse(drafts[1], bounds.max)]);
	};

	const shown = drafts ?? [String(value[0]), String(value[1])];
	const affix = money ? "₹" : unit;

	return (
		<div className={styles.range}>
			{!single && (
				<Slider.Root
					className={styles.slider}
					min={bounds.min}
					max={bounds.max}
					step={step}
					value={value}
					minStepsBetweenThumbs={0}
					onValueChange={(v) => setValue([v[0]!, v[1]!])}
					onValueCommit={(v) => commit([v[0]!, v[1]!])}
				>
					<Slider.Track className={styles.track}>
						<Slider.Range className={styles.trackFill} />
					</Slider.Track>
					<Slider.Thumb
						className={styles.sliderThumb}
						aria-label={`Minimum ${label.toLowerCase()}`}
					/>
					<Slider.Thumb
						className={styles.sliderThumb}
						aria-label={`Maximum ${label.toLowerCase()}`}
					/>
				</Slider.Root>
			)}
			<div className={styles.rangeInputs}>
				{(["Min", "Max"] as const).map((side, i) => (
					<label key={side} className={styles.numberField}>
						<span className="visually-hidden">
							{side === "Min" ? "Minimum" : "Maximum"} {label.toLowerCase()}
						</span>
						{money && <span className={styles.affix}>{affix}</span>}
						<input
							className="mono"
							inputMode="decimal"
							autoComplete="off"
							value={shown[i]}
							onFocus={() => setDrafts([String(value[0]), String(value[1])])}
							onChange={(e) => {
								const next: [string, string] = [...shown] as [string, string];
								next[i] = e.target.value;
								setDrafts(next);
							}}
							onBlur={commitDraft}
							onKeyDown={(e) => {
								if (e.key === "Enter") commitDraft();
							}}
						/>
						{!money && unit && <span className={styles.affix}>{unit}</span>}
					</label>
				))}
			</div>
			<p className={styles.hint}>
				{formatRangeValue(bounds.min, { unit, money })} to{" "}
				{formatRangeValue(bounds.max, { unit, money })} in the catalogue
			</p>
		</div>
	);
}
