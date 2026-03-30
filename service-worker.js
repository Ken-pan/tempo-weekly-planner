// src/shared/constants.ts
var JIRA_ISSUES_URL = "https://imonline.atlassian.net/issues/?jql=assignee%20%3D%20currentUser()%20AND%20type%20%3D%20%22UX%20Story%22%20AND%20status%20NOT%20IN%20(Done%2C%20Cancelled%2C%20Archived%2C%20Cancel%2C%20Canceled%2C%20%22Cancelled%20Or%20not%20Approved%22%2C%20Close%2C%20Closed)%20ORDER%20BY%20status%20DESC%2C%20created%20DESC";
var TEMPO_WEEK_URL_BASE = "https://imonline.atlassian.net/plugins/servlet/ac/io.tempo.jira/tempo-app#!/my-work/week?type=TIME";
function getTempoWeekUrl(weekStart) {
  return `${TEMPO_WEEK_URL_BASE}&date=${weekStart}`;
}
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

// src/shared/planner.ts
function toLocalDateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseDate(dateStr) {
  return /* @__PURE__ */ new Date(dateStr + "T12:00:00");
}
function getMondayOfWeek(dateStr) {
  const d = parseDate(dateStr);
  const jsDay = d.getDay();
  const diff = jsDay === 0 ? -6 : 1 - jsDay;
  d.setDate(d.getDate() + diff);
  return toLocalDateString(d);
}

