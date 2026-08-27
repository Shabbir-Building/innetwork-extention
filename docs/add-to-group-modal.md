# Add-to-group modal

## Overview

Clicking the "List" button on a LinkedIn profile opens a popup where you can pick which list to save
that person to, or create a new list on the spot. Groups and their member counts are your real saved
data now — the popup briefly shows "Loading your lists…" while it reads from storage, then shows your
actual lists. Creating a list or saving a profile to one is permanent (until you remove it later,
which isn't built yet). If the profile is already saved somewhere, a warning tells you which list(s)
before you decide whether to add it to another one too — see `docs/duplicate-check.md`.

## Technical notes

- **Files**: `src/content/modal.ts` (UI), `src/content/storage.ts` (persistence), wired up from
  `src/content/content.ts` (imports `openAddToGroupModal`, calls it on List-button click).
- **Shadow DOM**: unlike the List button (which has to fight LinkedIn's own button styles with
  `!important`), the modal lives in a shadow root (`host.attachShadow({ mode: "open" })`) with
  `:host { all: initial }`. LinkedIn's page styles can't leak in, so the modal's CSS is written
  normally — no specificity battles.
- **Load sequence**: `openAddToGroupModal` opens immediately with a loading state
  (`buildLoadingModal`), then fetches `getGroups()` and `findGroupsContainingProfile()` in parallel.
  When both resolve, the loading overlay is swapped for the real modal (`buildModal`). A
  `host.isConnected` check guards against the modal having already been closed before the fetch
  finishes (e.g. the user hit Escape while it was loading).
- **State**: `groups` is loaded once when the modal opens; `selectedId` tracks the selected group by
  its storage id (not array index, so it survives the list being re-fetched after "+ Create"). Default
  selection prefers the first *non-duplicate* group, so the Save button isn't disabled by default when
  duplicates exist elsewhere.
- **"+ Create"** calls `createGroup()` (writes to storage), then re-fetches `getGroups()` so the new
  group's real id and member count (0) are reflected, and selects it.
- **"Save to list"** calls `addMemberToGroup(groupId, profile)` and closes the modal on success. Both
  it and "+ Create" disable themselves while their async call is in flight, to prevent double-submits.
- **Closing**: the × button, "Cancel", clicking the dark overlay outside the card, or Escape (a
  `keydown` listener added on open, removed on close).
- **Dark mode**: the modal's colors are CSS custom properties on `:host`, redefined under
  `:host(.dark)` using the design mockup's dark tokens. `src/content/theme.ts` holds the shared
  `isDarkMode()` check (also used by the List button).
- **What's still missing**: no way to remove a member or delete a group from this modal — that's
  planned for the groups panel (Step 4) and/or a later polish pass, not this popup.
