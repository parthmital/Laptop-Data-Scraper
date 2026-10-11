import { formatAge } from "@/catalogue/format";
import type { PriceSummary } from "@/catalogue/types";

import styles from "./PriceNote.module.css";

/** Says where the headline price comes from and how much to trust it. */
export function PriceNote({ price }: { price: PriceSummary }) {
	const age = formatAge(price.lastVerifiedAt);
	if (price.kind === "compared") {
		return (
			<p className={styles.note}>
				<span className={styles.good}>Best price</span> at {price.storeName},
				checked {age}
			</p>
		);
	}
	if (price.kind === "in_stock") {
		return (
			<p className={styles.note}>
				In stock at {price.storeName}, checked {age}. Not compared: the match to
				other stores is unconfirmed.
			</p>
		);
	}
	return (
		<p className={styles.note}>
			<span className={styles.warn}>
				{price.freshness === "stale"
					? "Price may be out of date"
					: "Out of stock"}
			</span>{" "}
			· last seen at {price.storeName} {age}
		</p>
	);
}
