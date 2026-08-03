const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://csrzhidtzqxfbapsenhu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcnpoaWR0enF4ZmJhcHNlbmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0OTM3OTYsImV4cCI6MjEwMTA2OTc5Nn0.NnHFURbQTvsdgGbm1d_PC-hkOgQFQIHKTMQaS2n44SU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCols() {
  const { data, error } = await supabase.from('listings').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columns in listings table:', Object.keys(data[0]));
  } else {
    console.log('Error or no rows:', error);
  }
}

checkCols();
