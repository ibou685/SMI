// frontend/public/sw.js - Service Worker minimal pour PWA

const CACHE_NAME = 'smi-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/logo-smi.jpeg',
  '/favicon.ico',
  '/manifest.json'  
];

// ✅ Installation : mettre en cache les ressources de base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .catch(err => console.log('Cache error:', err))
  );
  self.skipWaiting();
});

// ✅ Activation : nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ✅ Fetch : servir depuis le cache si possible (stratégie "Network First")
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes API (toujours aller sur le réseau)
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});