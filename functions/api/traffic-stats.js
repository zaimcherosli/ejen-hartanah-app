// Cloudflare Pages Function: Real-Time Traffic & Lead Analytics Aggregator API
const SUPABASE_URL = 'https://csrzhidtzqxfbapsenhu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcnpoaWR0enF4ZmJhcHNlbmh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQ5Mzc5NiwiZXhwIjoyMTAxMDY5Nzk2fQ.P4ZBaDNqRw0hMA3wVkkk-0xIhzhp0uPlF9fCf1elKuM';

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
  };
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet() {
  try {
    // 1. Fetch traffic events from activity_logs
    const logsRes = await fetch(`${SUPABASE_URL}/rest/v1/activity_logs?action_type=like.TRAFFIC_*&order=created_at.desc&limit=1500`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    const events = logsRes.ok ? await logsRes.json() : [];

    // 2. Fetch top articles from articles table
    const articlesRes = await fetch(`${SUPABASE_URL}/rest/v1/articles?select=title,slug,views_count,category&order=views_count.desc&limit=6`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    const topArticles = articlesRes.ok ? await articlesRes.json() : [];

    // 3. Compute timestamps for today (Malaysia UTC+8)
    const now = new Date();
    const myTzOffsetMs = 8 * 60 * 60 * 1000;
    const nowMy = new Date(now.getTime() + myTzOffsetMs);
    const todayStrMy = nowMy.toISOString().split('T')[0];

    // Aggregations
    const allVisitors = new Set();
    const todayVisitors = new Set();
    let totalPageviews = 0;
    let todayPageviews = 0;
    let totalWhatsappClicks = 0;
    let todayWhatsappClicks = 0;

    const pageCountMap = {};
    const countryCountMap = {};
    const deviceCountMap = { mobile: 0, desktop: 0, tablet: 0 };
    const recentActivities = [];

    const COUNTRY_NAMES = {
      'MY': 'Malaysia',
      'SG': 'Singapore',
      'ID': 'Indonesia',
      'TH': 'Thailand',
      'VN': 'Vietnam',
      'PH': 'Philippines',
      'BN': 'Brunei',
      'CN': 'China',
      'HK': 'Hong Kong',
      'TW': 'Taiwan',
      'JP': 'Japan',
      'KR': 'South Korea',
      'IN': 'India',
      'AU': 'Australia',
      'NZ': 'New Zealand',
      'US': 'United States',
      'GB': 'United Kingdom',
      'DE': 'Germany',
      'FR': 'France',
      'NL': 'Netherlands',
      'AE': 'United Arab Emirates',
      'SA': 'Saudi Arabia',
      'QA': 'Qatar',
      'CA': 'Canada'
    };

    for (const item of events) {
      const sessionId = item.user_email || 'anon';
      const action = item.action_type || '';
      const createdAt = item.created_at || '';
      
      const itemDateMy = new Date(new Date(createdAt).getTime() + myTzOffsetMs).toISOString().split('T')[0];
      const isToday = itemDateMy === todayStrMy;

      allVisitors.add(sessionId);
      if (isToday) todayVisitors.add(sessionId);

      let parsedDetails = {};
      try {
        parsedDetails = typeof item.details === 'string' ? JSON.parse(item.details) : (item.details || {});
      } catch (_) {
        parsedDetails = {};
      }

      const path = parsedDetails.path || item.target_id || '/';
      const title = parsedDetails.title || path;
      const device = (parsedDetails.device || 'desktop').toLowerCase();
      
      const rawCountry = (parsedDetails.country || 'MY').toUpperCase().trim();
      const countryName = COUNTRY_NAMES[rawCountry] || rawCountry;
      const city = parsedDetails.city || '';

      countryCountMap[countryName] = (countryCountMap[countryName] || 0) + 1;

      if (device.includes('mob')) deviceCountMap.mobile++;
      else if (device.includes('tab')) deviceCountMap.tablet++;
      else deviceCountMap.desktop++;

      if (action.includes('PAGE_VIEW')) {
        totalPageviews++;
        if (isToday) todayPageviews++;
        pageCountMap[path] = (pageCountMap[path] || 0) + 1;
      }

      if (action.includes('WHATSAPP')) {
        totalWhatsappClicks++;
        if (isToday) todayWhatsappClicks++;
      }

      if (recentActivities.length < 15) {
        recentActivities.push({
          type: action.replace('TRAFFIC_', ''),
          path: path,
          title: title,
          target_title: parsedDetails.target_title || '',
          device: device,
          country: countryName,
          country_code: rawCountry,
          city: city,
          created_at: createdAt
        });
      }
    }

    // Top Pages
    const topPages = Object.entries(pageCountMap)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Top Countries Breakdown
    const totalCountryHits = Object.values(countryCountMap).reduce((a, b) => a + b, 0) || 1;
    const topCountries = Object.entries(countryCountMap)
      .map(([country, count]) => ({
        country,
        count,
        pct: Math.round((count / totalCountryHits) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Device Breakdown Percentages
    const totalDevices = (deviceCountMap.mobile + deviceCountMap.desktop + deviceCountMap.tablet) || 1;
    const deviceBreakdown = {
      mobile_pct: Math.round((deviceCountMap.mobile / totalDevices) * 100),
      desktop_pct: Math.round((deviceCountMap.desktop / totalDevices) * 100),
      tablet_pct: Math.round((deviceCountMap.tablet / totalDevices) * 100),
      mobile_count: deviceCountMap.mobile,
      desktop_count: deviceCountMap.desktop,
      tablet_count: deviceCountMap.tablet
    };

    return new Response(JSON.stringify({
      success: true,
      stats: {
        total_visitors: allVisitors.size,
        today_visitors: todayVisitors.size,
        total_pageviews: totalPageviews,
        today_pageviews: todayPageviews,
        total_whatsapp_clicks: totalWhatsappClicks,
        today_whatsapp_clicks: todayWhatsappClicks,
        top_pages: topPages,
        top_countries: topCountries,
        top_articles: topArticles,
        device_breakdown: deviceBreakdown,
        recent_activities: recentActivities,
        last_updated: new Date().toISOString()
      }
    }), {
      headers: corsHeaders()
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}
