const fs = require('fs');
const path = require('path');

// 1. Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let SUPABASE_URL = '';
let SUPABASE_KEY = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) SUPABASE_URL = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) SUPABASE_KEY = line.split('=')[1].trim();
});

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const date = '2026-09-01';

const orders = [
  { date, client_name: 'Abu Al Joud', qty: 25, cost_price: 4, nabta_bill: 100, client_bill: 112.5, jahed_balance: 12.5 },
  { date, client_name: 'Al Mallah', qty: 25, cost_price: 4, nabta_bill: 100, client_bill: 112.5, jahed_balance: 12.5 },
  { date, client_name: 'Khalifa Sharjah', qty: 70, cost_price: 3, nabta_bill: 210, client_bill: 245, jahed_balance: 35 },
  { date, client_name: 'Xender Peeled', qty: 120, cost_price: 3.6, nabta_bill: 432, client_bill: 480, jahed_balance: 48 }
];

const summary = {
  date,
  nabta_yesterday_balance: -56.2,
};

async function insertData() {
  // Clear existing orders for the date (optional, but good if we run it multiple times)
  await fetch(`${SUPABASE_URL}/rest/v1/orders?date=eq.${date}`, {
    method: 'DELETE',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });

  // Insert Orders
  for (const o of orders) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(o)
    });
    if (!res.ok) {
      console.error("Failed to insert order", o.client_name, await res.text());
    } else {
      console.log(`Inserted order for ${o.client_name}`);
    }
  }

  // Insert or update summary
  const sumRes = await fetch(`${SUPABASE_URL}/rest/v1/day_summaries?date=eq.${date}`, {
    method: 'GET',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  
  const existingSum = await sumRes.json();
  if (existingSum && existingSum.length > 0) {
    await fetch(`${SUPABASE_URL}/rest/v1/day_summaries?date=eq.${date}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(summary)
    });
    console.log("Updated day summary");
  } else {
    await fetch(`${SUPABASE_URL}/rest/v1/day_summaries`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(summary)
    });
    console.log("Inserted day summary");
  }

  console.log("Done");
}

insertData().catch(console.error);
