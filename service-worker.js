importScripts("./js/deployment-version.js");

const DEPLOYMENT_VERSION = String(self.AT_SPICES_DEPLOYMENT_VERSION || "dev");
const CACHE_PREFIX = "at-spices-shop-";
const CACHE_NAME = `${CACHE_PREFIX}${DEPLOYMENT_VERSION}`;
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./css/app.css",
  "./css/fonts.css",
  "./js/deployment-version.js",
  "./js/app.js",
  "./js/entry-page.js",
  "./js/product-page.js",
  "./data/products.csv",
  "./assets/ATlogo-round-ar-630.png",
  "./assets/fonts/cairo/Cairo-Arabic.woff2"
];

async function precacheFresh() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(PRECACHE_URLS.map(async url => {
    const request = new Request(new URL(url, self.registration.scope), { cache: "reload" });
    const response = await fetch(request);
    if (!response.ok) throw new Error(`Could not cache ${url}.`);
    await cache.put(request, response);
  }));
}

self.addEventListener("install", event => {
  event.waitUntil(precacheFresh().then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(cacheFirst(request));
});
