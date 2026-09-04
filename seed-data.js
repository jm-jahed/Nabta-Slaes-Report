async function main() {
  const baseUrl = 'https://sale-reports.vercel.app';
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': 'auth_session=' + JSON.stringify({ role: 'admin', username: 'jahed2uae' })
  };

  // Set 31-08-26 Summary
  console.log('Setting 31-08-26 Summary...');
  let res = await fetch(`${baseUrl}/api/summaries`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      date: '2026-08-31',
      nabta_yesterday_balance: -56.2
    })
  });
  console.log('Summary:', res.status, await res.text());

  const orders = [
    // 1 Sep 2026
    { date: '2026-09-01', client_name: 'Abu Al Joud', qty: 25, cost_price: 4, client_price: 4.5, amount_received: 0 },
    { date: '2026-09-01', client_name: 'Al Mallah', qty: 25, cost_price: 4, client_price: 4.5, amount_received: 0 },
    { date: '2026-09-01', client_name: 'Khalifa Sharjah', qty: 70, cost_price: 3, client_price: 3.5, amount_received: 0 },
    { date: '2026-09-01', client_name: 'Xender Peeled', qty: 120, cost_price: 3.6, client_price: 4, amount_received: 0 },
    
    // 2 Sep 2026
    { date: '2026-09-02', client_name: 'Abu Al Joud', qty: 25, cost_price: 4, client_price: 4.5, amount_received: 0 },
    { date: '2026-09-02', client_name: 'Al Mallah', qty: 25, cost_price: 4, client_price: 4.5, amount_received: 0 },
    { date: '2026-09-02', client_name: 'Khalifa Sharjah', qty: 70, cost_price: 3, client_price: 3.5, amount_received: 0 },
    { date: '2026-09-02', client_name: 'Xender Peeled', qty: 120, cost_price: 3.6, client_price: 4, amount_received: 0 },
    { date: '2026-09-02', client_name: 'Villago', qty: 20, cost_price: 4, client_price: 6, amount_received: 0 },
    { date: '2026-09-02', client_name: 'Sahelnom', qty: 30, cost_price: 4, client_price: 5, amount_received: 0 },
  ];

  for (const o of orders) {
    const r = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(o)
    });
    console.log(`Inserted ${o.date} - ${o.client_name}: ${r.status}`);
  }
}

main().catch(console.error);
