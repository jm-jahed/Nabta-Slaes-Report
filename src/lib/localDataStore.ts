import fs from 'fs';
import path from 'path';

// Using a `.data` directory in the project root
const DATA_DIR = path.join(process.cwd(), '.data');

const getFilePath = (filename: string) => path.join(DATA_DIR, filename);

// Ensure directory exists
const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

// Generic read
const readData = <T>(filename: string, defaultData: T): T => {
  ensureDataDir();
  const filePath = getFilePath(filename);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content) as T;
    } catch (e) {
      console.error(`Error reading ${filename}`, e);
    }
  }
  // Write default if not exists
  writeData(filename, defaultData);
  return defaultData;
};

// Generic write
const writeData = <T>(filename: string, data: T) => {
  ensureDataDir();
  const filePath = getFilePath(filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const INITIAL_ORDERS = [
  {
    id: "ord-20260901-1",
    date: "2026-09-01",
    client_name: "Abu Al Joud",
    qty: 25,
    cost_price: 4,
    client_price: 4.5,
    nabta_bill: 100,
    client_bill: 112.5,
    jahed_balance: 12.5,
    notes: "",
    created_at: "2026-09-01T08:00:00.000Z"
  },
  {
    id: "ord-20260901-2",
    date: "2026-09-01",
    client_name: "Al Mallah",
    qty: 25,
    cost_price: 4,
    client_price: 4.5,
    nabta_bill: 100,
    client_bill: 112.5,
    jahed_balance: 12.5,
    notes: "",
    created_at: "2026-09-01T08:10:00.000Z"
  },
  {
    id: "ord-20260901-3",
    date: "2026-09-01",
    client_name: "Khalifa Sharjah",
    qty: 70,
    cost_price: 3,
    client_price: 3.5,
    nabta_bill: 210,
    client_bill: 245,
    jahed_balance: 35,
    notes: "",
    created_at: "2026-09-01T08:20:00.000Z"
  },
  {
    id: "ord-20260901-4",
    date: "2026-09-01",
    client_name: "Xender Peeled",
    qty: 120,
    cost_price: 3.6,
    client_price: 4,
    nabta_bill: 432,
    client_bill: 480,
    jahed_balance: 48,
    notes: "",
    created_at: "2026-09-01T08:30:00.000Z"
  },
  {
    id: "ord-20260902-1",
    date: "2026-09-02",
    client_name: "Abu Al Joud",
    qty: 25,
    cost_price: 4,
    client_price: 4.5,
    nabta_bill: 100,
    client_bill: 112.5,
    jahed_balance: 12.5,
    notes: "",
    created_at: "2026-09-02T08:00:00.000Z"
  },
  {
    id: "ord-20260902-2",
    date: "2026-09-02",
    client_name: "Al Mallah",
    qty: 25,
    cost_price: 4,
    client_price: 4.5,
    nabta_bill: 100,
    client_bill: 112.5,
    jahed_balance: 12.5,
    notes: "",
    created_at: "2026-09-02T08:10:00.000Z"
  },
  {
    id: "ord-20260902-3",
    date: "2026-09-02",
    client_name: "Khalifa Sharjah",
    qty: 70,
    cost_price: 3,
    client_price: 3.5,
    nabta_bill: 210,
    client_bill: 245,
    jahed_balance: 35,
    notes: "",
    created_at: "2026-09-02T08:20:00.000Z"
  },
  {
    id: "ord-20260902-4",
    date: "2026-09-02",
    client_name: "Xender Peeled",
    qty: 120,
    cost_price: 3.6,
    client_price: 4,
    nabta_bill: 432,
    client_bill: 480,
    jahed_balance: 48,
    notes: "",
    created_at: "2026-09-02T08:30:00.000Z"
  },
  {
    id: "ord-20260902-5",
    date: "2026-09-02",
    client_name: "Villago",
    qty: 20,
    cost_price: 4,
    client_price: 6,
    nabta_bill: 80,
    client_bill: 120,
    jahed_balance: 40,
    notes: "",
    created_at: "2026-09-02T08:40:00.000Z"
  },
  {
    id: "ord-20260902-6",
    date: "2026-09-02",
    client_name: "Sahelnom",
    qty: 30,
    cost_price: 4,
    client_price: 5,
    nabta_bill: 120,
    client_bill: 150,
    jahed_balance: 30,
    notes: "",
    created_at: "2026-09-02T08:50:00.000Z"
  }
];

const INITIAL_SUMMARIES = [
  {
    date: "2026-09-01",
    nabta_yesterday_balance: -56.2,
    jahed_balance: 108,
    paid: 0,
    nabta_today_balance: -164.2,
    updated_at: "2026-09-01T09:00:00.000Z"
  },
  {
    date: "2026-09-02",
    nabta_yesterday_balance: -164.2,
    jahed_balance: 178,
    paid: 0,
    nabta_today_balance: -342.2,
    updated_at: "2026-09-02T09:00:00.000Z"
  }
];

export const LocalFS = {
  // --- Orders ---
  getOrders: () => readData<any[]>('orders.json', INITIAL_ORDERS),
  saveOrders: (orders: any[]) => writeData('orders.json', orders),
  
  // --- Payments ---
  getPayments: () => readData<any[]>('payments.json', []),
  savePayments: (payments: any[]) => writeData('payments.json', payments),

  // --- Day Summaries ---
  getDaySummaries: () => readData<any[]>('summaries.json', INITIAL_SUMMARIES),
  saveDaySummaries: (summaries: any[]) => writeData('summaries.json', summaries),
};
