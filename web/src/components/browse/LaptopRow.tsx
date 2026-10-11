import { Laptop as LaptopIcon } from "lucide-react";
import Link from "next/link";

import { formatInr, formatNumber, formatStorage } from "@/catalogue/format";
import type { Laptop } from "@/catalogue/types";
import { PriceNote } from "@/components/laptop/PriceNote";

import styles from "./browse.module.css";

function specLine(l: Laptop): string[] {
	const s = l.specs;
	const n = (v: unknown) => (typeof v === "number" ? v : null);
	const ram = n(s.ram_gb);
	const storage = n(s.storage_gb);
	const vram = n(s.gpu_vram_gb);
	const size = n(s.display_size_in);
	const weight = n(s.weight_kg);
	return [
		(s.cpu_model as string | null) ?? l.derived.cpuFamily,
		ram != null ? `${ram} GB${s.ram_type ? ` ${s.ram_type}` : ""} RAM` : null,
		storage != null
			? `${formatStorage(storage)}${s.storage_type ? ` ${s.storage_type}` : ""}`
			: null,
		l.derived.gpu ? `${l.derived.gpu}${vram ? ` ${vram} GB` : ""}` : null,
		size != null
			? `${formatNumber(size)}″${s.display_resolution ? ` ${String(s.display_resolution).replace("x", "×")}` : ""}${
					s.display_refresh_hz ? ` ${s.display_refresh_hz} Hz` : ""
				}${s.display_panel ? ` ${s.display_panel}` : ""}`
			: null,
		weight != null ? `${formatNumber(weight)} kg` : null,
	].filter((x): x is string => Boolean(x));
}

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
	const href = `/laptops/${laptop.slug}`;
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
			<div className={styles.rowMain}>
				<h2 className={styles.rowTitle}>
					<Link href={href} className={styles.rowLink}>
						{laptop.name}
					</Link>
				</h2>
				<p className={styles.specLine}>{specLine(laptop).join(" · ")}</p>
				{rowTags.length > 0 && (
					<ul className={styles.tags}>
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
								<s>{formatInr(price.mrpInr)}</s>{" "}
								<span className={styles.off}>{price.discountPct}% off</span>
							</p>
						)}
						<PriceNote price={price} />
					</>
				) : (
					<p className={styles.noPrice}>No price listed</p>
				)}
				<p className={styles.storeCount}>
					{stores === 1 ? "1 store" : `Compared across ${stores} stores`}
				</p>
			</div>
		</article>
	);
}
