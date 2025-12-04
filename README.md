# Browser Tools

Chrome DevTools Protocol tools for agent-assisted web automation. These tools connect to Chrome/Chromium running on `:9222` with remote debugging enabled.

**Supports both macOS and Linux** (including headless Docker environments).

This fork is modified and intended to be used with Claude Code in Docker.

## Linux Setup

Install Chromium:
```bash
sudo apt install -y chromium-browser
```

On Linux, `browser-start.js` will automatically:
- Find Chromium at `/usr/bin/chromium-browser` (or `/usr/bin/chromium`, `/usr/bin/google-chrome`)
- Add `--no-sandbox` flags for Docker compatibility
- Use `pkill` instead of `killall` for process management

## How to Invoke These Tools

**CRITICAL FOR AGENTS**: These are executable scripts in your PATH. When invoking via the Bash tool:

✓ CORRECT:
```bash
browser-start.js --headless
browser-nav.js https://example.com
browser-click.js "#submit-btn"
browser-fill.js "#username" "john_doe"
```

✗ INCORRECT:
```bash
node browser-start.js        # Don't use 'node' prefix
./browser-start.js           # Don't use './' prefix
```

## Start Chrome

```bash
browser-start.js --headless   # Start in headless mode (no display required, for containers)
browser-start.js --profile    # Start with your Chrome profile (cookies, logins)
```

Launch Chrome with remote debugging on `:9222`.
- Use `--headless` for containerized environments (no virtual display needed)
- Use `--profile` to preserve user's authentication state

## Navigate

```bash
browser-nav.js https://example.com
browser-nav.js https://example.com --new
```

Navigate to URLs. Use `--new` flag to open in a new tab instead of reusing current tab.

## Click Elements

```bash
browser-click.js "#submit-btn"
browser-click.js "button.primary"
browser-click.js "a[href='/about']"
```

Click elements by CSS selector. Waits for the element to appear before clicking.

## Fill Form Inputs

```bash
browser-fill.js "#username" "john_doe"
browser-fill.js "input[name='email']" "test@example.com"
browser-fill.js ".search-box" "search query"
```

Fill form inputs by CSS selector. Clears existing value and types the new value.

## Evaluate JavaScript

```bash
browser-eval.js 'document.title'
browser-eval.js 'document.querySelectorAll("a").length'
```

Execute JavaScript in the active tab. Code runs in async context. Use this to extract data, inspect page state, or perform DOM operations programmatically.

## Screenshot

```bash
browser-screenshot.js
```

Capture current viewport and return temporary file path. Use this to visually inspect page state or verify UI changes.

## Cookies

```bash
browser-cookies.js
```

Display all cookies for the current tab including domain, path, httpOnly, and secure flags. Use this to debug authentication issues or inspect session state.
