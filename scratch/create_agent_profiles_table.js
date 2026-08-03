const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://csrzhidtzqxfbapsenhu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcnpoaWR0enF4ZmJhcHNlbmh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQ5Mzc5NiwiZXhwIjoyMTAxMDY5Nzk2fQ.P4ZBaDNqRw0hMA3wVkkk-0xIhzhp0uPlF9fCf1elKuM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const sqlScript = `
CREATE TABLE IF NOT EXISTS public.agent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  full_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  ren_number TEXT,
  email TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'Pending',
  role TEXT DEFAULT 'agent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert access') THEN
    CREATE POLICY "Allow public insert access" ON public.agent_profiles FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select access') THEN
    CREATE POLICY "Allow public select access" ON public.agent_profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role update access') THEN
    CREATE POLICY "Allow service role update access" ON public.agent_profiles FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role delete access') THEN
    CREATE POLICY "Allow service role delete access" ON public.agent_profiles FOR DELETE USING (true);
  END IF;
END $$;
`;

async function createTable() {
  console.log('Sending SQL migration to Supabase Management API...');
  
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/csrzhidtzqxfbapsenhu/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sqlScript })
    });
    console.log('SQL Exec Status:', res.status);
    const body = await res.text();
    console.log('Response body:', body);
  } catch (e) {
    console.error('Fetch error:', e);
  }

  // Check if agent_profiles table is accessible
  const { data, error } = await supabase.from('agent_profiles').select('*').limit(1);
  if (error) {
    console.log('agent_profiles status check error:', error.message);
  } else {
    console.log('SUCCESS! agent_profiles table is READY! Rows found:', data.length);
  }
}

createTable();
