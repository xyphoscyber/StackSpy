let currentTabId = null;
let currentData = null;
let activeTab = "stack";

const CAT_LABELS = {
  databases: "Databases",
  caches: "Caches & CDN",
  orms: "ORMs & Query Builders",
  search: "Search Engines",
  infra: "Data Infrastructure"
};

const CAT_ORDER = ["databases", "orms", "caches", "search", "infra"];

function confLabel(c) {
  if (c >= 70) return { cls: "conf-high", txt: `${c}% HIGH` };
  if (c >= 40) return { cls: "conf-med",  txt: `${c}% MED` };
  return { cls: "conf-low", txt: `${c}% LOW` };
}

function renderStack(data) {
  const allItems = CAT_ORDER.flatMap(cat => (data[cat] || []).map(x => ({ ...x, category: cat })));
  if (allItems.length === 0) {
    return `<div class="state-box">
      <div class="state-icon">🔎</div>
      <div class="state-title">Nothing detected</div>
      <div class="state-desc">No database signatures found on this page.<br>The stack may be hidden server-side.</div>
    </div>`;
  }

  let html = "";
  CAT_ORDER.forEach(cat => {
    const items = data[cat] || [];
    if (!items.length) return;
    html += `<div class="category">
      <div class="cat-header">${CAT_LABELS[cat]}<div class="cat-line"></div></div>`;
    items.forEach(item => {
      const conf = confLabel(item.confidence);
      const signals = (item.signals || []).map(s => `<span class="signal-tag">${s}</span>`).join("");
      html += `<div class="db-card">
        <div class="db-icon-wrap" style="background:${item.color}22; border:1px solid ${item.color}44">
          <span style="font-size:17px">${item.icon}</span>
        </div>
        <div class="db-info">
          <div class="db-name">${item.name}
            <span class="conf-pill ${conf.cls}">${conf.txt}</span>
          </div>
          <div class="db-signals">${signals}</div>
        </div>
      </div>`;
    });
    html += `</div>`;
  });
  return html;
}

function renderSignals(data) {
  const raw = data.raw_signals || [];
  if (!raw.length) return `<div class="state-box"><div class="state-icon">📭</div><div class="state-title">No raw signals</div><div class="state-desc">No detection triggers fired.</div></div>`;
  return `<div class="signals-list">${raw.map(s => `<div>▸ ${escHtml(s)}</div>`).join("")}</div>`;
}

function renderHints(data) {
  let html = "";
  const hints = data.framework_hints || [];
  if (hints.length) {
    hints.forEach(h => {
      html += `<div class="hint-card framework-hint">
        <div class="hint-title"><span class="hint-icon">⬡</span>${h.name} Detected</div>
        <div class="hint-text">${h.hint}</div>
      </div>`;
    });
  }

  // General security hints based on what's found
  const allNames = CAT_ORDER.flatMap(cat => (data[cat] || []).map(x => x.name));

  if (allNames.includes("Firebase / Firestore")) {
    html += hint("🔥", "Firebase Security Rules", "Ensure Firestore Security Rules are configured. Default open rules expose all data publicly.");
  }
  if (allNames.includes("MongoDB")) {
    html += hint("🍃", "MongoDB Exposure Risk", "MongoDB instances are often exposed without authentication. Check if any admin ports (27017) are publicly accessible.");
  }
  if (allNames.includes("Elasticsearch")) {
    html += hint("🔍", "Elasticsearch Exposure", "Elasticsearch by default has no authentication. Ensure it's not publicly accessible without auth.");
  }
  if (allNames.includes("Redis")) {
    html += hint("🔴", "Redis Security", "Redis has no built-in auth by default. Ensure requirepass is set and the port is not publicly exposed.");
  }
  if (allNames.includes("Supabase")) {
    html += hint("⚡", "Supabase RLS", "Enable Row-Level Security (RLS) on all Supabase tables. Without it, all authenticated users can access all rows.");
  }
  if (!allNames.length) {
    html += hint("✅", "No databases detected", "The database layer appears to be hidden or fully server-side — good for security through obscurity.");
  }
  if (!html) html = `<div class="state-box"><div class="state-icon">💡</div><div class="state-title">No hints</div><div class="state-desc">Stack looks clean. No notable findings.</div></div>`;
  return html;
}

