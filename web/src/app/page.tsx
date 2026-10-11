import {
	browse,
	parseState,
	type SearchParamsRecord,
} from "@/catalogue/filters";
import { ActiveFilters } from "@/components/browse/ActiveFilters";
import { EmptyResults } from "@/components/browse/EmptyResults";
import { FilterDrawer } from "@/components/browse/FilterDrawer";
import { FilterNavigation } from "@/components/browse/FilterNavigation";
import { FilterPanel } from "@/components/browse/FilterPanel";
import { LaptopRow } from "@/components/browse/LaptopRow";
import { Pagination } from "@/components/browse/Pagination";
import { SearchBox } from "@/components/browse/SearchBox";
import { SortMenu } from "@/components/browse/SortMenu";
import styles from "@/components/browse/browse.module.css";
import { getCatalogue } from "@/data/catalogue";

export default async function BrowsePage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const params = await searchParams;
	const { laptops } = getCatalogue();
	const result = browse(laptops, parseState(params));
	const filtered = result.total !== result.catalogueSize;

	const stores = new Set(laptops.flatMap((l) => l.offers.map((o) => o.site)))
		.size;

	return (
		<FilterNavigation>
			<div className={styles.layout}>
				<aside className={styles.sidebar} aria-label="Filters">
					<FilterPanel
						facets={result.facets}
						catalogueSize={result.catalogueSize}
					/>
				</aside>
				<main className={styles.results}>
					<h1 className={styles.heading}>Laptops</h1>
					<div className={styles.searchRow}>
						<SearchBox />
						<span className={styles.mobileOnly}>
							<FilterDrawer
								facets={result.facets}
								catalogueSize={result.catalogueSize}
								total={result.total}
							/>
						</span>
					</div>
					<div className={styles.toolbar}>
						<p className={styles.countLine} role="status">
							{filtered
								? `${result.total} of ${result.catalogueSize} laptops match`
								: `${result.catalogueSize} laptops from ${stores} stores`}
						</p>
						<SortMenu />
					</div>
					<ActiveFilters facets={result.facets} />
					{result.laptops.length ? (
						<div className={styles.list}>
							{result.laptops.map((laptop, i) => (
								<LaptopRow key={laptop.key} laptop={laptop} index={i} />
							))}
						</div>
					) : (
						<EmptyResults />
					)}
					<Pagination
						page={result.page}
						pageCount={result.pageCount}
						searchParams={params}
					/>
				</main>
			</div>
		</FilterNavigation>
	);
}
