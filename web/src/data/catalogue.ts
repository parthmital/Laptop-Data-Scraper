import "server-only";

import { createHash } from "node:crypto";
import { statSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { derive, isLaptop } from "@/catalogue/normalise";
import { isBuyable, sortOffers, summarisePrice } from "@/catalogue/pricing";
import {
	BOOLEAN_SPECS,
	SPEC_KEYS,
	type SpecValue,
	type Specs,
} from "@/catalogue/specs";
import type {
	Availability,
	Catalogue,
	FieldSource,
	Freshness,
	Laptop,
	Offer,
	ReviewNote,
} from "@/catalogue/types";

/** Labels such as `fresh` depend on the current time, so a cached catalogue is rebuilt at least this often. */
const MAX_CACHE_AGE_MS = 5 * 60 * 1000;

export class CatalogueUnavailableError extends Error {}

export function databasePath(): string {
	// Runtime data, not a bundle input: keep the build from tracing the whole repository.
	return path.resolve(
		/*turbopackIgnore: true*/ process.cwd(),
		process.env.LAPTOP_DB_PATH || "../outputs/db/laptops.sqlite",
	);
}

type Row = Record<string, unknown>;

function parseJson<T>(value: unknown, fallback: T): T {
	if (typeof value !== "string" || !value) return fallback;
	try {
		return JSON.parse(value) as T;
	} catch {
		return fallback;
	}
}

const str = (v: unknown) => (typeof v === "string" && v !== "" ? v : null);
const num = (v: unknown) =>
	typeof v === "number" ? v : typeof v === "bigint" ? Number(v) : null;

function slugFor(key: string, name: string): string {
	const base = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 80);
	return `${base || "laptop"}-${createHash("sha1").update(key).digest("hex").slice(0, 6)}`;
}

function toOffer(row: Row): Offer {
	return {
		listingId: String(row.listing_id),
		site: String(row.site),
		storeName: str(row.store_name) ?? String(row.site),
		sellerName: str(row.seller_name),
		title: str(row.title),
		url: String(row.url),
		condition: str(row.condition),
		availability: (str(row.availability) ?? "unknown") as Availability,
		priceInr: num(row.price_inr),
		mrpInr: num(row.mrp_inr),
		lastVerifiedAt: String(row.last_verified_at),
		freshness: String(row.freshness) as Freshness,
		matchReason: str(row.match_reason),
	};
}

function toSpecs(row: Row): Specs {
	const specs = {} as Specs;
	for (const key of SPEC_KEYS) {
		const raw = row[key];
		const value: SpecValue =
			typeof raw === "bigint" ? Number(raw) : (raw as SpecValue);
		specs[key] = BOOLEAN_SPECS.has(key) && value != null ? value === 1 : value;
	}
	return specs;
}

function imagesFor(
	offers: Offer[],
	imagesByListing: Map<string, string[]>,
): string[] {
	const urls = offers.flatMap((o) => imagesByListing.get(o.listingId) ?? []);
	return [
		...new Set(
			urls.filter(
				(u) => /^https:\/\//.test(u) && !/youtube\.com|ytimg\.com/.test(u),
			),
		),
	].slice(0, 8);
}

