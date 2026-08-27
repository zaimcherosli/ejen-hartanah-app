// Corporate Estate Malaysia - Real-Time Website Traffic & Lead Analytics Tracker
(function() {
  'use strict';

  // 1. Initialize or retrieve persistent Session ID
  function getSessionId() {
    let sess = sessionStorage.getItem('cem_session_id');
    if (!sess) {
      sess = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
      sessionStorage.setItem('cem_session_id', sess);
    }
    return sess;
  }

  // 2. Detect device type
  function getDeviceType() {
    const ua = navigator.userAgent || '';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua) || (window.innerWidth <= 768)) {
      return 'mobile';
    }
    return 'desktop';
  }

  // 3. Send Analytics Beacon
  async function sendTrafficBeacon(eventType, extra = {}) {
    try {
      const payload = {
        event_type: eventType,
        page_path: window.location.pathname || '/',
        page_title: document.title || 'Corporate Estate Malaysia',
        referrer: document.referrer ? new URL(document.referrer, window.location.origin).hostname : 'Direct',
        device_type: getDeviceType(),
        session_id: getSessionId(),
        target_id: extra.target_id || window.location.pathname,
        target_title: extra.target_title || document.title,
        ...extra
      };

      // Use navigator.sendBeacon if available, otherwise fetch
      const endpoint = '/api/track-traffic';
      const dataStr = JSON.stringify(payload);

      if (navigator.sendBeacon) {
        const blob = new Blob([dataStr], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
      } else {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: dataStr,
          keepalive: true
        }).catch(function() {});
      }
    } catch (e) {
      console.warn('Analytics beacon error:', e);
    }
  }

  // Global tracker method
  window.trackCemEvent = function(eventType, extra) {
    sendTrafficBeacon(eventType, extra);
  };

  // 4. Automatic Page View Tracker
  function trackPageView() {
    // Avoid double counting on quick tab switches within 15 seconds
    const path = window.location.pathname || '/';
    const lastKey = 'cem_last_pv_' + path;
    const lastTime = sessionStorage.getItem(lastKey);
    const now = Date.now();

    if (!lastTime || (now - parseInt(lastTime, 10)) > 15000) {
      sessionStorage.setItem(lastKey, now.toString());
      sendTrafficBeacon('page_view');
    }
  }

  // 5. Automatic WhatsApp Lead Click Tracker
  function setupWhatsAppTracking() {
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href') || '';
      if (href.includes('wa.me') || href.includes('whatsapp.com') || href.includes('api.whatsapp.com')) {
        const text = (link.innerText || link.getAttribute('title') || 'WhatsApp Button').trim();
        const pageTitle = document.title || 'Corporate Estate Malaysia';
        
        sendTrafficBeacon('whatsapp_click', {
          target_title: text ? `${text} (di ${pageTitle})` : `WhatsApp Inquiry (di ${pageTitle})`,
          target_id: href
        });
      }
    }, true);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      trackPageView();
      setupWhatsAppTracking();
    });
  } else {
    trackPageView();
    setupWhatsAppTracking();
  }
})();
