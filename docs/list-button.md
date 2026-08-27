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
- **Button placement**: scans `main button` elements for ones whose text or `aria-label` starts with
  "message", "follow", "connect", or "more" (case-insensitive). LinkedIn sometimes wraps each action
  button in its own container, so a single matched button's direct parent isn't necessarily the
  shared row — we find two matched buttons and walk up to their common ancestor, which is the actual
  flex row, and append there.
- **Style isolation**: the button is injected directly into LinkedIn's DOM (no shadow root), so
  LinkedIn's own button styles can outweigh ours in the cascade. Every visual property is `!important`
  and starts from `all: unset` to strip LinkedIn's inherited styling first, guaranteeing our exact
  colors/shape render regardless of what LinkedIn's stylesheet does.
- **Dark mode**: LinkedIn's dark theme is an independent in-app setting (not tied to OS
  `prefers-color-scheme`). Detected via `document.body.getAttribute('data-color-scheme') === 'dark'`
  (LinkedIn's modern surfaces) with a `theme--dark` class fallback (older pages), re-checked on every
  navigation since the button is recreated each time. A `.lgl-dark` class swaps to darker tokens
  matching the design mockup's dark palette.
- **Sizing**: matched to LinkedIn's real Message-button pill via live DevTools measurement —
  `padding: 4px 12px`, `border-radius: 24px`, `font-size: 14px`. (LinkedIn's own buttons nest the
  visible pill inside a larger invisible hit-target, which makes naive outer-box comparisons
  misleading — the true pill is a rounded child span, not the outer clickable element.)
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
