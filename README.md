# 🗄️ StackSpy

**Database & Tech Fingerprinter for Chrome** — Detects the database stack, ORMs, caches, search engines, and data infrastructure powering any website. Like Wappalyzer, but laser-focused on the data layer.

![StackSpy Screenshot](docs/screenshot.png)

---

## ✨ Features

- **30+ technologies** detected across 5 categories
- **Multi-signal detection** — DOM/HTML, JavaScript globals, script URLs, cookies, HTTP response headers, and error message patterns
- **Confidence scoring** — each detection is rated Low / Medium / High based on how many signals fired
- **Exposure score** — visual risk bar showing how much of the data stack is visible
- **Security hints** — actionable warnings (e.g. Firebase RLS, MongoDB auth, Redis exposure)
- **Framework hints** — detects Next.js, Nuxt, Laravel and infers likely ORM/DB choices
- **Raw signals tab** — full audit trail of every trigger that fired
- **Export to JSON** — one-click export of all findings
- **Rescan** — re-run detection without reloading the page

---

## 🔍 What It Detects

### Databases
| Technology | Detection Method |
|---|---|
| MySQL | Cookies, headers, HTML patterns, error messages |
| PostgreSQL | Globals, HTML patterns, error messages |
| MongoDB | Globals, script URLs, HTML patterns, error messages |
| Firebase / Firestore | Script URLs, globals, HTML patterns |
| Supabase | Script URLs, globals, cookies, HTML patterns |
| DynamoDB | Globals, HTML patterns, AWS headers |
| SQLite | HTML patterns, error messages |
| Oracle DB | Server headers, error patterns |
| MariaDB | Headers, error patterns |
| CouchDB | Server headers |
| PlanetScale | HTML patterns, headers |
| InfluxDB | HTML patterns, headers |
| PocketBase | Globals, HTML patterns, headers |
| Cassandra | HTML patterns, error messages |

### ORMs & Query Builders
Prisma, Sequelize, TypeORM, Drizzle ORM, SQLAlchemy, Django ORM, Rails ActiveRecord, Hibernate

### Caches & CDN
Redis, Memcached, Varnish Cache, Cloudflare Cache

### Search Engines
Elasticsearch, Algolia, MeiliSearch, Typesense, Solr

### Data Infrastructure
GraphQL, Apollo GraphQL, Kafka, RabbitMQ, AWS RDS

---

## 🚀 Installation

### From Source (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/xyphoscyber/stackspy.git
   ```

2. Open Chrome and navigate to `chrome://extensions`

3. Enable **Developer Mode** (toggle in the top-right corner)

4. Click **Load unpacked** and select the `stackspy` folder

5. The StackSpy icon will appear in your toolbar — click it on any website to scan

### From ZIP Release

1. Download the latest `.zip` from the [Releases](../../releases) page
2. Unzip it
3. Follow steps 2–5 above

---

## 🏗️ Project Structure

```
stackspy/
├── manifest.json       # Chrome Extension Manifest v3
├── background.js       # Service worker — captures HTTP headers, stores tab results
├── content.js          # Injected into pages — fingerprints DOM, globals, cookies
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic — renders results, tabs, export
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## 🔧 How Detection Works

StackSpy uses a **multi-signal fingerprinting engine** in two stages:

**Stage 1 — HTTP Headers** (`background.js`)
The service worker intercepts every page's response headers using `chrome.webRequest.onHeadersReceived`. Headers like `x-varnish`, `cf-ray`, `x-elastic-product`, `x-powered-by`, and `server` are parsed for technology signatures before the page even loads.

**Stage 2 — Page Fingerprinting** (`content.js`)
After the page loads, a content script is injected that checks:
- **HTML source** — regex patterns for library imports, config strings, error messages
- **JavaScript globals** — checks `window` for known library objects (`mongoose`, `PrismaClient`, `algoliasearch`, etc.)
- **Script `src` URLs** — scans all `<script src>` tags for CDN or package paths
- **Cookies** — checks cookie names against known patterns (`csrftoken`, `sb-*-auth-token`, etc.)
- **Meta tags** — `generator` and other meta values

Results are merged and confidence scores calculated based on how many independent signals fired per technology.

---

## 🤝 Contributing

Contributions welcome! The easiest way to contribute is adding new technology signatures to `content.js`.

Each signature follows this structure:

```js
{
  name: "YourDB",
  category: "databases",   // databases | caches | orms | search | infra
  icon: "🆕",
  color: "#HEXCOLOR",
  textColor: "#HEXCOLOR",
  checks: [
    { type: "global",     keys: ["globalVarName"] },
    { type: "html",       pattern: /regex/i },
    { type: "script_src", pattern: /regex/i },
    { type: "cookie",     pattern: /regex/i },
    { type: "header",     key: "header-name", pattern: /regex/i },
    { type: "meta",       name: "meta-name",  pattern: /regex/i },
    { type: "error",      pattern: /error regex/i }
  ]
}
```

**Check types:**

| Type | What it checks |
|---|---|
| `global` | `window.keyName` existence |
| `html` | Regex against full page HTML |
| `script_src` | Regex against all `<script src>` URLs |
| `cookie` | Regex against `document.cookie` |
| `header` | HTTP response header value |
| `meta` | `<meta name="...">` content |
| `error` | Error message patterns in HTML |

Please open an issue before adding large batches of signatures so we can coordinate.

---

## 📋 Roadmap

- [ ] Firefox / Edge support
- [ ] Detection history per domain
- [ ] Export as CSV
- [ ] Right-click context menu scan
- [ ] Dark/light theme toggle
- [ ] Wappalyzer-compatible JSON output format
- [ ] CI badge / automated tests for signatures

---

## ⚠️ Disclaimer

StackSpy is intended for **security research, reconnaissance, and educational purposes**. Use it only on websites you own or have permission to analyse. The extension reads publicly visible signals only — it does not make any requests beyond the page you're already visiting.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">Built with 🗄️ by the open-source community</p>
