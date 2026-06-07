// Type declarations for non-code imports handled by the bundler.

// CSS Modules. extension.js bundles `*.module.css` as `type: 'css/module'`,
// which emits *named* exports (one per class). Import the whole namespace:
//
//   import * as styles from './Button.module.css'
//   <div class={styles.button} />
//
// The index signature types every class access as a string.
declare module '*.module.css' {
  const classes: {readonly [key: string]: string}
  export = classes
}

declare module '*.module.scss' {
  const classes: {readonly [key: string]: string}
  export = classes
}

// Global stylesheets imported for their side effect only.
declare module '*.css'

// Static assets resolve to their emitted URL string.
declare module '*.png' {
  const src: string
  export default src
}
declare module '*.svg' {
  const src: string
  export default src
}
declare module '*.jpg' {
  const src: string
  export default src
}
declare module '*.webp' {
  const src: string
  export default src
}