// src/service-worker.ts
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
async function findOrCreateTab(url) {
  const tabs = await chrome.tabs.query({});
  const existing = tabs.find((t) => t.url?.startsWith(url.split("?")[0]));
  if (existing?.id) {
    await chrome.tabs.update(existing.id, { active: true });
    if (existing.windowId) {
      await chrome.windows.update(existing.windowId, { focused: true });
    }
    return existing;
  }
  return chrome.tabs.create({ url, active: true });
}
async function getTempoFrameId(tabId) {
  try {
    const frames = await chrome.webNavigation.getAllFrames({ tabId });
    const tempoFrame = frames?.find((f) => f.url?.includes("app.tempo.io"));
    if (tempoFrame != null) return tempoFrame.frameId;
  } catch {
  }
  return 0;
}
async function ensureContentScript(tabId, target) {
  const sendPing = (opts = {}) => {
    return chrome.tabs.sendMessage(
      tabId,
      { type: "PING", target },
      opts.frameId !== void 0 && opts.frameId !== 0 ? { frameId: opts.frameId } : {}
    );
  };
  if (target === "tempo") {
    const frameId = await getTempoFrameId(tabId);
    try {
      const response = await sendPing({ frameId });
      if (response?.type === "PONG") return true;
    } catch {
    }
    const file = "tempo-content.js";
    try {
      if (frameId !== 0) {
        await chrome.scripting.executeScript({
          target: { tabId, frameIds: [frameId] },
          files: [file]
        });
      } else {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: [file]
        });
      }
      return true;
    } catch (err) {
      console.error("[TEMPO SW] Failed to inject tempo content script:", err);
      return false;
    }
  }
  try {
    const response = await sendPing({});
    return response?.type === "PONG";
  } catch {
    const file = "jira-content.js";
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: [file]
      });
      return true;
    } catch (err) {
      console.error(`[TEMPO SW] Failed to inject ${target} content script:`, err);
      return false;
    }
  }
}
chrome.runtime.onMessage.addListener(
  (msg, sender, sendResponse) => {
    handleMessage(msg, sender).then(sendResponse).catch((err) => {
      console.error("[TEMPO SW] Message handler error:", err);
      sendResponse({ error: String(err) });
    });
    return true;
  }
);
async function handleMessage(msg, _sender) {
  switch (msg.type) {
    case "OPEN_JIRA_PAGE": {
      const tab = await findOrCreateTab(JIRA_ISSUES_URL);
      if (tab.id) {
        await waitForTabComplete(tab.id);
        await ensureContentScript(tab.id, "jira");
      }
      return { success: true, tabId: tab.id };
    }
    case "OPEN_TEMPO_PAGE": {
      const url = msg.date ? getTempoWeekUrl(msg.date) : TEMPO_WEEK_URL_BASE;
      const tab = await findOrCreateTab(url);
      if (tab.id) {
        await waitForTabComplete(tab.id);
        await ensureContentScript(tab.id, "tempo");
      }
      return { success: true, tabId: tab.id };
    }
    case "NAVIGATE_TO_TEMPO_WEEK": {
      const tabs = await chrome.tabs.query({});
      const tempoTab = tabs.find(
        (t) => t.url?.includes("imonline.atlassian.net/plugins/servlet/ac/io.tempo.jira")
      );
      if (!tempoTab?.id) {
        return { error: "Tempo page not open" };
      }
      await navigateTempoTabToWeek(tempoTab.id, tempoTab.url ?? "", msg.weekStart);
      return { success: true, tabId: tempoTab.id };
    }
    case "SCRAPE_JIRA_TICKETS": {
      const tabs = await chrome.tabs.query({});
      const hadIssuesTab = tabs.some(
        (t) => t.url?.includes("imonline.atlassian.net/issues")
      );
      let jiraTab = tabs.find(
        (t) => t.url?.includes("imonline.atlassian.net/issues")
      );
      if (!jiraTab?.id) {
        jiraTab = await findOrCreateTab(JIRA_ISSUES_URL);
      }
      if (!jiraTab?.id) {
        return { error: "Could not open Jira issues page." };
      }
      await waitForTabComplete(jiraTab.id);
      if (!hadIssuesTab) {
        await new Promise((r) => setTimeout(r, 2e3));
      }
      const ok = await ensureContentScript(jiraTab.id, "jira");
      if (!ok) {
        return { error: "Could not inject Jira content script." };
      }
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(
          jiraTab.id,
          { type: "SCRAPE_JIRA_TICKETS" },
          (response) => {
            const err = chrome.runtime.lastError;
            if (err) {
              resolve({ error: err.message ?? "Failed to reach Jira page." });
              return;
            }
            resolve(response ?? { success: true });
          }
        );
      });
    }
    case "START_TEMPO_AUTOMATION": {
      const tabs = await chrome.tabs.query({});
      let tempoTab = tabs.find(
        (t) => t.url?.includes("imonline.atlassian.net/plugins/servlet/ac/io.tempo.jira")
      );
      if (!tempoTab?.id) {
        return { error: "Tempo page not open. Click 'Open Tempo Page' first." };
      }
      const weekStart = msg.plan?.weekStart;
      if (weekStart && tempoTab.url) {
        const needsNavigation = checkTempoWeekMismatch(tempoTab.url, weekStart);
        if (needsNavigation) {
          console.log(`[TEMPO SW] Week mismatch detected. Navigating to week ${weekStart}...`);
          await navigateTempoTabToWeek(tempoTab.id, tempoTab.url, weekStart);
          tempoTab = await chrome.tabs.get(tempoTab.id);
        }
      }
      await ensureContentScript(tempoTab.id, "tempo");
      const frameId = await getTempoFrameId(tempoTab.id);
      return new Promise((resolve) => {
        const opts = frameId !== 0 ? { frameId } : {};
        chrome.tabs.sendMessage(tempoTab.id, msg, opts).then(resolve).catch(resolve);
      });
    }
    case "STOP_TEMPO_AUTOMATION": {
      const tabs = await chrome.tabs.query({});
      const tempoTab = tabs.find(
        (t) => t.url?.includes("imonline.atlassian.net/plugins/servlet/ac/io.tempo.jira")
      );
      if (tempoTab?.id) {
        const frameId = await getTempoFrameId(tempoTab.id);
        const opts = frameId !== 0 ? { frameId } : {};
        chrome.tabs.sendMessage(tempoTab.id, msg, opts).catch(() => {
        });
      }
      return { success: true };
    }
    // Forward results/progress from content scripts to side panel
    case "JIRA_TICKETS_RESULT":
    case "JIRA_SCRAPE_ERROR":
    case "TEMPO_AUTOMATION_PROGRESS":
    case "TEMPO_AUTOMATION_ENTRY_RESULT":
    case "TEMPO_AUTOMATION_RESULT": {
      chrome.runtime.sendMessage(msg).catch(() => {
      });
      return { forwarded: true };
    }
    default:
      return { error: `Unknown message type: ${msg.type}` };
  }
}
function waitForTabComplete(tabId) {
  return new Promise((resolve) => {
    const check = async () => {
      const tab = await chrome.tabs.get(tabId);
      if (tab.status === "complete") {
        resolve();
        return;
      }
      const listener = (id, info) => {
        if (id === tabId && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }, 15e3);
    };
    check();
  });
}
function checkTempoWeekMismatch(currentUrl, targetWeekStart) {
  const fromMatch = currentUrl.match(/[?&]from=(\d{4}-\d{2}-\d{2})/);
  const dateMatch = currentUrl.match(/[?&]date=(\d{4}-\d{2}-\d{2})/);
  const currentDateStr = fromMatch?.[1] ?? dateMatch?.[1];
  if (!currentDateStr) {
    console.log("[TEMPO SW] Can't determine current week from URL, will navigate");
    return true;
  }
  const currentMonday = getMondayOfWeek(currentDateStr);
  const targetMonday = getMondayOfWeek(targetWeekStart);
  const mismatch = currentMonday !== targetMonday;
  if (mismatch) {
    console.log(`[TEMPO SW] Week mismatch: page=${currentMonday}, target=${targetMonday}`);
  }
  return mismatch;
}
function buildTempoUrlForWeek(currentUrl, weekStart) {
  const targetMonday = getMondayOfWeek(weekStart);
  const monday = /* @__PURE__ */ new Date(targetMonday + "T12:00:00");
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const targetFrom = targetMonday;
  const targetTo = toLocalDateString(sunday);
  const hashIdx = currentUrl.indexOf("#");
  if (hashIdx >= 0) {
    const base = currentUrl.substring(0, hashIdx);
    let hash = currentUrl.substring(hashIdx);
    if (hash.includes("from=")) {
      hash = hash.replace(/from=\d{4}-\d{2}-\d{2}/, `from=${targetFrom}`);
    }
    if (hash.includes("to=")) {
      hash = hash.replace(/to=\d{4}-\d{2}-\d{2}/, `to=${targetTo}`);
    }
    if (hash.includes("date=")) {
      hash = hash.replace(/date=\d{4}-\d{2}-\d{2}/, `date=${targetMonday}`);
    }
    if (!hash.includes("from=") && !hash.includes("date=")) {
      const separator = hash.includes("?") ? "&" : "?";
      hash = hash + separator + `from=${targetFrom}&to=${targetTo}`;
    }
    return base + hash;
  }
  return getTempoWeekUrl(targetMonday);
}
async function navigateTempoTabToWeek(tabId, currentUrl, weekStart) {
  const newUrl = currentUrl ? buildTempoUrlForWeek(currentUrl, weekStart) : getTempoWeekUrl(weekStart);
  console.log(`[TEMPO SW] navigateTempoTabToWeek: ${newUrl.substring(0, 140)}`);
  const hashIdx = newUrl.indexOf("#");
  if (hashIdx >= 0) {
    const newHash = newUrl.substring(hashIdx);
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (hash) => {
          window.location.hash = hash.substring(1);
        },
        args: [newHash]
      });
      console.log("[TEMPO SW] Hash navigation executed via scripting API");
      await new Promise((r) => setTimeout(r, 5e3));
      await ensureContentScript(tabId, "tempo");
      return;
    } catch (err) {
      console.warn("[TEMPO SW] Scripting hash navigation failed, falling back to tab update:", err);
    }
  }
  await chrome.tabs.update(tabId, { url: newUrl });
  await waitForTabComplete(tabId);
  await new Promise((r) => setTimeout(r, 4e3));
  await ensureContentScript(tabId, "tempo");
}
