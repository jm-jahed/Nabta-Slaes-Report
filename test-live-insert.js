async function testLiveInsert() {
  try {
    // 1. Login
    const loginRes = await fetch("https://sale-reports.vercel.app/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "jahed2uae", password: "asdASD123@" })
    });
    
    if (!loginRes.ok) {
      console.log("Login failed", await loginRes.text());
      return;
    }
    
    // Get cookies from response
    const setCookieHeader = loginRes.headers.get("set-cookie");
    console.log("Cookies received:", setCookieHeader);
    
    let authCookie = "";
    if (setCookieHeader) {
      // Very naive parsing for the test
      const match = setCookieHeader.match(/auth_session=([^;]+)/);
      if (match) authCookie = `auth_session=${match[1]}`;
    }

    // 2. Post new order
    const orderRes = await fetch("https://sale-reports.vercel.app/api/orders", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": authCookie
      },
      body: JSON.stringify({
        date: "2026-09-01",
        client_name: "Test Debug Order",
        qty: 1,
        cost_price: 1,
        client_price: 1,
        notes: "test debug"
      })
    });

    const status = orderRes.status;
    const body = await orderRes.text();
    console.log("Order POST Status:", status);
    console.log("Order POST Response:", body);
    
    // If it succeeded, clean it up
    if (status === 200) {
      const data = JSON.parse(body);
      const delRes = await fetch(`https://sale-reports.vercel.app/api/orders?id=${data.id}`, {
        method: "DELETE",
        headers: { "Cookie": authCookie }
      });
      console.log("Cleanup DELETE:", delRes.status);
    }
  } catch (err) {
    console.error(err);
  }
}

testLiveInsert();
