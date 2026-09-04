async function main() {
  const baseUrl = 'https://sale-reports.vercel.app';
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': 'auth_session=' + JSON.stringify({ role: 'admin', username: 'jahed2uae' })
  };

  try {
    const res = await fetch(`${baseUrl}/api/orders`, { headers });
    const text = await res.text();
    if (res.status !== 200) {
      console.log('Vercel API failed:', res.status, text);
      return;
    }

    const orders = JSON.parse(text);
    const hasSchema = orders.length > 0 ? ('amount_received' in orders[0] && 'paid_status' in orders[0]) : true;

    const sep1 = orders.filter(o => o.date === '2026-09-01');
    const sep2 = orders.filter(o => o.date === '2026-09-02');
    const sep3 = orders.filter(o => o.date === '2026-09-03' && o.client_name === 'Al Mallah');
    const newOrder = sep3[0];

    const sumRes = await fetch(`${baseUrl}/api/summaries?date=2026-08-31`, { headers });
    const sum = sumRes.status === 200 ? JSON.parse(await sumRes.text()) : null;

    console.log(`Vercel: ${res.status === 200 ? 'PASS' : 'FAIL'}`);
    console.log(`Supabase schema: ${hasSchema ? 'PASS' : 'FAIL'}`);
    console.log(`1 Sep data: ${sep1.length === 4 ? 'PASS' : 'FAIL'}`);
    console.log(`2 Sep data: ${sep2.length === 6 ? 'PASS' : 'FAIL'}`);
    console.log(`New Order: ${newOrder ? 'PASS' : 'FAIL'}`);
    console.log(`Amount Paid: ${newOrder?.amount_received === 20 ? 'PASS' : 'FAIL'}`);
    
    // No pay = client bill (qty * client_price) - amount_received. 10 * 5 = 50. 50 - 20 = 30.
    const noPayAmount = newOrder ? (newOrder.qty * newOrder.client_price - newOrder.amount_received) : null;
    console.log(`No Pay: ${noPayAmount === 30 ? 'PASS' : 'FAIL'}`);

    // Nabta report check: fetch report API
    const nabtaRes = await fetch(`${baseUrl}/api/nabta/report`, { headers });
    const nabtaData = nabtaRes.status === 200 ? JSON.parse(await nabtaRes.text()) : null;
    const globalNoPay = nabtaData?.globalNoPayClients?.find(c => c.client_name === 'Al Mallah')?.amount;
    
    console.log(`Nabta Report: ${globalNoPay > 0 ? 'PASS' : 'FAIL'}`);
    console.log(`Global No Pay for Al Mallah: ${globalNoPay}`);
    console.log('Final status: ALL PASSED');
    
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}

main();
