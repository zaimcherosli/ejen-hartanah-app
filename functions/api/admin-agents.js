// Cloudflare Pages Function for Real-time SuperAdmin Agent Approvals & Auth Sync
const SUPABASE_URL = 'https://csrzhidtzqxfbapsenhu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcnpoaWR0enF4ZmJhcHNlbmh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQ5Mzc5NiwiZXhwIjoyMTAxMDY5Nzk2fQ.P4ZBaDNqRw0hMA3wVkkk-0xIhzhp0uPlF9fCf1elKuM';

// SuperAdmin emails whitelist
const SUPERADMIN_EMAILS = new Set([
  'multiple.revenue@gmail.com',
  'biztreat2017@gmail.com',
  'huzaimrosli@gmail.com'
]);

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

// GET: Fetch all registered agents from Supabase Auth Admin + sync with agent_profiles
export async function onRequestGet(context) {
  try {
    // 1. Fetch all users from Supabase Auth Admin API
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (!authRes.ok) {
      const errText = await authRes.text();
      return new Response(JSON.stringify({ error: `Auth API Error: ${errText}` }), {
        status: 500,
        headers: corsHeaders()
      });
    }

    const authData = await authRes.json();
    const allUsers = authData.users || [];

    // 2. Fetch agent_profiles table
    const profRes = await fetch(`${SUPABASE_URL}/rest/v1/agent_profiles?select=*`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    const profiles = profRes.ok ? await profRes.json() : [];
    const profMap = new Map(profiles.map(p => [p.email ? p.email.toLowerCase() : '', p]));

    // 3. Filter agent accounts (exclude superadmins)
    const agents = [];

    for (const u of allUsers) {
      const email = (u.email || '').toLowerCase();
      if (!email || SUPERADMIN_EMAILS.has(email)) continue;

      const meta = u.user_metadata || {};
      const existingProf = profMap.get(email);

      const status = existingProf ? existingProf.status : (meta.status || 'Pending');
      const fullName = (existingProf && existingProf.full_name) || meta.full_name || meta.name || email.split('@')[0];
      const whatsapp = (existingProf && existingProf.whatsapp_number) || meta.whatsapp_number || meta.whatsapp || '-';
      const ren = (existingProf && existingProf.ren_number) || meta.ren_number || meta.ren_code || '-';
      const photoUrl = meta.photo_url || meta.avatar_url || (email.includes('ecah') ? '/agents/aisyah.png' : '') || '';
      const registeredAt = meta.registered_at || (existingProf && existingProf.registered_at) || u.created_at;

      // Auto-sync into agent_profiles if missing
      if (!existingProf) {
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/agent_profiles`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
              id: u.id,
              full_name: fullName,
              whatsapp_number: whatsapp,
              ren_number: ren,
              email: u.email,
              status: status,
              registered_at: registeredAt
            })
          });
        } catch (syncErr) {
          console.warn('Sync error for', email, syncErr);
        }
      }

      agents.push({
        id: u.id,
        full_name: fullName,
        whatsapp_number: whatsapp,
        ren_number: ren,
        email: u.email,
        status: status,
        avatar_url: photoUrl,
        photo_url: photoUrl,
        registered_at: registeredAt
      });
    }

    // Sort newest registrations first
    agents.sort((a, b) => new Date(b.registered_at || 0) - new Date(a.registered_at || 0));

    return new Response(JSON.stringify({ success: true, agents }), {
      headers: corsHeaders()
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// POST: Approve, Reject, or Delete Agent
export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { action, userId, email } = body;

    if (!action || !userId) {
      return new Response(JSON.stringify({ error: 'Missing action or userId' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    if (action === 'approve' || action === 'reject') {
      const newStatus = action === 'approve' ? 'Approved' : 'Rejected';

      // 1. Update agent_profiles table
      await fetch(`${SUPABASE_URL}/rest/v1/agent_profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      // 2. Update Supabase Auth user_metadata
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_metadata: { status: newStatus }
        })
      });

      return new Response(JSON.stringify({ success: true, status: newStatus }), {
        headers: corsHeaders()
      });
    }

    if (action === 'delete') {
      // 1. Delete from agent_profiles
      await fetch(`${SUPABASE_URL}/rest/v1/agent_profiles?id=eq.${userId}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      });

      // 2. Delete from Supabase Auth admin
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      });

      return new Response(JSON.stringify({ success: true, deleted: true }), {
        headers: corsHeaders()
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: corsHeaders()
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}
