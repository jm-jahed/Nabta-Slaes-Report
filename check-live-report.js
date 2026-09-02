async function checkReport() {
  try {
    // Login as Nabta first
    const loginRes = await fetch("https://sale-reports.vercel.app/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "Nabta", password: "asd123@" })
    });
    
    console.log("Login status:", loginRes.status);
    const setCookie = loginRes.headers.get("set-cookie");
    let cookie = "";
    if (setCookie) {
      const match = setCookie.match(/auth_session=([^;]+)/);
      if (match) cookie = `auth_session=${match[1]}`;
    }

    const reportRes = await fetch("https://sale-reports.vercel.app/api/nabta/report", {
      headers: { "Cookie": cookie }
    });
    console.log("Report API status:", reportRes.status);
    const data = await reportRes.json();
    console.log("Report Data:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
checkReport();
