async function testPost() {
  try {
    const res = await fetch("https://sale-reports.vercel.app/api/orders", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: "2026-09-01",
        client_name: "Test POST from backend",
        qty: 1,
        cost_price: 1,
        client_price: 1,
        notes: "test"
      })
    });
    const data = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (e) {
    console.error(e);
  }
}
testPost();
