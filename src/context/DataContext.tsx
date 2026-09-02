'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Order, Payment, DaySummary } from '@/types';
import { DataStore } from '@/lib/storage';
import { format } from 'date-fns';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface DataContextType {
  orders: Order[];
  payments: Payment[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  daySummary: DaySummary | null;
  isLoading: boolean;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  addOrder: (order: Omit<Order, 'id' | 'nabta_bill' | 'client_bill' | 'jahed_balance' | 'created_at' | 'updated_at'>) => Promise<Order>;
  editOrder: (order: Order) => Promise<Order>;
  removeOrder: (id: string) => Promise<boolean>;
  addPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Promise<Payment>;
  removePayment: (id: string) => Promise<boolean>;
  updateYesterdayOpeningBalance: (amount: number) => Promise<void>;
  refreshData: () => Promise<void>;
  resetToDefaultData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [daySummary, setDaySummary] = useState<DaySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedOrders, fetchedPayments] = await Promise.all([
        DataStore.getOrders(),
        DataStore.getPayments(),
      ]);
      setOrders(fetchedOrders);
      setPayments(fetchedPayments);

      const summary = await DataStore.getDaySummaryForDate(selectedDate, fetchedOrders, fetchedPayments);
      setDaySummary(summary);
    } catch (err) {
      console.error('Failed to load data:', err);
      showToast('Error loading records', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recalculate summary whenever selectedDate changes
  useEffect(() => {
    if (orders.length >= 0) {
      DataStore.getDaySummaryForDate(selectedDate, orders, payments).then((summary) => {
        setDaySummary(summary);
      });
    }
  }, [selectedDate, orders, payments]);

  const addOrder = async (orderInput: Omit<Order, 'id' | 'nabta_bill' | 'client_bill' | 'jahed_balance' | 'created_at' | 'updated_at'>) => {
    const newOrder = await DataStore.createOrder(orderInput);
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    
    // update summary
    const updatedSummary = await DataStore.getDaySummaryForDate(selectedDate, updatedOrders, payments);
    setDaySummary(updatedSummary);
    showToast(`Order for ${newOrder.client_name} created successfully!`, 'success');
    return newOrder;
  };

  const editOrder = async (order: Order) => {
    const updated = await DataStore.updateOrder(order);
    const updatedOrders = orders.map((o) => (o.id === updated.id ? updated : o));
    setOrders(updatedOrders);

    const updatedSummary = await DataStore.getDaySummaryForDate(selectedDate, updatedOrders, payments);
    setDaySummary(updatedSummary);
    showToast(`Order updated successfully!`, 'success');
    return updated;
  };

  const removeOrder = async (id: string) => {
    const success = await DataStore.deleteOrder(id);
    if (success) {
      const updatedOrders = orders.filter((o) => o.id !== id);
      setOrders(updatedOrders);

      const updatedSummary = await DataStore.getDaySummaryForDate(selectedDate, updatedOrders, payments);
      setDaySummary(updatedSummary);
      showToast('Order removed', 'info');
      return true;
    }
    return false;
  };

  const addPayment = async (paymentInput: Omit<Payment, 'id' | 'created_at'>) => {
    const newPayment = await DataStore.createPayment(paymentInput);
    const updatedPayments = [newPayment, ...payments];
    setPayments(updatedPayments);

    const updatedSummary = await DataStore.getDaySummaryForDate(selectedDate, orders, updatedPayments);
    setDaySummary(updatedSummary);
    showToast(`Payment of AED ${newPayment.amount} recorded!`, 'success');
    return newPayment;
  };

  const removePayment = async (id: string) => {
    const success = await DataStore.deletePayment(id);
    if (success) {
      const updatedPayments = payments.filter((p) => p.id !== id);
      setPayments(updatedPayments);

      const updatedSummary = await DataStore.getDaySummaryForDate(selectedDate, orders, updatedPayments);
      setDaySummary(updatedSummary);
      showToast('Payment voucher removed', 'info');
      return true;
    }
    return false;
  };

  const updateYesterdayOpeningBalance = async (amount: number) => {
    const updated = await DataStore.updateYesterdayBalance(selectedDate, amount);
    setDaySummary(updated);
    showToast(`Yesterday opening balance updated to AED ${amount}`, 'success');
  };

  const resetToDefaultData = () => {
    DataStore.resetToSeed();
    loadData();
    showToast('Reset to demo sample data', 'info');
  };

  return (
    <DataContext.Provider
      value={{
        orders,
        payments,
        selectedDate,
        setSelectedDate,
        daySummary,
        isLoading,
        toasts,
        showToast,
        removeToast,
        addOrder,
        editOrder,
        removeOrder,
        addPayment,
        removePayment,
        updateYesterdayOpeningBalance,
        refreshData: loadData,
        resetToDefaultData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
