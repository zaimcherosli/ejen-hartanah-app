// Supabase Client Configuration & System Versioning
const SUPABASE_URL = 'https://csrzhidtzqxfbapsenhu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcnpoaWR0enF4ZmJhcHNlbmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0OTM3OTYsImV4cCI6MjEwMTA2OTc5Nn0.NnHFURbQTvsdgGbm1d_PC-hkOgQFQIHKTMQaS2n44SU';

// System Versioning & Build Info
window.CEM_SYSTEM = {
  VERSION: 'v2.3.2',
  BUILD_DATE: '2026-08-28',
  ENV: 'Production (Cloudflare Pages + Dedicated Traffic & Leads Analytics Portal Page & Streamlined Mobile Navigation)',
  PWA_VERSION: 'cem-pwa-v42'
};

// Console Diagnostic Log
console.log(
  `%c 🏢 Corporate Estate Malaysia | Build: ${window.CEM_SYSTEM.VERSION} (${window.CEM_SYSTEM.BUILD_DATE}) %c ${window.CEM_SYSTEM.ENV} `,
  'background: #0a192f; color: #38bdf8; font-weight: bold; padding: 4px 8px; border-radius: 4px 0 0 4px;',
  'background: #1e293b; color: #94a3b8; padding: 4px 8px; border-radius: 0 4px 4px 0;'
);

// Developer System Info Diagnostics Trigger
window.showSystemInfo = function() {
  const infoMsg = 
    `🏢 CORPORATE ESTATE MALAYSIA - SYSTEM DIAGNOSTICS\n` +
    `--------------------------------------------------\n` +
    `• App Version    : ${window.CEM_SYSTEM.VERSION}\n` +
    `• Build Date     : ${window.CEM_SYSTEM.BUILD_DATE}\n` +
    `• Environment    : ${window.CEM_SYSTEM.ENV}\n` +
    `• Service Worker : ${window.CEM_SYSTEM.PWA_VERSION}\n` +
    `• Database API   : Supabase PostgREST Connected\n` +
    `• Monitoring     : Sentry Real-Time Error Tracking Active 🛡️\n` +
    `• User Agent     : ${navigator.userAgent.slice(0, 60)}...\n` +
    `--------------------------------------------------\n` +
    `Status: All Systems Operational ✅`;
  alert(infoMsg);
};

// Developer Sentry Test Trigger
window.testSentryError = function() {
  if (window.Sentry) {
    Sentry.captureMessage("Test alert from Corporate Estate Malaysia Developer Diagnostics!");
    alert("✅ Mesej ujian Sentry berjaya dihantar! Sila semak dashboard Sentry anda.");
  } else {
    alert("⚠️ Sentry sedang dimuatkan, sila cuba sebentar lagi.");
  }
};

// Initialize Supabase Client
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// ⚡ Auto-inject version badge on any page that has id="versionBadge"
document.addEventListener('DOMContentLoaded', function() {
  const badge = document.getElementById('versionBadge');
  if (badge && window.CEM_SYSTEM) {
    badge.textContent = window.CEM_SYSTEM.VERSION;
  }
});
