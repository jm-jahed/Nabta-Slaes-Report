import { Order, Payment, DaySummary } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';
import { computeOrderFields, calculateDaySummary } from './calculations';

export const DataStore = {
  // Fetch all orders from server
  async getOrders(): Promise<Order[]> {
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Fallback getting orders:', e);
    }
    return [];
  },

  // Create Order
  async createOrder(orderInput: Omit<Order, 'id' | 'nabta_bill' | 'client_bill' | 'jahed_balance' | 'created_at' | 'updated_at'>): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderInput),
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Failed to create order on server');
  },

  // Update Order
  async updateOrder(order: Order): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Failed to update order on server');
  },

  // Delete Order
  async deleteOrder(id: string): Promise<boolean> {
    const res = await fetch(`/api/orders?id=${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  // Fetch Payments
  async getPayments(): Promise<Payment[]> {
    try {
      const res = await fetch('/api/payments', { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Fallback getting payments:', e);
    }
    return [];
  },

  // Create Payment
  async createPayment(paymentInput: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentInput),
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Failed to create payment on server');
  },

  // Delete Payment
  async deletePayment(id: string): Promise<boolean> {
    const res = await fetch(`/api/payments?id=${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  // Compute or Retrieve Day Summary for a given date
  async getDaySummaryForDate(dateStr: string, allOrders?: Order[], allPayments?: Payment[]): Promise<DaySummary> {
    try {
      const res = await fetch(`/api/summaries?date=${dateStr}`, { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Fallback getting summary:', e);
    }

    return {
      date: dateStr,
      nabta_yesterday_balance: 0,
      jahed_balance: 0,
      paid: 0,
      nabta_today_balance: 0,
      updated_at: new Date().toISOString(),
    };
  },

  // Manually update yesterday opening balance
  async updateYesterdayBalance(dateStr: string, newYesterdayBalance: number): Promise<DaySummary> {
    const res = await fetch('/api/summaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: dateStr,
        nabta_yesterday_balance: newYesterdayBalance,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Failed to update opening balance');
  },

  // Reset to seed data
  resetToSeed() {
    // Handled on server
  },
};
