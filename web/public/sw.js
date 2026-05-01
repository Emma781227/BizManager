// Stratégie: Network-first pour les pages HTML, cache-first pour les assets
const CACHE_STATIC = 'bizmanager-static-v2';
const CACHE_DYNAMIC = 'bizmanager-dynamic-v2';
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

  // Toujours laisser Next.js gerer ses bundles pour eviter les mismatch d'hydratation.
  if (url.pathname.startsWith('/_next/')) {
    return;
  }

  // 1️⃣ NETWORK-ONLY pour les pages HTML (toujours fraiches)
  if (request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .catch(() => {
          console.log('[SW] Réseau indisponible pour la navigation:', url.pathname);
          return new Response('Hors ligne - contenu indisponible', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        })
    );
    return;
  }

  // 2️⃣ NETWORK-ONLY pour les API (toujours fraiches)
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return new Response(JSON.stringify({ offline: true }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
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
