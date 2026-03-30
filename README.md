# Tempo Weekly Planner

A Chrome Extension (Manifest V3) that streamlines weekly time logging by scraping Jira tickets and automating Tempo worklog entries via DOM automation.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)

## What it does

1. **Scrapes your Jira board** — pulls ticket key, summary, and status from your active sprint/filter
2. **Builds a weekly plan** — allocate hours across Mon–Fri per ticket, with one-click auto-allocation to hit exactly 40h
3. **Automates Tempo logging** — fills in the log-time dialog (issue, date, duration, description, WBS Name, Work Phase) automatically
4. **Dry Run mode** — walks through every form fill without submitting so you can verify before committing

## Installation (Developer Mode)

This extension is distributed as an unpacked build. Chrome Web Store publication is not required.

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select this folder (`dist/`)
6. The **Tempo Weekly Planner** icon will appear in your toolbar

> **Note:** Pin the extension from the puzzle-piece menu for easy access.

## Requirements

- Google Chrome (or any Chromium-based browser)
- Access to a Jira instance at `*.atlassian.net`
- Tempo Timesheets app installed in your Jira workspace
- You must be logged into Atlassian in the same browser session

> **Domain note:** The current build is configured for a specific Atlassian subdomain. If you use a different Jira instance, you will need to update the `host_permissions` and `content_scripts.matches` entries in `manifest.json` to match your domain, then reload the extension.

## How to use

### Step 1 — Scrape your Jira tickets

1. Click the extension icon to open the side panel
2. Go to the **Jira** tab
3. Click **Open Jira Page** — this navigates to your Jira issues filter
4. Click **Refresh Tickets** to scrape all visible tickets
5. Select the tickets you want to log time against and click **Add to Plan**

### Step 2 — Plan your week

1. Switch to the **Tempo** tab
2. Each selected ticket appears with hour inputs for Mon–Fri
3. Enter hours manually, or click **Auto Allocate 40h** to distribute evenly across selected tickets and working days
4. The total is validated — the planner won't let you proceed unless hours add up correctly

### Step 3 — Log time automatically

1. Open your Tempo page (the extension will navigate there if needed)
2. Toggle **Dry Run** ON for a safe preview — the extension will fill every form without clicking Submit
3. Click **Start Dry Run** and watch each entry get filled in
4. If everything looks correct, toggle Dry Run OFF and run again to submit for real
5. Failed entries are tracked individually — use **Retry Failed** to re-attempt only the ones that errored

## Features at a glance

| Feature | Description |
|---|---|
| Ticket scraping | Reads key, summary, and status from Jira list view |
| Weekly planner | Per-ticket, per-day hour allocation with 40h validation |
| Auto-allocate | One click to distribute 40h evenly |
| DOM automation | Fills Tempo log-time dialogs without manual input |
| Dry Run | Full walkthrough without submitting — verify first |
| Failure recovery | Per-record tracking, retry failed items, stop mid-run |

## Debugging

| Component | How to inspect |
|---|---|
| Side Panel | Right-click the panel → Inspect |
| Service Worker | `chrome://extensions/` → click the "Service Worker" link |
| Jira content script | Open Jira page → DevTools Console → filter by `[TEMPO]` |
| Tempo content script | Open Tempo page → DevTools Console → filter by `[TEMPO]` |

## Known limitations

- DOM automation is inherently fragile — if Atlassian updates their UI, selectors may need updating
- Tempo runs inside an iframe; in rare cases the content script may fail to reach it
- Jira's virtual-scroll list may not capture all tickets in a single pass — scroll down before refreshing
- The extension requires an active Atlassian login in the current browser session

## License

MIT
