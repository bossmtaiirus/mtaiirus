// public/sw.js
// LearnByAKP.online Web Push Service Worker

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }

  const title = data.title || "Mtaiirus.pages.dev";
  const options = {
    body: data.body || "New notification from LearnByAKP.online",
    icon: data.icon || "https://mtaiirus.pages.dev/lo.png",
    badge: "https://mtaiirus.pages.dev/lo.png",    
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const payload = event.notification.data || {};
  const targetUrl = payload.url || "https://mtaiirus.pages.dev/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const target = new URL(targetUrl, self.location.origin);

      // Agar koi tab same origin ka already open hai to use focus + optionally navigate
      for (const client of clientList) {
        try {
          const url = new URL(client.url);
          if (url.origin === target.origin) {
            client.focus();
            // optional: client.navigate(target.href);
            return;
          }
        } catch (e) {}
      }

      // Nahi mila to naya tab khol do
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
