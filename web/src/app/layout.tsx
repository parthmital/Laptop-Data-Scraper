import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";

import "./globals.css";
import styles from "./layout.module.css";

// Apple devices render SF Pro from the system stack; everyone else gets Inter, the closest open match.
const sans = Inter({
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	variable: "--font-inter",
});
const mono = IBM_Plex_Mono({
	subsets: ["latin"],
	weight: ["400", "500"],
	variable: "--font-plex-mono",
});

export const metadata: Metadata = {
	title: { default: "Laptop Ledger", template: "%s · Laptop Ledger" },
	description:
		"Laptop prices from Indian stores side by side, with filters for every spec that matters.",
};

export const viewport: Viewport = {
	colorScheme: "light dark",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
		{ media: "(prefers-color-scheme: dark)", color: "#000000" },
	],
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en-IN" className={`${sans.variable} ${mono.variable}`}>
			<head>
				{/* The app has its own dark theme; this stops the Dark Reader extension rewriting the DOM before hydration. */}
				<meta name="darkreader-lock" />
			</head>
			<body>
				<a className={styles.skip} href="#main">
					Skip to content
				</a>
				<div id="main">{children}</div>
				<footer className={styles.footer}>
					<p className={styles.footerText}>
						Prices and specs are collected from store pages for personal,
						non-commercial comparison. Confirm the price and specification on
						the store&apos;s page before you buy.
					</p>
				</footer>
			</body>
		</html>
	);
}