function load(dbPath: string): Catalogue {
	const db = new DatabaseSync(dbPath, { readOnly: true });
	try {
		const all = (sql: string) => db.prepare(sql).all() as Row[];

		const stores = all(
			"SELECT site, base_url, seller_default FROM sites ORDER BY site",
		).map((r) => ({
			site: String(r.site),
			name: str(r.seller_default) ?? String(r.site),
			baseUrl: str(r.base_url),
		}));
		const run = all(
			"SELECT run_id, finished_at FROM scrape_runs WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 1",
		)[0];

		const offersByProduct = new Map<string, Offer[]>();
		const imagesByListing = new Map<string, string[]>();
		const productByListing = new Map<string, string>();
		for (const row of all(`
			SELECT o.listing_id, o.site, o.seller_name, o.url, o.condition, o.availability, o.price_inr, o.mrp_inr,
			       o.last_verified_at, o.freshness, o.product_key, l.title, l.image_urls_json, l.match_reason,
			       s.seller_default AS store_name
			FROM v_current_offers o
			JOIN seller_listings l USING (listing_id)
			LEFT JOIN sites s ON s.site = o.site
			WHERE o.product_key IS NOT NULL`)) {
			const key = String(row.product_key);
			const offer = toOffer(row);
			offersByProduct.set(key, [...(offersByProduct.get(key) ?? []), offer]);
			imagesByListing.set(
				offer.listingId,
				parseJson<string[]>(row.image_urls_json, []),
			);
			productByListing.set(offer.listingId, key);
		}

		const rows = all(`
			SELECT cp.product_key, cp.display_name, cp.match_status, cp.power_limits_known, ps.*,
			       lp.listing_id AS compared_listing_id
			FROM canonical_products cp
			JOIN product_specs ps USING (product_key)
			LEFT JOIN lowest_prices lp USING (product_key)`);

		const laptops: Laptop[] = [];
		let excludedNonLaptops = 0;
		for (const row of rows) {
			const specs = toSpecs(row);
			if (!isLaptop(specs)) {
				excludedNonLaptops++;
				continue;
			}
			const key = String(row.product_key);
			const name =
				str(row.display_name) ??
				[specs.brand, specs.series, specs.model_number]
					.filter(Boolean)
					.join(" ");
			const offers = sortOffers(offersByProduct.get(key) ?? []);
			const price = summarisePrice(offers, str(row.compared_listing_id));
			const rawSources = parseJson<
				Record<string, { listing_id: string; origin: string }[]>
			>(row.field_sources_json, {});
			const sources = Object.fromEntries(
				Object.entries(rawSources).map(([field, list]) => [
					field,
					list.map((s): FieldSource => ({
						listingId: s.listing_id,
						origin: s.origin,
					})),
				]),
			);
			// The headline offer's photos lead the gallery.
			const imageOrder = [
				...offers.filter((o) => o.listingId === price?.listingId),
				...offers.filter((o) => o.listingId !== price?.listingId),
			];
			laptops.push({
				key,
				slug: slugFor(key, name),
				name,
				matchStatus: str(row.match_status),
				powerLimitsKnown: num(row.power_limits_known) === 1,
				specs,
				sources,
				offers,
				price,
				inStock: offers.some(isBuyable),
				images: imagesFor(imageOrder, imagesByListing),
				derived: derive(specs),
				reviewNotes: [],
			});
		}

		const byKey = new Map(laptops.map((l) => [l.key, l]));
		for (const row of all(
			"SELECT listing_a, listing_b, relation, reasons_json FROM match_candidates WHERE status = 'needs_review'",
		)) {
			const a = byKey.get(productByListing.get(String(row.listing_a)) ?? "");
			const b = byKey.get(productByListing.get(String(row.listing_b)) ?? "");
			const reasons = parseJson<string[]>(row.reasons_json, []);
			for (const [self, other] of [
				[a, b],
				[b, a],
			]) {
				if (!self || !other || self === other) continue;
				const note: ReviewNote = {
					otherSlug: other.slug,
					otherName: other.name,
					relation: String(row.relation),
					reasons,
				};
				self.reviewNotes.push(note);
			}
		}

		return {
			laptops,
			meta: {
				runId: str(run?.run_id),
				runFinishedAt: str(run?.finished_at),
				stores,
				excludedNonLaptops,
			},
		};
	} finally {
		db.close();
	}
}

let cache: { stamp: string; loadedAt: number; catalogue: Catalogue } | null =
	null;

/** Reads the whole catalogue from the pipeline database, cached until the file changes or the cache ages out. */
export function getCatalogue(): Catalogue {
	const dbPath = databasePath();
	let stamp: string;
	try {
		const stat = statSync(dbPath);
		stamp = `${dbPath}:${stat.mtimeMs}:${stat.size}`;
	} catch {
		throw new CatalogueUnavailableError(
			`No database at ${dbPath}. Set LAPTOP_DB_PATH in web/.env.local.`,
		);
	}
	if (
		cache &&
		cache.stamp === stamp &&
		Date.now() - cache.loadedAt < MAX_CACHE_AGE_MS
	)
		return cache.catalogue;
	const catalogue = load(dbPath);
	cache = { stamp, loadedAt: Date.now(), catalogue };
	return catalogue;
}

export function getLaptop(slug: string): Laptop | undefined {
	return getCatalogue().laptops.find((l) => l.slug === slug);
}
