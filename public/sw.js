/* ============================================================
   NOTIFICATIONS PUSH - Service worker (fichier a mettre sur le site)
   A placer dans le dossier "public" de ton depot GitHub, pour qu'il
   soit servi a l'adresse  https://ton-site/sw.js
   (Vite, Create React App et Next.js servent le dossier public a la racine.)
   ============================================================ */

self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) { data = { titre: "FCSM Equipes", corps: event.data ? event.data.text() : "" }; }

  const titre = data.titre || "FCSM Equipes";
  const options = {
    body: data.corps || "",
    icon: "/icon-192.png",   // si ce fichier n'existe pas, la notification s'affiche quand meme
    badge: "/icon-192.png",
    data: { url: data.url || "/" },
    tag: data.tag || undefined,
    renotify: !!data.tag,
    vibrate: [120, 60, 120],
  };
  event.waitUntil(self.registration.showNotification(titre, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ("focus" in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
