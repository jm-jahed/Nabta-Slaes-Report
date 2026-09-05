const crypto = require('crypto');
const fs = require('fs');
const uuidv4 = () => crypto.randomUUID();

const data = {
  orders: [
    {
      id: uuidv4(),
      date: "2026-09-01",
      client_name: "Abu Al Joud",
      qty: 25,
      cost_price: 4,
      nabta_bill: 100,
      client_bill: 112.5,
      jahed_balance: 12.5,
      notes: "",
      amount_received: 112.5,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      date: "2026-09-01",
      client_name: "Al Mallah",
      qty: 25,
      cost_price: 4,
      nabta_bill: 100,
      client_bill: 112.5,
      jahed_balance: 12.5,
      notes: "",
      amount_received: 112.5,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      date: "2026-09-01",
      client_name: "Khalifa Sharjah",
      qty: 70,
      cost_price: 3,
      nabta_bill: 210,
      client_bill: 245,
      jahed_balance: 35,
      notes: "",
      amount_received: 245,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      date: "2026-09-01",
      client_name: "Xender Peeled",
      qty: 120,
      cost_price: 3.6,
      nabta_bill: 432,
      client_bill: 480,
      jahed_balance: 48,
      notes: "",
      amount_received: 480,
      created_at: new Date().toISOString()
    }
  ],
  payments: [],
  day_summaries: [
    {
      date: "2026-09-01",
      nabta_yesterday_balance: -56,
      jahed_balance: 108,
      paid: 0,
      nabta_today_balance: -164,
      notes: "",
      updated_at: new Date().toISOString()
    }
  ],
  clients: [
    { id: uuidv4(), name: "Abu Al Joud", created_at: new Date().toISOString() },
    { id: uuidv4(), name: "Al Mallah", created_at: new Date().toISOString() },
    { id: uuidv4(), name: "Khalifa Sharjah", created_at: new Date().toISOString() },
    { id: uuidv4(), name: "Xender Peeled", created_at: new Date().toISOString() }
  ]
};

// Ensure .data exists
if (!fs.existsSync('.data')) {
  fs.mkdirSync('.data');
}

// Write only 2026-09.json
fs.writeFileSync('.data/2026-09.json', JSON.stringify(data, null, 2));

// Delete other files if they exist to completely reset
const files = fs.readdirSync('.data');
for (const file of files) {
  if (file !== '2026-09.json') {
    fs.unlinkSync(`.data/${file}`);
  }
}

console.log('Successfully reset data in .data/2026-09.json');
