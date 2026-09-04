const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://fihxvavdtmaajbtdzbel.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3J5SCaElkfkKF7LtuqJdpA_cZ2Wyb70';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const { data, error } = await supabase.from('clients').select('*').limit(1);
  console.log('SELECT ERROR:', error);
  console.log('SELECT DATA:', data);
}
test();
