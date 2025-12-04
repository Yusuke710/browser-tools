#!/usr/bin/env node

import puppeteer from "puppeteer-core";

const selector = process.argv[2];
const value = process.argv[3];

if (!selector || value === undefined) {
	console.log("Usage: browser-fill.js <selector> <value>");
	console.log("\nExamples:");
	console.log('  browser-fill.js "#username" "john_doe"');
	console.log("  browser-fill.js \"input[name='email']\" \"test@example.com\"");
	console.log('  browser-fill.js ".search-box" "search query"');
	process.exit(1);
}

const b = await Promise.race([
	puppeteer.connect({
		browserURL: "http://localhost:9222",
		defaultViewport: null,
	}),
	new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
]).catch((e) => {
	console.error("✗ Could not connect to browser:", e.message);
	console.error("  Run: browser-start.js");
	process.exit(1);
});

const p = (await b.pages()).at(-1);

if (!p) {
	console.error("✗ No active tab found. Run: browser-start.js");
	process.exit(1);
}

try {
	await p.waitForSelector(selector, { timeout: 5000 });
	// Clear existing value and type new one
	await p.click(selector, { clickCount: 3 }); // Select all
	await p.type(selector, value);
	console.log(`✓ Filled "${selector}" with: ${value}`);
} catch (e) {
	console.error(`✗ Could not fill element: ${e.message}`);
	process.exit(1);
}

await b.disconnect();
