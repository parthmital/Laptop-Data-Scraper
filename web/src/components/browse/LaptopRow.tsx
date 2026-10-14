import { ChevronRight, Laptop as LaptopIcon } from "lucide-react";
import Link from "next/link";

import { formatInr } from "@/catalogue/format";
import { keySpecs } from "@/catalogue/summary";
import type { Laptop, PriceSummary } from "@/catalogue/types";

import styles from "./browse.module.css";

function tags(l: Laptop): string[] {
	const s = l.specs;
	return [
		typeof s.gpu_tgp_w === "number" ? `${s.gpu_tgp_w} W TGP` : null,
		typeof s.cpu_tdp_w === "number" ? `${s.cpu_tdp_w} W CPU` : null,
		s.wifi_standard as string | null,
		s.touchscreen === true ? "Touchscreen" : null,
		s.ms_office === true ? "Office included" : null,
		l.derived.ramUpgradeable ? "Upgradable RAM" : null,
		l.offers.some((o) => o.condition === "display_unit")
			? "Store display unit"
			: null,
	].filter((x): x is string => Boolean(x));
}

/** One line on where the price comes from; the laptop page carries the full explanation and check dates. */
function PriceSource({
	price,
	stores,
}: {
	price: PriceSummary;
	stores: number;
}) {
	if (price.kind === "last_seen")
		return (
			<p className={styles.priceSource}>
				<span className={styles.warn}>
					{price.freshness === "stale"
						? "Price may be out of date"
						: "Out of stock"}
				</span>
				<br />
				last seen at {price.storeName}
			</p>
		);
	return (
		<p className={styles.priceSource}>
			{price.kind === "compared" && stores > 1 && (
				<>
					<span className={styles.good}>Lowest of {stores} stores</span>
					<br />
				</>
			)}
			at {price.storeName}
		</p>
	);
}

/** Rows fade in with a short stagger; capped so a full page never waits long. */
const STAGGER_LIMIT = 8;

export function LaptopRow({
	laptop,
	index,
}: {
	laptop: Laptop;
	index: number;
}) {
	const { price } = laptop;
	const stores = new Set(laptop.offers.map((o) => o.site)).size;
	const specs = keySpecs(laptop);
	const rowTags = tags(laptop);
	return (
		<article
			className={styles.row}
			style={{ "--i": Math.min(index, STAGGER_LIMIT) } as React.CSSProperties}
		>
			<div className={styles.thumb}>
				{laptop.images[0] ? (
					<img
						src={laptop.images[0]}
						alt=""
						loading="lazy"
						decoding="async"
						referrerPolicy="no-referrer"
					/>
				) : (
					<LaptopIcon size={32} strokeWidth={1.25} aria-hidden />
				)}
			</div>
			<h2 className={styles.rowTitle}>
				<Link href={`/laptops/${laptop.slug}`} className={styles.rowLink}>
					{laptop.name}
				</Link>
			</h2>
			<div className={styles.rowMain}>
				{specs.length > 0 && (
					<dl className={styles.keySpecs}>
						{specs.map((s) => (
							<div key={s.label}>
								<dt>{s.label}</dt>
								<dd>{s.value}</dd>
							</div>
						))}
					</dl>
				)}
				{rowTags.length > 0 && (
					<ul className={styles.tags} aria-label="Highlights">
						{rowTags.map((t) => (
							<li key={t}>{t}</li>
						))}
					</ul>
				)}
			</div>
			<div className={styles.rowPrice}>
				{price ? (
					<>
						<p
							className={styles.price}
							data-muted={price.kind === "last_seen" || undefined}
						>
							{formatInr(price.amountInr)}
						</p>
						{price.discountPct != null && price.mrpInr != null && (
							<p className={styles.mrp}>
								<s>
									<span className="visually-hidden">MRP </span>
									{formatInr(price.mrpInr)}
								</s>{" "}
								<span className={styles.off}>{price.discountPct}% off</span>
							</p>
						)}
						<PriceSource price={price} stores={stores} />
					</>
				) : (
					<p className={styles.noPrice}>No price listed</p>
				)}
				<span className={styles.rowMore} aria-hidden>
					{stores > 1 ? `Compare ${stores} stores` : "View details"}
					<ChevronRight size={16} />
				</span>
			</div>
		</article>
	);
}
