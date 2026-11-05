/* ============================================================
   NOTIFICATIONS PUSH - Service worker (fichier a mettre sur le site)
   A placer dans le dossier "public" de ton depot GitHub, pour qu'il
   soit servi a l'adresse  https://ton-site/sw.js
   (Vite, Create React App et Next.js servent le dossier public a la racine.)
   ============================================================ */

self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });

// Compteur local de la pastille (icone d'accueil). Il augmente a chaque notification
// recue appli fermee ; l'appli, a son ouverture, remet le chiffre exact des messages non lus.
let badgeCount = 0;

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

  // Pastille rouge avec le nombre de messages : on l'incremente a chaque push recu.
  // Si le serveur fournit un compte precis (badge_count), on l'utilise directement.
  const majPastille = () => {
    try {
      if (typeof data.badge_count === "number") badgeCount = data.badge_count;
      else badgeCount = badgeCount + 1;
      if (self.navigator && self.navigator.setAppBadge) return self.navigator.setAppBadge(badgeCount).catch(() => {});
    } catch (e) {}
    return Promise.resolve();
  };

  event.waitUntil(Promise.all([
    self.registration.showNotification(titre, options),
    majPastille(),
  ]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // On ouvre l'appli ; l'appli recalculera la pastille exacte a l'ouverture.
  try { badgeCount = 0; if (self.navigator && self.navigator.clearAppBadge) self.navigator.clearAppBadge().catch(() => {}); } catch (e) {}
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ("focus" in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
