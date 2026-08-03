const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://csrzhidtzqxfbapsenhu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcnpoaWR0enF4ZmJhcHNlbmh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQ5Mzc5NiwiZXhwIjoyMTAxMDY5Nzk2fQ.P4ZBaDNqRw0hMA3wVkkk-0xIhzhp0uPlF9fCf1elKuM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupExistingAdmins() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('List users error:', error);
    return;
  }

  for (const user of users) {
    const meta = user.user_metadata || {};
    const updatedMeta = {
      ...meta,
      full_name: meta.full_name || user.email.split('@')[0],
      whatsapp_number: meta.whatsapp_number || '0173569452',
      ren_number: meta.ren_number || 'REN 12345',
      status: 'Approved',
      role: 'superadmin'
    };

    const { data: updateData, error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: updatedMeta
    });

    if (updateErr) {
      console.error(`Failed to update ${user.email}:`, updateErr.message);
    } else {
      console.log(`Updated ${user.email} -> Approved & SuperAdmin`);
    }
  }
}

setupExistingAdmins();
