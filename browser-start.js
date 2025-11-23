#!/usr/bin/env node

import { spawn, execSync } from "node:child_process";
import { platform } from "node:os";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const args = process.argv.slice(2);
const useProfile = args.includes("--profile");
const useHeadless = args.includes("--headless");
const isLinux = platform() === "linux";

const validArgs = ["--profile", "--headless"];
const invalidArg = args.find(arg => !validArgs.includes(arg));
if (invalidArg) {
	console.log("Usage: browser-start.js [--headless] [--profile]");
	console.log("\nOptions:");
	console.log("  --headless  Run Chrome in headless mode (no display required)");
	console.log("  --profile   Copy your default Chrome profile (cookies, logins)");
	process.exit(1);
}

// Platform-specific Chrome paths
const chromePaths = isLinux
	? ["/usr/bin/chromium-browser", "/usr/bin/chromium", "/usr/bin/google-chrome-stable", "/usr/bin/google-chrome"]
	: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"];

// Find Chrome executable
let chromePath = null;
for (const p of chromePaths) {
	if (existsSync(p)) {
		chromePath = p;
		break;
	}
}

if (!chromePath) {
	console.error("✗ No Chrome/Chromium found");
	process.exit(1);
}

// Kill existing Chrome
try {
	if (isLinux) {
		execSync("pkill -f 'chrom.*remote-debugging'", { stdio: "ignore" });
	} else {
		execSync("killall 'Google Chrome'", { stdio: "ignore" });
	}
} catch {}

await new Promise((r) => setTimeout(r, 1000));

// Setup profile directory
execSync("mkdir -p ~/.cache/scraping", { stdio: "ignore" });

if (useProfile) {
	const profileSource = isLinux
		? `${process.env["HOME"]}/.config/google-chrome/`
		: `${process.env["HOME"]}/Library/Application Support/Google/Chrome/`;
	try {
		execSync(`rsync -a --delete "${profileSource}" ~/.cache/scraping/`, { stdio: "pipe" });
	} catch {}
}

// Chrome arguments
const chromeArgs = [
	"--remote-debugging-port=9222",
	`--user-data-dir=${process.env["HOME"]}/.cache/scraping`,
];

if (useHeadless) {
	chromeArgs.push("--headless=new");
}

if (isLinux) {
	chromeArgs.push("--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage");
}

// Start Chrome
spawn(chromePath, chromeArgs, { detached: true, stdio: "ignore" }).unref();

// Wait for Chrome to be ready
let connected = false;
for (let i = 0; i < 30; i++) {
	try {
		const browser = await puppeteer.connect({ browserURL: "http://localhost:9222", defaultViewport: null });
		await browser.disconnect();
		connected = true;
		break;
	} catch {
		await new Promise((r) => setTimeout(r, 500));
	}
}

if (!connected) {
	console.error("✗ Failed to connect to Chrome");
	process.exit(1);
}

const flags = [useHeadless && "headless", useProfile && "profile"].filter(Boolean).join(", ");
console.log(`✓ Chrome started on :9222${flags ? ` (${flags})` : ""}`);
