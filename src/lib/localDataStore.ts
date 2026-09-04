import fs from 'fs';
import path from 'path';

// On Vercel serverless, process.cwd() is read-only.
// Use /tmp (writable) on Vercel, .data locally.
// NOTE: /tmp is per-Lambda-instance and NOT persistent across cold starts.
// Configure NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel
// for true production persistence.
const IS_VERCEL = Boolean(process.env.VERCEL);
const DATA_DIR = IS_VERCEL
  ? '/tmp/jahed-data'
  : path.join(process.cwd(), '.data');

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

const INITIAL_ORDERS: any[] = [];

const INITIAL_SUMMARIES: any[] = [];

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

  // --- Clients ---
  getClients: () => readData<any[]>('clients.json', []),
  saveClients: (clients: any[]) => writeData('clients.json', clients),
};
