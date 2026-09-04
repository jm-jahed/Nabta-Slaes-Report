const fs = require('fs');

async function main() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
  const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)[1].trim();
  
  const headers = {
    'apikey': key,
    'Authorization': 'Bearer ' + key,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  // Add 31-08-26 Summary
  const summary = {
    date: '2026-08-31',
    nabta_yesterday_balance: -56.2,
    jahed_balance: 0,
    paid: 0,
    nabta_today_balance: -56.2,
    updated_at: new Date().toISOString()
  };
  
  const sumRes = await fetch(`${url}/rest/v1/day_summaries`, {
    method: 'POST',
    headers,
    body: JSON.stringify(summary)
  });
  console.log('Inserted Summary:', sumRes.status);

  const orders = [
    { date: '2026-09-01', client_name: 'Abu Al Joud', qty: 25, cost_price: 4, client_price: 4.5, nabta_bill: 100, client_bill: 112.5, jahed_balance: 12.5, amount_received: 0, paid_status: 'Unpaid' },
    { date: '2026-09-01', client_name: 'Al Mallah', qty: 25, cost_price: 4, client_price: 4.5, nabta_bill: 100, client_bill: 112.5, jahed_balance: 12.5, amount_received: 0, paid_status: 'Unpaid' },
    { date: '2026-09-01', client_name: 'Khalifa Sharjah', qty: 70, cost_price: 3, client_price: 3.5, nabta_bill: 210, client_bill: 245, jahed_balance: 35, amount_received: 0, paid_status: 'Unpaid' },
    { date: '2026-09-01', client_name: 'Xender Peeled', qty: 120, cost_price: 3.6, client_price: 4, nabta_bill: 432, client_bill: 480, jahed_balance: 48, amount_received: 0, paid_status: 'Unpaid' }
  ];

  for (const o of orders) {
    const r = await fetch(`${url}/rest/v1/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(o)
    });
    console.log(`Inserted ${o.client_name}: ${r.status}`);
    if (r.status !== 201) {
      console.log(await r.text());
    }
  }
}

main().catch(console.error);
