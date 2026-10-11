"use client";

import { Check, ChevronDown } from "lucide-react";
import { Select as RadixSelect } from "radix-ui";

import styles from "./ui.module.css";

interface Props {
	label: string;
	value: string;
	options: readonly { id: string; label: string }[];
	onValueChange: (value: string) => void;
}

export function Select({ label, value, options, onValueChange }: Props) {
	return (
		<RadixSelect.Root value={value} onValueChange={onValueChange}>
			<RadixSelect.Trigger className={styles.selectTrigger} aria-label={label}>
				<span className={styles.selectLabel}>{label}</span>
				<RadixSelect.Value />
				<RadixSelect.Icon className={styles.selectIcon}>
					<ChevronDown size={16} aria-hidden />
				</RadixSelect.Icon>
			</RadixSelect.Trigger>
			<RadixSelect.Portal>
				<RadixSelect.Content
					className={styles.selectContent}
					position="popper"
					sideOffset={6}
					align="end"
				>
					<RadixSelect.Viewport className={styles.selectViewport}>
						{options.map((o) => (
							<RadixSelect.Item
								key={o.id}
								value={o.id}
								className={styles.selectItem}
							>
								<RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
								<RadixSelect.ItemIndicator className={styles.selectCheck}>
									<Check size={14} aria-hidden />
								</RadixSelect.ItemIndicator>
							</RadixSelect.Item>
						))}
					</RadixSelect.Viewport>
				</RadixSelect.Content>
			</RadixSelect.Portal>
		</RadixSelect.Root>
	);
}
