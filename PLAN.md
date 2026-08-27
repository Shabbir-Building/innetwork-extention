# LinkedIn Group Lister — Build Plan

A personal Chrome extension (Manifest V3, unpacked/dev-mode install) that lets you group LinkedIn
profiles into named lists ("groups"), stored in a Google Sheet, with a "List" button injected on
profile pages and an in-page right-side panel to browse groups.

## Decisions locked in (from Q&A)

- **Auth**: Google OAuth via `chrome.identity.getAuthToken` (not Apps Script, not a service account).
  You'll do a one-time Google Cloud OAuth Client setup. Since the extension stays unpacked, its ID
  must be pinned with a `key` in `manifest.json` so the OAuth client registration doesn't break on
  reload.
- **Distribution**: Just you, unpacked/dev mode only. No Chrome Web Store, no OAuth verification
  needed. Practical consequence: while the OAuth consent screen is in "Testing" mode, Google expires
  your access roughly every 7 days and you'll need to re-click "Allow" — not a bug, just how
  unverified apps work. Fine for personal use.
- **Data captured per profile**: name, photo URL, and profile URL (so you can click back to LinkedIn
  from the side panel).
- **Storage**: Google Sheets is the source of truth for groups + members. `chrome.storage.local`
  holds config (Sheet ID) and the session-scoped OAuth token — nothing sensitive touches
  `chrome.storage.sync` or cookies.
- **Duplicate check**: before adding a profile to a group, check **every group's members** (not just
  the target group) by **profile URL**. If the profile already exists anywhere, show a warning naming
  which group(s) it's already in — this is a warning, not a hard block, so you can still confirm and
  add it to the new group too (a person can legitimately belong to more than one group).

## Clarified: "side panel" means an in-page panel, not Chrome's native Side Panel API

Note: an earlier draft of this plan assumed "side panel" meant Chrome's built-in
`chrome.sidePanel` API (a browser-level panel docked outside the page, only openable via a
toolbar-icon click due to a user-gesture restriction). That's **not** what's wanted here.

What's actually wanted, and what this plan now builds: a **custom `<div>` panel that the content
script injects directly into the LinkedIn page**, anchored to the right edge, toggled by a small
floating button also injected into the page (bottom-right, as originally described). This is simpler
than the native API and has no special gesture restrictions — a page-injected button can freely open
a page-injected div.

- **"List" button** on the profile page → opens a small **in-page modal** (injected `<div>` overlay,
  shadow DOM). This is where you pick/create a group and save the current profile into it.
- **Small floating button, bottom-right of the page** → toggles a **custom right-edge panel** (also
  an injected `<div>`, shadow DOM, `position: fixed`, vertically scrollable/responsive). Shows the
  list of groups with member counts; clicking a group drills into its member list (photo, name, link
  back to profile) inside the same panel.

Both the modal and the panel are plain DOM UI built and controlled entirely by the content script —
no `sidePanel` permission needed, no toolbar icon required for this flow.

## LinkedIn-specific risk notes (brief, factual)

- LinkedIn actively probes for known extension resource signatures and can rate-limit accounts it
  associates with automated data collection. This extension only acts when *you* click a button on a
  profile *you* are already viewing (no bulk scraping, no background crawling), which is a
  meaningfully lower-risk usage pattern than scrapers, but isn't risk-free.
- LinkedIn's DOM/class names change periodically and are obfuscated; the button-injection selectors
  will need occasional maintenance when LinkedIn ships a redesign.
- Keep this for personal use as planned — the plan does not include any bulk-scraping, auto-connect,
  or messaging automation features.

---

## Build steps

We build incrementally — one small, testable feature per step. Each step ends with something you can
load into Chrome and click on. We will NOT move to the next step until the current one works for you.

### Step 0 — Scaffolding
- `manifest.json` (MV3), icons (placeholder), folder structure (`content/` for the injected script,
  UI, and styles; `background/` for the service worker), empty background service worker, empty
  content script matched to `linkedin.com/*` (needed on all pages, not just `/in/*`, since the
  floating button + right panel should be available site-wide).
- Load unpacked into Chrome, confirm it appears with no errors in `chrome://extensions`.
- **Outcome**: extension installs, no functionality yet.

### Step 1 — Inject the "List" button on profile pages
- Content script detects profile pages, uses `MutationObserver` (scoped to the action-button
  container) + navigation-change detection to (re-)insert a "List" button next to Message/Follow.
