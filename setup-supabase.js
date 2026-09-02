// Test Supabase connection and run schema setup + seed data
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fihxvavdtmaajbtdzbel.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3J5SCaElkfkKF7LtuqJdpA_cZ2Wyb70';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testAndSeed() {
  console.log('Testing Supabase connection...');
  
  // Step 1: Test connection by checking orders table
  const { data: testData, error: testError } = await supabase
    .from('orders')
    .select('count')
    .limit(1);
  
  if (testError) {
    console.error('Connection FAILED:', testError.message);
    console.error('Code:', testError.code);
    console.log('\nTables may not exist yet. Checking error type...');
    if (testError.message.includes('does not exist')) {
      console.log('=> Tables need to be created. Run supabase/schema.sql in Supabase SQL Editor first.');
    }
    return false;
  }
  
  console.log('Connection SUCCESS!');
  
  // Step 2: Check existing data
  const { data: existingOrders } = await supabase.from('orders').select('id, date, client_name');
  console.log(`Existing orders: ${existingOrders?.length || 0}`);
  
  // Step 3: Seed 1 Sep 2026 data (only if not already there)
  const sep1Exists = existingOrders?.some(o => o.date === '2026-09-01');
  const sep2Exists = existingOrders?.some(o => o.date === '2026-09-02');
  
  if (!sep1Exists) {
    console.log('Seeding 1 Sep 2026...');
    const { error } = await supabase.from('orders').insert([
      { id: 'ord-20260901-1', date: '2026-09-01', client_name: 'Abu Al Joud', qty: 25, cost_price: 4, client_price: 4.5, nabta_bill: 100, client_bill: 112.5, jahed_balance: 12.5, notes: '' },
      { id: 'ord-20260901-2', date: '2026-09-01', client_name: 'Al Mallah', qty: 25, cost_price: 4, client_price: 4.5, nabta_bill: 100, client_bill: 112.5, jahed_balance: 12.5, notes: '' },
      { id: 'ord-20260901-3', date: '2026-09-01', client_name: 'Khalifa Sharjah', qty: 70, cost_price: 3, client_price: 3.5, nabta_bill: 210, client_bill: 245, jahed_balance: 35, notes: '' },
      { id: 'ord-20260901-4', date: '2026-09-01', client_name: 'Xender Peeled', qty: 120, cost_price: 3.6, client_price: 4, nabta_bill: 432, client_bill: 480, jahed_balance: 48, notes: '' },
    ]);
    if (error) console.error('Seed 1 Sep error:', error.message);
    else console.log('1 Sep 2026 seeded OK.');
  } else {
    console.log('1 Sep 2026 already exists — skipping.');
  }
  
  if (!sep2Exists) {
    console.log('Seeding 2 Sep 2026...');
    const { error } = await supabase.from('orders').insert([
      { id: 'ord-20260902-1', date: '2026-09-02', client_name: 'Abu Al Joud', qty: 25, cost_price: 4, client_price: 4.5, nabta_bill: 100, client_bill: 112.5, jahed_balance: 12.5, notes: '' },
      { id: 'ord-20260902-2', date: '2026-09-02', client_name: 'Al Mallah', qty: 25, cost_price: 4, client_price: 4.5, nabta_bill: 100, client_bill: 112.5, jahed_balance: 12.5, notes: '' },
      { id: 'ord-20260902-3', date: '2026-09-02', client_name: 'Khalifa Sharjah', qty: 70, cost_price: 3, client_price: 3.5, nabta_bill: 210, client_bill: 245, jahed_balance: 35, notes: '' },
      { id: 'ord-20260902-4', date: '2026-09-02', client_name: 'Xender Peeled', qty: 120, cost_price: 3.6, client_price: 4, nabta_bill: 432, client_bill: 480, jahed_balance: 48, notes: '' },
      { id: 'ord-20260902-5', date: '2026-09-02', client_name: 'Villago', qty: 20, cost_price: 4, client_price: 6, nabta_bill: 80, client_bill: 120, jahed_balance: 40, notes: '' },
      { id: 'ord-20260902-6', date: '2026-09-02', client_name: 'Sahelnom', qty: 30, cost_price: 4, client_price: 5, nabta_bill: 120, client_bill: 150, jahed_balance: 30, notes: '' },
    ]);
    if (error) console.error('Seed 2 Sep error:', error.message);
    else console.log('2 Sep 2026 seeded OK.');
  } else {
    console.log('2 Sep 2026 already exists — skipping.');
  }
  
  // Step 4: Seed day summaries
  const { data: existingSummaries } = await supabase.from('day_summaries').select('date');
  const hasSep1Summary = existingSummaries?.some(s => s.date === '2026-09-01');
  const hasSep2Summary = existingSummaries?.some(s => s.date === '2026-09-02');
  
  if (!hasSep1Summary) {
    await supabase.from('day_summaries').upsert({
      date: '2026-09-01', nabta_yesterday_balance: -56.2, jahed_balance: 108, paid: 0, nabta_today_balance: -164.2
    }, { onConflict: 'date' });
    console.log('1 Sep 2026 summary seeded.');
  }
  if (!hasSep2Summary) {
    await supabase.from('day_summaries').upsert({
      date: '2026-09-02', nabta_yesterday_balance: -164.2, jahed_balance: 178, paid: 0, nabta_today_balance: -342.2
    }, { onConflict: 'date' });
    console.log('2 Sep 2026 summary seeded.');
  }
  
  // Final check
  const { data: finalOrders } = await supabase.from('orders').select('id, date, client_name').order('date');
  console.log(`\nFinal order count: ${finalOrders?.length}`);
  finalOrders?.forEach(o => console.log(`  ${o.date} | ${o.client_name}`));
  
  return true;
}

testAndSeed().then(ok => {
  if (ok) console.log('\n✅ Supabase setup complete!');
  else console.log('\n❌ Setup failed. Check errors above.');
  process.exit(ok ? 0 : 1);
});
