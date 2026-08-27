# Add-to-group modal

## Overview

Clicking the "List" button on a LinkedIn profile opens a popup where you can pick which list to save
that person to, or create a new list on the spot. Right now the list of groups shown is fake sample
data ("Recruiters", "Q3 Outreach", "Conference — Madrid") — nothing you do here is saved yet. This
step is purely about getting the popup's look and interactions right before wiring it up to real
storage in the next step.

## Technical notes

- **Files**: `src/content/modal.ts` (new module), wired up from `src/content/content.ts` (imports
  `openAddToGroupModal`, calls it on List-button click instead of just logging to console).
- **Shadow DOM**: unlike the List button (which has to fight LinkedIn's own button styles with
  `!important`), the modal lives in a shadow root (`host.attachShadow({ mode: "open" })`) with
  `:host { all: initial }`. LinkedIn's page styles can't leak in, so the modal's CSS is written
  normally — no specificity battles.
- **State**: fully in-memory, scoped to one `buildModal()` call — `selectedIndex` tracks which group
  radio is selected, `groups` is a local array seeded from a hardcoded `FAKE_GROUPS` constant. Nothing
  persists after the modal closes; "Save to list" currently just `console.log`s what it *would* save.
- **Closing**: three ways in — the × button, "Cancel", clicking the dark overlay outside the card, or
  pressing Escape (a `keydown` listener added on open and removed on close, so it doesn't leak once
  the modal is gone).
- **"Save to list" is disabled** (not just inert) when there's no group selected — relevant right
  after opening if there are zero groups and none has been created yet.
- **Dark mode**: the modal's colors are CSS custom properties on `:host`, redefined under
  `:host(.dark)` using the design mockup's dark tokens. `src/content/theme.ts` holds the shared
  `isDarkMode()` check (also used by the List button) — `openAddToGroupModal` adds a `dark` class to
  the shadow host when LinkedIn is in dark mode, which flips every color at once via the CSS
  variables rather than duplicating each rule per theme.
- **What Step 3 changes**: `FAKE_GROUPS` gets replaced with a real read from `chrome.storage.local`,
  "+ Create" persists the new group instead of only updating in-memory state, and "Save to list" 
  actually writes the profile into the chosen group — plus the duplicate-check warning described in
  `docs/duplicate-check.md` gets added between selecting a group and saving.
