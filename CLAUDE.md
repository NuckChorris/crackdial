# CrackDial

A custom new tab page (Kagi search + manageable speed dials), built with
[extension.js](https://extension.js.org), Preact, and TypeScript. The page
overrides `chrome_url_overrides.newtab` and works in Chromium browsers and
Firefox.

## Commands

```bash
npm run dev                      # dev server + live browser (Chromium)
npm run dev -- --browser=firefox
npm run typecheck                # tsc --noEmit — the real type gate (see below)
npm run build                    # production build -> dist/chromium
npm run build:firefox            # -> dist/firefox
npm run build:edge               # -> dist/edge
```

Type checking is separate from building: the bundler compiles with **SWC,
which strips types but does not check them**. Always run `npm run typecheck`
to catch type errors.

## Watcher-proof builds (important when inspecting `dist/`)

The IDE's preview panel auto-starts one or more `extension dev` watchers (e.g.
`extension dev` and `extension dev --browser=firefox`). Each watcher
**continuously owns and rewrites its `dist/<browser>/` directory** with a
development bundle (HMR / Preact Fast Refresh wrappers).

The practical consequence: if a watcher is running, you **cannot reliably
inspect or serve a production build from `dist/chromium` or `dist/firefox`** —
the watcher clobbers your `npm run build` output moments later with a dev
bundle. Symptoms:

- The served page is blank, and the console spams `[HMR] Waiting for update
  signal from WDS...`.
- `dist/chromium/.../newtab.js` is large (100KB+) instead of the ~20KB
  production bundle.

### How to get a clean production bundle to inspect

Build for a target **no watcher owns**. The watchers are Chromium and Firefox,
so Edge is free:

```bash
rm -rf dist/edge && npm run build:edge
# dist/edge now holds a clean production build the watchers won't touch.
grep -c "Waiting for update signal" dist/edge/chrome_url_overrides/newtab.js  # -> 0
```

Verify it's clean: `0` HMR hits, and `newtab.js` ~20KB.

### Previewing a production build as a static page

The built HTML uses absolute asset paths (`/chrome_url_overrides/newtab.js`),
so serve the **build root** (not the `chrome_url_overrides` subdir) and add a
redirect to the entry page:

```bash
printf '%s' '<!DOCTYPE html><meta http-equiv="refresh" content="0; url=/chrome_url_overrides/newtab.html">' > dist/edge/index.html
python3 -m http.server 4605 --directory dist/edge
```

Because there's no extension runtime in a plain static server, `chrome.storage`
is absent — `storage.ts` falls back to the default seed dials, which is fine
for visual checks.

### Don't kill the watchers to "fix" this

The watchers back the IDE preview panel and launch real browsers with the
extension loaded — that's the best way to test interactively. Build to `edge`
for static inspection instead of killing them.

## Conventions worth knowing

- **Layout is feature-folders under `src/newtab/`.** The shell stays at the
  root (`App.tsx`, `scripts.js`, `index.html`, `styles.css`); everything else
  lives in a folder: `shared/` (`types`, `util`, `palette`, `storage`,
  `icons`), `search/`, `weather/` (`Weather.tsx`, `data.ts`, `icons.tsx`), and
  `dials/` (the grid + edit UI, plus `dials/providers/`). A component and its
  CSS module sit together, imported relatively (`./Weather.module.css`);
  cross-folder imports use the absolute `#/newtab/<folder>/<name>` form. **macOS
  is case-insensitive**, so never pair a `Foo.tsx` component with a `foo.ts`
  module in the same folder — tsc's `forceConsistentCasingInFileNames` treats
  them as one file (this is why `weather/`'s logic is `data.ts`, not
  `weather.ts`). Name the helper for what it holds instead.
- **`#/` imports** map to `./src/*` (package.json `imports` field + tsconfig
  `paths`) and are written **extensionless**:
  `import {App} from '#/newtab/App'`. The project is `"type": "module"`, so the
  `config` hook in `extension.config.js` sets `resolve.fullySpecified: false`
  to allow extensionless ESM resolution. **CSS imports keep their extension**
  (`import '#/newtab/styles.css'`, `import * as s from './X.module.css'`).
- **CSS Modules** (`*.module.css`) emit **named exports** here, so import the
  namespace: `import * as styles from './X.module.css'`. Global stylesheets
  (e.g. `styles.css`) are imported for side effect only.
- The `scripts.js` entry stays plain `.js` (it's what `index.html` references)
  and uses `h()` rather than JSX; everything it imports is TypeScript.
