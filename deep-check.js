// Deep diagnostic — check what the key can access
async function deepCheck() {
  const url = 'https://fihxvavdtmaajbtdzbel.supabase.co';
  const key = 'sb_publishable_3J5SCaElkfkKF7LtuqJdpA_cZ2Wyb70';

  console.log('=== Supabase Deep Diagnostic ===\n');

  // Test 1: orders
  const r1 = await fetch(`${url}/rest/v1/orders?select=count`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  console.log('orders:', r1.status, await r1.text());

  // Test 2: pg_tables (system table to check if DB is accessible at all)
  const r2 = await fetch(`${url}/rest/v1/rpc/version`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  console.log('rpc/version:', r2.status, await r2.text());

  // Test 3: using anon key format check
  const r3 = await fetch(`${url}/rest/v1/`, {
    headers: { 
      'apikey': key, 
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }
  });
  console.log('rest root:', r3.status);
  console.log('root body:', (await r3.text()).substring(0, 300));
}

deepCheck();
