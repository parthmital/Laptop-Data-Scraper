"use client";

import { Switch as RadixSwitch } from "radix-ui";
import { useId } from "react";

import styles from "./ui.module.css";

interface Props {
	label: string;
	description?: string;
	count?: number;
	checked: boolean;
	disabled?: boolean;
	onCheckedChange: (checked: boolean) => void;
}

export function Switch({
	label,
	description,
	count,
	checked,
	disabled,
	onCheckedChange,
}: Props) {
	const id = useId();
	const descriptionId = useId();
	return (
		<div className={styles.switchRow} data-disabled={disabled || undefined}>
			<div className={styles.switchText}>
				<label htmlFor={id} className={styles.choiceLabel}>
					{label}
					{count != null && <span className={styles.count}>{count}</span>}
				</label>
				{description && (
					<p id={descriptionId} className={styles.hint}>
						{description}
					</p>
				)}
			</div>
			<RadixSwitch.Root
				id={id}
				className={styles.switch}
				checked={checked}
				disabled={disabled}
				onCheckedChange={onCheckedChange}
				aria-describedby={description ? descriptionId : undefined}
			>
				<RadixSwitch.Thumb className={styles.thumb} />
			</RadixSwitch.Root>
		</div>
	);
}
