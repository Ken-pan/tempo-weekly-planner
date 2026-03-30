"use strict";
(() => {
  // src/shared/types.ts
  var DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"];
  var DAY_LABELS = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday"
  };

  // src/content/dom/tempo-selectors.ts
  var TEMPO_SELECTORS = {
    tempoIframe: [
      'iframe[id*="tempo"]',
      'iframe[src*="tempo"]',
      'iframe[name*="tempo"]',
      'iframe[src*="io.tempo.jira"]',
      'iframe[src*="atlassian"]',
      "iframe"
    ],
    calendarCanvasHeader: '#calendarCanvasHeader, [data-testid="calendarCanvasHeader"]',
    calendarCanvasDayHeader: '#calendarCanvasDayHeader, [data-testid="calendarCanvasDayHeader"]',
    weekNavigation: {
      dateRangeText: '[data-testid="date-picker-text"]',
      prevWeekButton: '[data-testid="navigateBack"], button[aria-label="Previous period"]',
      nextWeekButton: '[data-testid="navigateForward"], button[aria-label="Next period"]'
    },
    /** Direct "Log time" button per day — clicking opens the log dialog immediately */
    logTimeButtonForDate: (date) => `[data-testid="tempoCalendarLogWork-${date}"], #tempoCalendarLogWork-${date}`,
    /** "Plan time" button per day */
    planTimeButtonForDate: (date) => `[data-testid="tempoCalendarPlanTime-${date}"], #tempoCalendarPlanTime-${date}`,
    /** Main "+" button per day (opens dropdown with Log/Plan options) */
    addPlanWorkMainButton: (date) => `[data-testid="tempoAddPlanWorkMainButton-${date}"], #tempoAddPlanWorkMainButton-${date}`,
    /** Stand-alone "add" plan button per day */
    addPlanButton: (date) => `[data-testid="addPlanButton-${date}"], #addPlanButton-${date}`,
    addPlanWorkButtonGroup: (date) => `[data-testid="tempoAddPlanWorkButtonGroup-${date}"], #tempoAddPlanWorkButtonGroup-${date}`,
    logTimeButtonInGroup: 'button[title="Log Time"]',
    addButton: [
      '[aria-label*="Log time for"]',
      '[data-testid="log-time-button"]',
      'button[data-testid="log-time-button"]',
      'button[title="Log Time"]',
      '[aria-label="Add time"]',
      '[data-testid="tempo-add-time"]',
      'button[title*="Add"]',
      'button[class*="add-time"]',
      'button[class*="log-time"]'
    ],
    logDialog: [
      '[data-testid="tuiModal"]',
      '[role="dialog"]',
      'div[class*="modal"]',
      'div[class*="Dialog"]'
    ],
    issueInput: [
      "#form-issue-input",
      'input[data-testid="issueField"]',
      'input[placeholder="Search issues"]',
      'input[placeholder*="Search, navigate and choose"]',
      'input[aria-label*="issue"]',
      'input[aria-label*="Issue"]'
    ],
    issueDropdownItem: [
      '[data-testid^="issue_"]',
      '[role="listbox"] [role="option"]',
      '[role="option"]',
      'div[class*="option"]',
      'li[class*="suggestion"]',
      'div[class*="suggestion"]'
    ],
    dateInput: [
      "#startedField",
      'input[aria-label*="Date. Date format"]',
      'input[aria-label*="Date"]',
      'input[placeholder="Date"]'
    ],
    durationInput: [
      "#durationField",
      'input[data-testid="durationField"]',
      'input[aria-label="Duration"]',
      'input[placeholder="0h"]',
      'input[name="durationField"]'
    ],
    wbsInput: [
      "#_WBSName_",
      'input[aria-label="Work Attribute WBS Name"][role="combobox"]',
      'input[aria-label="Work Attribute WBS Name"]'
    ],
    workPhaseInput: [
      "#_WorkPhase_",
      'input[aria-label="Work Attribute Work Phase"][role="combobox"]',
      'input[aria-label="Work Attribute Work Phase"]'
    ],
    submitButton: [
      "#logTimeBtn",
      'button[data-testid="submitLogTime"]',
      'button[type="submit"]',
      'button[aria-label*="Log time"]',
      'button[data-testid*="submit"]'
    ],
    cancelButton: [
      'button[data-testid="cancelLogTime"]',
      'button[aria-label*="Cancel"]',
      'button[data-testid*="cancel"]'
    ],
    errorBanner: [
      '[role="alert"][aria-live="polite"]',
      '[role="alert"]',
      'div[class*="error"]',
      'div[class*="Error"]',
      'span[class*="error"]',
      'div[data-testid*="error"]'
    ],
    wbsSingleValue: [
      '#_WBSName_-15 [class*="singleValue"]',
      '[id^="_WBSName_"] [class*="singleValue"]'
    ],
    workPhaseSingleValue: [
      '#_WorkPhase_-16 [class*="singleValue"]',
      '[id^="_WorkPhase_"] [class*="singleValue"]'
    ],
    wbsPlaceholder: [
      '#_WBSName_-15 [class*="placeholder"]',
      '[id^="_WBSName_"] [class*="placeholder"]'
    ],
    /** Calendar containers */
    calendarContainer: '#myWorkCalendarContainer, [data-testid="myWorkCalendarContainer"]',
    calendarProgressBar: '[data-testid="calendar-progress-bar"]',
    tempoContainer: "#tempo-container",
    toolbar: "#toolbar"
  };

  // src/shared/constants.ts
  var DOM_TIMEOUT_MS = 8e3;
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
  var DEFAULT_WORK_PHASE = "Design";
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
  async function pollUntil(label, condition, opts = {}) {
    const { timeoutMs = DOM_TIMEOUT_MS, intervalMs = 80, isAborted: isAborted2 } = opts;
    const t0 = performance.now();
    let polls = 0;
    const immediate = condition();
    polls++;
    if (immediate) {
      const elapsed = performance.now() - t0;
      console.log(`[TEMPO][poll] ${label}: ready immediately (${elapsed.toFixed(0)}ms)`);
      return { value: immediate, elapsedMs: elapsed, polls };
    }
    return new Promise((resolve, reject) => {
      const timer = setInterval(() => {
        polls++;
        if (isAborted2?.()) {
          clearInterval(timer);
          reject(new Error(`pollUntil(${label}): aborted`));
          return;
        }
        const result = condition();
        if (result) {
          clearInterval(timer);
          const elapsed = performance.now() - t0;
          console.log(`[TEMPO][poll] ${label}: ready after ${elapsed.toFixed(0)}ms (${polls} polls)`);
          resolve({ value: result, elapsedMs: elapsed, polls });
          return;
        }
        if (performance.now() - t0 >= timeoutMs) {
          clearInterval(timer);
          const elapsed = performance.now() - t0;
          console.warn(`[TEMPO][poll] ${label}: TIMEOUT after ${elapsed.toFixed(0)}ms (${polls} polls)`);
          reject(new Error(`pollUntil(${label}): timed out after ${timeoutMs}ms`));
        }
      }, intervalMs);
    });
  }

  // src/content/dom/safe-click.ts
  var TAG = "[TEMPO][click]";
  function describeEl(el) {
    if (!el) return "(null)";
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const cls = el.className ? `.${String(el.className).split(" ").slice(0, 2).join(".")}` : "";
    const text = (el.textContent ?? "").trim().substring(0, 30);
    return `<${tag}${id}${cls}> "${text}"`;
  }
  function ensureVisible(el) {
    el.scrollIntoView({ block: "center", behavior: "instant" });
  }
  async function safeClick(el, opts = {}) {
    const { ensureVis = true, delay = 80 } = opts;
    console.log(TAG, `safeClick: target=${describeEl(el)}`);
    const rect = el.getBoundingClientRect?.();
    if (rect) {
      console.log(TAG, `safeClick: rect x=${rect.x.toFixed(0)} y=${rect.y.toFixed(0)} w=${rect.width.toFixed(0)} h=${rect.height.toFixed(0)}, visible=${rect.width > 0 && rect.height > 0}`);
    }
    if (ensureVis) ensureVisible(el);
    await sleep(50);
    if (!(el instanceof HTMLElement)) {
      throw new Error(`safeClick: element is not HTMLElement (${el.constructor.name})`);
    }
    const wasDisabled = el.disabled;
    if (wasDisabled) {
      console.warn(TAG, `safeClick: element is DISABLED`);
    }
    el.focus();
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    el.click();
    console.log(TAG, `safeClick: events dispatched (focus\u2192mousedown\u2192mouseup\u2192click)`);
    await sleep(delay);
  }

  // src/content/dom/safe-type.ts
  var TAG2 = "[TEMPO][type]";
  function describeEl2(el) {
    if (!el) return "(null)";
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const aria = el.getAttribute("aria-label") ?? "";
    const placeholder = el.placeholder ?? "";
    return `<${tag}${id}${aria ? ` aria="${aria}"` : ""}${placeholder ? ` placeholder="${placeholder}"` : ""}>`;
  }
  function setReactInputValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (nativeSetter) {
      nativeSetter.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
    return false;
  }
  async function safeType(el, value, opts = {}) {
    const { clearFirst = true, delay = 80 } = opts;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
      throw new Error(`safeType: element is not input/textarea (${el.constructor.name})`);
    }
    const elDesc = describeEl2(el);
    console.log(TAG2, `safeType: target=${elDesc}, typing="${value}", clearFirst=${clearFirst}`);
    console.log(TAG2, `safeType: before \u2014 value="${el.value}"`);
    ensureVisible(el);
    el.focus();
    await sleep(50);
    if (clearFirst) {
      setReactInputValue(el, "");
      await sleep(30);
      console.log(TAG2, `safeType: cleared, value="${el.value}"`);
    }
    if (value.length <= 15) {
      for (const char of value) {
        el.dispatchEvent(new KeyboardEvent("keydown", { key: char, bubbles: true }));
        setReactInputValue(el, el.value + char);
        el.dispatchEvent(new KeyboardEvent("keyup", { key: char, bubbles: true }));
        await sleep(10);
      }
    } else {
      setReactInputValue(el, value);
    }
    console.log(TAG2, `safeType: after \u2014 value="${el.value}"`);
    await sleep(delay);
  }
  async function safeSetValue(el, value, opts = {}) {
    const { clearFirst = true, delay = 100 } = opts;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
      throw new Error(`safeSetValue: element is not input/textarea (${el.constructor.name})`);
    }
    const elDesc = describeEl2(el);
    console.log(TAG2, `safeSetValue: target=${elDesc}, value="${value}", clearFirst=${clearFirst}`);
    console.log(TAG2, `safeSetValue: before \u2014 value="${el.value}"`);
    ensureVisible(el);
    el.focus();
    await sleep(50);
    if (clearFirst) {
      setReactInputValue(el, "");
      await sleep(30);
      console.log(TAG2, `safeSetValue: cleared, value="${el.value}"`);
    }
    if (!setReactInputValue(el, value)) {
      el.value = value;
      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
    console.log(TAG2, `safeSetValue: after \u2014 value="${el.value}"`);
    await sleep(delay);
  }

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
  function getDateForDay(weekStart, dayKey) {
    const idx = DAY_KEYS.indexOf(dayKey);
    const d = parseDate(getMondayOfWeek(weekStart));
    d.setDate(d.getDate() + idx);
    return toLocalDateString(d);
  }

  // src/content/workflows/open-tempo-log-dialog.ts
  function getMondayOfWeek2(dateStr) {
    const date = /* @__PURE__ */ new Date(dateStr + "T12:00:00");
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  function parseTempoDateRange(text) {
    const cleanText = text.replace(/\u00A0/g, " ").trim();
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    let match = cleanText.match(/(\d{1,2})\s+([a-z]{3})\s*[-–]\s*(\d{1,2})\s+([a-z]{3}),?\s*(\d{4})/i);
    if (match) {
      const [, startDay, startMonth, endDay, endMonth, year] = match;
      const startMonthIdx = monthNames.indexOf(startMonth.toLowerCase());
      const endMonthIdx = monthNames.indexOf(endMonth.toLowerCase());
      if (startMonthIdx >= 0 && endMonthIdx >= 0) {
        return {
          start: new Date(parseInt(year), startMonthIdx, parseInt(startDay)),
          end: new Date(parseInt(year), endMonthIdx, parseInt(endDay))
        };
      }
    }
    match = cleanText.match(/([a-z]{3})\s+(\d{1,2})\s*[-–]\s*([a-z]{3})\s+(\d{1,2}),?\s*(\d{4})/i);
    if (match) {
      const [, startMonth, startDay, endMonth, endDay, year] = match;
      const startMonthIdx = monthNames.indexOf(startMonth.toLowerCase());
      const endMonthIdx = monthNames.indexOf(endMonth.toLowerCase());
      if (startMonthIdx >= 0 && endMonthIdx >= 0) {
        return {
          start: new Date(parseInt(year), startMonthIdx, parseInt(startDay)),
          end: new Date(parseInt(year), endMonthIdx, parseInt(endDay))
        };
      }
    }
    return { start: null, end: null };
  }
  function getWeeksDiff(date1, date2) {
    const msPerWeek = 7 * 24 * 60 * 60 * 1e3;
    return Math.round((date1.getTime() - date2.getTime()) / msPerWeek);
  }
  var TAG3 = "[TEMPO][openLogDialog]";
  function ts() {
    return (/* @__PURE__ */ new Date()).toISOString().slice(11, 23);
  }
  function log(...args) {
    console.log(TAG3, `[${ts()}]`, ...args);
  }
  function warn(...args) {
    console.warn(TAG3, `[${ts()}]`, ...args);
  }
  function describeEl3(el) {
    if (!el) return "(null)";
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const testid = el.getAttribute("data-testid") ?? "";
    return `<${tag}${id}${testid ? ` testid="${testid}"` : ""}>`;
  }
  function getTempoRoots() {
    const roots = [document];
    for (const sel of TEMPO_SELECTORS.tempoIframe) {
      const iframes = document.querySelectorAll(sel);
      iframes.forEach((iframe) => {
        const iframeEl = iframe;
        let iframeUrl = "(unknown)";
        try {
          iframeUrl = iframeEl.src || iframeEl.getAttribute("src") || "(no src)";
        } catch {
        }
        const doc = iframeEl.contentDocument;
        if (doc && !roots.includes(doc)) {
          roots.push(doc);
          log(`getTempoRoots: added iframe doc from ${iframeUrl.substring(0, 80)}`);
        } else if (!doc) {
          log(`getTempoRoots: iframe contentDocument=null (cross-origin?) src=${iframeUrl.substring(0, 80)}`);
        }
      });
    }
    log(`getTempoRoots: ${roots.length} root(s), docURL=${document.location?.href?.substring(0, 100)}`);
    return roots;
  }
  function getTempoRoot() {
    const roots = getTempoRoots();
    return roots.length > 1 ? roots[1] : roots[0];
  }
  function getDayHeaderTitle(date) {
    const d = /* @__PURE__ */ new Date(date + "T12:00:00");
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `${dayNames[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}`;
  }
  function querySelectorIncludingShadow(root, selector) {
    const el = root.querySelector(selector);
    if (el) return el;
    const start = root.body ?? root.documentElement;
    if (!start) return null;
    const walk = (node) => {
      if (node.shadowRoot) {
        const found = node.shadowRoot.querySelector(selector);
        if (found) return found;
        for (const child of node.shadowRoot.children) {
          const deep = walk(child);
          if (deep) return deep;
        }
      }
      for (const child of node.children) {
        const found = walk(child);
        if (found) return found;
      }
      return null;
    };
    return walk(start);
  }
  function triggerButtonGroupActive(el) {
    el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    if (document.body.contains(el)) el.focus?.();
  }
  async function openLogDialog(dayLabel, date) {
    const t0 = performance.now();
    log(`===== openLogDialog START: date="${date}" =====`);
    log(`openLogDialog: current URL="${window.location.href.substring(0, 120)}"`);
    if (date) {
      const targetMonday = getMondayOfWeek2(date);
      let navAttempt = 0;
      const maxNavAttempts = 3;
      let onCorrectWeek = false;
      while (navAttempt < maxNavAttempts && !onCorrectWeek) {
        navAttempt++;
        log(`openLogDialog: navigation attempt ${navAttempt}/${maxNavAttempts}`);
        if (navAttempt === 1) {
          const navSuccess = await navigateToWeek(date);
          if (!navSuccess) {
            log(`openLogDialog: navigateToWeek returned false for ${date}`);
          }
        } else {
          log(`openLogDialog: retry via URL navigation`);
          await navigateToWeekViaUrl(date);
        }
        await sleep(navAttempt === 1 ? 500 : 1500);
        try {
          await pollUntil("verify-week-" + navAttempt, () => {
            return verifyCorrectWeekInDom(date, targetMonday);
          }, { timeoutMs: navAttempt === 1 ? 3e3 : 5e3, intervalMs: 300 });
          onCorrectWeek = true;
          log(`openLogDialog: confirmed correct week on attempt ${navAttempt} \u2713`);
        } catch {
          log(`openLogDialog: wrong week after attempt ${navAttempt}`);
        }
      }
      if (!onCorrectWeek) {
        warn(`openLogDialog: could not navigate to correct week after ${maxNavAttempts} attempts, trying anyway\u2026`);
      }
      const roots = getTempoRoots();
      let docUsed = roots[0];
      const directLogSel = TEMPO_SELECTORS.logTimeButtonForDate(date);
      let directLogBtn = null;
      for (const doc of roots) {
        directLogBtn = doc.querySelector(directLogSel);
        if (directLogBtn) {
          docUsed = doc;
          break;
        }
      }
      if (!directLogBtn) {
        try {
          const r = await pollUntil("direct-log-btn", () => {
            const freshRoots = getTempoRoots();
            for (const doc of freshRoots) {
              const el = doc.querySelector(directLogSel);
              if (el) return { el, doc };
            }
            return null;
          }, { timeoutMs: 5e3, intervalMs: 200 });
          directLogBtn = r.value.el;
          docUsed = r.value.doc;
          log(`Direct log button found after ${r.elapsedMs.toFixed(0)}ms`);
        } catch {
          log(`Direct log button not found, trying button group strategy`);
        }
      }
      if (directLogBtn) {
        log(`Using direct log button: ${describeEl3(directLogBtn)}`);
        await safeClick(directLogBtn, { delay: 50 });
        return await waitForDialogAfterClick(docUsed, t0);
      }
      const groupSel = TEMPO_SELECTORS.addPlanWorkButtonGroup(date);
      let buttonGroup = null;
      for (const doc of roots) {
        buttonGroup = doc.querySelector(groupSel) ?? querySelectorIncludingShadow(doc, groupSel);
        if (buttonGroup) {
          docUsed = doc;
          break;
        }
      }
      if (!buttonGroup) {
        try {
          const r = await pollUntil("button-group", () => {
            const freshRoots = getTempoRoots();
            for (const doc of freshRoots) {
              const el = doc.querySelector(groupSel) ?? querySelectorIncludingShadow(doc, groupSel);
              if (el) return { el, doc };
            }
            return null;
          }, { timeoutMs: 8e3, intervalMs: 300 });
          buttonGroup = r.value.el;
          docUsed = r.value.doc;
          log(`Button group found after ${r.elapsedMs.toFixed(0)}ms`);
        } catch {
          dumpDebugTestIds(roots, date, groupSel);
          throw new Error(
            `open-log-dialog: neither direct button nor button group found for date=${date}`
          );
        }
      }
      log(`Triggering hover/focus on button group\u2026`);
      triggerButtonGroupActive(buttonGroup);
      let logTimeBtn = null;
      try {
        const r = await pollUntil("log-time-btn", () => {
          return buttonGroup.querySelector(TEMPO_SELECTORS.logTimeButtonInGroup);
        }, { timeoutMs: 2e3, intervalMs: 80 });
        logTimeBtn = r.value;
        log(`Log Time button appeared in ${r.elapsedMs.toFixed(0)}ms: ${describeEl3(logTimeBtn)}`);
      } catch {
        const children = Array.from(buttonGroup.children).map((c) => describeEl3(c));
        throw new Error(`open-log-dialog: Log Time button not found. Children: ${children.join(", ")}`);
      }
      log(`Clicking Log Time\u2026`);
      await safeClick(logTimeBtn, { delay: 50 });
      return await waitForDialogAfterClick(docUsed, t0);
    }
    log(`Fallback: looking for Log Time button\u2026`);
    const fallbackRoot = getTempoRoot();
    let addBtn;
    const buttons = fallbackRoot.querySelectorAll(TEMPO_SELECTORS.addButton[0]);
    if (buttons.length > 0 && dayLabel) {
      const match = Array.from(buttons).find(
        (el) => el.getAttribute("aria-label")?.toLowerCase().includes(dayLabel.toLowerCase())
      );
      addBtn = match ?? buttons[0];
    } else if (buttons.length > 0) {
      addBtn = buttons[0];
    } else {
      const { element } = await waitForSelector(TEMPO_SELECTORS.addButton, {
        root: fallbackRoot,
        timeout: 1e4
      });
      addBtn = element;
    }
    log(`Fallback: clicking ${describeEl3(addBtn)}`);
    await safeClick(addBtn, { delay: 50 });
    return await waitForDialogAfterClick(fallbackRoot, performance.now());
  }
  async function waitForDialogAfterClick(docUsed, t0) {
    log(`Polling for dialog\u2026`);
    try {
      const r = await pollUntil("dialog-appear", () => {
        for (const sel of TEMPO_SELECTORS.logDialog) {
          const el = docUsed.querySelector(sel);
          if (el) return el;
        }
        for (const root of getTempoRoots()) {
          for (const sel of TEMPO_SELECTORS.logDialog) {
            const el = root.querySelector(sel);
            if (el) return el;
          }
        }
        return null;
      }, { timeoutMs: 8e3, intervalMs: 100 });
      const dialog = r.value;
      log(`Dialog appeared in ${r.elapsedMs.toFixed(0)}ms: ${describeEl3(dialog)}`);
      try {
        await pollUntil("dialog-issue-input", () => {
          for (const sel of TEMPO_SELECTORS.issueInput) {
            if (dialog.querySelector(sel)) return true;
          }
          return null;
        }, { timeoutMs: 3e3, intervalMs: 80 });
      } catch {
        const allInputs = dialog.querySelectorAll("input");
        warn(`Issue input not found in dialog. ${allInputs.length} inputs present.`);
      }
      const elapsed = (performance.now() - t0).toFixed(0);
      log(`===== openLogDialog END (${elapsed}ms) =====`);
      return dialog;
    } catch (err) {
      throw new Error(`open-log-dialog: dialog not appear after click (8s) \u2014 ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  function dumpDebugTestIds(roots, date, groupSel) {
    for (let ri = 0; ri < roots.length; ri++) {
      const testIds = Array.from(roots[ri].querySelectorAll("[data-testid]")).map((el) => el.getAttribute("data-testid")).filter((id) => id?.includes("tempo") || id?.includes("Plan") || id?.includes("button") || id?.includes(date)).slice(0, 15);
      log(`openLogDialog: root[${ri}] testids: ${testIds.join(", ") || "(none)"}`);
      log(`openLogDialog: root[${ri}] groupSel=${groupSel} found=${!!roots[ri].querySelector(groupSel)}`);
    }
  }
  async function navigateToWeek(targetDate, roots) {
    const targetMonday = getMondayOfWeek2(targetDate);
    log(`navigateToWeek: targetDate="${targetDate}", targetMonday="${targetMonday.toDateString()}"`);
    log(`navigateToWeek: window.location="${window.location.href.substring(0, 120)}"`);
    const urlDateMatch = window.location.href.match(/[?&]date=(\d{4}-\d{2}-\d{2})/);
    const urlFromMatch = window.location.href.match(/[?&]from=(\d{4}-\d{2}-\d{2})/);
    const urlDate = urlDateMatch?.[1] ?? urlFromMatch?.[1];
    if (urlDate) {
      const urlMonday = getMondayOfWeek2(urlDate);
      if (urlMonday.getTime() === targetMonday.getTime()) {
        log(`navigateToWeek: URL already shows correct week (${urlDate}), verifying DOM\u2026`);
        if (verifyCorrectWeekInDom(targetDate, targetMonday)) {
          log(`navigateToWeek: DOM confirmed correct week \u2713`);
          return true;
        }
        log(`navigateToWeek: URL is right but DOM not ready, waiting\u2026`);
        await sleep(1e3);
        if (verifyCorrectWeekInDom(targetDate, targetMonday)) return true;
      }
    }
    try {
      await pollUntil("pre-dom-verify", () => {
        return verifyCorrectWeekInDom(targetDate, targetMonday);
      }, { timeoutMs: 3e3, intervalMs: 300 });
      log(`navigateToWeek: target verified via polling (pre-DOM), correct week \u2713`);
      return true;
    } catch {
      log(`navigateToWeek: pre-DOM polling did not verify correct week, trying DOM navigation`);
    }
    const domResult = await navigateToWeekViaDom(targetDate, targetMonday, roots);
    if (domResult) {
      await sleep(500);
      if (verifyCorrectWeekInDom(targetDate, targetMonday)) return true;
      log(`navigateToWeek: DOM nav returned true but verify failed, waiting more\u2026`);
      await sleep(1e3);
      if (verifyCorrectWeekInDom(targetDate, targetMonday)) return true;
      warn(`navigateToWeek: DOM nav succeeded but target date buttons not found`);
    }
    log(`navigateToWeek: DOM navigation failed, trying URL navigation via service worker...`);
    return navigateToWeekViaUrl(targetDate);
  }
  function verifyCorrectWeekInDom(targetDate, targetMonday) {
    const freshRoots = getTempoRoots();
    const logBtnSel = TEMPO_SELECTORS.logTimeButtonForDate(targetDate);
    const groupSel = TEMPO_SELECTORS.addPlanWorkButtonGroup(targetDate);
    for (const doc of freshRoots) {
      if (doc.querySelector(logBtnSel) || doc.querySelector(groupSel)) {
        log(`verifyCorrectWeekInDom: found date-specific element for ${targetDate} \u2713`);
        return true;
      }
    }
    const targetMondayStr = toLocalDateString(targetMonday);
    const expectedTitle = getDayHeaderTitle(targetMondayStr);
    for (const doc of freshRoots) {
      const hc = doc.querySelector(TEMPO_SELECTORS.calendarCanvasHeader);
      if (!hc) continue;
      const headers = hc.querySelectorAll(TEMPO_SELECTORS.calendarCanvasDayHeader);
      for (const h of headers) {
        if (h.querySelector(`span[title="${expectedTitle}"]`)) {
          log(`verifyCorrectWeekInDom: calendar header "${expectedTitle}" found \u2713`);
          return true;
        }
      }
    }
    for (const doc of freshRoots) {
      const el = doc.querySelector(TEMPO_SELECTORS.weekNavigation.dateRangeText);
      if (!el) continue;
      const dateText = (el.textContent ?? "").trim();
      const { start, end } = parseTempoDateRange(dateText);
      if (!start) continue;
      if (end) {
        const spanDays = Math.abs(end.getTime() - start.getTime()) / (24 * 60 * 60 * 1e3);
        if (spanDays > 8) {
          log(`verifyCorrectWeekInDom: date range "${dateText}" spans ${spanDays.toFixed(0)} days \u2014 period display, skipping`);
          continue;
        }
      }
      const displayedMonday = getMondayOfWeek2(toLocalDateString(start));
      if (displayedMonday.getTime() === targetMonday.getTime()) {
        log(`verifyCorrectWeekInDom: date range confirms correct week ("${dateText}") \u2713`);
        return true;
      }
      log(`verifyCorrectWeekInDom: date range "${dateText}" \u2192 Monday=${displayedMonday.toDateString()}, want=${targetMonday.toDateString()}`);
    }
    log(`verifyCorrectWeekInDom: could not verify correct week for ${targetDate}`);
    return false;
  }
  async function navigateToWeekViaDom(targetDate, targetMonday, roots) {
    const findDateRange = () => {
      const docs = roots ?? getTempoRoots();
      for (const doc of docs) {
        const el = doc.querySelector(TEMPO_SELECTORS.weekNavigation.dateRangeText);
        if (el) return { el, doc };
      }
      return null;
    };
    let dateRangeInfo = findDateRange();
    if (!dateRangeInfo) {
      log(`navigateToWeekViaDom: date range not found, waiting up to 3s...`);
      try {
        await pollUntil("nav-date-range", findDateRange, { timeoutMs: 3e3, intervalMs: 300 });
        dateRangeInfo = findDateRange();
      } catch {
        log(`navigateToWeekViaDom: date range element never appeared`);
        return false;
      }
    }
    if (!dateRangeInfo) {
      log(`navigateToWeekViaDom: no date range element`);
      return false;
    }
    for (let attempt = 0; attempt < 15; attempt++) {
      if (verifyCorrectWeekInDom(targetDate, targetMonday)) {
        log(`navigateToWeekViaDom: target elements appeared on attempt ${attempt + 1} \u2713`);
        return true;
      }
      const info = findDateRange();
      if (!info) {
        log(`navigateToWeekViaDom: date range element lost on attempt ${attempt + 1}, waiting...`);
        await sleep(300);
        continue;
      }
      const dateText = (info.el.textContent ?? "").trim();
      log(`navigateToWeekViaDom: current date range="${dateText}"`);
      const { start: currentStart, end: currentEnd } = parseTempoDateRange(dateText);
      if (!currentStart) {
        log(`navigateToWeekViaDom: failed to parse date range "${dateText}"`);
        return false;
      }
      if (currentEnd) {
        const spanDays = Math.abs(currentEnd.getTime() - currentStart.getTime()) / (24 * 60 * 60 * 1e3);
        if (spanDays > 8) {
          log(`navigateToWeekViaDom: date range spans ${spanDays.toFixed(0)} days \u2014 period display, aborting DOM nav`);
          return false;
        }
      }
      const currentMonday = getMondayOfWeek2(toLocalDateString(currentStart));
      const weeksDiff = getWeeksDiff(targetMonday, currentMonday);
      log(`navigateToWeekViaDom: currentMonday="${currentMonday.toDateString()}", weeksDiff=${weeksDiff}`);
      if (weeksDiff === 0) {
        log(`navigateToWeekViaDom: already on correct week \u2713`);
        return true;
      }
      const prevBtn = info.doc.querySelector(TEMPO_SELECTORS.weekNavigation.prevWeekButton);
      const nextBtn = info.doc.querySelector(TEMPO_SELECTORS.weekNavigation.nextWeekButton);
      log(`navigateToWeekViaDom: prevBtn=${!!prevBtn}, nextBtn=${!!nextBtn}`);
      if (weeksDiff < 0 && prevBtn) {
        log(`navigateToWeekViaDom: clicking previous (need ${Math.abs(weeksDiff)} week(s) back)`);
        await safeClick(prevBtn, { delay: 50 });
      } else if (weeksDiff > 0 && nextBtn) {
        log(`navigateToWeekViaDom: clicking next (need ${weeksDiff} week(s) forward)`);
        await safeClick(nextBtn, { delay: 50 });
      } else {
        log(`navigateToWeekViaDom: navigation buttons not available (prev=${!!prevBtn}, next=${!!nextBtn})`);
        return false;
      }
      try {
        await pollUntil(
          "week-nav-change",
          () => {
            const fresh = findDateRange();
            if (!fresh) return null;
            const newText = (fresh.el.textContent ?? "").trim();
            if (newText !== dateText) return newText;
            return null;
          },
          { timeoutMs: 3e3, intervalMs: 150 }
        );
        log(`navigateToWeekViaDom: date range updated after click`);
      } catch {
        log(`navigateToWeekViaDom: timeout waiting for date range update after click`);
        await sleep(300);
      }
    }
    log(`navigateToWeekViaDom: max attempts reached`);
    return false;
  }
  async function navigateToWeekViaUrl(targetDate) {
    const targetMonday = getMondayOfWeek2(targetDate);
    const targetWeekStart = toLocalDateString(targetMonday);
    log(`navigateToWeekViaUrl: requesting service worker to navigate to week ${targetWeekStart}`);
    try {
      const response = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve({ error: "timeout" }), 15e3);
        chrome.runtime.sendMessage(
          { type: "NAVIGATE_TO_TEMPO_WEEK", weekStart: targetWeekStart },
          (resp) => {
            clearTimeout(timer);
            resolve(resp ?? { error: "no response" });
          }
        );
      });
      if (response.success) {
        log(`navigateToWeekViaUrl: service worker navigated, waiting for DOM to settle\u2026`);
        try {
          await pollUntil("url-nav-verify", () => {
            return verifyCorrectWeekInDom(targetDate, targetMonday);
          }, { timeoutMs: 1e4, intervalMs: 500 });
          log(`navigateToWeekViaUrl: DOM verified correct week \u2713`);
          return true;
        } catch {
          warn(`navigateToWeekViaUrl: DOM didn't show correct week after URL navigation`);
          await sleep(2e3);
          return true;
        }
      }
      log(`navigateToWeekViaUrl: service worker returned error: ${response.error}`);
      return false;
    } catch (err) {
      log(`navigateToWeekViaUrl: failed: ${err}`);
      return false;
    }
  }
  function readCurrentTempoWeek() {
    const roots = getTempoRoots();
    for (const doc of roots) {
      const dateRangeEl = doc.querySelector(TEMPO_SELECTORS.weekNavigation.dateRangeText);
      if (!dateRangeEl) continue;
      const dateText = (dateRangeEl.textContent ?? "").trim();
      log(`readCurrentTempoWeek: found date range="${dateText}"`);
      const { start, end } = parseTempoDateRange(dateText);
      if (!start || !end) {
        log(`readCurrentTempoWeek: failed to parse date range`);
        continue;
      }
      const weekStart = getMondayOfWeek2(toLocalDateString(start));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 4);
      const result = {
        weekStart: toLocalDateString(weekStart),
        weekEnd: toLocalDateString(weekEnd)
      };
      log(`readCurrentTempoWeek: parsed weekStart=${result.weekStart}, weekEnd=${result.weekEnd}`);
      return result;
    }
    log(`readCurrentTempoWeek: could not find date range element in any root`);
    return null;
  }
  function readLoggedHoursFromHeaders(root) {
    const results = [];
    const headerContainer = root.querySelector(TEMPO_SELECTORS.calendarCanvasHeader);
    if (!headerContainer) {
      log(`readLoggedHoursFromHeaders: header container not found`);
      return results;
    }
    const dayHeaders = headerContainer.querySelectorAll(TEMPO_SELECTORS.calendarCanvasDayHeader);
    log(`readLoggedHoursFromHeaders: found ${dayHeaders.length} day headers`);
    dayHeaders.forEach((header, index) => {
      const text = header.textContent ?? "";
      const match = text.match(/(\d+(?:\.\d+)?)h\s*\/\s*(\d+(?:\.\d+)?)h/i);
      if (match) {
        const logged = parseFloat(match[1]);
        const expected = parseFloat(match[2]);
        results.push({ dayIndex: index, logged, expected });
        log(`readLoggedHoursFromHeaders: day ${index} - ${logged}h / ${expected}h`);
      } else {
        const simpleMatch = text.match(/(\d+(?:\.\d+)?)h/i);
        if (simpleMatch) {
          const logged = parseFloat(simpleMatch[1]);
          results.push({ dayIndex: index, logged, expected: 8 });
          log(`readLoggedHoursFromHeaders: day ${index} - ${logged}h (simple match)`);
        }
      }
    });
    return results;
  }
  async function checkWeekCapacity(targetWeekStart) {
    const currentWeek = readCurrentTempoWeek();
    if (!currentWeek) {
      return {
        allowed: true,
        loggedHours: 0,
        remainingHours: 40,
        maxHours: 40,
        reason: "Could not read current week from page"
      };
    }
    if (currentWeek.weekStart !== targetWeekStart) {
      log(`checkWeekCapacity: navigating from ${currentWeek.weekStart} to ${targetWeekStart}`);
      const navSuccess = await navigateToWeek(targetWeekStart);
      if (!navSuccess) {
        return {
          allowed: true,
          loggedHours: 0,
          remainingHours: 40,
          maxHours: 40,
          reason: `Could not navigate to week ${targetWeekStart}`
        };
      }
      await sleep(500);
    }
    const freshRoots = getTempoRoots();
    let totalLogged = 0;
    for (const doc of freshRoots) {
      const hours = readLoggedHoursFromHeaders(doc);
      if (hours.length > 0) {
        const rootTotal = hours.reduce((sum, h) => sum + h.logged, 0);
        totalLogged = Math.max(totalLogged, rootTotal);
        log(`checkWeekCapacity: root has ${hours.length} days, total ${rootTotal}h logged`);
      }
    }
    const maxHours = 40;
    const remainingHours = Math.max(0, maxHours - totalLogged);
    const allowed = totalLogged < maxHours;
    const result = {
      allowed,
      loggedHours: totalLogged,
      remainingHours,
      maxHours,
      reason: allowed ? void 0 : `Week is full: ${totalLogged}h already logged (max ${maxHours}h)`
    };
    log(`checkWeekCapacity: result=${JSON.stringify(result)}`);
    return result;
  }

  // src/content/dom/verified-step.ts
  var DEFAULT_RETRIES = 2;
  var DEFAULT_DELAY_MS = 80;
  var LOG_PREFIX = "[tempo]";
  async function runVerifiedStep(step, action, verify, options) {
    const {
      retries = DEFAULT_RETRIES,
      delayMs = DEFAULT_DELAY_MS,
      onRetry,
      logPrefix = LOG_PREFIX
    } = options ?? {};
    let lastVerify = false;
    let lastError;
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`${logPrefix} ${step} attempt ${attempt}`);
          await onRetry?.(attempt - 1);
        }
        await action();
        await sleep2(delayMs);
        lastVerify = await verify();
        if (lastVerify) {
          console.log(`${logPrefix} ${step} verify success`);
          return { success: true, step, message: "ok" };
        }
        console.warn(`${logPrefix} ${step} verify failed (attempt ${attempt})`);
      } catch (err) {
        lastError = err;
        console.warn(`${logPrefix} ${step} attempt ${attempt} error:`, err);
      }
    }
    return {
      success: false,
      step,
      message: lastError instanceof Error ? lastError.message : String(lastError),
      details: lastError
    };
  }
  function sleep2(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // src/content/dom/wbs-helpers.ts
  var LISTBOX_SELECTOR = '[role="listbox"]';
  var OPTION_SELECTOR = '[role="option"]';
  var TAG4 = "[TEMPO][WBS]";
  function ts2() {
    return (/* @__PURE__ */ new Date()).toISOString().slice(11, 23);
  }
  function log2(...args) {
    console.log(TAG4, `[${ts2()}]`, ...args);
  }
  function warn2(...args) {
    console.warn(TAG4, `[${ts2()}]`, ...args);
  }
  function describeEl4(el) {
    if (!el) return "(null)";
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const aria = el.getAttribute("aria-label") ?? "";
    return `<${tag}${id}${aria ? ` aria="${aria}"` : ""}>`;
  }
  var rootDoc = (root) => {
    if (!root) return document;
    return root instanceof Document ? root : root.ownerDocument ?? document;
  };
  var scope = (root) => {
    if (!root) return document;
    return root;
  };
  function getWbsInput(root) {
    const r = scope(root);
    const doc = rootDoc(root);
    for (const sel of TEMPO_SELECTORS.wbsInput) {
      const el = r.querySelector?.(sel) ?? doc.querySelector(sel);
      if (el) {
        log2(`getWbsInput: found via "${sel}" \u2192 ${describeEl4(el)}, value="${el.value}", expanded=${el.getAttribute("aria-expanded")}`);
        return el;
      }
    }
    log2(`getWbsInput: NOT FOUND`);
    return null;
  }
  function getWbsContainer(root) {
    const input = getWbsInput(root);
    if (!input) return null;
    return input.closest(".css-b62m3t-container") ?? input.closest('[class*="container"]') ?? input.parentElement?.closest("div") ?? null;
  }
  function getWbsControl(root) {
    const input = getWbsInput(root);
    if (!input) return null;
    const container = input.closest(".css-b62m3t-container") ?? input.closest('[class*="container"]');
    const ctrl = container?.querySelector?.('[class*="control"]');
    if (ctrl) return ctrl;
    return container?.querySelector?.('[class*="Control"]');
  }
  function getOpenListbox(root) {
    const doc = rootDoc(root);
    return doc.querySelector(LISTBOX_SELECTOR);
  }
  function getWbsOptions(root) {
    const listbox = getOpenListbox(root);
    if (!listbox) return [];
    return Array.from(listbox.querySelectorAll(OPTION_SELECTOR));
  }
  function isWbsMenuOpen(root) {
    const input = getWbsInput(root);
    if (input?.getAttribute("aria-expanded") === "true") return true;
    const listbox = getOpenListbox(root);
    if (!listbox) return false;
    return getWbsOptions(root).length > 0;
  }
  function normalizeText(s) {
    return s.replace(/\s+/g, " ").trim().toLowerCase();
  }
  function isWbsSelected(target, root) {
    const container = getWbsContainer(root) ?? getWbsInput(root)?.parentElement;
    if (!container) return false;
    const text = normalizeText(container.textContent ?? "");
    const targetNorm = normalizeText(target);
    if (text.includes(targetNorm)) return true;
    const code = target.match(/\((I-\d+\.\d+)\)/i)?.[1];
    return code ? text.includes(code.toLowerCase()) : false;
  }
  async function openWbsMenu(root) {
    const input = getWbsInput(root);
    const control = getWbsControl(root);
    if (!input) throw new Error("openWbsMenu: WBS input not found");
    log2(`openWbsMenu: input=${describeEl4(input)}, expanded=${input.getAttribute("aria-expanded")}`);
    input.scrollIntoView({ block: "center", behavior: "instant" });
    input.focus();
    input.click();
    if (control) {
      control.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    }
    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowDown",
        code: "ArrowDown",
        keyCode: 40,
        which: 40,
        bubbles: true
      })
    );
    try {
      await pollUntil("wbs-menu-open", () => {
        const expanded = input.getAttribute("aria-expanded") === "true";
        const lb = getOpenListbox(root);
        if (expanded || lb && lb.querySelectorAll(OPTION_SELECTOR).length > 0) return true;
        return null;
      }, { timeoutMs: 3e3, intervalMs: 40 });
    } catch {
      log2(`openWbsMenu: poll timed out, expanded=${input.getAttribute("aria-expanded")}`);
    }
  }
  function getOptionLabel(opt) {
    const titled = opt.querySelector("[title]");
    const title = titled?.getAttribute("title") ?? "";
    if (title.trim()) return title.trim();
    return (opt.textContent ?? "").trim();
  }
  function findOptionByLabel(options, label) {
    const target = normalizeText(stripWbsCode(label));
    for (const opt of options) {
      if (normalizeText(stripWbsCode(getOptionLabel(opt))) === target) return opt;
    }
    for (const opt of options) {
      if (normalizeText(stripWbsCode(opt.textContent ?? "")) === target) return opt;
    }
    for (const opt of options) {
      const t = normalizeText(stripWbsCode(getOptionLabel(opt)));
      const text = normalizeText(stripWbsCode(opt.textContent ?? ""));
      if (t.includes(target) || text.includes(target)) return opt;
    }
    return null;
  }
  function clickOption(opt) {
    log2(`clickOption: "${getOptionLabel(opt).substring(0, 50)}\u2026"`);
    opt.scrollIntoView({ block: "nearest" });
    opt.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    opt.click();
    opt.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  }
  async function selectWbsOption(preferredLabels, fallbackLabel, root, logFn, skipOpen) {
    const t0 = performance.now();
    log2(`selectWbsOption: preferred=${JSON.stringify(preferredLabels)}, fallback="${fallbackLabel.substring(0, 35)}\u2026"`);
    if (!skipOpen) {
      await openWbsMenu(root);
    }
    const LOAD_ROUNDS = [
      { timeoutMs: 4e3, intervalMs: 40, action: "wait" },
      { timeoutMs: 5e3, intervalMs: 50, action: "arrow" },
      { timeoutMs: 6e3, intervalMs: 50, action: "reopen" }
    ];
    let options = [];
    for (let i = 0; i < LOAD_ROUNDS.length; i++) {
      const round = LOAD_ROUNDS[i];
      const roundLabel = `wbs-options-load-r${i + 1}`;
      if (i > 0 && round.action === "arrow") {
        log2(`selectWbsOption: round ${i + 1} \u2014 re-trigger ArrowDown`);
        logFn?.(`[tempo] wbs options not loaded, retrying (${i + 1}/${LOAD_ROUNDS.length})\u2026`);
        const input = getWbsInput(root);
        input?.focus();
        input?.dispatchEvent(new KeyboardEvent("keydown", {
          key: "ArrowDown",
          code: "ArrowDown",
          keyCode: 40,
          which: 40,
          bubbles: true
        }));
      } else if (i > 0 && round.action === "reopen") {
        log2(`selectWbsOption: round ${i + 1} \u2014 re-open menu`);
        logFn?.(`[tempo] wbs re-opening menu (${i + 1}/${LOAD_ROUNDS.length})\u2026`);
        const input = getWbsInput(root);
        input?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        await sleep(100);
        await openWbsMenu(root);
      }
      try {
        const r = await pollUntil(roundLabel, () => {
          const opts = getWbsOptions(root);
          return opts.length > 0 ? opts : null;
        }, { timeoutMs: round.timeoutMs, intervalMs: round.intervalMs });
        options = r.value;
        log2(`selectWbsOption: ${options.length} options loaded in round ${i + 1} (${r.elapsedMs.toFixed(0)}ms, ${r.polls} polls)`);
        break;
      } catch {
        log2(`selectWbsOption: round ${i + 1} timed out`);
      }
    }
    if (options.length === 0) {
      throw new Error("selectWbsOption: no options available after all retries");
    }
    logFn?.(`[tempo] wbs options count=${options.length}`);
    if (options.length > 0) {
      const labels = options.slice(0, 3).map((o) => `"${getOptionLabel(o).substring(0, 40)}"`);
      log2(`selectWbsOption: first: ${labels.join(", ")}`);
    }
    let chosen = null;
    let chosenLabel = "";
    for (const pref of preferredLabels) {
      if (!pref?.trim()) continue;
      chosen = findOptionByLabel(options, pref);
      if (chosen) {
        chosenLabel = getOptionLabel(chosen);
        log2(`selectWbsOption: preferred MATCHED "${chosenLabel.substring(0, 40)}\u2026"`);
        logFn?.(`[tempo] wbs preferred: ${chosenLabel.substring(0, 40)}\u2026`);
        break;
      }
    }
    if (!chosen) {
      chosen = findOptionByLabel(options, fallbackLabel);
      if (chosen) {
        chosenLabel = getOptionLabel(chosen);
        log2(`selectWbsOption: fallback MATCHED "${chosenLabel.substring(0, 40)}\u2026"`);
        logFn?.(`[tempo] wbs fallback: ${chosenLabel.substring(0, 40)}\u2026`);
      }
    }
    if (!chosen) {
      warn2(`selectWbsOption: no match`);
      const input = getWbsInput(root);
      input?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      throw new Error(`selectWbsOption: no match for [${preferredLabels.join(", ")}] or "${fallbackLabel}"`);
    }
    clickOption(chosen);
    try {
      await pollUntil("wbs-listbox-close", () => {
        const lb = getOpenListbox(root);
        if (!lb) return true;
        return lb.querySelectorAll(OPTION_SELECTOR).length === 0 ? true : null;
      }, { timeoutMs: 2e3, intervalMs: 40 });
    } catch {
      log2(`selectWbsOption: listbox still open after click`);
    }
    const elapsed = (performance.now() - t0).toFixed(0);
    log2(`selectWbsOption: done in ${elapsed}ms, label="${chosenLabel.substring(0, 40)}\u2026"`);
    return chosenLabel;
  }
  async function verifyWbsSelected(target, root) {
    try {
      await pollUntil("wbs-verify-selected", () => {
        if (isWbsSelected(target, root)) return true;
        const doc = rootDoc(root);
        const sv = doc.querySelector(TEMPO_SELECTORS.wbsSingleValue.join(", "));
        if (sv) return true;
        const placeholder = doc.querySelector(TEMPO_SELECTORS.wbsPlaceholder.join(", "));
        if (!placeholder) return true;
        return null;
      }, { timeoutMs: 2e3, intervalMs: 50 });
      log2(`verifyWbsSelected: confirmed \u2713`);
      return true;
    } catch {
      warn2(`verifyWbsSelected: FAILED for "${target.substring(0, 35)}\u2026"`);
      return false;
    }
  }

  // src/content/workflows/fill-tempo-form.ts
  var TAG5 = "[TEMPO]";
  var AbortError = class extends Error {
    constructor() {
      super("Automation aborted by user");
    }
  };
  function checkAbort(isAborted2) {
    if (isAborted2?.()) throw new AbortError();
  }
  function ts3() {
    return (/* @__PURE__ */ new Date()).toISOString().slice(11, 23);
  }
  function log3(...args) {
    console.log(TAG5, `[${ts3()}]`, ...args);
  }
  function warn3(...args) {
    console.warn(TAG5, `[${ts3()}]`, ...args);
  }
  function normalizeText2(s) {
    return s.replace(/\s+/g, " ").trim().toLowerCase();
  }
  function formatDuration(hours) {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (wholeHours === 0) {
      return `${minutes}m`;
    }
    if (minutes === 0) {
      return `${wholeHours}h`;
    }
    return `${wholeHours}h ${minutes}m`;
  }
  function describeEl5(el) {
    if (!el) return "(null)";
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const aria = el.getAttribute("aria-label") ?? "";
    const testid = el.getAttribute("data-testid") ?? "";
    return `<${tag}${id}${aria ? ` aria="${aria}"` : ""}${testid ? ` testid="${testid}"` : ""}>`;
  }
  function queryFirst(scopes, selectors) {
    for (const scope2 of scopes) {
      for (const sel of selectors) {
        const el = scope2.querySelector(sel);
        if (el) return el;
      }
    }
    return null;
  }
  function inputVal(scopes, selectors) {
    const el = queryFirst(scopes, selectors);
    return el ? el.value ?? "" : null;
  }
  function snapshotDialog(dialog, root) {
    const s = [dialog, root];
    return {
      issueInput: queryFirst(s, TEMPO_SELECTORS.issueInput) ? "yes" : null,
      dateInput: queryFirst(s, TEMPO_SELECTORS.dateInput) ? "yes" : null,
      dateValue: inputVal(s, TEMPO_SELECTORS.dateInput),
      durationInput: queryFirst(s, TEMPO_SELECTORS.durationInput) ? "yes" : null,
      durationValue: inputVal(s, TEMPO_SELECTORS.durationInput),
      submitBtn: queryFirst(s, TEMPO_SELECTORS.submitButton) ? "yes" : null,
      cancelBtn: queryFirst(s, TEMPO_SELECTORS.cancelButton) ? "yes" : null,
      hasError: detectPageErrors(dialog, root) !== null
    };
  }
  function detectPageErrors(dialog, root) {
    for (const sel of TEMPO_SELECTORS.errorBanner) {
      for (const scope2 of [dialog, root]) {
        const els = scope2.querySelectorAll(sel);
        for (const el of els) {
          const text = (el.textContent ?? "").trim().substring(0, 200);
          if (text && text !== "This field is required") return text;
        }
      }
    }
    return null;
  }
  function detectFieldErrors(dialog, root) {
    const errors = [];
    for (const scope2 of [dialog, root]) {
      const alerts = scope2.querySelectorAll('[role="alert"]');
      for (const a of alerts) {
        const text = (a.textContent ?? "").trim();
        if (text) errors.push(text);
      }
    }
    return errors;
  }
  async function findInDialog(dialog, selectors, label) {
    log3(`findInDialog(${label}): trying selectors in dialog\u2026`);
    try {
      const { element, selector } = await waitForSelector(selectors, {
        root: dialog,
        timeout: 5e3
      });
      log3(
        `findInDialog(${label}): found via "${selector}" \u2192 ${describeEl5(
          element
        )}`
      );
      return element;
    } catch {
      log3(`findInDialog(${label}): not in dialog, trying tempo root\u2026`);
      const root = getTempoRoot();
      const { element, selector } = await waitForSelector(selectors, {
        root,
        timeout: 3e3
      });
      warn3(
        `findInDialog(${label}): found in ROOT via "${selector}" \u2192 ${describeEl5(
          element
        )}`
      );
      return element;
    }
  }
  function fail(state, detail, dialog, timings) {
    warn3(`FAIL @ ${state}: ${detail}`);
    if (dialog) {
      const root = getTempoRoot();
      const pageErr = detectPageErrors(dialog, root);
      if (pageErr) {
        warn3(`Page error detected: ${pageErr}`);
        return {
          state,
          success: false,
          detail: `${detail} | Page error: ${pageErr}`,
          timings
        };
      }
    }
    return { state, success: false, detail, timings };
  }
  async function selectComboboxOption(scope2, ariaLabel, targetText, onProgress, stepName, isAborted2) {
    const root = scope2 instanceof Document ? scope2 : scope2.ownerDocument ?? document;
    const inputSel = `input[role="combobox"][aria-label="${ariaLabel}"]`;
    log3(`selectCombobox: looking for ${inputSel}`);
    let input = scope2.querySelector(inputSel);
    if (!input) input = root.querySelector(inputSel);
    if (!input) {
      const loose = `input[aria-label="${ariaLabel}"]`;
      input = scope2.querySelector(loose);
      if (!input) input = root.querySelector(loose);
    }
    if (!input) {
      const all = root.querySelectorAll('input[role="combobox"]');
      log3(`selectCombobox: NOT FOUND. ${all.length} comboboxes in root:`);
      for (const el of all) {
        log3(
          `  combobox: id="${el.id}", aria-label="${el.getAttribute(
            "aria-label"
          )}"`
        );
      }
      onProgress(stepName, `Combobox not found: ${ariaLabel}`);
      return false;
    }
    log3(`selectCombobox: found ${describeEl5(input)}, value="${input.value}"`);
    input.scrollIntoView({ block: "center", behavior: "instant" });
    input.focus();
    input.click();
    await sleep(50);
    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set;
    const setInputValue = (val) => {
      if (nativeSetter) {
        nativeSetter.call(input, val);
      } else {
        input.value = val;
      }
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };
    setInputValue("");
    log3(`selectCombobox: setting value "${targetText}"`);
    onProgress(stepName, `Typing search: "${targetText}"`);
    setInputValue(targetText);
    let listbox = null;
    try {
      const result = await pollUntil(
        "combobox-listbox",
        () => {
          const listboxId = input.getAttribute("aria-controls");
          let lb = listboxId ? root.getElementById(listboxId) : null;
          if (!lb) lb = root.querySelector('[role="listbox"]');
          if (lb && lb.querySelectorAll('[role="option"]').length > 0) return lb;
          return null;
        },
        { timeoutMs: 5e3, intervalMs: 100, isAborted: isAborted2 }
      );
      listbox = result.value;
    } catch {
      log3(`selectCombobox: listbox never appeared, trying ArrowDown`);
      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowDown",
          keyCode: 40,
          bubbles: true
        })
      );
      await sleep(400);
      const listboxId = input.getAttribute("aria-controls");
      listbox = listboxId ? root.getElementById(listboxId) : root.querySelector('[role="listbox"]');
    }
    if (!listbox) {
      onProgress(stepName, "Listbox did not appear");
      return false;
    }
    const options = Array.from(
      listbox.querySelectorAll('[role="option"]')
    );
    log3(`selectCombobox: ${options.length} options`);
    const target = normalizeText2(targetText);
    let best = null;
    for (const opt of options) {
      const titled = opt.querySelector("[title]");
      const title = normalizeText2(titled?.getAttribute("title") ?? "");
      if (title === target) {
        best = opt;
        break;
      }
    }
    if (!best) {
      for (const opt of options) {
        if (normalizeText2(opt.textContent ?? "") === target) {
          best = opt;
          break;
        }
      }
    }
    if (!best) {
      for (const opt of options) {
        const titled = opt.querySelector("[title]");
        const title = normalizeText2(titled?.getAttribute("title") ?? "");
        const text = normalizeText2(opt.textContent ?? "");
        if (title.includes(target) || text.includes(target)) {
          best = opt;
          break;
        }
      }
    }
    if (!best) {
      const labels = options.slice(0, 3).map((o) => `"${(o.textContent?.trim() ?? "").substring(0, 40)}"`);
      log3(`selectCombobox: no match. Options: ${labels.join(", ")}`);
      onProgress(stepName, `No matching option: "${targetText}"`);
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
      return false;
    }
    log3(
      `selectCombobox: clicking "${(best.textContent?.trim() ?? "").substring(
        0,
        50
      )}"`
    );
    onProgress(
      stepName,
      `Selected: "${(best.textContent?.trim() ?? "").substring(0, 50)}"`
    );
    best.scrollIntoView({ block: "nearest" });
    best.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    best.click();
    best.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    try {
      await pollUntil(
        "combobox-close",
        () => {
          const lb = root.querySelector('[role="listbox"]');
          if (!lb) return true;
          return lb.querySelectorAll('[role="option"]').length === 0 ? true : null;
        },
        { timeoutMs: 2e3, intervalMs: 80, isAborted: isAborted2 }
      );
    } catch {
      log3(`selectCombobox: listbox still open, keyboard fallback`);
      input.focus();
      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowDown",
          keyCode: 40,
          bubbles: true
        })
      );
      await sleep(50);
      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          keyCode: 13,
          bubbles: true
        })
      );
      await sleep(100);
    }
    log3(`selectCombobox: done, value="${input.value}"`);
    onProgress(stepName, "Selection complete \u2713");
    return true;
  }
  async function fillTempoForm(alloc, day, hours, weekStart, dryRun, onProgress, isAborted2) {
    const date = getDateForDay(weekStart, day);
    const label = `${alloc.ticketKey} ${day} ${hours}h`;
    const formStart = performance.now();
    const timings = {};
    log3(
      `===== fillTempoForm START: ${label}, date=${date}, dryRun=${dryRun} =====`
    );
    let dialog;
    try {
      let stepStart = performance.now();
      try {
        checkAbort(isAborted2);
        log3(`[1/8] Opening log dialog for date=${date}\u2026`);
        onProgress("open-log-dialog", `Opening log dialog (${date})...`);
        dialog = await openLogDialog(DAY_LABELS[day], date);
        timings["open-dialog"] = performance.now() - stepStart;
        log3(
          `[1/8] Dialog obtained in ${timings["open-dialog"].toFixed(
            0
          )}ms: ${describeEl5(dialog)}`
        );
      } catch (err) {
        if (err instanceof AbortError) throw err;
        timings["open-dialog"] = performance.now() - stepStart;
        return fail(
          "open-log-dialog",
          `${err instanceof Error ? err.message : String(err)}`,
          void 0,
          timings
        );
      }
      checkAbort(isAborted2);
      const root = getTempoRoot();
      const snap1 = snapshotDialog(dialog, root);
      log3(`[1/8] Snapshot: ${JSON.stringify(snap1)}`);
      if (!snap1.issueInput) {
        return fail(
          "open-log-dialog",
          "Dialog opened but Issue input is missing",
          dialog,
          timings
        );
      }
      stepStart = performance.now();
      log3(`[2/8] Filling issue: ${alloc.ticketKey}`);
      try {
        const issueInput = await findInDialog(
          dialog,
          TEMPO_SELECTORS.issueInput,
          "issueInput"
        );
        log3(
          `[2/8] Issue input: ${describeEl5(issueInput)}, value="${issueInput.value}"`
        );
        onProgress("fill-issue", `Typing Issue: ${alloc.ticketKey}`);
        await safeSetValue(issueInput, alloc.ticketKey, { delay: 100 });
        log3(
          `[2/8] safeSetValue done, value="${issueInput.value}"`
        );
        checkAbort(isAborted2);
        const key = alloc.ticketKey;
        const exactTestId = `[data-testid="issue_${key}"]`;
        const fallbackSels = TEMPO_SELECTORS.issueDropdownItem.join(", ");
        const findClickableOption = () => {
          for (const c of [dialog, root]) {
            const exact = c.querySelector(exactTestId);
            if (exact) return exact;
          }
          for (const c of [dialog, root]) {
            const opts = c.querySelectorAll(fallbackSels);
            for (const opt of opts) {
              if (opt.textContent?.includes(key)) return opt;
            }
            for (const opt of opts) {
              if (opt.textContent?.trim()) return opt;
            }
          }
          return null;
        };
        let option;
        try {
          const r = await pollUntil("issue-dropdown", findClickableOption, {
            timeoutMs: 8e3,
            intervalMs: 150,
            isAborted: isAborted2
          });
          option = r.value;
          log3(
            `[2/8] Dropdown option found in ${r.elapsedMs.toFixed(
              0
            )}ms: ${describeEl5(option)}`
          );
          onProgress(
            "fill-issue",
            `Found option: ${(option.textContent?.trim() ?? "").substring(0, 50)}`
          );
        } catch {
          log3(`[2/8] No dropdown, trying Enter`);
          onProgress("fill-issue", "No suggestion found, trying Enter...");
          const inputEl = issueInput;
          inputEl.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
          );
          inputEl.dispatchEvent(
            new KeyboardEvent("keyup", { key: "Enter", bubbles: true })
          );
          try {
            const r2 = await pollUntil(
              "issue-dropdown-retry",
              findClickableOption,
              {
                timeoutMs: 3e3,
                intervalMs: 150,
                isAborted: isAborted2
              }
            );
            option = r2.value;
          } catch {
            return fail(
              "fill-issue",
              `No suggestion found (key=${key})`,
              dialog,
              timings
            );
          }
        }
        log3(`[2/8] Clicking option\u2026`);
        onProgress("fill-issue", "Clicking suggestion...");
        await safeClick(option, { delay: 50 });
        checkAbort(isAborted2);
        const stillVisible = findClickableOption();
        if (stillVisible) {
          log3(`[2/8] Dropdown still visible, retrying click`);
          await safeClick(stillVisible, { delay: 50 });
        }
        log3(`[2/8] Polling for date input (issue accepted)\u2026`);
        onProgress("fill-issue", "Verifying Issue is confirmed...");
        try {
          const r = await pollUntil(
            "issue-accepted",
            () => {
              return queryFirst([dialog, root], TEMPO_SELECTORS.dateInput);
            },
            { timeoutMs: 8e3, intervalMs: 100, isAborted: isAborted2 }
          );
          log3(`[2/8] Issue accepted in ${r.elapsedMs.toFixed(0)}ms \u2713`);
        } catch {
          const snap = snapshotDialog(dialog, root);
          return fail(
            "fill-issue",
            `Form did not expand after selecting Issue. snap=${JSON.stringify(snap)}`,
            dialog,
            timings
          );
        }
        const fieldErrs2 = detectFieldErrors(dialog, root);
        if (fieldErrs2.length > 0) {
          log3(`[2/8] Field errors: ${fieldErrs2.join(", ")}`);
        }
        timings["fill-issue"] = performance.now() - stepStart;
        log3(`[2/8] Issue done in ${timings["fill-issue"].toFixed(0)}ms`);
      } catch (err) {
        if (err instanceof AbortError) throw err;
        timings["fill-issue"] = performance.now() - stepStart;
        return fail(
          "fill-issue",
          `${err instanceof Error ? err.message : String(err)}`,
          dialog,
          timings
        );
      }
      checkAbort(isAborted2);
      stepStart = performance.now();
      log3(`[3/8] Filling date: ${date}`);
      try {
        const dateInput = await findInDialog(
          dialog,
          TEMPO_SELECTORS.dateInput,
          "dateInput"
        );
        const prevDate = dateInput.value;
        log3(`[3/8] Date input: ${describeEl5(dateInput)}, current="${prevDate}"`);
        onProgress("fill-date", `Setting date: ${date} (current: "${prevDate}")`);
        await safeType(dateInput, date, { delay: 30 });
        dateInput.blur();
        try {
          const r = await pollUntil(
            "date-accepted",
            () => {
              return queryFirst([dialog, root], TEMPO_SELECTORS.durationInput);
            },
            { timeoutMs: 5e3, intervalMs: 80, isAborted: isAborted2 }
          );
          log3(`[3/8] Duration input appeared in ${r.elapsedMs.toFixed(0)}ms \u2713`);
        } catch {
          const snap = snapshotDialog(dialog, root);
          return fail(
            "fill-date",
            `Duration input did not appear after setting date. snap=${JSON.stringify(snap)}`,
            dialog,
            timings
          );
        }
        const afterDate = dateInput.value;
        log3(`[3/8] Date after: "${afterDate}"`);
        onProgress("fill-date", `Date set: "${afterDate}" \u2713`);
        timings["fill-date"] = performance.now() - stepStart;
        log3(`[3/8] Date done in ${timings["fill-date"].toFixed(0)}ms`);
      } catch (err) {
        if (err instanceof AbortError) throw err;
        timings["fill-date"] = performance.now() - stepStart;
        return fail(
          "fill-date",
          `${err instanceof Error ? err.message : String(err)}`,
          dialog,
          timings
        );
      }
      checkAbort(isAborted2);
      stepStart = performance.now();
      log3(`[4/8] Filling duration: ${hours}h`);
      try {
        const durInput = await findInDialog(
          dialog,
          TEMPO_SELECTORS.durationInput,
          "durationInput"
        );
        const prevDur = durInput.value;
        log3(`[4/8] Duration input: ${describeEl5(durInput)}, current="${prevDur}"`);
        const formattedDuration = formatDuration(hours);
        onProgress("fill-duration", `Setting duration: ${formattedDuration}`);
        durInput.scrollIntoView({ block: "center", behavior: "instant" });
        durInput.focus();
        durInput.select();
        await sleep(50);
        await safeType(durInput, formattedDuration, { delay: 30 });
        const afterType = durInput.value;
        log3(`[4/8] After type: "${afterType}"`);
        durInput.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, bubbles: true })
        );
        durInput.dispatchEvent(
          new KeyboardEvent("keyup", { key: "Enter", keyCode: 13, bubbles: true })
        );
        await sleep(150);
        durInput.blur();
        dialog.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        dialog.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        try {
          await pollUntil(
            "duration-format",
            () => {
              const v = durInput.value;
              if (v && v !== String(hours) && v !== formattedDuration && v !== "0" && v !== "") return v;
              return null;
            },
            { timeoutMs: 2e3, intervalMs: 60, isAborted: isAborted2 }
          );
        } catch {
          log3(`[4/8] Duration format poll timed out, checking current value\u2026`);
        }
        const afterBlur = durInput.value;
        log3(`[4/8] After blur: "${afterBlur}"`);
        onProgress("fill-duration", `Duration set: "${afterBlur}" \u2713`);
        if (!afterBlur || afterBlur === "0h" || afterBlur === "0") {
          warn3(`[4/8] Duration suspicious: "${afterBlur}"`);
          onProgress("fill-duration", `\u26A0 Unexpected duration value: "${afterBlur}"`);
        }
        timings["fill-duration"] = performance.now() - stepStart;
        log3(`[4/8] Duration done in ${timings["fill-duration"].toFixed(0)}ms`);
      } catch (err) {
        if (err instanceof AbortError) throw err;
        timings["fill-duration"] = performance.now() - stepStart;
        return fail(
          "fill-duration",
          `${err instanceof Error ? err.message : String(err)}`,
          dialog,
          timings
        );
      }
      checkAbort(isAborted2);
      stepStart = performance.now();
      const resolvedFallbackWbs = getDefaultWbsFallback(weekStart);
      const preferredWbs = alloc.wbsName?.trim() ? [stripWbsCode(applyQuarterToWbsLabel(alloc.wbsName.trim(), weekStart))] : [];
      log3(
        `[6/8] Filling WBS. preferred=${JSON.stringify(
          preferredWbs
        )}, fallback=${resolvedFallbackWbs.substring(0, 30)}\u2026`
      );
      onProgress(
        "fill-wbs",
        `Selecting WBS: ${preferredWbs[0] ?? resolvedFallbackWbs.substring(0, 30)}...`
      );
      const wbsRoot = getTempoRoot();
      const openResult = await runVerifiedStep(
        "open-wbs-menu",
        () => openWbsMenu(wbsRoot),
        async () => {
          const expanded = getWbsInput(wbsRoot)?.getAttribute("aria-expanded") === "true";
          const listbox = !!getOpenListbox(wbsRoot);
          const opts = getWbsOptions(wbsRoot).length;
          log3(
            `[6/8] open-wbs verify: expanded=${expanded}, listbox=${listbox}, opts=${opts}`
          );
          return isWbsMenuOpen(wbsRoot);
        },
        { retries: 2, delayMs: 80, logPrefix: TAG5 }
      );
      if (!openResult.success) {
        timings["fill-wbs"] = performance.now() - stepStart;
        return fail(
          "fill-wbs",
          `open-wbs-menu: ${openResult.message}`,
          dialog,
          timings
        );
      }
      checkAbort(isAborted2);
      let selectedWbsLabel;
      try {
        selectedWbsLabel = await selectWbsOption(
          preferredWbs,
          resolvedFallbackWbs,
          wbsRoot,
          (msg) => {
            log3(`[6/8] ${msg}`);
            onProgress("fill-wbs", msg);
          },
          true
        );
      } catch (err) {
        if (err instanceof AbortError) throw err;
        timings["fill-wbs"] = performance.now() - stepStart;
        return fail(
          "fill-wbs",
          `selectWbsOption: ${err instanceof Error ? err.message : String(err)}`,
          dialog,
          timings
        );
      }
      checkAbort(isAborted2);
      try {
        await pollUntil(
          "wbs-verify",
          () => {
            const container = queryFirst(
              [wbsRoot],
              TEMPO_SELECTORS.wbsSingleValue
            );
            if (container) return true;
            const placeholder = queryFirst(
              [wbsRoot],
              TEMPO_SELECTORS.wbsPlaceholder
            );
            if (!placeholder) return true;
            return null;
          },
          { timeoutMs: 2e3, intervalMs: 50, isAborted: isAborted2 }
        );
        log3(`[6/8] WBS verified \u2713`);
      } catch {
        warn3(`[6/8] WBS verify timed out, checking text\u2026`);
        const isOk = await verifyWbsSelected(selectedWbsLabel, wbsRoot);
        if (!isOk) {
          timings["fill-wbs"] = performance.now() - stepStart;
          return fail("fill-wbs", "WBS verification failed", dialog, timings);
        }
      }
      onProgress("fill-wbs", `WBS \u2713 (${selectedWbsLabel.substring(0, 35)}\u2026)`);
      timings["fill-wbs"] = performance.now() - stepStart;
      log3(`[6/8] WBS done in ${timings["fill-wbs"].toFixed(0)}ms`);
      checkAbort(isAborted2);
      stepStart = performance.now();
      const workPhase = alloc.workPhase ?? DEFAULT_WORK_PHASE;
      log3(`[7/8] Filling Work Phase: "${workPhase}"`);
      try {
        onProgress("fill-work-phase", `Selecting Work Phase: "${workPhase}"...`);
        const wpRoot = getTempoRoot();
        const matched = await selectComboboxOption(
          wpRoot,
          "Work Attribute Work Phase",
          workPhase,
          onProgress,
          "fill-work-phase",
          isAborted2
        );
        if (!matched) {
          warn3(`[7/8] Work Phase not matched, continuing`);
          onProgress("fill-work-phase", `No match for "${workPhase}", continuing...`);
        } else {
          log3(`[7/8] Work Phase \u2713`);
        }
        timings["fill-work-phase"] = performance.now() - stepStart;
        log3(`[7/8] Work Phase done in ${timings["fill-work-phase"].toFixed(0)}ms`);
      } catch (err) {
        if (err instanceof AbortError) throw err;
        timings["fill-work-phase"] = performance.now() - stepStart;
        warn3(`[7/8] Work Phase failed (non-fatal):`, err);
      }
      checkAbort(isAborted2);
      const preSnap = snapshotDialog(dialog, root);
      log3(`[PRE-SUBMIT] ${JSON.stringify(preSnap)}`);
      const fieldErrs = detectFieldErrors(dialog, root);
      const realErrs = fieldErrs.filter((e) => e !== "This field is required");
      if (realErrs.length > 0) {
        warn3(`[PRE-SUBMIT] Field errors: ${realErrs.join("; ")}`);
        onProgress("submit", `\u26A0 Field errors before submit: ${realErrs.join("; ")}`);
      }
      const pageErr = detectPageErrors(dialog, root);
      if (pageErr) {
        return fail("submit", `Page error before submit: ${pageErr}`, dialog, timings);
      }
      stepStart = performance.now();
      if (dryRun) {
        log3(`[8/8] DRY RUN`);
        onProgress("verify", "Dry run \u2014 skip submit");
        try {
          const cancelBtn = queryFirst(
            [getTempoRoot()],
            TEMPO_SELECTORS.cancelButton
          );
          if (cancelBtn) await safeClick(cancelBtn, { delay: 50 });
          else
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
            );
        } catch {
        }
        timings["submit"] = performance.now() - stepStart;
        timings["total"] = performance.now() - formStart;
        log3(
          `===== fillTempoForm END (dry run) ${timings["total"].toFixed(
            0
          )}ms: ${label} =====`
        );
        log3(`Timings: ${JSON.stringify(timings)}`);
        return {
          state: "done",
          success: true,
          detail: `Dry run: ${label}`,
          timings
        };
      }
      log3(`[8/8] LIVE SUBMIT`);
      try {
        let submitBtn = null;
        let docUsed = getTempoRoot();
        for (const r of getTempoRoots()) {
          for (const sel of TEMPO_SELECTORS.submitButton) {
            const el = r.querySelector(sel);
            if (el && el.offsetParent !== null) {
              submitBtn = el;
              docUsed = r;
              log3(`[8/8] Submit found: "${sel}" \u2192 ${describeEl5(el)}`);
              break;
            }
          }
          if (submitBtn) break;
        }
        if (!submitBtn) {
          const { element: btn } = await waitForSelector(
            TEMPO_SELECTORS.submitButton,
            {
              root: getTempoRoot(),
              timeout: 5e3
            }
          );
          submitBtn = btn;
          docUsed = getTempoRoot();
        }
        const btnDisabled = submitBtn.disabled;
        const btnText = submitBtn.textContent?.trim();
        log3(`[8/8] Submit: text="${btnText}", disabled=${btnDisabled}`);
        if (btnDisabled) {
          const snap = snapshotDialog(dialog, root);
          timings["submit"] = performance.now() - stepStart;
          return fail(
            "submit",
            `Submit button is disabled. snap=${JSON.stringify(snap)}`,
            dialog,
            timings
          );
        }
        onProgress("submit", "Submitting\u2026");
        submitBtn.scrollIntoView({
          block: "center",
          behavior: "instant"
        });
        await sleep(50);
        await safeClick(submitBtn, { delay: 50 });
        log3(`[8/8] Clicked, polling for dialog close\u2026`);
        onProgress("verify", "Verifying dialog is closed...");
        try {
          await pollUntil(
            "dialog-close",
            () => {
              const d = docUsed.querySelector(
                TEMPO_SELECTORS.logDialog.join(", ")
              );
              return d ? null : true;
            },
            { timeoutMs: 8e3, intervalMs: 150, isAborted: isAborted2 }
          );
          log3(`[8/8] Dialog closed \u2713`);
        } catch {
          const d = docUsed.querySelector(TEMPO_SELECTORS.logDialog.join(", "));
          if (d) {
            const postErr = detectPageErrors(d, docUsed);
            const postSnap = snapshotDialog(d, docUsed);
            log3(
              `[8/8] Dialog still open! err="${postErr}", snap=${JSON.stringify(
                postSnap
              )}`
            );
            timings["submit"] = performance.now() - stepStart;
            return fail(
              "verify",
              `Dialog is still open. ${postErr ? `error: ${postErr}` : `snap=${JSON.stringify(postSnap)}`}`,
              d,
              timings
            );
          }
        }
        timings["submit"] = performance.now() - stepStart;
        timings["total"] = performance.now() - formStart;
        onProgress("done", `\u2713 ${label} (${timings["total"].toFixed(0)}ms)`);
        log3(
          `===== fillTempoForm END (success) ${timings["total"].toFixed(
            0
          )}ms: ${label} =====`
        );
        log3(`Timings: ${JSON.stringify(timings)}`);
        return {
          state: "done",
          success: true,
          detail: `Logged ${hours}h for ${alloc.ticketKey} on ${date} (${timings["total"].toFixed(0)}ms)`,
          timings
        };
      } catch (err) {
        if (err instanceof AbortError) throw err;
        timings["submit"] = performance.now() - stepStart;
        return fail(
          "submit",
          `${err instanceof Error ? err.message : String(err)}`,
          dialog,
          timings
        );
      }
    } catch (err) {
      if (err instanceof AbortError) {
        timings["total"] = performance.now() - formStart;
        log3(
          `===== fillTempoForm ABORTED ${timings["total"].toFixed(
            0
          )}ms: ${label} =====`
        );
        onProgress("error", "Aborted by user");
        try {
          const r = getTempoRoot();
          const cancelBtn = r.querySelector(
            TEMPO_SELECTORS.cancelButton.join(", ")
          );
          if (cancelBtn) cancelBtn.click();
          else
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
            );
        } catch {
        }
        return {
          state: "error",
          success: false,
          detail: "Aborted by user",
          timings
        };
      }
      throw err;
    }
  }

  // src/content/workflows/submit-week-plan.ts
  var TAG6 = "[TEMPO][submitWeekPlan]";
  var aborted = false;
  function stopAutomation() {
    console.log(TAG6, "stopAutomation called");
    aborted = true;
  }
  function isAborted() {
    return aborted;
  }
  async function submitWeekPlan(plan, dryRun, onProgress) {
    aborted = false;
    const results = [];
    const totalEntries = plan.allocations.reduce(
      (sum, a) => sum + DAY_KEYS.filter((d) => a.byDay[d] > 0).length,
      0
    );
    let entryIndex = 0;
    console.log(TAG6, `===== START: weekStart=${plan.weekStart}, dryRun=${dryRun}, allocations=${plan.allocations.length}, totalEntries=${totalEntries} =====`);
    for (const alloc of plan.allocations) {
      for (const day of DAY_KEYS) {
        if (aborted) {
          console.log(TAG6, `Aborted before ${alloc.ticketKey} ${day}`);
          return results;
        }
        const hours = alloc.byDay[day];
        if (hours <= 0) continue;
        entryIndex++;
        console.log(TAG6, `--- Entry ${entryIndex}/${totalEntries}: ${alloc.ticketKey} ${day} ${hours}h ---`);
        onProgress(alloc.ticketKey, day, "open-log-dialog");
        const t0 = performance.now();
        const result = await fillTempoForm(
          alloc,
          day,
          hours,
          plan.weekStart,
          dryRun,
          (state, detail) => onProgress(alloc.ticketKey, day, state, detail),
          isAborted
        );
        const elapsed = (performance.now() - t0).toFixed(0);
        const entryResult = {
          ticketKey: alloc.ticketKey,
          day,
          hours,
          success: result.success,
          step: result.state,
          message: result.detail,
          timestamp: Date.now(),
          timings: result.timings
        };
        results.push(entryResult);
        chrome.runtime.sendMessage({
          type: "TEMPO_AUTOMATION_ENTRY_RESULT",
          result: entryResult
        });
        if (result.success) {
          console.log(TAG6, `\u2713 ${alloc.ticketKey} ${day} ${hours}h \u2014 ${elapsed}ms`);
          if (result.timings) {
            console.log(TAG6, `  timings: ${JSON.stringify(result.timings)}`);
          }
        } else {
          console.error(TAG6, `\u2717 ${alloc.ticketKey} ${day} \u2014 step=${result.state}, detail=${result.detail}, ${elapsed}ms`);
        }
        if (aborted) {
          console.log(TAG6, `Aborted after ${alloc.ticketKey} ${day}`);
          return results;
        }
        await sleep(1500);
      }
    }
    const successes = results.filter((r) => r.success).length;
    const failures = results.filter((r) => !r.success).length;
    console.log(TAG6, `===== END: ${successes} success, ${failures} failed, ${results.length} total =====`);
    return results;
  }

  // src/content/tempo-content.ts
  console.log("[TEMPO] Tempo content script loaded");
  chrome.runtime.onMessage.addListener(
    (msg, _sender, sendResponse) => {
      if (msg.type === "PING" && msg.target === "tempo") {
        sendResponse({ type: "PONG", target: "tempo" });
        return false;
      }
      if (msg.type === "CHECK_WEEK_CAPACITY") {
        checkWeekCapacity(msg.weekStart).then((info) => {
          chrome.runtime.sendMessage({
            type: "WEEK_CAPACITY_RESULT",
            weekStart: msg.weekStart,
            info
          });
          sendResponse({ success: true, info });
        }).catch((err) => {
          const errorInfo = {
            allowed: true,
            loggedHours: 0,
            remainingHours: 40,
            maxHours: 40,
            reason: `Capacity check failed: ${String(err)}`
          };
          chrome.runtime.sendMessage({
            type: "WEEK_CAPACITY_RESULT",
            weekStart: msg.weekStart,
            info: errorInfo
          });
          sendResponse({ success: false, error: String(err), info: errorInfo });
        });
        return true;
      }
      if (msg.type === "START_TEMPO_AUTOMATION") {
        const { plan, dryRun } = msg;
        submitWeekPlan(
          plan,
          dryRun,
          (ticketKey, day, state, detail) => {
            chrome.runtime.sendMessage({
              type: "TEMPO_AUTOMATION_PROGRESS",
              ticketKey,
              day,
              state,
              detail
            });
          }
        ).then((results) => {
          chrome.runtime.sendMessage({
            type: "TEMPO_AUTOMATION_RESULT",
            results
          });
          sendResponse({ success: true });
        }).catch((err) => {
          sendResponse({ success: false, error: String(err) });
        });
        return true;
      }
      if (msg.type === "STOP_TEMPO_AUTOMATION") {
        stopAutomation();
        sendResponse({ success: true });
        return false;
      }
      return false;
    }
  );
})();
