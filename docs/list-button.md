# List button on profile pages

## Overview

When you visit someone's LinkedIn profile (a page like `linkedin.com/in/their-name`), the extension
adds a small "List" button next to LinkedIn's own Message/Follow/More buttons. Clicking it captures
that person's name, photo, and profile link. Right now that's all it does — the button just prints
the captured data to the browser's developer console, as a checkpoint before we build the actual
"add to group" UI on top of it in the next step.

## Technical notes

- **Files**: `src/content/content.ts` (logic), `src/content/content.css` (button style) — compiled to
  `extension/content/` by `npm run build` (see `docs/typescript-build.md`).
- **Profile-page detection**: regex match on `window.location.href` against
  `^https://www.linkedin.com/in/[^/?#]+`.
- **SPA navigation handling**: LinkedIn is a single-page app — going from one profile to another
  doesn't reload the page. We patch `history.pushState`/`replaceState` and listen for `popstate` to
  detect route changes, removing and re-injecting the button each time. A `MutationObserver` on
  `document.body` provides a second trigger, since the button-row DOM can render asynchronously after
  the URL has already changed.
- **Button placement**: found by scanning `main button` elements for one whose text or `aria-label`
  starts with "message", "follow", "connect", or "more" (case-insensitive), then appending our button
  into that button's parent container.
- **Data extraction — important gotcha**: LinkedIn's CSS classes are fully hashed/generated (e.g.
  `_89d1f328`) and carry no semantic meaning — confirmed by live inspection, not assumption. Nothing
  here is selected by class name:
  - **Name** comes from `document.title`, which LinkedIn renders as `"{Name} | LinkedIn"`. This is
    far more stable than any DOM element.
  - **Photo** is picked structurally: the largest roughly-square (`aspect ratio` between 0.85–1.15)
    image inside `<main>`. Cover photos are wide/short and get excluded by the aspect-ratio check;
    the profile photo is square and wins by being the largest match.
  - **Profile URL** reuses the same regex as page detection, applied to `window.location.href`.
- **Known fragility**: if LinkedIn changes its `<title>` format, the name extraction breaks. If a
  profile has an unusually-shaped photo or a large square decorative image appears before the actual
  photo in `<main>`, the photo extraction could pick the wrong image. Both are visible immediately in
  the console log, so easy to catch if LinkedIn changes something later.
