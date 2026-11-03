const CACHE_NAME = 'astra-shell-v3'

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    const response = await fetch('/')
    if (!response.ok) throw new Error('No se pudo guardar la página de inicio.')
    await cache.put('/', response.clone())
    const html = await response.text()
    const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((match) => match[1])
    const workerAssets = []
    for (const asset of assets.filter((path) => path.endsWith('.js'))) {
      const scriptResponse = await fetch(asset)
      if (!scriptResponse.ok) throw new Error(`No se pudo guardar el código de la app: ${asset}`)
      const script = await scriptResponse.text()
      for (const match of script.matchAll(/[`"']((?:\/|\.{1,2}\/)assets\/[^`"']+\.js)[`"']/g)) {
        const path = new URL(match[1], self.location.origin).pathname
        if (!assets.includes(path) && !workerAssets.includes(path)) workerAssets.push(path)
      }
    }
    await cache.addAll(['/manifest.webmanifest', '/icon.svg', '/data/cities.tsv', '/data/ATTRIBUTION.txt', ...assets, ...workerAssets])
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key.startsWith('astra-shell-') && key !== CACHE_NAME).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) void caches.open(CACHE_NAME).then((cache) => cache.put('/', response.clone()))
      return response
    }).catch(async () => {
      const cached = await caches.match('/')
      return cached ?? new Response('No hay una versión guardada de la app.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }))
    return
  }

  event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request).then((response) => {
    if (response.ok) void caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
    return response
  })))
})
