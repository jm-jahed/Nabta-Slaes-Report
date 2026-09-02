const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '.data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function writeJson(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

function readJson(filename) {
  try {
    const p = path.join(DATA_DIR, filename);
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {}
  return [];
}

const orders = readJson('orders.json');
const summaries = readJson('summaries.json');

const dateStr = "2026-09-01";

// Remove existing orders for this date
const filteredOrders = orders.filter(o => o.date !== dateStr);

const newOrders = [
  {
    id: "ord-" + Date.now() + "-1",
    date: dateStr,
    client_name: "Abu Al Joud",
    qty: 25,
    cost_price: 4,
    client_price: 4.5,
    nabta_bill: 100,
    client_bill: 112.5,
    jahed_balance: 12.5,
    notes: "",
    created_at: new Date().toISOString()
  },
  {
    id: "ord-" + Date.now() + "-2",
    date: dateStr,
    client_name: "Al Mallah",
    qty: 25,
    cost_price: 4,
    client_price: 4.5,
    nabta_bill: 100,
    client_bill: 112.5,
    jahed_balance: 12.5,
    notes: "",
    created_at: new Date().toISOString()
  },
  {
    id: "ord-" + Date.now() + "-3",
    date: dateStr,
    client_name: "Khalifa Sharjah",
    qty: 70,
    cost_price: 3,
    client_price: 3.5,
    nabta_bill: 210,
    client_bill: 245,
    jahed_balance: 35,
    notes: "",
    created_at: new Date().toISOString()
  },
  {
    id: "ord-" + Date.now() + "-4",
    date: dateStr,
    client_name: "Xender Peeled",
    qty: 120,
    cost_price: 3.6,
    client_price: 4,
    nabta_bill: 432,
    client_bill: 480,
    jahed_balance: 48,
    notes: "",
    created_at: new Date().toISOString()
  }
];

writeJson('orders.json', [...filteredOrders, ...newOrders]);

const validSummaries = Array.isArray(summaries) ? summaries : Object.values(summaries || {});
const filteredSummaries = validSummaries.filter(s => s.date !== dateStr);
const jahed_balance = newOrders.reduce((acc, curr) => acc + curr.jahed_balance, 0);

const newSummary = {
  date: dateStr,
  nabta_yesterday_balance: -56.2,
  jahed_balance: jahed_balance,
  paid: 0,
  nabta_today_balance: -56.2 - jahed_balance,
  updated_at: new Date().toISOString()
};

writeJson('summaries.json', [...filteredSummaries, newSummary]);

console.log("Seed complete.");
