const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://csrzhidtzqxfbapsenhu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcnpoaWR0enF4ZmJhcHNlbmh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQ5Mzc5NiwiZXhwIjoyMTAxMDY5Nzk2fQ.P4ZBaDNqRw0hMA3wVkkk-0xIhzhp0uPlF9fCf1elKuM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function addTenureColumn() {
  console.log('Attempting to add tenure column via Supabase...');
  
  // Try via RPC if available
  const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', {
    sql_query: 'ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS tenure TEXT DEFAULT \'Freehold\';'
  });

  if (rpcError) {
    console.log('RPC error:', rpcError.message);
  } else {
    console.log('RPC success:', rpcData);
  }

  // Check again
  const { data, error } = await supabase.from('listings').select('id, title, tenure').limit(1);
  if (error) {
    console.log('Check error:', error.message);
  } else {
    console.log('SUCCESS! Tenure column exists:', data);
  }
}

addTenureColumn();
