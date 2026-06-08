/** @type {import('extension').FileConfig} */
// Extension.js uses a fresh profile on every run.
// Prefer that default? Remove the profile config below.
const profile = (name) => `./dist/extension-profile-${name}`
const ciFlags = process.env.CI ? ['--no-sandbox', '--disable-gpu'] : []

export default {
  // The project is `"type": "module"`, so ESM resolution defaults to "fully
  // specified" — every import would need an explicit extension. Relax that for
  // our own JS/TS modules so extensionless, bundler-style imports work
  // (e.g. `import {App} from '#/newtab/App'`). CSS imports keep their
  // extension (`.css` / `.module.css`).
  config: (config) => {
    config.module = config.module || {}
    config.module.rules = config.module.rules || []
    config.module.rules.push({
      test: /\.([cm]?[jt]sx?)$/,
      resolve: {fullySpecified: false}
    })
    // Firefox (MV2) dev builds default to an `eval`-based source map
    // (`eval-cheap-source-map`); Chromium (MV3) uses the non-eval
    // `cheap-source-map`. Under the dev server the entry `scripts.js` gets an
    // injected `import.meta.webpackHot` block that marks it strict ESM, and on
    // the `eval` devtool path rspack then stops honoring the
    // `fullySpecified: false` rule above for our `#/…` subpath-imports
    // specifiers — so `import {App} from '#/newtab/App'` resolves to a missing
    // module and the new tab page renders blank in Firefox. Dropping the
    // `eval-` prefix matches the working MV3 source map (and drops the reliance
    // on `unsafe-eval`). Production builds use `devtool: false` and are
    // untouched.
    if (typeof config.devtool === 'string' && config.devtool.startsWith('eval-')) {
      config.devtool = config.devtool.slice('eval-'.length)
    }
    return config
  },
  browser: {
    chrome: {profile: profile('chrome'), browserFlags: ciFlags},
    chromium: {profile: profile('chromium'), browserFlags: ciFlags},
    edge: {profile: profile('edge'), browserFlags: ciFlags},
    firefox: {profile: profile('firefox')},
    'chromium-based': {
      profile: profile('chromium-based'),
      browserFlags: ciFlags
    },
    'gecko-based': {profile: profile('gecko-based')}
  }
}
