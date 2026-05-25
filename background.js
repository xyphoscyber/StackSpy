const tabData = {};

// Capture response headers for header-based detection
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.type === "main_frame") {
      const headers = {};
      details.responseHeaders.forEach(h => {
        headers[h.name.toLowerCase()] = h.value;
      });
      if (!tabData[details.tabId]) tabData[details.tabId] = {};
      tabData[details.tabId].headers = headers;
      tabData[details.tabId].url = details.url;

      // Run header-based detection immediately
      const detected = detectFromHeaders(headers);
      if (detected.length > 0) {
        if (!tabData[details.tabId].header_detections) {
          tabData[details.tabId].header_detections = [];
        }
        tabData[details.tabId].header_detections = detected;
      }
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

function detectFromHeaders(headers) {
  const detected = [];
  const checks = [
    { name: "Varnish Cache",    category: "caches",    icon: "🏎️", color: "#5B8DB8", textColor: "#d8eaf8", header: "x-varnish" },
    { name: "Cloudflare Cache", category: "caches",    icon: "☁️", color: "#F48120", textColor: "#fff4e0", header: "cf-ray" },
    { name: "Cloudflare Cache", category: "caches",    icon: "☁️", color: "#F48120", textColor: "#fff4e0", header: "cf-cache-status" },
    { name: "AWS",              category: "infra",     icon: "☁️", color: "#232F3E", textColor: "#e8eff8", header: "x-amz-request-id" },
    { name: "Elasticsearch",    category: "search",    icon: "🔍", color: "#FEC514", textColor: "#3d2e00", header: "x-elastic-product" },
    { name: "InfluxDB",         category: "databases", icon: "📈", color: "#22ADF6", textColor: "#e0f4ff", header: "x-influxdb-build" },
    { name: "PocketBase",       category: "databases", icon: "🗂️", color: "#B8DBE4", textColor: "#0a2a30", header: "x-pocketbase" }
  ];

  const seen = new Set();
  checks.forEach(c => {
    if (headers[c.header] && !seen.has(c.name)) {
      seen.add(c.name);
      detected.push({
        name: c.name, category: c.category,
        icon: c.icon, color: c.color, textColor: c.textColor,
        confidence: 90, signals: ["header:" + c.header]
      });
    }
  });

  // Server header heuristics
  const server = headers["server"] || "";
  if (/cloudflare/i.test(server) && !seen.has("Cloudflare Cache")) {
    detected.push({ name: "Cloudflare Cache", category: "caches", icon: "☁️", color: "#F48120", textColor: "#fff4e0", confidence: 85, signals: ["header:server"] });
  }
  if (/couchdb/i.test(server)) {
    detected.push({ name: "CouchDB", category: "databases", icon: "🛋️", color: "#E42528", textColor: "#fde0e0", confidence: 95, signals: ["header:server"] });
  }

  // x-powered-by
  const xpb = headers["x-powered-by"] || "";
  if (/asp\.net/i.test(xpb)) {
    detected.push({ name: "Microsoft SQL Server", category: "databases", icon: "🪟", color: "#CC2927", textColor: "#fddcdc", confidence: 60, signals: ["header:x-powered-by"] });
  }
  if (/php/i.test(xpb)) {
    detected.push({ name: "MySQL", category: "databases", icon: "🐬", color: "#00758F", textColor: "#e0f4f8", confidence: 45, signals: ["header:x-powered-by (PHP)"] });
  }

  return detected;
}

// Listen for content script results
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "DB_RESULTS" && sender.tab) {
    if (!tabData[sender.tab.id]) tabData[sender.tab.id] = {};
    // Merge header_detections into content results
    const hd = tabData[sender.tab.id].header_detections || [];
    const data = msg.data;
    hd.forEach(item => {
      const cat = item.category;
      if (!data[cat]) data[cat] = [];
      const exists = data[cat].find(x => x.name === item.name);
      if (!exists) {
        data[cat].push(item);
      } else {
        exists.confidence = Math.max(exists.confidence, item.confidence);
        item.signals.forEach(s => { if (!exists.signals.includes(s)) exists.signals.push(s); });
      }
    });
    tabData[sender.tab.id].results = data;
    tabData[sender.tab.id].scanned = true;
  }
});

// Respond to popup requests
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_RESULTS") {
    const data = tabData[msg.tabId];
    sendResponse(data || null);
    return true;
  }
  if (msg.type === "RESCAN") {
    delete tabData[msg.tabId];
    sendResponse({ ok: true });
    return true;
  }
});

// Clean up on tab close
chrome.tabs.onRemoved.addListener(tabId => delete tabData[tabId]);
