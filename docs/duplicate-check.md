# Duplicate check

## Overview

Before you save a profile to a list, the extension checks whether that person is already saved
*anywhere* — not just in the list you're about to pick. If they are, you'll see a warning naming
which list(s) already have them. You can still add them to a different list (someone can reasonably
be on more than one list — e.g. both "Recruiters" and "Q3 Outreach"), but you can't add the same
person to the *same* list twice — that option is simply disabled, since there'd be no point.

## Technical notes

- **Files**: `src/content/storage.ts` (`findGroupsContainingProfile`), `src/content/modal.ts`
  (`buildWarnBox`, the `duplicateGroupIds` logic in `buildModal`).
- **Matching key**: profile URL (`profileUrl`), not name — two different people can share a name, but
  the canonical `linkedin.com/in/...` URL is unique per profile.
- **How the check runs**: `findGroupsContainingProfile(profileUrl)` scans every member across every
  group in storage (not scoped to the group you're about to select) and returns the groups that
  already contain a member with that URL. This runs once when the modal opens, in parallel with
  loading the full group list.
- **UI behavior**:
  - If any duplicates exist, an amber warning box appears above the group list, naming the group(s)
    (e.g. "Already saved to **Recruiters** and **Q3 Outreach**"). Amber, not red — this is a heads-up,
    not an error state.
  - Each duplicate group's row in the list is labeled "(already added)" and cannot be selected as the
    save target — `updateSaveState()` disables the Save button when the selected group is one of the
    duplicates. This is the "block outright" behavior for the *exact same group*.
  - Selecting any *other* (non-duplicate) group re-enables Save, and the button's label changes to
    "Add anyway" whenever duplicates exist elsewhere, as a reminder of the context — even though the
    click only ever adds to the currently selected group, never removes from the others.
  - The default selected group (on modal open) is the first non-duplicate one, so a first-time save
    into a *new* list isn't accidentally blocked by an unrelated duplicate.
- **Where this changes next**: Step 7 (Google Sheets write) replaces `findGroupsContainingProfile`'s
  local-storage scan with a query against the Sheet's `Members` tab, so the check also catches
  duplicates added from another browser/device — the UI behavior described above doesn't change, only
  where the data comes from.
