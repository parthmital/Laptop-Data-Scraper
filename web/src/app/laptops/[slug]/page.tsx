import { ChevronLeft, ExternalLink, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatInr } from "@/catalogue/format";
import { SPEC_KEYS } from "@/catalogue/specs";
import { keySpecs } from "@/catalogue/summary";
import { Gallery } from "@/components/laptop/Gallery";
import { OffersTable } from "@/components/laptop/OffersTable";
import { PriceNote } from "@/components/laptop/PriceNote";
import { SpecSheet } from "@/components/laptop/SpecSheet";
import styles from "@/components/laptop/laptop.module.css";
import { getLaptop } from "@/data/catalogue";

interface Props {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const laptop = getLaptop((await params).slug);
	return { title: laptop?.name ?? "Laptop not found" };
}

const RELATION_TEXT: Record<string, string> = {
	same_model_number_incompatible_specs:
		"Same model number, but the stores list different specs",
	same_config_no_model_number: "Same specs, but no model number to confirm it",
};

export default async function LaptopPage({ params }: Props) {
	const laptop = getLaptop((await params).slug);
	if (!laptop) notFound();
	const { price, specs } = laptop;
	const stated = SPEC_KEYS.filter((k) => specs[k] != null).length;
	// Model and part numbers often already end the name; repeating them adds nothing.
	const codes = [specs.model_number, specs.part_number]
		.filter(
			(c): c is string =>
				typeof c === "string" &&
				c !== "" &&
				!laptop.name.toLowerCase().includes(c.toLowerCase()),
		)
		.join(" · ");
	const summary = keySpecs(laptop, true);

	const storeLink = price && price.kind !== "last_seen" ? price : null;

	return (
		<main className={styles.page}>
			<Link href="/" className={styles.back}>
				<ChevronLeft size={18} aria-hidden /> All laptops
			</Link>
			<div className={styles.top}>
				<Gallery images={laptop.images} name={laptop.name} />
				<div className={styles.summary}>
					<h1 className={styles.title}>{laptop.name}</h1>
					{codes && <p className={`${styles.codes} mono`}>{codes}</p>}

					<div className={styles.priceBox}>
						{price ? (
							<>
								<div className={styles.priceText}>
									<p
										className={styles.bigPrice}
										data-muted={price.kind === "last_seen" || undefined}
									>
										{formatInr(price.amountInr)}
									</p>
									{price.discountPct != null && price.mrpInr != null && (
										<p className={styles.offerMrp}>
											MRP <s>{formatInr(price.mrpInr)}</s>{" "}
											<span className={styles.off}>
												{price.discountPct}% off
											</span>
										</p>
									)}
									<PriceNote
										price={price}
										stores={new Set(laptop.offers.map((o) => o.site)).size}
									/>
								</div>
								{storeLink && (
									<a
										className="button-primary"
										href={storeLink.url}
										target="_blank"
										rel="noopener noreferrer nofollow"
									>
										View at {storeLink.storeName}
										<ExternalLink size={16} aria-hidden />
										<span className="visually-hidden">
											(opens in a new tab)
										</span>
									</a>
								)}
							</>
						) : (
							<p className={styles.offerMeta}>
								No store lists a price for this laptop.
							</p>
						)}
					</div>

					{summary.length > 0 && (
						<dl className={styles.keySpecs} aria-label="Key specs">
							{summary.map((spec) => (
								<div key={spec.label}>
									<dt>{spec.label}</dt>
									<dd>{spec.value}</dd>
								</div>
							))}
						</dl>
					)}

					{!laptop.powerLimitsKnown &&
						(specs.gpu_type === "dedicated" ||
							laptop.derived.gpuKind === "dedicated") && (
							<p className={styles.notice}>
								<Info size={16} aria-hidden />
								<span>
									No store states this laptop&apos;s processor or graphics power
									limits. Two laptops with the same GPU can differ a lot in
									speed, so check the manufacturer&apos;s spec sheet.
								</span>
							</p>
						)}
				</div>
			</div>

			<section className={styles.section} aria-labelledby="offers">
				<div>
					<h2 id="offers" className={styles.sectionTitle}>
						Where to buy
					</h2>
					<p className={styles.sectionMeta}>
						{laptop.offers.length === 1
							? "Listed at 1 store."
							: `Listed at ${laptop.offers.length} stores.`}{" "}
						Confirm the price on the store&apos;s page before you buy.
					</p>
				</div>
				<OffersTable
					offers={laptop.offers}
					bestListingId={price?.kind === "compared" ? price.listingId : null}
				/>
				{laptop.reviewNotes.map((note) => (
					<div
						key={`${note.otherSlug}${note.relation}`}
						className={styles.notice}
					>
						<Info size={16} aria-hidden />
						<div>
							<p>
								{RELATION_TEXT[note.relation] ?? "Possibly the same laptop"}:{" "}
								{note.otherSlug ? (
									<Link href={`/laptops/${note.otherSlug}`}>
										{note.otherName}
									</Link>
								) : (
									note.otherName
								)}
								. Prices are not combined until the match is confirmed.
							</p>
							{note.reasons.length > 0 && (
								<ul className={`${styles.reasons} mono`}>
									{note.reasons.map((r) => (
										<li key={r}>{r}</li>
									))}
								</ul>
							)}
						</div>
					</div>
				))}
			</section>

			<section className={styles.section} aria-labelledby="specs">
				<SpecSheet laptop={laptop} stated={stated} total={SPEC_KEYS.length} />
			</section>
		</main>
	);
}
