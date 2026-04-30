// Stratégie: Network-first pour les pages HTML, cache-first pour les assets
const CACHE_STATIC = 'bizmanager-static-v1';
const CACHE_DYNAMIC = 'bizmanager-dynamic-v1';
const OFFLINE_URL = '/';

const STATIC_ASSETS = [
  '/manifest.json'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation en cours...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_STATIC).then((cache) => {
        console.log('[SW] Cache statique créé');
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('[SW] Erreur lors du cache des assets:', err);
        });
      }),
      caches.open(CACHE_DYNAMIC).then((cache) => {
        console.log('[SW] Cache dynamique créé');
      })
    ])
  );
  self.skipWaiting();
});

// Activation du service worker - Supprime les anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation en cours...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_STATIC && cacheName !== CACHE_DYNAMIC) {
            console.log('[SW] Suppression du cache ancien:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complète');
      return self.clients.claim();
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes externes
  if (!request.url.includes(self.location.origin)) {
    return;
  }

  // 1️⃣ NETWORK-FIRST pour les pages HTML (important pour pages à jour)
  if (request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          const clonedResponse = response.clone();
          caches.open(CACHE_DYNAMIC).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          console.log('[SW] Réseau indisponible, utilisation du cache pour:', url.pathname);
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('Hors ligne - contenu indisponible', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        })
    );
    return;
  }

  // 2️⃣ NETWORK-FIRST pour les API (données fraîches)
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_DYNAMIC).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response(JSON.stringify({ offline: true }), {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // 3️⃣ CACHE-FIRST pour les assets statiques (CSS, JS, images)
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const clonedResponse = response.clone();
            caches.open(CACHE_STATIC).then((cache) => {
              cache.put(request, clonedResponse);
            });

            return response;
          })
          .catch(() => {
            console.log('[SW] Impossible de charger l\'asset:', url.pathname);
            return new Response('Asset indisponible', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
    );
    return;
  }

  // 4️⃣ Fallback: cache-first pour tout le reste
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const clonedResponse = response.clone();
          caches.open(CACHE_DYNAMIC).then((cache) => {
            cache.put(request, clonedResponse);
          });

          return response;
        })
        .catch(() => {
          return new Response('Contenu indisponible', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
    })
  );
});

// Gestion des messages depuis le client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    self.clients.claim();
  }
});
