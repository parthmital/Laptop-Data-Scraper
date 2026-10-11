import Link from "next/link";

import styles from "./layout.module.css";

export default function NotFound() {
	return (
		<main className={styles.message}>
			<h1>Page not found</h1>
			<p>
				The link may be incomplete, or the laptop was removed in the latest
				price check.
			</p>
			<Link href="/" className="button-primary">
				Browse all laptops
			</Link>
		</main>
	);
}
