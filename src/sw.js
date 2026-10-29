// Chordhub service worker. Built by the `serviceWorker` plugin in vite.config.ts, which
// replaces the two placeholders below. The whole app (code, fonts, chord data, icons)
// is precached on first visit, so every screen works offline afterwards.
const VERSION = __VERSION__
const PRECACHE = __PRECACHE__
const CACHE = `chordhub-${VERSION}`
const INDEX = new URL('index.html', self.registration.scope).href
// Precached files are content-hashed, so the URL alone identifies them. ignoreVary matters:
// hosts send `Vary: Origin`, and module/CSS requests carry an Origin header the precache didn't.
const MATCH = { ignoreSearch: true, ignoreVary: true }

self.addEventListener('install', (e) => {
  // addAll is atomic: if any file fails, this version isn't installed and the old one keeps serving.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => /^chord(hub|box)-/.test(k) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  // Hash routing: every navigation is the one shell page.
  if (req.mode === 'navigate') {
    e.respondWith(caches.match(INDEX, MATCH).then((r) => r || fetch(req)))
    return
  }
  e.respondWith(
    caches.match(req, MATCH).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        }),
    ),
  )
})
