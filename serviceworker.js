urlsToCache = [
    "https://mathezirkel-augsburg.github.io/wandertag-app/",
    // "/", // technically this would need to be cached for properly caching on localhost. It however breaks the deploy version, because that does not live on the top level of a domain, but is in the route "...wandertag-app"
    "", // Replacement for the starting page "/" for relative urls. I do not think it is working though. Replacement for in-browser-usage is the full url of the deployment (first entry) and for the installed version the entrypoint is "index.html" anyway (next line)
    "index.html",
    "app.js",
    "styles.css",
    "app.webmanifest",
    "favicon.ico",
    "assets/favicons/apple-touch-icon.png",
    "assets/favicons/favicon-16x16.png",
    "assets/favicons/favicon-32x32.png",
    "assets/favicons/safari-pinned-tab.svg",
    "assets/icons/icon-48x48.png",
    "assets/icons/icon-72x72.png",
    "assets/icons/icon-128x128.png",
    "assets/icons/icon-144x144.png",
    "assets/icons/icon-152x152.png",
    "assets/icons/icon-192x192.png",
    "assets/icons/icon-384x384.png",
    "assets/icons/icon-512x512.png",
    "https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.css",
    "https://cdn.jsdelivr.net/npm/ol@v7.5.1/ol.css",
    "https://cdnjs.cloudflare.com/ajax/libs/openlayers/7.5.0/dist/ol.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/mapbox-polyline/1.2.0/polyline.min.js",
    "tracking.html",
    "tracking.js",
    "secret.html",
    "secret.js",
    "paths.json",
    "logo.png",
];

// This code executes in its own worker or thread
self.addEventListener("install", (event) => {
    console.log("Service worker installed");

    // cache all application requirements for offline use
    event.waitUntil(
        caches.open("pwa-assets").then((cache) => {
            // add cache busting param for own .js and .html
            let bust = Date.now();
            let urls_with_cache_bust = urlsToCache.map((url) =>
                url.includes(".html") ||
                (url.includes(".js") && !url.includes(".min.js")) ||
                (url.includes(".css") && !url.includes("cdn"))
                    ? url + "?bust=" + bust
                    : url
            );

            return cache.addAll(urls_with_cache_bust);
        })
    );
});
self.addEventListener("activate", (event) => {
    console.log("Service worker activated");
});

// fetch event listener
self.addEventListener("fetch", (event) => {
    event.respondWith(
        // ignore search params (like url "...?bust=123123123") to allow for cache busting to take place as there is no other use for the search parameters in this application
        caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
            // It can update the cache to serve updated content on the next request
            return cachedResponse || fetch(event.request);
        })
    );
});
