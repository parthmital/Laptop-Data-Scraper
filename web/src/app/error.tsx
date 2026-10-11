"use client";

import styles from "./layout.module.css";

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<main className={styles.message}>
			<h1>The laptop catalogue could not be loaded</h1>
			<p>
				{process.env.NODE_ENV === "development"
					? error.message
					: "Something went wrong reading the price database. Try again in a moment."}
			</p>
			<button type="button" className="button-primary" onClick={reset}>
				Try again
			</button>
		</main>
	);
}
