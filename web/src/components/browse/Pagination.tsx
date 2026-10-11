import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { SearchParamsRecord } from "@/catalogue/filters";
import { toHref, withPage } from "@/catalogue/url-state";

import styles from "./browse.module.css";

function toParams(record: SearchParamsRecord): URLSearchParams {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(record)) {
		for (const v of Array.isArray(value) ? value : value != null ? [value] : [])
			params.append(key, v);
	}
	return params;
}

export function Pagination({
	page,
	pageCount,
	searchParams,
}: {
	page: number;
	pageCount: number;
	searchParams: SearchParamsRecord;
}) {
	if (pageCount <= 1) return null;
	const params = toParams(searchParams);
	return (
		<nav className={styles.pagination} aria-label="Pages">
			{page > 1 ? (
				<Link
					className={styles.pageLink}
					href={toHref(withPage(params, page - 1))}
					rel="prev"
				>
					<ChevronLeft size={16} aria-hidden /> Previous
				</Link>
			) : (
				<span />
			)}
			<span className={styles.pageInfo}>
				Page {page} of {pageCount}
			</span>
			{page < pageCount ? (
				<Link
					className={styles.pageLink}
					href={toHref(withPage(params, page + 1))}
					rel="next"
				>
					Next <ChevronRight size={16} aria-hidden />
				</Link>
			) : (
				<span />
			)}
		</nav>
	);
}
