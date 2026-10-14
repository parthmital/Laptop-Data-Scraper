"use client";

import { PARAM } from "@/catalogue/filters";
import { clearFilters, setFlag, setParam } from "@/catalogue/url-state";

import { useFilterNavigation } from "./FilterNavigation";
import styles from "./browse.module.css";

const NOT_FILTERS: string[] = [
	PARAM.query,
	PARAM.sort,
	PARAM.page,
	PARAM.unstated,
];

/** Says what found nothing (the search, the filters or both) and offers the fix for that case. */
export function EmptyResults() {
	const { params, navigate } = useFilterNavigation();
	const query = params.get(PARAM.query);
	const filtered = [...params.keys()].some((k) => !NOT_FILTERS.includes(k));
	const unstatedOff = params.get(PARAM.unstated) !== "1";

	if (query && !filtered)
		return (
			<div className={styles.empty}>
				<p className={styles.emptyTitle}>No laptops match “{query}”</p>
				<p className={styles.emptyText}>
					Check the spelling, or search by brand, model, processor or graphics.
				</p>
				<div className={styles.emptyActions}>
					<button
						type="button"
						className="button-primary"
						onClick={() => navigate(setParam(params, PARAM.query, null))}
					>
						Clear search
					</button>
				</div>
			</div>
		);

	return (
		<div className={styles.empty}>
			<p className={styles.emptyTitle}>No laptops match these filters</p>
			<p className={styles.emptyText}>
				{unstatedOff
					? "Remove a filter, or include laptops whose listings don't state the specs you filtered on."
					: "Remove a filter to see more laptops."}
			</p>
			<div className={styles.emptyActions}>
				{unstatedOff && (
					<button
						type="button"
						className={styles.secondaryButton}
						onClick={() => navigate(setFlag(params, PARAM.unstated, true))}
					>
						Include laptops with missing specs
					</button>
				)}
				<button
					type="button"
					className="button-primary"
					onClick={() => navigate(clearFilters(params))}
				>
					Clear all filters
				</button>
			</div>
		</div>
	);
}
