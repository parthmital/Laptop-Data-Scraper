import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { SearchParamsRecord } from "@/catalogue/filters";
import { pageList, toHref, withPage } from "@/catalogue/url-state";

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
	const href = (p: number) => toHref(withPage(params, p));
	return (
		<nav className={styles.pagination} aria-label="Pages">
			{page > 1 ? (
				<Link className={styles.pageLink} href={href(page - 1)} rel="prev">
					<ChevronLeft size={16} aria-hidden /> Previous
				</Link>
			) : (
				<span />
			)}
			<ol className={styles.pageNumbers}>
				{pageList(page, pageCount).map((p, i) =>
					p == null ? (
						<li key={`gap${i}`} className={styles.pageGap} aria-hidden>
							…
						</li>
					) : (
						<li key={p}>
							<Link
								className={styles.pageNumber}
								href={href(p)}
								aria-label={`Page ${p}`}
								aria-current={p === page ? "page" : undefined}
							>
								{p}
							</Link>
						</li>
					),
				)}
			</ol>
			{page < pageCount ? (
				<Link className={styles.pageLink} href={href(page + 1)} rel="next">
					Next <ChevronRight size={16} aria-hidden />
				</Link>
			) : (
				<span />
			)}
		</nav>
	);
}