function hint(icon, title, text) {
  return `<div class="hint-card">
    <div class="hint-title"><span class="hint-icon">${icon}</span>${title}</div>
    <div class="hint-text">${text}</div>
  </div>`;
}

function escHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function renderPage(data) {
  const content = document.getElementById("content");
  switch (activeTab) {
    case "stack":   content.innerHTML = renderStack(data); break;
    case "signals": content.innerHTML = renderSignals(data); break;
    case "hints":   content.innerHTML = renderHints(data); break;
  }
}

function updateSummary(data) {
  const allItems = CAT_ORDER.flatMap(cat => data[cat] || []);
  const total = allItems.length;
  const high = allItems.filter(x => x.confidence >= 70).length;

  document.getElementById("totalCount").textContent = total;
  document.getElementById("highConfCount").textContent = high;
  document.getElementById("stackBadge").textContent = total;
  document.getElementById("signalBadge").textContent = (data.raw_signals || []).length;
  document.getElementById("hintBadge").textContent = (data.framework_hints || []).length;

  // Exposure score: more high-confidence = more visible exposure
  const score = Math.min(100, total * 12 + high * 8);
  const fill = document.getElementById("riskFill");
  fill.style.width = score + "%";
  fill.className = "risk-fill " + (score > 60 ? "risk-high" : score > 30 ? "risk-med" : "risk-low");

  document.getElementById("summary").style.display = "flex";
  document.getElementById("tabsBar").style.display = "flex";
  document.getElementById("footer").style.display = "flex";
  document.getElementById("footerNote").textContent = `${total} tech · ${(data.raw_signals||[]).length} signals`;
}

async function loadResults() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabId = tab.id;
  document.getElementById("urlBar").innerHTML = `<span>⬤</span>${tab.url || "—"}`;

  // Try to inject content script
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  } catch (e) {
    // Already injected or restricted page
  }

  // Poll for results (up to 3s)
  let attempts = 0;
  const poll = setInterval(async () => {
    attempts++;
    const data = await chrome.runtime.sendMessage({ type: "GET_RESULTS", tabId: tab.id });
    if (data && data.scanned) {
      clearInterval(poll);
      currentData = data;
      updateSummary(data.results || data);
      renderPage(data.results || data);
    } else if (attempts > 15) {
      clearInterval(poll);
      document.getElementById("content").innerHTML = `<div class="state-box">
        <div class="state-icon">⚠️</div>
        <div class="state-title">Scan timeout</div>
        <div class="state-desc">Could not inject content script.<br>This page may be restricted (chrome://, extension pages, etc.).</div>
      </div>`;
    }
  }, 200);
}

// Tabs
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeTab = tab.dataset.tab;
    if (currentData) renderPage(currentData.results || currentData);
  });
});

// Rescan
document.getElementById("rescanBtn").addEventListener("click", async () => {
  const btn = document.getElementById("rescanBtn");
  btn.disabled = true;
  btn.textContent = "...";
  await chrome.runtime.sendMessage({ type: "RESCAN", tabId: currentTabId });
  document.getElementById("summary").style.display = "none";
  document.getElementById("tabsBar").style.display = "none";
  document.getElementById("footer").style.display = "none";
  document.getElementById("content").innerHTML = `<div class="state-box">
    <div class="state-icon pulse">🔍</div>
    <div class="state-title">Rescanning...</div>
    <div class="state-desc">Re-running detection engine</div>
  </div>`;
  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = "↺ Rescan";
    loadResults();
  }, 500);
});

// Export
document.getElementById("exportBtn").addEventListener("click", () => {
  if (!currentData) return;
  const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dbdetector-${new URL(document.title || "export").hostname || "export"}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// Init
loadResults();
