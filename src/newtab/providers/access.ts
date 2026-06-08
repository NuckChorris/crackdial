// Reading a site's markup is a cross-origin fetch, which needs host access.
// Rather than request broad access up front, we ask for the one origin at the
// moment the user triggers auto-fill (a user gesture). The origin must be
// covered by `optional_host_permissions` / `optional_permissions` in the
// manifest. In a plain static preview (no chrome.permissions API) we resolve
// true and let the fetch attempt proceed or fail on its own.
export function ensureHostAccess(rawUrl: string): Promise<boolean> {
  const perms = globalThis.chrome?.permissions
  if (!perms?.request) return Promise.resolve(true)

  let origin: string
  try {
    origin = `${new URL(rawUrl).origin}/*`
  } catch {
    return Promise.resolve(false)
  }

  return new Promise((resolve) => {
    perms.request({origins: [origin]}, (granted) => resolve(Boolean(granted)))
  })
}
