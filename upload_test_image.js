const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://csrzhidtzqxfbapsenhu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcnpoaWR0enF4ZmJhcHNlbmh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQ5Mzc5NiwiZXhwIjoyMTAxMDY5Nzk2fQ.P4ZBaDNqRw0hMA3wVkkk-0xIhzhp0uPlF9fCf1elKuM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function uploadTest() {
  console.log('Uploading 1 test image to Supabase Storage to prove live sync...');
  // Create a 500KB dummy buffer
  const buffer = Buffer.alloc(500 * 1024, 'A'); 
  const fileName = `test_live_${Date.now()}.jpg`;
  
  const { data, error } = await supabase.storage
    .from('listing-images')
    .upload(`properties/${fileName}`, buffer, { contentType: 'image/jpeg' });

  if (error) {
    console.error('Upload error:', error);
  } else {
    console.log('SUCCESSFULLY uploaded test file! Path:', data.path);
  }
}

uploadTest();
