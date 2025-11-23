#!/usr/bin/env node

import { spawn, execSync } from "node:child_process";
import { platform } from "node:os";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const useProfile = process.argv[2] === "--profile";
const isLinux = platform() === "linux";

if (process.argv[2] && process.argv[2] !== "--profile") {
	console.log("Usage: browser-start.js [--profile]");
	console.log("\nOptions:");
	console.log("  --profile  Copy your default Chrome profile (cookies, logins)");
	console.log("\nExamples:");
	console.log("  browser-start.js            # Start with fresh profile");
	console.log("  browser-start.js --profile  # Start with your Chrome profile");
	process.exit(1);
}

// Platform-specific Chrome paths
const chromePaths = isLinux
	? [
			// System chromium (default - installed via apt install chromium-browser)
			"/usr/bin/chromium-browser",
			"/usr/bin/chromium",
			"/usr/bin/google-chrome-stable",
			"/usr/bin/google-chrome",
	  ]
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
	console.error("✗ No Chrome/Chromium found at:");
	chromePaths.forEach((p) => console.error(`    ${p}`));
	process.exit(1);
}

console.log(`Using Chrome at: ${chromePath}`);

// Kill existing Chrome
try {
	if (isLinux) {
		execSync("pkill -f 'chrom.*remote-debugging'", { stdio: "ignore" });
	} else {
		execSync("killall 'Google Chrome'", { stdio: "ignore" });
	}
} catch {}

// Wait a bit for processes to fully die
await new Promise((r) => setTimeout(r, 1000));

// Setup profile directory
execSync("mkdir -p ~/.cache/scraping", { stdio: "ignore" });

if (useProfile) {
	// Sync profile with rsync (much faster on subsequent runs)
	const profileSource = isLinux
		? `${process.env["HOME"]}/.config/google-chrome/`
		: `${process.env["HOME"]}/Library/Application Support/Google/Chrome/`;

	if (existsSync(profileSource)) {
		try {
			execSync(`rsync -a --delete "${profileSource}" ~/.cache/scraping/`, {
				stdio: "pipe",
			});
		} catch (e) {
			console.error("Warning: Could not sync profile:", e.message);
		}
	} else {
		console.error(`Warning: Profile not found at ${profileSource}`);
	}
}

// Build Chrome arguments
const chromeArgs = [
	"--remote-debugging-port=9222",
	`--user-data-dir=${process.env["HOME"]}/.cache/scraping`,
];

// Add Linux-specific flags for headless/Docker environments
if (isLinux) {
	chromeArgs.push(
		"--no-sandbox",
		"--disable-setuid-sandbox",
		"--disable-dev-shm-usage",
		"--disable-gpu",
		"--headless=new"
	);
}

// Start Chrome in background (detached so Node can exit)
const chromeProcess = spawn(chromePath, chromeArgs, {
	detached: true,
	stdio: isLinux ? "pipe" : "ignore",
});

// Capture stderr on Linux to help debug issues
if (isLinux) {
	chromeProcess.stderr.on("data", (data) => {
		const msg = data.toString();
		// Only show actual errors, not routine messages
		if (msg.includes("ERROR") || msg.includes("FATAL")) {
			console.error(`Chrome stderr: ${msg}`);
		}
	});
}

chromeProcess.unref();

// Wait for Chrome to be ready by attempting to connect
let connected = false;
for (let i = 0; i < 30; i++) {
	try {
		const browser = await puppeteer.connect({
			browserURL: "http://localhost:9222",
			defaultViewport: null,
		});
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

const mode = isLinux ? " (headless)" : "";
const profile = useProfile ? " with your profile" : "";
console.log(`✓ Chrome started on :9222${mode}${profile}`);
