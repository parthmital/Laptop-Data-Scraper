// Purpose: build a synthetic, larger copy of the pipeline database to load-test the web app at a bigger catalogue size.
// Inputs:  source SQLite path, output SQLite path, multiplier (copies of every product, listing and price row).
// Outputs: the output database; prints product and listing counts. The source is never modified.
// Run:     node scripts/scale-catalogue-db.mjs outputs/db/laptops.sqlite /tmp/laptops_x30.sqlite 30

import { copyFileSync, rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const [source, target, times = "30"] = process.argv.slice(2);
if (!source || !target) {
	console.error("usage: scale-catalogue-db.mjs <source> <target> [multiplier]");
	process.exit(2);
}

rmSync(target, { force: true });
copyFileSync(source, target);
const db = new DatabaseSync(target);

// Columns rewritten per copy so every copy gets new keys but keeps its specs, offers and prices.
const rewrites = {
	canonical_products: { product_key: "key", display_name: "name" },
	product_specs: { product_key: "key" },
	seller_listings: { listing_id: "key", product_key: "key" },
	price_history: { listing_id: "key" },
};

db.exec("BEGIN");
for (let copy = 1; copy < Number(times); copy++) {
	for (const [table, rewrite] of Object.entries(rewrites)) {
		const columns = db
			.prepare(`PRAGMA table_info(${table})`)
			.all()
			.map((c) => c.name);
		const select = columns.map((c) =>
			rewrite[c] === "key"
				? `${c} || '~copy${copy}'`
				: rewrite[c] === "name"
					? `${c} || ' (copy ${copy})'`
					: c,
		);
		db.exec(
			`INSERT INTO ${table} (${columns.join(", ")}) SELECT ${select.join(", ")} FROM ${table} WHERE ${columns[0]} NOT LIKE '%~copy%'`,
		);
	}
}
db.exec("COMMIT");

const count = (table) =>
	db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
console.log(
	JSON.stringify({
		target,
		products: count("canonical_products"),
		listings: count("seller_listings"),
	}),
);
db.close();
