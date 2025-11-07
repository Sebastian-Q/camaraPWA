const STATIC_CACHE = 'camara-pwa-static-v1';
const DYNAMIC_CACHE = 'camara-pwa-dynamic';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './images/icons/192.png',
  './images/icons/512.png'
];

// --- Instalar SW ---
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('📦 Archivos estáticos cacheados');
      return cache.addAll(urlsToCache);
    })
  );
});

// --- Activar SW ---
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      );
    })
  );
});

// --- Interceptar peticiones ---
self.addEventListener('fetch', event => {
  const request = event.request;

  // Si es una imagen generada por canvas (base64)
  if (request.url.startsWith('data:image/png;base64')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(async cache => {
        const match = await cache.match(request.url);
        if (match) return match;
        const response = await fetch(request);
        cache.put(request.url, response.clone());
        return response;
      })
    );
    return;
  }

  // Caché normal para los demás recursos
  event.respondWith(
    caches.match(request).then(
      res =>
        res ||
        fetch(request).then(response => {
          // Guarda dinámicamente otros archivos si deseas
          return response;
        })
    )
  );
});
