// Cloudflare Pages Function: Real-Time Article View Counter & Analytics Tracker
const SUPABASE_URL = 'https://csrzhidtzqxfbapsenhu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcnpoaWR0enF4ZmJhcHNlbmh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQ5Mzc5NiwiZXhwIjoyMTAxMDY5Nzk2fQ.P4ZBaDNqRw0hMA3wVkkk-0xIhzhp0uPlF9fCf1elKuM';

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
  };
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const slug = (body.slug || '').trim();
    const articleId = (body.article_id || body.id || '').trim();

    if (!slug && !articleId) {
      return new Response(JSON.stringify({ error: 'Missing article slug or id' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    let queryParam = slug ? `slug=eq.${encodeURIComponent(slug)}` : `id=eq.${encodeURIComponent(articleId)}`;
    const fetchRes = await fetch(`${SUPABASE_URL}/rest/v1/articles?${queryParam}&select=id,views_count`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (!fetchRes.ok) {
      return new Response(JSON.stringify({ error: 'Article lookup failed' }), {
        status: 404,
        headers: corsHeaders()
      });
    }

    const rows = await fetchRes.json();
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: corsHeaders()
      });
    }

    const article = rows[0];
    const newViewsCount = (article.views_count || 0) + 1;

    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${article.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        views_count: newViewsCount
      })
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      return new Response(JSON.stringify({ error: 'Failed to update views count: ' + errText }), {
        status: 500,
        headers: corsHeaders()
      });
    }

    return new Response(JSON.stringify({
      success: true,
      article_id: article.id,
      views_count: newViewsCount
    }), {
      status: 200,
      headers: corsHeaders()
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}
