/**
 * In-memory access token registry.
 *
 * This tiny module breaks the circular dependency between useApi.js and auth.js:
 *   auth.js → useApi.js → tokenRegistry.js  ✓  (no cycle)
 *   auth.js → tokenRegistry.js              ✓  (no cycle)
 *
 * The token lives ONLY in memory — never in localStorage.
 */
let _token = null

export const tokenRegistry = {
  get: ()      => _token,
  set: (token) => { _token = token },
  clear: ()    => { _token = null }
}
