"use client";

import { Check } from "lucide-react";
import { Checkbox as RadixCheckbox } from "radix-ui";
import { useId } from "react";

import styles from "./ui.module.css";

interface Props {
	label: string;
	count?: number;
	checked: boolean;
	disabled?: boolean;
	onCheckedChange: (checked: boolean) => void;
}

export function Checkbox({
	label,
	count,
	checked,
	disabled,
	onCheckedChange,
}: Props) {
	const id = useId();
	return (
		<div className={styles.choice} data-disabled={disabled || undefined}>
			<RadixCheckbox.Root
				id={id}
				className={styles.box}
				checked={checked}
				disabled={disabled}
				onCheckedChange={(v) => onCheckedChange(v === true)}
			>
				<RadixCheckbox.Indicator className={styles.tick}>
					<Check size={13} strokeWidth={3} aria-hidden />
				</RadixCheckbox.Indicator>
			</RadixCheckbox.Root>
			<label htmlFor={id} className={styles.choiceLabel}>
				{label}
			</label>
			{count != null && <span className={styles.count}>{count}</span>}
		</div>
	);
}
