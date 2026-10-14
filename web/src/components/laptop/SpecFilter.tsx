"use client";

import { useState } from "react";

import { Switch } from "@/components/ui/Switch";

import styles from "./laptop.module.css";

/** Section head for the spec sheet with the switch that reveals fields no store states. */
export function SpecFilter({
	stated,
	total,
	children,
}: {
	stated: number;
	total: number;
	children: React.ReactNode;
}) {
	const [showAll, setShowAll] = useState(false);
	return (
		<>
			<div className={styles.sectionHead}>
				<div>
					<h2 id="specs" className={styles.sectionTitle}>
						Specifications
					</h2>
					<p className={styles.sectionMeta}>
						The stores state {stated} of {total} specs for this laptop.
					</p>
				</div>
				{stated < total && (
					<div className={styles.specSwitch}>
						<Switch
							label={`Show ${total - stated} missing specs`}
							checked={showAll}
							onCheckedChange={setShowAll}
						/>
					</div>
				)}
			</div>
			<div className={styles.specGroups} data-all={showAll || undefined}>
				{children}
			</div>
		</>
	);
}
