"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { Dialog } from "radix-ui";

import type { Facet } from "@/catalogue/filters";

import { useFilterNavigation } from "./FilterNavigation";
import { FilterPanel } from "./FilterPanel";
import styles from "./browse.module.css";

/** The filter panel for narrow screens, where it does not fit beside the results. */
export function FilterDrawer({
	facets,
	catalogueSize,
	total,
}: {
	facets: Facet[];
	catalogueSize: number;
	total: number;
}) {
	const { params, pending } = useFilterNavigation();
	const active = facets.filter((f) => params.has(f.id)).length;
	return (
		<Dialog.Root>
			<Dialog.Trigger className={styles.drawerTrigger}>
				<SlidersHorizontal size={16} aria-hidden />
				Filters
				{active > 0 && <span className={styles.activeDot}>{active}</span>}
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className={styles.overlay} />
				<Dialog.Content className={styles.drawer} aria-describedby={undefined}>
					<div className={styles.drawerHead}>
						<Dialog.Title className={styles.panelTitle}>Filters</Dialog.Title>
						<Dialog.Close
							className={styles.iconButton}
							aria-label="Close filters"
						>
							<X size={18} aria-hidden />
						</Dialog.Close>
					</div>
					<div className={styles.drawerBody}>
						<FilterPanel facets={facets} catalogueSize={catalogueSize} />
					</div>
					<div className={styles.drawerFoot}>
						<Dialog.Close className={`button-primary ${styles.drawerAction}`}>
							{pending
								? "Updating…"
								: `Show ${total} ${total === 1 ? "laptop" : "laptops"}`}
						</Dialog.Close>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
