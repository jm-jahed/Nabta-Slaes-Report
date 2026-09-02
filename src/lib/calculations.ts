import { Order, Payment, DaySummary } from '@/types';

/**
 * Calculates Nabta Bill: Qty * Cost Price
 */
export function calculateNabtaBill(qty: number, costPrice: number): number {
  return Number((qty * costPrice).toFixed(2));
}

/**
 * Calculates Client Bill: Qty * Client Price
 */
export function calculateClientBill(qty: number, clientPrice: number): number {
  return Number((qty * clientPrice).toFixed(2));
}

/**
 * Calculates Jahed Balance: Client Bill - Nabta Bill
 */
export function calculateJahedBalance(clientBill: number, nabtaBill: number): number {
  return Number((clientBill - nabtaBill).toFixed(2));
}

/**
 * Prepares calculated order object
 */
export function computeOrderFields(params: {
  qty: number;
  cost_price: number;
  client_price: number;
}): { nabta_bill: number; client_bill: number; jahed_balance: number } {
  const nabta_bill = calculateNabtaBill(params.qty, params.cost_price);
  const client_bill = calculateClientBill(params.qty, params.client_price);
  const jahed_balance = calculateJahedBalance(client_bill, nabta_bill);

  return {
    nabta_bill,
    client_bill,
    jahed_balance,
  };
}

/**
 * Calculates Day Summary:
 * Nabta Today Balance = Nabta Yesterday Balance - Jahed Balance - Paid Amount
 */
export function calculateDaySummary(
  nabtaYesterdayBalance: number,
  jahedBalance: number,
  paidAmount: number
): number {
  return Number((nabtaYesterdayBalance - jahedBalance - paidAmount).toFixed(2));
}

/**
 * Formats currency in UAE Dirhams (AED)
 */
export function formatAED(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'AED 0.00';
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats number cleanly
 */
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}
