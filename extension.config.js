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
