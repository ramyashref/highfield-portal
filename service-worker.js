const CACHE_NAME = "highfield-v5";
const CORE = [
  "./", "index.html", "about.html", "programs.html","js/registration.js","js/program-detail.js","js/program-catalog.js","register.html","program.html", "accreditations.html", "council.html", "verification.html",
  "css/site.css", "css/verification.css", "css/verification-mobile.css", "css/print.css",
  "js/site.js", "js/programs.js", "js/config.js", "js/utils.js", "js/certificate.js", "js/qr.js", "js/pdf.js", "js/app.js",
  "assets/certificate-template.png", "assets/hero-certificate.png", "assets/favicon.svg"
];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => { if(e.request.method !== "GET") return; e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); });
