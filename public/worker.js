var CACHE_NAME = "pwa-task-manager";
var urlsToCache = ["/", "/completed"];

// Install a service worker
self.addEventListener("install", (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Cache and return requests
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // Cache hit - return response
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

// Update a service worker
self.addEventListener("activate", (event) => {
  var cacheWhitelist = ["pwa-task-manager"];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});


const checkPermission = () => {
  if (!('serviceWorker' in navigator)){
    throw new Error("No support for service worker")
  }

  if (!('Notification' in window)){
    throw new Error("No support for notifications")
  }
}

const requestNotifPermission = async () => {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted'){
    throw new Error("Notification permit not granted")
  }else{
    new Notification("Hello world")
  }
}
