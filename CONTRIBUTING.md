# Contributing to StackSpy

Thanks for your interest in contributing! StackSpy is community-driven — the more signatures, the better the detection.

## Ways to Contribute

- **Add a new technology signature** (most needed)
- **Improve an existing signature** (better patterns, fewer false positives)
- **Report a false positive** (open an issue with the URL and what was incorrectly detected)
- **Report a missed detection** (open an issue with the URL and what technology you expected to see)
- **Improve the UI** (popup.html / popup.js)
- **Add browser support** (Firefox, Edge)

---

## Adding a New Signature

All signatures live in `content.js` inside the `DB_SIGNATURES` array.

### Template

```js
{
  name: "YourTechnology",
  category: "databases",       // databases | caches | orms | search | infra
  icon: "🆕",                  // single emoji
  color: "#336791",            // brand hex color (used for card background tint)
  textColor: "#d4e8f5",        // readable text on that background
  checks: [
    // Add one or more of the check types below
    { type: "global",     keys: ["windowVarName", "alternativeName"] },
    { type: "html",       pattern: /package-name|ClassName/i },
    { type: "script_src", pattern: /cdn-or-package-name/i },
    { type: "cookie",     pattern: /cookie-name-pattern/i },
    { type: "header",     key: "x-header-name", pattern: /value-pattern/i },
    { type: "meta",       name: "generator",    pattern: /tech-name/i },
    { type: "error",      pattern: /ErrorClassName|stack trace pattern/i }
  ]
}
```

### Check Type Reference

| Type | Description | Example |
|---|---|---|
| `global` | Checks if `window.key` exists | `{ type: "global", keys: ["mongoose"] }` |
| `html` | Regex on full page HTML (catches imports, configs, inline scripts) | `{ type: "html", pattern: /import.*from.*'drizzle-orm'/i }` |
| `script_src` | Regex against every `<script src="...">` URL | `{ type: "script_src", pattern: /algolia/i }` |
| `cookie` | Regex against `document.cookie` string | `{ type: "cookie", pattern: /sb-.*-auth-token/i }` |
| `header` | HTTP response header — key is lowercased header name | `{ type: "header", key: "x-powered-by", pattern: /express/i }` |
| `meta` | `<meta name="...">` content attribute | `{ type: "meta", name: "generator", pattern: /wordpress/i }` |
| `error` | Error message patterns in HTML source | `{ type: "error", pattern: /MongoNetworkError/i }` |

### Confidence Scoring

Confidence is calculated automatically: `min(100, signals_matched × 35 + bonus_15_if_multiple)`. So:
- 1 signal → ~35% (Low)
- 2 signals → ~85% (High)
- 3 signals → 100% (High)

Add multiple diverse check types to increase accuracy.

### Tips for Good Signatures

- **Prefer specific patterns** — `/@supabase\/supabase-js/i` is better than `/supabase/i`
- **Use globals when available** — they're the most reliable signal
- **Test for false positives** — search for your pattern on unrelated sites
- **Add error patterns** — stack traces and error messages are very reliable
- **Header keys must be lowercase** — HTTP headers are normalised to lowercase internally

---

## Opening a Pull Request

1. Fork the repo and create a branch: `git checkout -b add-turso-detection`
2. Make your changes
3. Test manually: load the extension in Chrome developer mode, visit a site using the technology
4. Open a PR with:
   - What technology you added / changed
   - Which sites you tested on
   - Confidence level you observed

---

## Reporting Issues

Please include:
- URL of the page (or a description if private)
- What was detected that shouldn't be (false positive) or what wasn't detected (missed)
- Any relevant page source snippets

---

## Code Style

- Plain ES2020 JavaScript — no build step, no TypeScript, no bundler
- Keep `content.js` self-contained (runs in page context, no imports)
- Keep `background.js` as a minimal service worker
- Prefer readability over cleverness
