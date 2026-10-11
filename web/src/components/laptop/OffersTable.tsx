import { ExternalLink } from "lucide-react";

import { formatAge, formatInr } from "@/catalogue/format";
import { discountPct, isBuyable } from "@/catalogue/pricing";
import type { Offer } from "@/catalogue/types";

import styles from "./laptop.module.css";

function status(offer: Offer): {
	label: string;
	tone: "good" | "warn" | "muted";
} {
	if (offer.freshness === "delisted")
		return { label: "No longer listed", tone: "muted" };
	if (offer.freshness === "stale")
		return { label: "Not checked recently", tone: "warn" };
	if (offer.availability === "in_stock")
		return { label: "In stock", tone: "good" };
	if (offer.availability === "out_of_stock")
		return { label: "Out of stock", tone: "warn" };
	return { label: "Stock not shown", tone: "muted" };
}

export function OffersTable({
	offers,
	bestListingId,
}: {
	offers: Offer[];
	bestListingId: string | null;
}) {
	return (
		<ul className={styles.offers}>
			{offers.map((offer) => {
				const s = status(offer);
				const off = discountPct(offer.priceInr, offer.mrpInr);
				const best =
					offers.length > 1 &&
					offer.listingId === bestListingId &&
					isBuyable(offer);
				return (
					<li
						key={offer.listingId}
						className={styles.offer}
						data-best={best || undefined}
					>
						<div className={styles.offerStore}>
							<p className={styles.offerName}>
								{offer.storeName}
								{best && <span className={styles.bestTag}>Lowest</span>}
							</p>
							<p className={styles.offerMeta}>
								{offer.sellerName && offer.sellerName !== offer.storeName
									? `Sold by ${offer.sellerName} · `
									: ""}
								{offer.condition === "display_unit"
									? "Store display unit · "
									: ""}
								Checked {formatAge(offer.lastVerifiedAt)}
							</p>
						</div>
						<p className={styles.offerStatus} data-tone={s.tone}>
							{s.label}
						</p>
						<div className={styles.offerPrice}>
							<p className={styles.offerAmount}>
								{offer.priceInr != null
									? formatInr(offer.priceInr)
									: "No price"}
							</p>
							{off != null && offer.mrpInr != null && (
								<p className={styles.offerMrp}>
									<s>{formatInr(offer.mrpInr)}</s>{" "}
									<span className={styles.off}>{off}% off</span>
								</p>
							)}
						</div>
						<a
							className={best ? styles.storeButtonPrimary : styles.storeButton}
							href={offer.url}
							target="_blank"
							rel="noopener noreferrer nofollow"
						>
							View at {offer.storeName}
							<ExternalLink size={14} aria-hidden />
							<span className="visually-hidden">(opens in a new tab)</span>
						</a>
					</li>
				);
			})}
		</ul>
	);
}
