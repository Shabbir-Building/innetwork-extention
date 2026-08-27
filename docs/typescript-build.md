# TypeScript build

## Overview

The extension's code is now written in TypeScript instead of plain JavaScript, which catches a class
of bugs (wrong types, typos in property names, forgetting a function can return `null`) before you
ever load the extension in Chrome. Since browsers can't run TypeScript directly, a build step
compiles it into regular JavaScript first. Nothing about how the extension *works* changed — same
List button, same behavior — only how it's written and prepared for loading into Chrome.

## Technical notes

- **Source lives in `src/`**: `src/manifest.json`, `src/background/service-worker.ts`,
  `src/content/content.ts` + `content.css`, `src/icons/`. This is what you edit.
- **`extension/` is now generated output**, not source — it's listed in `.gitignore` and rebuilt from
  `src/` on demand. Load *this* folder unpacked in Chrome, same as before; just build first (or after
  any source change).
- **Build tool**: [esbuild](https://esbuild.github.io/), invoked via `build.mjs` at the repo root.
  Bundles each TypeScript entry point (`content.ts`, `service-worker.ts`) into a single plain-JS file
  with a matching name, wrapped in an IIFE (`format: "iife"`) so content-script code doesn't leak
  variables into LinkedIn's own page scope. Static files (manifest, icons, CSS) are copied across
  unchanged.
- **Commands** (`package.json`):
  - `npm run build` — one-off compile to `extension/`.
  - `npm run watch` — same, but rebuilds automatically on file save (useful while developing).
  - `npm run typecheck` — runs `tsc --noEmit`, i.e. type-checks without producing output; good for a
    fast correctness check without doing a full build.
- **TypeScript config** (`tsconfig.json`): `strict: true` plus `noUncheckedIndexedAccess` — array/
  object index access (e.g. `candidates[0]`) is typed as possibly `undefined` even if you "know" it
  isn't, forcing an explicit check. `@types/chrome` is included so `chrome.runtime`,
  `chrome.storage`, etc. are properly typed as we start using them in later steps.
- **First-time setup**: `npm install` once to pull down TypeScript/esbuild/`@types/chrome` into
  `node_modules/` (also gitignored).
