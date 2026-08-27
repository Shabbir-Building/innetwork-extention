# Floating button and groups panel

## Overview

A small round button sits in the bottom-left corner of every LinkedIn page. Clicking it opens a
panel sliding in from the left edge, listing all your saved lists with how many people are in each.
Click a list to see who's in it — their photo, name, and a link that opens their LinkedIn profile in
a new tab. Click "All groups" to go back, or close the panel with the × or Escape. Clicking the
floating button again while the panel is open also closes it.

## Technical notes

- **Files**: `src/content/panel.ts` (new module), mounted once from `src/content/content.ts` via
  `mountFloatingButtonAndPanel()` at content-script load time (not scoped to profile pages — the
  button and panel are available site-wide, matching the plan's requirement).
- **Two shadow-DOM hosts**: the floating button (`#lgl-fab-host`) and the panel
  (`#lgl-panel-host`) are separate shadow roots, each with their own `<style>` — same isolation
  approach as the add-to-group modal, so LinkedIn's page styles can't interfere.
- **Shared design tokens**: both stylesheets duplicate the same light/dark CSS custom property block
  (`SHARED_TOKENS`/`SHARED_DARK_TOKENS` constants) rather than importing a shared stylesheet, since
  each shadow root needs its own `<style>` tag — there's no way to share a stylesheet element across
  independent shadow roots without re-inserting it. Dark mode is applied the same way as the modal: a
  `.dark` class on the host, checked once via `isDarkMode()` when each host is created.
- **View state**: `openPanel()` keeps a local `view` variable (`{kind: "groups"}` or
  `{kind: "members", group}`) and a `requestToken` counter. Every call to `renderCurrentView()`
  captures the current token; if the user navigates away (e.g. clicks "All groups") before an
  in-flight `chrome.storage` read resolves, the stale read's result is discarded instead of
  overwriting a view the user has since left.
- **Toggle behavior**: `openPanel()` closes the panel if one is already open (so the floating button
  acts as a toggle), otherwise creates a fresh one. Only one panel instance exists at a time via the
  module-level `currentPanel` variable.
- **Members view**: shows a loading state immediately (`renderMembersView(..., null, ...)`) while
  `getMembersForGroup()` resolves, then re-renders with the real list. Each member row is an `<a>`
  (not a button) pointing at `profileUrl`, opened in a new tab — clicking a member takes you back to
  their LinkedIn profile.
- **Not built yet**: no way to remove a member or delete a group from this panel — left for a later
  polish pass, same as the modal.
