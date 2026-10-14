"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PARAM } from "@/catalogue/filters";
import { setParam } from "@/catalogue/url-state";

import { useFilterNavigation } from "./FilterNavigation";
import styles from "./browse.module.css";

const DEBOUNCE_MS = 350;

export function SearchBox() {
	const { params, navigate } = useFilterNavigation();
	const committed = params.get(PARAM.query) ?? "";
	const [value, setValue] = useState(committed);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const input = useRef<HTMLInputElement>(null);
	// The debounced commit must use the URL state at the time it fires, not when typing started.
	const latest = useRef({ params, navigate });
	useEffect(() => {
		latest.current = { params, navigate };
	});

	// Follow outside changes such as "Clear all".
	const [lastCommitted, setLastCommitted] = useState(committed);
	if (committed !== lastCommitted) {
		setLastCommitted(committed);
		setValue(committed);
	}

	useEffect(() => () => clearTimeout(timer.current), []);

	const commit = (text: string) => {
		clearTimeout(timer.current);
		const { params: p, navigate: go } = latest.current;
		if (text.trim() !== (p.get(PARAM.query) ?? ""))
			go(setParam(p, PARAM.query, text.trim() || null));
	};

	return (
		<form
			role="search"
			noValidate
			className={styles.search}
			// The whole box looks like the field, so a click on its padding or icon focuses the input.
			onMouseDown={(e) => {
				if (e.target === e.currentTarget || e.target instanceof SVGElement) {
					e.preventDefault();
					input.current?.focus();
				}
			}}
			onSubmit={(e) => {
				e.preventDefault();
				commit(value);
			}}
		>
			<Search size={16} className={styles.searchIcon} aria-hidden />
			<label htmlFor="laptop-search" className="visually-hidden">
				Search laptops
			</label>
			<input
				ref={input}
				id="laptop-search"
				type="search"
				autoComplete="off"
				spellCheck={false}
				placeholder="Search laptops"
				value={value}
				onChange={(e) => {
					const text = e.target.value;
					setValue(text);
					clearTimeout(timer.current);
					timer.current = setTimeout(() => commit(text), DEBOUNCE_MS);
				}}
			/>
			{value && (
				<button
					type="button"
					className={styles.iconButton}
					aria-label="Clear search"
					onClick={() => {
						setValue("");
						commit("");
					}}
				>
					<X size={16} aria-hidden />
				</button>
			)}
		</form>
	);
}
