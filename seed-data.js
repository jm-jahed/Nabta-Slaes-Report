const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '.data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function writeJson(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

const orders1 = [
  { id: "ord-20260901-1", date: "2026-09-01", client_name: "Abu Al Joud", qty: 25, cost_price: 4, client_price: 4.5, nabta_bill: 100, client_bill: 112.5, jahed_balance: 12.5, notes: "", created_at: "2026-09-01T08:00:00.000Z" },
  { id: "ord-20260901-2", date: "2026-09-01", client_name: "Al Mallah", qty: 25, cost_price: 4, client_price: 4.5, nabta_bill: 100, client_bill: 112.5, jahed_balance: 12.5, notes: "", created_at: "2026-09-01T08:10:00.000Z" },
  { id: "ord-20260901-3", date: "2026-09-01", client_name: "Khalifa Sharjah", qty: 70, cost_price: 3, client_price: 3.5, nabta_bill: 210, client_bill: 245, jahed_balance: 35, notes: "", created_at: "2026-09-01T08:20:00.000Z" },
  { id: "ord-20260901-4", date: "2026-09-01", client_name: "Xender Peeled", qty: 120, cost_price: 3.6, client_price: 4, nabta_bill: 432, client_bill: 480, jahed_balance: 48, notes: "", created_at: "2026-09-01T08:30:00.000Z" },
];

const orders2 = [
  { id: "ord-20260902-1", date: "2026-09-02", client_name: "Abu Al Joud", qty: 25, cost_price: 4, client_price: 4.5, nabta_bill: 100, client_bill: 112.5, jahed_balance: 12.5, notes: "", created_at: "2026-09-02T08:00:00.000Z" },
  { id: "ord-20260902-2", date: "2026-09-02", client_name: "Al Mallah", qty: 25, cost_price: 4, client_price: 4.5, nabta_bill: 100, client_bill: 112.5, jahed_balance: 12.5, notes: "", created_at: "2026-09-02T08:10:00.000Z" },
  { id: "ord-20260902-3", date: "2026-09-02", client_name: "Khalifa Sharjah", qty: 70, cost_price: 3, client_price: 3.5, nabta_bill: 210, client_bill: 245, jahed_balance: 35, notes: "", created_at: "2026-09-02T08:20:00.000Z" },
  { id: "ord-20260902-4", date: "2026-09-02", client_name: "Xender Peeled", qty: 120, cost_price: 3.6, client_price: 4, nabta_bill: 432, client_bill: 480, jahed_balance: 48, notes: "", created_at: "2026-09-02T08:30:00.000Z" },
  { id: "ord-20260902-5", date: "2026-09-02", client_name: "Villago", qty: 20, cost_price: 4, client_price: 6, nabta_bill: 80, client_bill: 120, jahed_balance: 40, notes: "", created_at: "2026-09-02T08:40:00.000Z" },
  { id: "ord-20260902-6", date: "2026-09-02", client_name: "Sahelnom", qty: 30, cost_price: 4, client_price: 5, nabta_bill: 120, client_bill: 150, jahed_balance: 30, notes: "", created_at: "2026-09-02T08:50:00.000Z" },
];

writeJson('orders.json', [...orders1, ...orders2]);

const summaries = [
  { date: "2026-09-01", nabta_yesterday_balance: -56.2, jahed_balance: 108, paid: 0, nabta_today_balance: -164.2, updated_at: "2026-09-01T09:00:00.000Z" },
  { date: "2026-09-02", nabta_yesterday_balance: -164.2, jahed_balance: 178, paid: 0, nabta_today_balance: -342.2, updated_at: "2026-09-02T09:00:00.000Z" },
];

writeJson('summaries.json', summaries);

console.log("Seed complete with updated 2 Sep 2026 data (Villago & Sahelnom).");
