"use client";

import { PARAM } from "@/catalogue/filters";
import { clearFilters, setFlag } from "@/catalogue/url-state";

import { useFilterNavigation } from "./FilterNavigation";
import styles from "./browse.module.css";

export function EmptyResults() {
	const { params, navigate } = useFilterNavigation();
	const unstatedOff = params.get(PARAM.unstated) !== "1";
	return (
		<div className={styles.empty}>
			<p className={styles.emptyTitle}>No laptops match these filters</p>
			<p className={styles.emptyText}>
				Remove a filter, or include laptops whose listings don&apos;t state the
				specs you filtered on.
			</p>
			<div className={styles.emptyActions}>
				{unstatedOff && (
					<button
						type="button"
						className={styles.chip}
						onClick={() => navigate(setFlag(params, PARAM.unstated, true))}
					>
						Include unstated specs
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
