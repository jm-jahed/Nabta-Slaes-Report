const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://fihxvavdtmaajbtdzbel.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3J5SCaElkfkKF7LtuqJdpA_cZ2Wyb70';

async function fetchTable(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  return res.json();
}

async function migrate() {
  console.log('Fetching data from Supabase REST API...');
  
  const orders = await fetchTable('orders');
  const payments = await fetchTable('payments');
  const clients = await fetchTable('clients');
  const summaries = await fetchTable('day_summaries');

  console.log(`Found ${orders?.length} orders, ${payments?.length} payments, ${clients?.length} clients, ${summaries?.length} summaries.`);

  const data = {
    orders: orders || [],
    payments: payments || [],
    clients: clients || [],
    day_summaries: summaries || []
  };

  const dir = path.join(__dirname, '.data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  
  const filePath = path.join(dir, '2026-09.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log(`Migration complete! Data saved to ${filePath}`);
}

migrate().catch(console.error);
