export interface Order {
  id: string;
  date: string; // YYYY-MM-DD
  client_name: string;
  qty: number;
  cost_price: number;
  client_price: number; // Stored internally, not visible in public order list table
  nabta_bill: number;   // qty * cost_price
  client_bill: number;  // qty * client_price
  jahed_balance: number;// client_bill - nabta_bill
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  reason: string;
  payment_method?: string;
  recipient?: string;
  created_at?: string;
}

export interface DaySummary {
  date: string; // YYYY-MM-DD
  nabta_yesterday_balance: number; // Carried over from previous day's nabta_today_balance
  jahed_balance: number;           // Sum of all jahed_balance for orders on this date
  paid: number;                    // Sum of all payments on this date
  nabta_today_balance: number;     // nabta_yesterday_balance - jahed_balance - paid
  notes?: string;
  is_locked?: boolean;
  updated_at?: string;
}

export interface DateFilterOption {
  startDate: string;
  endDate: string;
  period: 'all' | 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';
  clientName?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'viewer';
}

export interface DashboardStats {
  todayOrdersCount: number;
  todayTotalQty: number;
  todayJahedBalance: number;
  todayPaidAmount: number;
  todayNabtaBalance: number;
  yesterdayNabtaBalance: number;
  totalClientBillToday: number;
  totalNabtaBillToday: number;
}
