const CACHE_NAME = 'bizmanager-v1';
const OFFLINE_URL = '/';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/globals.css'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation en cours...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache créé, ajout des assets statiques');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Erreur lors du cache des assets statiques:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation en cours...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Suppression du cache ancien:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes externes
  if (!request.url.includes(self.location.origin)) {
    return;
  }

  // Stratégie network-first pour les API
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
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

  // Stratégie cache-first pour les assets statiques
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
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });

          return response;
        })
        .catch(() => {
          return new Response('Hors ligne - contenu indisponible', {
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
