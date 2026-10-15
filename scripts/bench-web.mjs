// Purpose: measure throughput and latency of the running web app (production build) without extra dependencies.
// Inputs:  base URL, duration in seconds, concurrency, then one or more paths to request in rotation.
// Outputs: requests, errors, requests per second, p50/p95/p99 latency in ms, printed as JSON.
// Run:     node scripts/bench-web.mjs http://localhost:3000 20 8 / "/?q=hp&sort=price-desc" "/?page=3"

const [base, seconds = "20", concurrency = "8", ...paths] =
	process.argv.slice(2);
if (!base || paths.length === 0) {
	console.error(
		"usage: bench-web.mjs <base> <seconds> <concurrency> <path...>",
	);
	process.exit(2);
}

const deadline = Date.now() + Number(seconds) * 1000;
const latencies = [];
let errors = 0;
let next = 0;

async function worker() {
	while (Date.now() < deadline) {
		const path = paths[next++ % paths.length];
		const start = performance.now();
		try {
			const res = await fetch(base + path);
			await res.arrayBuffer();
			if (!res.ok) errors++;
			latencies.push(performance.now() - start);
		} catch {
			errors++;
		}
	}
}

const began = Date.now();
await Promise.all(Array.from({ length: Number(concurrency) }, worker));
const elapsed = (Date.now() - began) / 1000;
latencies.sort((a, b) => a - b);
const pct = (p) =>
	Math.round(
		latencies[
			Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length))
		],
	);
console.log(
	JSON.stringify({
		base,
		paths,
		concurrency: Number(concurrency),
		seconds: Math.round(elapsed * 10) / 10,
		requests: latencies.length,
		errors,
		requestsPerSecond: Math.round((latencies.length / elapsed) * 10) / 10,
		p50ms: pct(50),
		p95ms: pct(95),
		p99ms: pct(99),
	}),
);
