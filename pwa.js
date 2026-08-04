// PWA & Notification Handler for Corporate Estate Malaysia
(function() {
  let deferredPrompt = null;

  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('CEM PWA Service Worker Registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('CEM SW registration failed:', err);
        });
    });
  }

  // 2. Handle 'beforeinstallprompt' Event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showPwaInstallBanner();
  });

  // 3. Create & Show Sleek Floating PWA Install Banner
  function showPwaInstallBanner() {
    if (document.getElementById('pwaInstallBanner')) return;
    if (localStorage.getItem('cem_pwa_dismissed') === 'true') return;

    const banner = document.createElement('div');
    banner.id = 'pwaInstallBanner';
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 32px);
      max-width: 440px;
      background: #0a192f;
      color: white;
      padding: 0.9rem 1rem;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      border: 1px solid rgba(255,255,255,0.15);
      animation: pwaSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    banner.innerHTML = `
      <style>
        @keyframes pwaSlideUp {
          from { transform: translate(-50%, 100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      </style>
      <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0;">
        <img src="/logo.png" alt="CEM Logo" style="width: 42px; height: 42px; border-radius: 8px; object-fit: contain; background: white; padding: 2px; flex-shrink: 0;">
        <div style="min-width: 0;">
          <div style="font-weight: 800; font-size: 0.88rem; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Install CEM App</div>
          <div style="font-size: 0.75rem; color: #94a3b8; line-height: 1.2;">Pasang ke Skrin Utama untuk Akses Pantas &amp; Notifikasi</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;">
        <button id="pwaInstallBtn" type="button" style="padding: 0.45rem 0.75rem; background: #dc2626; color: white; border: none; border-radius: 6px; font-weight: 800; font-size: 0.78rem; cursor: pointer; white-space: nowrap; box-shadow: 0 2px 8px rgba(220,38,38,0.4);">
          Install
        </button>
        <button id="pwaCloseBtn" type="button" style="padding: 0.45rem 0.55rem; background: transparent; color: #cbd5e1; border: none; font-size: 0.9rem; cursor: pointer; font-weight: 700;">
          ✕
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('pwaInstallBtn').addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('PWA Choice:', outcome);
        deferredPrompt = null;
      }
      banner.remove();
      requestNotificationPermission();
    });

    document.getElementById('pwaCloseBtn').addEventListener('click', () => {
      localStorage.setItem('cem_pwa_dismissed', 'true');
      banner.remove();
    });
  }

  // 4. Request Push Notification Permission
  window.requestNotificationPermission = async function() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      console.log('Notification permission already granted.');
      return;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted!');
        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification('Corporate Estate Malaysia', {
              body: '🎉 Notifikasi CEM Berjaya Diberdayakan! Anda akan menerima kemaskini terus ke peranti.',
              icon: '/logo.png',
              badge: '/logo.png'
            });
          });
        }
      }
    }
  };

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('CEM PWA App was installed successfully.');
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.remove();
  });
})();
