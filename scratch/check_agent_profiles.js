const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://csrzhidtzqxfbapsenhu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcnpoaWR0enF4ZmJhcHNlbmh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQ5Mzc5NiwiZXhwIjoyMTAxMDY5Nzk2fQ.P4ZBaDNqRw0hMA3wVkkk-0xIhzhp0uPlF9fCf1elKuM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('Setting up agent_profiles table...');

  // Test if table exists by querying
  const { data, error } = await supabase.from('agent_profiles').select('*').limit(1);

  if (error && error.message.includes('relation "public.agent_profiles" does not exist')) {
    console.log('Creating agent_profiles table via REST RPC or SQL...');
  } else if (!error) {
    console.log('agent_profiles table already exists!');
  } else {
    console.log('Status message:', error.message);
  }
}

main().catch(console.error);
