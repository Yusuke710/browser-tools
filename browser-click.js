#!/usr/bin/env node

import puppeteer from "puppeteer-core";

const selector = process.argv[2];
if (!selector) {
	console.log("Usage: browser-click.js <selector>");
	console.log("\nExamples:");
	console.log('  browser-click.js "button.submit"');
	console.log('  browser-click.js "#login-btn"');
	console.log("  browser-click.js \"a[href='/about']\"");
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
	await p.click(selector);
	console.log(`✓ Clicked: ${selector}`);
} catch (e) {
	console.error(`✗ Could not click element: ${e.message}`);
	process.exit(1);
}

await b.disconnect();
