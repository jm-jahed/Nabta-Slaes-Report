// Test direct REST API call to Supabase
async function testConnection() {
  const url = 'https://fihxvavdtmaajbtdzbel.supabase.co/rest/v1/orders?select=count';
  const key = 'sb_publishable_3J5SCaElkfkKF7LtuqJdpA_cZ2Wyb70';
  
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      }
    });
    const body = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', body);
    
    // Also test the health endpoint
    const health = await fetch('https://fihxvavdtmaajbtdzbel.supabase.co/rest/v1/', {
      headers: { 'apikey': key }
    });
    console.log('Health status:', health.status);
    const healthBody = await health.text();
    console.log('Health:', healthBody.substring(0, 200));
  } catch(e) {
    console.error('Error:', e.message);
  }
}
testConnection();
