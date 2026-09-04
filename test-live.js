async function main() {
  const baseUrl = 'https://sale-reports.vercel.app';
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': 'auth_session=' + JSON.stringify({ role: 'admin', username: 'jahed2uae' })
  };

  try {
    console.log('1. Checking Vercel /api/orders...');
    const res = await fetch(`${baseUrl}/api/orders`, { headers });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    
    if (res.status !== 200) {
      console.log('Error output:', text);
      return;
    }

    const orders = JSON.parse(text);
    console.log(`Successfully fetched ${orders.length} orders from live db.`);
    
    // Check schema
    if (orders.length > 0) {
      const first = orders[0];
      console.log('Schema has amount_received:', 'amount_received' in first);
      console.log('Schema has paid_status:', 'paid_status' in first);
    } else {
      console.log('No orders to check schema against, but 200 means columns exist.');
    }

    // Check for 1 Sep and 2 Sep
    const sepOrders = orders.filter(o => o.date === '2026-09-01' || o.date === '2026-09-02');
    console.log(`Found ${sepOrders.length} orders for 1 Sep and 2 Sep.`);

    console.log('\nChecking 31 Aug Summary...');
    const sumRes = await fetch(`${baseUrl}/api/summaries?date=2026-08-31`, { headers });
    const sumText = await sumRes.text();
    console.log(`Summary Status: ${sumRes.status}`);
    if (sumRes.status === 200) {
      const sum = JSON.parse(sumText);
      console.log('31 Aug Balance:', sum?.nabta_yesterday_balance);
    }

  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}

main();
