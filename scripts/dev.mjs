// Starts the web app for local development: `npm run dev` from the repository root.
// Installs dependencies on the first run or when package-lock.json changes, checks the port,
// runs `next dev` in web/, opens the browser once the app responds, and stops everything on Ctrl+C.

import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const web = path.join(root, "web");
const cacheDir = path.join(root, ".cache");
const stampFile = path.join(cacheDir, "dev-install.stamp");
const port = Number(process.env.PORT || 3000);
const url = `http://localhost:${port}`;
const isWindows = process.platform === "win32";
const env = {
	...process.env,
	npm_config_cache: path.join(cacheDir, "npm"),
	NEXT_TELEMETRY_DISABLED: "1",
};

const log = (message) => console.log(`[dev] ${message}`);
const fail = (message) => {
	console.error(`[dev] ${message}`);
	process.exit(1);
};

function checkNode() {
	const [major, minor] = process.versions.node.split(".").map(Number);
	if (major < 22 || (major === 22 && minor < 13))
		fail(
			`Node.js 22.13 or newer is required (found ${process.versions.node}).`,
		);
}

function installIfNeeded() {
	const lock = readFileSync(path.join(root, "package-lock.json"));
	const hash = createHash("sha256").update(lock).digest("hex");
	const installed = existsSync(path.join(root, "node_modules", "next"));
	if (
		installed &&
		existsSync(stampFile) &&
		readFileSync(stampFile, "utf8") === hash
	)
		return;
	log("Installing dependencies (npm ci)...");
	const args = ["ci", "--no-audit", "--no-fund", "--loglevel=error"];
	// npm sets npm_execpath for `npm run`; run its CLI with this Node instead of going through a shell.
	const npmCli = process.env.npm_execpath;
	const result = npmCli
		? spawnSync(process.execPath, [npmCli, ...args], {
				cwd: root,
				env,
				stdio: "inherit",
			})
		: spawnSync(`npm ${args.join(" ")}`, {
				cwd: root,
				env,
				stdio: "inherit",
				shell: true,
			});
	if (result.status !== 0) fail("npm ci failed; see the output above.");
	mkdirSync(cacheDir, { recursive: true });
	writeFileSync(stampFile, hash);
	log("Dependencies installed.");
}

function ensureEnvFile() {
	const target = path.join(web, ".env.local");
	if (!existsSync(target)) {
		copyFileSync(path.join(web, ".env.example"), target);
		log("Created web/.env.local from web/.env.example.");
	}
}

function checkPortFree() {
	return new Promise((resolve) => {
		const server = createServer()
			.once("error", () => resolve(false))
			.once("listening", () => server.close(() => resolve(true)))
			.listen(port);
	});
}

function openBrowser() {
	if (process.env.CI) return;
	const [command, args] = isWindows
		? ["cmd", ["/c", "start", "", url]]
		: process.platform === "darwin"
			? ["open", [url]]
			: ["xdg-open", [url]];
	spawn(command, args, { stdio: "ignore", detached: true })
		.on("error", () => {})
		.unref();
}

async function waitForApp(child) {
	for (let i = 0; i < 120 && child.exitCode == null; i++) {
		try {
			const response = await fetch(url, {
				signal: AbortSignal.timeout(30_000),
			});
			if (response.status < 500) return true;
		} catch {
			// Not up yet.
		}
		await new Promise((r) => setTimeout(r, 1000));
	}
	return false;
}

function stop(child) {
	if (child.exitCode != null) return;
	if (isWindows)
		spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
			stdio: "ignore",
		});
	else process.kill(-child.pid, "SIGTERM");
}

checkNode();
installIfNeeded();
ensureEnvFile();
if (!(await checkPortFree()))
	fail(
		`Port ${port} is in use. Stop the other process or run with PORT=<port>.`,
	);

log(`Starting the web app on ${url} ...`);
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const child = spawn(
	process.execPath,
	[nextBin, "dev", "--port", String(port)],
	{
		cwd: web,
		env,
		stdio: "inherit",
		detached: !isWindows,
	},
);

for (const signal of ["SIGINT", "SIGTERM"]) {
	process.on(signal, () => {
		stop(child);
		process.exit(0);
	});
}
child.on("exit", (code) => {
	if (code) fail(`The web app exited with code ${code}.`);
	process.exit(0);
});

if (await waitForApp(child)) {
	log(`Ready: ${url} (Ctrl+C to stop)`);
	openBrowser();
}
