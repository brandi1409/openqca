/*
 * openQCA Service Worker (plain JS, kein Build-Schritt).
 *
 * Ziel: die installierte PWA nach dem ersten Besuch offline nutzbar machen,
 * ohne die App-Logik zu berühren. Strategie:
 *  - Navigationsanfragen: network-first, mit Cache-Fallback (exakte URL,
 *    dann "/app") wenn das Netz ausfällt.
 *  - Statische Next-Assets ("/_next/static/"), Icons ("/icons/") und
 *    "/icon.svg": cache-first mit Nachladen im Hintergrund.
 *  - API-Routen ("/api/") werden NIE gecacht, immer direkt durchgereicht.
 *  - Nur GET, nur same-origin. Alles defensiv in try/catch — der Service
 *    Worker darf niemals einen Fehler werfen, der die Seite blockiert.
 */

/*
 * Cache-Name trägt die Build-Version (QUALITY-SPEC A5.1): PwaRegister
 * registriert "/sw.js?v=<BUILD_TS>" — jede neue Version ergibt eine neue
 * SW-URL, der neue Worker übernimmt (skipWaiting + claim) und räumt beim
 * Aktivieren alle alten "openqca-*"-Caches weg. So kann kein Deploy-Stand
 * tagelang aus einem veralteten Cache bedient werden.
 */
var VERSION = "dev";
try {
  VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
} catch {
  // URL-Parsing fehlgeschlagen → "dev" als Fallback.
}
var CACHE_NAME = "openqca-" + VERSION;
var CACHE_PREFIX = "openqca-";

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    (async function () {
      try {
        await self.clients.claim();
        var keys = await caches.keys();
        await Promise.all(
          keys
            .filter(function (key) {
              return key.indexOf(CACHE_PREFIX) === 0 && key !== CACHE_NAME;
            })
            .map(function (key) {
              return caches.delete(key);
            }),
        );
      } catch {
        // Aufräumen fehlgeschlagen ist unkritisch — Worker bleibt aktiv.
      }
    })(),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.indexOf("/_next/static/") === 0 ||
    url.pathname.indexOf("/icons/") === 0 ||
    url.pathname === "/icon.svg"
  );
}

self.addEventListener("fetch", function (event) {
  try {
    var request = event.request;

    if (request.method !== "GET") return;

    var url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // API-Routen niemals cachen, immer durchreichen.
    if (url.pathname.indexOf("/api/") === 0) return;

    if (request.mode === "navigate") {
      event.respondWith(networkFirstNavigate(request));
      return;
    }

    if (isStaticAsset(url)) {
      event.respondWith(cacheFirstWithRevalidate(request));
      return;
    }
  } catch {
    // Bei unerwarteten Fehlern: nichts tun, Browser macht den normalen Fetch.
  }
});

async function networkFirstNavigate(request) {
  try {
    var response = await fetch(request);
    try {
      var cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    } catch {
      // Cache-Schreibfehler ignorieren, Antwort trotzdem ausliefern.
    }
    return response;
  } catch {
    try {
      var cache2 = await caches.open(CACHE_NAME);
      var cached = await cache2.match(request);
      if (cached) return cached;
      var appFallback = await cache2.match("/app");
      if (appFallback) return appFallback;
    } catch {
      // Cache-Zugriff fehlgeschlagen — es bleibt nur der Fehler unten.
    }
    return new Response("Offline und keine gecachte Version verfügbar.", {
      status: 503,
      statusText: "Offline",
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function cacheFirstWithRevalidate(request) {
  try {
    var cache = await caches.open(CACHE_NAME);
    var cached = await cache.match(request);

    var networkFetch = fetch(request)
      .then(function (response) {
        try {
          cache.put(request, response.clone());
        } catch {
          // Cache-Schreibfehler ignorieren.
        }
        return response;
      })
      .catch(function () {
        return undefined;
      });

    if (cached) {
      // Stale-while-revalidate light: Cache sofort liefern, im Hintergrund
      // nachladen (Fehler dort werden bewusst verschluckt, s.o.).
      void networkFetch;
      return cached;
    }

    var fresh = await networkFetch;
    if (fresh) return fresh;
    return new Response("", { status: 504, statusText: "Offline" });
  } catch {
    try {
      return await fetch(request);
    } catch {
      return new Response("", { status: 504, statusText: "Offline" });
    }
  }
}
