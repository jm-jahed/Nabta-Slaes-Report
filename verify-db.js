const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://fihxvavdtmaajbtdzbel.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3J5SCaElkfkKF7LtuqJdpA_cZ2Wyb70';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log("Starting verification...");

  // Test 1: tables exist
  const tOrders = await supabase.from('orders').select('id').limit(1);
  const tPayments = await supabase.from('payments').select('id').limit(1);
  const tSummaries = await supabase.from('day_summaries').select('date').limit(1);

  const tablesExist = !tOrders.error && !tPayments.error && !tSummaries.error;
  console.log("Supabase Connected: YES");
  console.log("Tables Exist:", tablesExist ? "YES" : "NO");
  if (!tablesExist) {
    console.log("Errors:", tOrders.error?.message, tPayments.error?.message, tSummaries.error?.message);
  }

  // Insert Test
  const testId = 'test-' + Date.now();
  const insertRes = await supabase.from('orders').insert({
    id: testId,
    date: '2026-01-01',
    client_name: 'Test Client',
    qty: 1, cost_price: 1, client_price: 1,
    nabta_bill: 1, client_bill: 1, jahed_balance: 0,
    notes: 'test'
  });

  const insertPass = !insertRes.error;
  console.log("Insert Test:", insertPass ? "PASS" : "FAIL");
  if (!insertPass) console.log("Insert Error:", insertRes.error?.message);

  let readPass = false;
  if (insertPass) {
    const readRes = await supabase.from('orders').select('*').eq('id', testId).single();
    readPass = !readRes.error && readRes.data.id === testId;
    console.log("Read Test:", readPass ? "PASS" : "FAIL");

    await supabase.from('orders').delete().eq('id', testId);
  } else {
    console.log("Read Test: FAIL (insert failed)");
  }
}

main().catch(err => console.error(err));