- Handles LinkedIn's SPA navigation (profile → profile without reload).
- Button click just `console.log`s the detected name/photo/URL for now — proves scraping works
  before we build UI.
- **Outcome**: visiting any profile shows a working "List" button; clicking it logs correct profile
  data to the console.

### Step 2 — In-page modal (no data persistence yet)
- Clicking "List" opens a modal overlay (shadow DOM to avoid LinkedIn CSS collisions) styled
  minimally.
- Modal shows a hardcoded fake list of groups + a "+ New group" input, purely as UI — no storage
  wired up.
- **Outcome**: modal opens/closes correctly, matches basic UX you described, still no real data.

### Step 3 — Local persistence (chrome.storage.local only, no Sheets yet)
- Wire the modal to real `chrome.storage.local`: create groups, list groups, add the
  current profile (name/photo/url) to a chosen group.
- **Duplicate check**: before saving, scan members across *all* groups by `profileUrl`. If found,
  show an inline warning in the modal: e.g. "Already in: Recruiters, Q3 Leads" — with an explicit
  "Add anyway" confirm and a "Cancel" option, rather than silently blocking or silently allowing.
  If the profile is already in the *target* group specifically, just block that duplicate outright
  (no reason to store the same person twice in one group).
- **Outcome**: fully working group-assignment flow, persisted locally, with duplicate warnings. This
  alone is usable even before Sheets exists.

### Step 4 — Floating button + in-page right panel: browse groups
- Content script injects a small floating button, fixed to the bottom-right of the page (persists
  across LinkedIn navigation, same shadow-DOM approach as the modal).
- Clicking it toggles a custom right-edge panel (`<div>`, `position: fixed`, full viewport height,
  scrollable) listing all groups with member counts (read from `chrome.storage.local`).
- Click a group → panel drills into its member list (photo, name, link back to profile URL), with a
  way to go back to the group list.
- **Outcome**: floating button + right panel fully functional against local storage, on every
  LinkedIn page (not just profile pages).

### Step 5 — Google Cloud OAuth setup (guided, manual steps on your end)
- I'll give you exact click-by-click instructions: create a Google Cloud project, enable the Google
  Sheets API, configure the OAuth consent screen (Testing mode, you as test user), create an OAuth
  Client ID of type "Chrome Extension" using your extension's fixed ID.
- We generate a fixed `key` for `manifest.json` so the extension ID never changes.
- **Outcome**: you have a Client ID; nothing in the extension changes yet.

### Step 6 — Google Sheets integration: connect + read
- First-run flow: the right panel checks `chrome.storage.local` for a saved Sheet ID; if missing,
  shows an input to paste a Google Sheet URL/ID (and a "Sign in with Google" button using
  `chrome.identity.getAuthToken`).
- We define the sheet schema (two tabs: `Groups` [id, name], `Members` [id, groupId, name, photoUrl,
  profileUrl, addedAt]).
- Read existing groups/members from the Sheet into the right panel (replacing local-storage reads).
- **Outcome**: right panel reflects real Sheet contents; local storage now only caches Sheet ID +
  token, not group data.

### Step 7 — Google Sheets integration: write
- "New group" and "Add profile to group" now call Sheets API `values.append` / batch update instead
  of local storage.
- **Duplicate check now runs against the Sheet's `Members` tab** (the real source of truth) instead
  of local storage — same behavior as Step 3: warn with the group name(s) already containing that
  `profileUrl`, block exact same-group duplicates outright, allow "Add anyway" across different
  groups. This also naturally catches duplicates added from another device/browser session, since the
  Sheet is now authoritative.
- Handle the weekly re-auth prompt gracefully (detect 401, re-trigger `getAuthToken`).
- **Outcome**: full round-trip — add from LinkedIn profile → appears in your Google Sheet → visible in
  the right panel, with duplicate warnings backed by the real database.

### Step 8 — Polish pass
- Loading/error states (API failures, rate limits, offline), delete group / remove member, basic
  empty states, icon design.
- **Outcome**: extension feels solid for daily personal use.

---

## What I need from you to start Step 0

Nothing yet — Step 0 is pure scaffolding I can do solo. I'll need your input at:
- **Step 5**: you'll need to actually click through Google Cloud Console with me (I can give exact
  steps, but you must be logged into your own Google account to create the project/OAuth client — I
  cannot do this on your behalf).

Say "go" and I'll start Step 0.
