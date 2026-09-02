import fs from 'fs';
import path from 'path';
import { Order, Payment, DaySummary } from '@/types';
import { computeOrderFields, calculateDaySummary } from './calculations';
import { format, subDays, addDays } from 'date-fns';

const DATA_DIR = path.join(process.cwd(), '.data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');
const SUMMARIES_FILE = path.join(DATA_DIR, 'summaries.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Generate 25+ consecutive days of chronological realistic data
function generateSeedData(): { seedOrders: Order[]; seedPayments: Payment[]; seedSummaries: Record<string, DaySummary> } {
  const seedOrders: Order[] = [];
  const seedPayments: Payment[] = [];
  const seedSummaries: Record<string, DaySummary> = {};

  const clients = [
    'Al Noor General Trading LLC',
    'Dubai Marina Hypermarket',
    'Gulf Falcon Enterprises',
    'Emirates Grand Superstore',
    'Al Barsha Mart',
    'Deira Wholesale Depot',
    'Jumeirah Retail Distribution',
    'Sharjah Central Trading',
    'Abu Dhabi Express Mart',
    'Ras Al Khaimah Logistics',
  ];

  let currentYesterdayBalance = 5000.0;

  // Generate 24 days starting from 23 days ago up to today
  for (let dayOffset = 23; dayOffset >= 0; dayOffset--) {
    const targetDate = subDays(new Date(), dayOffset);
    const dateStr = format(targetDate, 'yyyy-MM-dd');

    // 2-3 orders per day
    const dayOrderCount = 2 + (dayOffset % 2);
    let dayJahedTotal = 0;

    for (let ordIdx = 0; ordIdx < dayOrderCount; ordIdx++) {
      const clientName = clients[(dayOffset + ordIdx) % clients.length];
      const qty = 50 + ((dayOffset * 17 + ordIdx * 31) % 200);
      const costPrice = 3.5 + ((ordIdx * 0.75 + dayOffset * 0.2) % 3.0);
      const clientPrice = costPrice + 1.0 + ((ordIdx * 0.5) % 2.0); // Private client price

      const computed = computeOrderFields({
        qty,
        cost_price: Number(costPrice.toFixed(2)),
        client_price: Number(clientPrice.toFixed(2)),
      });

      const order: Order = {
        id: `ord-${dateStr}-${ordIdx + 1}`,
        date: dateStr,
        client_name: clientName,
        qty,
        cost_price: Number(costPrice.toFixed(2)),
        client_price: Number(clientPrice.toFixed(2)),
        nabta_bill: computed.nabta_bill,
        client_bill: computed.client_bill,
        jahed_balance: computed.jahed_balance,
        notes: `Delivery Voucher #${1000 + dayOffset * 10 + ordIdx}`,
        created_at: new Date(targetDate).toISOString(),
        updated_at: new Date(targetDate).toISOString(),
      };

      seedOrders.push(order);
      dayJahedTotal += computed.jahed_balance;
    }

    // 1 payment every alternate day
    let dayPaidTotal = 0;
    if (dayOffset % 2 === 0) {
      const payAmount = 80.0 + ((dayOffset * 13) % 150);
      const payReason = dayOffset % 4 === 0 ? 'Courier Logistics & Transportation' : 'Packaging Materials Supplies';
      const payment: Payment = {
        id: `pay-${dateStr}-1`,
        date: dateStr,
        amount: Number(payAmount.toFixed(2)),
        reason: payReason,
        payment_method: dayOffset % 4 === 0 ? 'Bank Transfer' : 'Cash',
        recipient: 'Nabta Express Logistics',
        created_at: new Date(targetDate).toISOString(),
      };
      seedPayments.push(payment);
      dayPaidTotal = payment.amount;
    }

    // Calculate Day Summary
    const jahedSum = Number(dayJahedTotal.toFixed(2));
    const todayBal = calculateDaySummary(currentYesterdayBalance, jahedSum, dayPaidTotal);

    seedSummaries[dateStr] = {
      date: dateStr,
      nabta_yesterday_balance: Number(currentYesterdayBalance.toFixed(2)),
      jahed_balance: jahedSum,
      paid: dayPaidTotal,
      nabta_today_balance: todayBal,
      notes: `Day audit for ${dateStr}`,
      updated_at: new Date(targetDate).toISOString(),
    };

    // Carry forward to next day
    currentYesterdayBalance = todayBal;
  }

  return { seedOrders, seedPayments, seedSummaries };
}

export function getServerOrders(): Order[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(ORDERS_FILE)) {
      const { seedOrders, seedPayments, seedSummaries } = generateSeedData();
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(seedOrders, null, 2));
      fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(seedPayments, null, 2));
      fs.writeFileSync(SUMMARIES_FILE, JSON.stringify(seedSummaries, null, 2));
      return seedOrders;
    }
    const content = fs.readFileSync(ORDERS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading server orders:', err);
    return [];
  }
}

export function saveServerOrders(orders: Order[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error('Error saving server orders:', err);
  }
}

export function getServerPayments(): Payment[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(PAYMENTS_FILE)) {
      getServerOrders(); // Triggers seed generation
      const content = fs.readFileSync(PAYMENTS_FILE, 'utf-8');
      return JSON.parse(content);
    }
    const content = fs.readFileSync(PAYMENTS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading server payments:', err);
    return [];
  }
}

export function saveServerPayments(payments: Payment[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2));
  } catch (err) {
    console.error('Error saving server payments:', err);
  }
}

export function getServerSummaries(): Record<string, DaySummary> {
  try {
    ensureDataDir();
    if (!fs.existsSync(SUMMARIES_FILE)) {
      getServerOrders();
      const content = fs.readFileSync(SUMMARIES_FILE, 'utf-8');
      return JSON.parse(content);
    }
    const content = fs.readFileSync(SUMMARIES_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading server summaries:', err);
    return {};
  }
}

export function saveServerSummaries(summaries: Record<string, DaySummary>) {
  try {
    ensureDataDir();
    fs.writeFileSync(SUMMARIES_FILE, JSON.stringify(summaries, null, 2));
  } catch (err) {
    console.error('Error saving server summaries:', err);
  }
}
