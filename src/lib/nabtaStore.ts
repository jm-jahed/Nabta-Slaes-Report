import { Order, Payment, DaySummary } from '@/types';
import { format, parseISO } from 'date-fns';

export interface NabtaTokenRecord {
  token: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  name: string;
}

export interface NabtaDayBlock {
  date: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "03 September 2026"
  orders: Array<{
    id: string;
    client_name: string;
    qty: number;
    cost_price: number; // Rendered as "Price" in table
    nabta_bill: number;
    client_bill: number;
    jahed_balance: number;
    notes?: string;
  }>;
  summary: {
    nabta_yesterday_balance: number;
    jahed_balance: number;
    paid: number;
    paid_reason: string;
    nabta_today_balance: number;
  };
}

/**
 * Transforms orders and payments into sanitized chronological daily blocks for Nabta report.
 * Strictly guarantees client_price is completely excluded!
 */
export function getSanitizedNabtaDayBlocks(
  orders: Order[] = [],
  payments: Payment[] = [],
  summaries: Record<string, DaySummary> = {}
): NabtaDayBlock[] {
  // 1. Collect all unique dates across orders and payments
  const datesSet = new Set<string>();
  orders.forEach((o) => o.date && datesSet.add(o.date));
  payments.forEach((p) => p.date && datesSet.add(p.date));
  Object.keys(summaries).forEach((d) => datesSet.add(d));

  if (datesSet.size === 0) {
    datesSet.add(format(new Date(), 'yyyy-MM-dd'));
  }

  // 2. Sort dates chronologically from oldest to newest
  const sortedDates = Array.from(datesSet).sort((a, b) => a.localeCompare(b));

  // 3. Build each day's block with calculations and carry forward
  let runningYesterdayBalance = 5000.0; // Starting baseline
  const dayBlocks: NabtaDayBlock[] = [];

  for (let i = 0; i < sortedDates.length; i++) {
    const dateStr = sortedDates[i];
    const dayOrders = orders.filter((o) => o.date === dateStr);
    const dayPayments = payments.filter((p) => p.date === dateStr);

    // Filtered orders with ABSOLUTELY NO client_price
    const sanitizedOrders = dayOrders.map((o) => ({
      id: o.id,
      client_name: o.client_name,
      qty: Number(o.qty || 0),
      cost_price: Number(o.cost_price || 0), // Displayed as "Price"
      nabta_bill: Number(o.nabta_bill || (o.qty * o.cost_price).toFixed(2)),
      client_bill: Number(o.client_bill || 0),
      jahed_balance: Number(o.jahed_balance || 0),
      notes: o.notes || '',
    }));

    const jahed_balance = Number(
      sanitizedOrders.reduce((sum, o) => sum + o.jahed_balance, 0).toFixed(2)
    );

    const paid = Number(
      dayPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0).toFixed(2)
    );

    const paidReasons = dayPayments
      .map((p) => (p.recipient ? `${p.reason} (${p.recipient})` : p.reason))
      .filter(Boolean)
      .join('; ') || 'No payments recorded';

    // Yesterday balance resolution
    const nabta_yesterday_balance = summaries[dateStr]?.nabta_yesterday_balance !== undefined
      ? Number(summaries[dateStr].nabta_yesterday_balance)
      : runningYesterdayBalance;

    // Nabta Today Balance = Nabta Yesterday Balance - Jahed Balance - Paid Amount
    const nabta_today_balance = Number(
      (nabta_yesterday_balance - jahed_balance - paid).toFixed(2)
    );

    // Carry forward to next day
    runningYesterdayBalance = nabta_today_balance;

    let formattedDate = dateStr;
    try {
      formattedDate = format(parseISO(dateStr), 'dd MMMM yyyy');
    } catch (e) {}

    dayBlocks.push({
      date: dateStr,
      formattedDate,
      orders: sanitizedOrders,
      summary: {
        nabta_yesterday_balance,
        jahed_balance,
        paid,
        paid_reason: paidReasons,
        nabta_today_balance,
      },
    });
  }

  return dayBlocks;
}
