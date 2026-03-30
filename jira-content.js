"use strict";
(() => {
  // src/content/dom/jira-selectors.ts
  var JIRA_SELECTORS = {
    issueTable: [
      '[data-testid="issue-navigator.ui.issue-results.detail-view.card-list.card-container"]',
      '[data-testid="issue-table-body"]',
      'div[class*="IssueList"]',
      'table[class*="issue"]',
      '[role="rowgroup"]'
    ],
    issueRow: [
      '[data-testid*="issue-navigator"] [data-testid*="card-container"]',
      'tr[data-testid*="issue-table"]',
      "div[data-issuekey]",
      '[data-testid*="issue-line-card"]',
      'tr[class*="issuerow"]'
    ],
    issueKey: [
      '[data-testid="issue-field-key"] a',
      '[data-testid*="key"] a',
      'a[href*="/browse/"]',
      'a[data-testid*="issue-key"]',
      'span[class*="IssueKey"]'
    ],
    issueSummary: [
      '[data-testid="issue-field-summary"]',
      '[data-testid*="summary"]',
      'a[data-testid*="issue-key"]',
      'span[class*="Summary"]'
    ],
    issueStatus: [
      '[data-testid="issue-field-status"] span',
      '[data-testid*="status"] span',
      'span[class*="StatusBadge"]',
      'span[class*="lozenge"]'
    ],
    scrollContainer: [
      '[data-testid="issue-navigator.ui.issue-results.detail-view.card-list"]',
      '[data-testid="issue-table-container"]',
      '[role="rowgroup"]',
      'div[class*="VirtualList"]',
      'div[class*="scrollable"]'
    ]
  };

  // src/shared/constants.ts
  var DOM_TIMEOUT_MS = 8e3;
  var SCROLL_PAUSE_MS = 400;
  var MAX_SCROLL_ATTEMPTS = 8;
  function parseWeekDate(weekStart) {
    if (!weekStart) return /* @__PURE__ */ new Date();
    const parsed = /* @__PURE__ */ new Date(`${weekStart}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? /* @__PURE__ */ new Date() : parsed;
  }
  function getQuarterForWeek(weekStart) {
    const anchor = parseWeekDate(weekStart);
    if (weekStart) {
      anchor.setDate(anchor.getDate() + 2);
    }
    const month = anchor.getMonth();
    const quarter = Math.floor(month / 3) + 1;
    return `Q${quarter}`;
  }
  function applyQuarterToWbsLabel(label, weekStart) {
    return label.replace(/\bQ[1-4]\b/g, getQuarterForWeek(weekStart));
  }
  function stripWbsCode(label) {
    return label.replace(/\s*\([A-Z]-[\d.]+\)\s*$/, "").trim();
  }
  var DEFAULT_WBS_NAME_TEMPLATE = "2026 Cust Self-Srv - Prod Q1 (I-003768.06)";
  var DEFAULT_WBS_FALLBACK_TEMPLATE = "2026 Voice Cust Vdr - Prod Q1 (I-003764.06)";
  function getDefaultWbsName(weekStart) {
    return stripWbsCode(applyQuarterToWbsLabel(DEFAULT_WBS_NAME_TEMPLATE, weekStart));
  }
  function getDefaultWbsFallback(weekStart) {
    return stripWbsCode(applyQuarterToWbsLabel(DEFAULT_WBS_FALLBACK_TEMPLATE, weekStart));
  }
  var DEFAULT_WBS_NAME = getDefaultWbsName();
  var DEFAULT_WBS_FALLBACK = getDefaultWbsFallback();
  var WBS_OPTION_TEMPLATES = [
    // Confirmed in Tempo dropdown
    "2026 Cust Self-Srv - Prod Q1 (I-003768.06)",
    "2026 Voice Cust Vdr - Prod Q1 (I-003764.06)",
    "2026 Self-Srv Vdr - Prod Q1 (I-003766.06)",
    "2026 Cloud - Prod Q1 (I-003754.06)",
    "2026 Rev IDA - Prod Q1 (I-003756.06)",
    "2026 Top Vdrs - Prod Q1 (I-003762.06)",
    "2026 OST - Prod Q1 (I-003772.06)",
    "2026 Opticore - Product Q1 (I-003783.06)",
    "2026 KTLO-Prod Q1 (I-003781.26)",
    // From initiative table — may require project access to appear in dropdown
    "2026 Unified - Prod Q1",
    "2026 X4A - Prod Q1",
    "2026 XI Integr - Prod Q1",
    "2026 Pricing - Prod Q1",
    "2026 Invoicing - Prod Q1",
    "2026 Master Data - Prod Q1",
    "2026 Order Mgmt - Prod Q1",
    "2026 Returns - Prod Q1"
  ];
  function getWbsOptionsForWeek(weekStart) {
    return WBS_OPTION_TEMPLATES.map(
      (name) => stripWbsCode(applyQuarterToWbsLabel(name, weekStart))
    );
  }
  var WBS_OPTIONS = getWbsOptionsForWeek();

  // src/content/dom/wait-for.ts
  function waitForSelector(selectors, opts = {}) {
    const { timeout = DOM_TIMEOUT_MS, root = document } = opts;
    return new Promise((resolve, reject) => {
      for (const sel of selectors) {
        const el = (root ?? document).querySelector(sel);
        if (el) return resolve({ element: el, selector: sel });
      }
      const observer = new MutationObserver(() => {
        for (const sel of selectors) {
          const el = (root ?? document).querySelector(sel);
          if (el) {
            observer.disconnect();
            clearTimeout(timer);
            return resolve({ element: el, selector: sel });
          }
        }
      });
      observer.observe(root === document ? document.body : root, {
        childList: true,
        subtree: true
      });
      const timer = setTimeout(() => {
        observer.disconnect();
        reject(
          new Error(
            `waitForSelector(${selectors.join(", ")}) timed out after ${timeout}ms`
          )
        );
      }, timeout);
    });
  }
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // src/content/dom/observe.ts
  function onceStable(root, opts = {}) {
    const { debounceMs = 500, timeout = 1e4 } = opts;
    return new Promise((resolve, reject) => {
      let timer;
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        observer.disconnect();
        clearTimeout(outerTimer);
        resolve();
      };
      const observer = new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(settle, debounceMs);
      });
      observer.observe(root instanceof Document ? document.body : root, {
        childList: true,
        subtree: true,
        characterData: true
      });
      timer = setTimeout(settle, debounceMs);
      const outerTimer = setTimeout(() => {
        observer.disconnect();
        if (!settled) {
          settled = true;
          resolve();
        }
      }, timeout);
    });
  }

  // src/content/workflows/scrape-jira-tickets.ts
  var ISSUE_KEY_RE = /[A-Z][A-Z0-9]+-\d+/;
  function tryQueryAll(selectors, root) {
    for (const sel of selectors) {
      const els = root.querySelectorAll(sel);
      if (els.length > 0) return Array.from(els);
    }
    return [];
  }
  function tryQuery(selectors, root) {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function extractTicketFromRow(row) {
    let key = "";
    let summary = "";
    let status = "";
    let href = "";
    const keyEl = tryQuery(JIRA_SELECTORS.issueKey, row);
    if (keyEl) {
      const anchor = keyEl instanceof HTMLAnchorElement ? keyEl : keyEl.querySelector("a");
      if (anchor) {
        href = anchor.href;
        const keyMatch = (anchor.textContent ?? "").match(ISSUE_KEY_RE);
        if (keyMatch) key = keyMatch[0];
        if (!key) {
          const hrefMatch = anchor.href.match(ISSUE_KEY_RE);
          if (hrefMatch) key = hrefMatch[0];
        }
      }
    }
    if (!key) {
      const anchors = row.querySelectorAll("a");
      for (const a of anchors) {
        const match = a.href.match(/\/browse\/(([A-Z][A-Z0-9]+-\d+))/);
        if (match) {
          key = match[1];
          href = a.href;
          break;
        }
      }
    }
    if (!key) return null;
    const summaryEl = tryQuery(JIRA_SELECTORS.issueSummary, row);
    summary = summaryEl?.textContent?.trim() ?? "";
    if (!summary) {
      const texts = Array.from(row.querySelectorAll("span, a")).map((el) => el.textContent?.trim() ?? "").filter((t) => t.length > 3 && t !== key);
      summary = texts.sort((a, b) => b.length - a.length)[0] ?? "";
    }
    const statusEl = tryQuery(JIRA_SELECTORS.issueStatus, row);
    status = statusEl?.textContent?.trim() ?? "";
    if (!href && key) {
      href = `https://imonline.atlassian.net/browse/${key}`;
    }
    return {
      key,
      summary,
      status,
      href,
      source: "jira-scrape",
      lastSeenAt: Date.now()
    };
  }
  async function scrollAndCollect() {
    const ticketMap = /* @__PURE__ */ new Map();
    const collectVisible = () => {
      const rows = tryQueryAll(JIRA_SELECTORS.issueRow, document);
      let newCount = 0;
      for (const row of rows) {
        const ticket = extractTicketFromRow(row);
        if (ticket && !ticketMap.has(ticket.key)) {
          ticketMap.set(ticket.key, ticket);
          newCount++;
        }
      }
      return newCount;
    };
    collectVisible();
    let scrollTarget = null;
    for (const sel of JIRA_SELECTORS.scrollContainer) {
      scrollTarget = document.querySelector(sel);
      if (scrollTarget) break;
    }
    if (!scrollTarget) {
      scrollTarget = document.documentElement;
    }
    let noNewCount = 0;
    for (let i = 0; i < MAX_SCROLL_ATTEMPTS; i++) {
      scrollTarget.scrollTop += scrollTarget.clientHeight * 0.8;
      await sleep(SCROLL_PAUSE_MS);
      await onceStable(document, { debounceMs: 200, timeout: 1500 });
      const found = collectVisible();
      if (found === 0) {
        noNewCount++;
        if (noNewCount >= 2) break;
      } else {
        noNewCount = 0;
      }
    }
    return ticketMap;
  }
  async function scrapeJiraTickets() {
    console.log("[TEMPO] Starting Jira ticket scrape...");
    try {
      await waitForSelector(JIRA_SELECTORS.issueRow, { timeout: 15e3 });
    } catch {
      console.warn("[TEMPO] No issue rows found, trying broader selectors...");
      await sleep(3e3);
    }
    await onceStable(document, { debounceMs: 400, timeout: 4e3 });
    const ticketMap = await scrollAndCollect();
    const tickets = Array.from(ticketMap.values());
    console.log(`[TEMPO] Scraped ${tickets.length} tickets`);
    return tickets;
  }

  // src/content/jira-content.ts
  console.log("[TEMPO] Jira content script loaded");
  function injectSyncFab() {
    if (document.getElementById("tempo-sync-fab")) return;
    const fab = document.createElement("button");
    fab.id = "tempo-sync-fab";
    fab.title = "Sync tickets to Tempo Planner";
    fab.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`;
    Object.assign(fab.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      background: "#0052cc",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 12px rgba(0,82,204,0.4)",
      zIndex: "2147483647",
      transition: "transform 0.2s ease, box-shadow 0.2s ease"
    });
    fab.addEventListener("mouseenter", () => {
      fab.style.transform = "scale(1.1)";
      fab.style.boxShadow = "0 6px 16px rgba(0,82,204,0.5)";
    });
    fab.addEventListener("mouseleave", () => {
      fab.style.transform = "scale(1)";
      fab.style.boxShadow = "0 4px 12px rgba(0,82,204,0.4)";
    });
    fab.addEventListener("click", () => {
      fab.style.pointerEvents = "none";
      fab.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;
      fab.style.opacity = "0.7";
      scrapeJiraTickets().then((tickets) => {
        chrome.runtime.sendMessage({
          type: "JIRA_TICKETS_RESULT",
          tickets
        });
        fab.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        fab.style.background = "#36b37e";
        fab.style.opacity = "1";
        setTimeout(() => {
          fab.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`;
          fab.style.background = "#0052cc";
          fab.style.pointerEvents = "auto";
        }, 1500);
      }).catch((err) => {
        chrome.runtime.sendMessage({
          type: "JIRA_SCRAPE_ERROR",
          error: String(err)
        });
        fab.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        fab.style.background = "#ff5630";
        fab.style.opacity = "1";
        setTimeout(() => {
          fab.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`;
          fab.style.background = "#0052cc";
          fab.style.pointerEvents = "auto";
        }, 2e3);
      });
    });
    document.body.appendChild(fab);
  }
  injectSyncFab();
  chrome.runtime.onMessage.addListener(
    (msg, _sender, sendResponse) => {
      if (msg.type === "PING" && msg.target === "jira") {
        sendResponse({ type: "PONG", target: "jira" });
        return false;
      }
      if (msg.type === "SCRAPE_JIRA_TICKETS") {
        scrapeJiraTickets().then((tickets) => {
          chrome.runtime.sendMessage({
            type: "JIRA_TICKETS_RESULT",
            tickets
          });
          sendResponse({ success: true, count: tickets.length });
        }).catch((err) => {
          chrome.runtime.sendMessage({
            type: "JIRA_SCRAPE_ERROR",
            error: String(err)
          });
          sendResponse({ success: false, error: String(err) });
        });
        return true;
      }
      return false;
    }
  );
})();
