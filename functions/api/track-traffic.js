// Cloudflare Pages Function: Live Traffic & Lead Tracker Beacon Engine
const SUPABASE_URL = 'https://csrzhidtzqxfbapsenhu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcnpoaWR0enF4ZmJhcHNlbmh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQ5Mzc5NiwiZXhwIjoyMTAxMDY5Nzk2fQ.P4ZBaDNqRw0hMA3wVkkk-0xIhzhp0uPlF9fCf1elKuM';

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
  };
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const {
      event_type = 'page_view',
      page_path = '/',
      page_title = '',
      target_id = '',
      target_title = '',
      referrer = '',
      device_type = 'desktop',
      session_id = 'anon'
    } = body;

    // Filter out bots / spam
    const userAgent = context.request.headers.get('user-agent') || '';
    if (/bot|crawl|spider|slurp|facebookexternalhit|bingbot|googlebot/i.test(userAgent)) {
      return new Response(JSON.stringify({ success: true, ignored: 'bot' }), {
        headers: corsHeaders()
      });
    }

    const actionType = `TRAFFIC_${event_type.toUpperCase()}`;
    const details = JSON.stringify({
      path: page_path,
      title: page_title,
      target_id: target_id,
      target_title: target_title,
      referrer: referrer,
      device: device_type,
      user_agent: userAgent.substring(0, 150)
    });

    // 1. Insert into activity_logs table
    const logRes = await fetch(`${SUPABASE_URL}/rest/v1/activity_logs`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_email: session_id,
        action_type: actionType,
        details: details,
        target_id: target_id || page_path,
        created_at: new Date().toISOString()
      })
    });

    // 2. Also try insert into site_traffic table if exists
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/site_traffic`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: event_type,
          page_path: page_path,
          page_title: page_title,
          target_id: target_id,
          target_title: target_title,
          referrer: referrer,
          device_type: device_type,
          session_id: session_id,
          created_at: new Date().toISOString()
        })
      });
    } catch (_) {
      // Graceful fallback to activity_logs
    }

    return new Response(JSON.stringify({ success: true, recorded: actionType }), {
      headers: corsHeaders()
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}
