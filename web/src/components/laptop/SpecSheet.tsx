import { describeOrigin, formatSpec } from "@/catalogue/format";
import { SPEC_GROUPS, SPEC_META } from "@/catalogue/specs";
import type { Laptop } from "@/catalogue/types";

import { SpecFilter } from "./SpecFilter";
import styles from "./laptop.module.css";

/** Every canonical field with where its value came from; fields no store states are one switch away. */
export function SpecSheet({
	laptop,
	stated,
	total,
}: {
	laptop: Laptop;
	stated: number;
	total: number;
}) {
	const storeOf = new Map(laptop.offers.map((o) => [o.listingId, o.storeName]));
	return (
		<SpecFilter stated={stated} total={total}>
			{SPEC_GROUPS.map((group) => {
				const groupStated = group.fields.filter(
					(f) => laptop.specs[f] != null,
				).length;
				return (
					<section
						key={group.id}
						className={styles.specGroup}
						aria-labelledby={`spec-${group.id}`}
						data-empty={groupStated === 0 || undefined}
					>
						<div className={styles.specGroupHead}>
							<h3 id={`spec-${group.id}`}>{group.label}</h3>
							<span>
								{groupStated} of {group.fields.length} stated
							</span>
						</div>
						<dl>
							{group.fields.map((field) => {
								const value = formatSpec(field, laptop.specs[field]);
								const sources = laptop.sources[field] ?? [];
								return (
									<div
										key={field}
										className={styles.specRow}
										data-unstated={value == null || undefined}
									>
										<dt>{SPEC_META[field].label}</dt>
										<dd>
											<span className={styles.specValue}>
												{value ?? "Not stated"}
											</span>
											{value != null &&
												sources.map((s) => (
													<span
														key={`${s.listingId}${s.origin}`}
														className={styles.source}
													>
														{describeOrigin(s.origin)}
														{storeOf.has(s.listingId)
															? ` · ${storeOf.get(s.listingId)}`
															: ""}
													</span>
												))}
										</dd>
									</div>
								);
							})}
						</dl>
					</section>
				);
			})}
		</SpecFilter>
	);
}
