'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

function computeLocalSummary(
  dateStr: string,
  allOrders: Order[],
  allPayments: Payment[],
  openingBalance: number
): DaySummary {
  const dayOrders = allOrders.filter((o) => o.date === dateStr);
  const dayPayments = allPayments.filter((p) => p.date === dateStr);

  const jahed_balance = Number(
    dayOrders.reduce((s, o) => s + Number(o.jahed_balance || 0), 0).toFixed(2)
  );
  
  const client_no_pay = Number(
    dayOrders.reduce((s, o) => s + Math.max(0, (o.client_bill || 0) - (o.amount_received || 0)), 0).toFixed(2)
  );
  
  const paid = Number(
    dayPayments.reduce((s, p) => s + Number(p.amount || 0), 0).toFixed(2)
  );

  const nabta_today_balance = Number((openingBalance - jahed_balance - client_no_pay + paid).toFixed(2));

  return {
    date: dateStr,
    nabta_yesterday_balance: openingBalance,
    jahed_balance,
    paid,
    nabta_today_balance,
    updated_at: new Date().toISOString(),
  };
}

// Helper to get YYYY-MM from a date string (YYYY-MM-DD)
function getMonthKey(dateStr: string) {
  return dateStr.substring(0, 7);
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedDate, setSelectedDateState] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [daySummary, setDaySummary] = useState<DaySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Cache of loaded month keys (YYYY-MM)
  const loadedMonths = useRef<Set<string>>(new Set());
  
  // Cache of day summaries fetched from the server
  const summariesCache = useRef<Map<string, DaySummary>>(new Map());

  // Track initial mount to restore localStorage safely
  const isMounted = useRef(false);

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

  const setSelectedDate = useCallback((date: string) => {
    setSelectedDateState(date);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedDate', date);
    }
  }, []);

  // Restore date from localStorage on mount
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      const savedDate = localStorage.getItem('selectedDate');
      if (savedDate && savedDate !== selectedDate) {
        setSelectedDateState(savedDate);
      }
    }
  }, [selectedDate]);

  const ordersRef = useRef<Order[]>([]);
  const paymentsRef = useRef<Payment[]>([]);

  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { paymentsRef.current = payments; }, [payments]);

  // Main data loader function
  const loadMonthData = useCallback(async (targetDate: string, forceRefresh = false) => {
    const monthKey = getMonthKey(targetDate);
    
    // If we already have this month loaded in memory, and we aren't forcing a refresh, skip network
    if (loadedMonths.current.has(monthKey) && !forceRefresh) {
      return; 
    }

    setIsLoading(true);
    try {
      const payload = await DataStore.getFullMonthData(targetDate);
      if (payload) {
        // Only append/update, do not wipe out other months from memory!
        setOrders(prev => {
          const others = prev.filter(o => getMonthKey(o.date) !== monthKey);
          return [...others, ...payload.orders];
        });
        setPayments(prev => {
          const others = prev.filter(p => getMonthKey(p.date) !== monthKey);
          return [...others, ...payload.payments];
        });

        // Store summaries in cache
        payload.day_summaries.forEach(s => {
          summariesCache.current.set(s.date, s);
        });

        loadedMonths.current.add(monthKey);
      }
    } catch (err) {
      console.error('Failed to load month data:', err);
      showToast('Error loading records for this month', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // When selectedDate changes, ensure we have the month data, and compute summary
  useEffect(() => {
    if (!isMounted.current) return;
    
    let isCancelled = false;

    const executeDateChange = async () => {
      const date = selectedDate;
      const monthKey = getMonthKey(date);

      // 1. If we don't have this month's data yet, fetch it (shows spinner)
      if (!loadedMonths.current.has(monthKey)) {
        await loadMonthData(date);
        if (isCancelled) return;
      }

      // 2. We now have the month data in memory. Render instantly!
      const currentOrders = ordersRef.current;
      const currentPayments = paymentsRef.current;
      
      const serverSummary = summariesCache.current.get(date);
      
      if (serverSummary) {
        setDaySummary(computeLocalSummary(date, currentOrders, currentPayments, serverSummary.nabta_yesterday_balance));
      } else {
        // If the server didn't have a summary for this date yet, the backend will auto-create it next time we fetch/mutate.
        // For now, let's optimistically find the most recent previous summary in cache.
        let latestKnownDate = '';
        let latestKnownBalance = 0;
        for (const [key, val] of summariesCache.current.entries()) {
          if (key < date && key > latestKnownDate) {
            latestKnownDate = key;
            latestKnownBalance = val.nabta_today_balance; // Use the closing balance of the previous day!
          }
        }
        setDaySummary(computeLocalSummary(date, currentOrders, currentPayments, latestKnownBalance));
        
        // Asynchronously fetch the actual day summary to ensure backend creates it properly and we get authoritative data
        DataStore.getDaySummaryForDate(date, currentOrders, currentPayments)
          .then((s) => {
            if (!isCancelled) {
              summariesCache.current.set(date, s);
              setDaySummary(s); // Update with authoritative
            }
          })
          .catch(console.error);
      }
    };

    executeDateChange();

    return () => {
      isCancelled = true;
    };
  }, [selectedDate, loadMonthData]);

  const refreshSummaryForDate = useCallback((date: string, updatedOrders: Order[], updatedPayments: Payment[]) => {
    // When a mutation happens, the backend auto-updates the summary.
    // Fetch the new summary from server to stay perfectly in sync.
    DataStore.getDaySummaryForDate(date, updatedOrders, updatedPayments)
      .then((s) => {
        summariesCache.current.set(date, s);
        setDaySummary(s);
      })
      .catch(console.error);
  }, []);

  const addOrder = async (
    orderInput: Omit<Order, 'id' | 'nabta_bill' | 'client_bill' | 'jahed_balance' | 'created_at' | 'updated_at'>
  ) => {
    const newOrder = await DataStore.createOrder(orderInput);
    setOrders((prev) => {
      const updatedOrders = [newOrder, ...prev];
      refreshSummaryForDate(selectedDate, updatedOrders, paymentsRef.current);
      return updatedOrders;
    });
    showToast(`Order for ${newOrder.client_name} created successfully!`, 'success');
    return newOrder;
  };

  const editOrder = async (order: Order) => {
    const updated = await DataStore.updateOrder(order);
    setOrders((prev) => {
      const updatedOrders = prev.map((o) => (o.id === updated.id ? updated : o));
      refreshSummaryForDate(selectedDate, updatedOrders, paymentsRef.current);
      return updatedOrders;
    });
    showToast('Order updated successfully!', 'success');
    return updated;
  };

  const removeOrder = async (id: string) => {
    const success = await DataStore.deleteOrder(id);
    if (success) {
      setOrders((prev) => {
        const updatedOrders = prev.filter((o) => o.id !== id);
        refreshSummaryForDate(selectedDate, updatedOrders, paymentsRef.current);
        return updatedOrders;
      });
      showToast('Order removed', 'info');
      return true;
    }
    return false;
  };

  const addPayment = async (paymentInput: Omit<Payment, 'id' | 'created_at'>) => {
    const newPayment = await DataStore.createPayment(paymentInput);
    setPayments((prev) => {
      const updatedPayments = [newPayment, ...prev];
      refreshSummaryForDate(selectedDate, ordersRef.current, updatedPayments);
      return updatedPayments;
    });
    showToast(`Payment of AED ${newPayment.amount} recorded!`, 'success');
    return newPayment;
  };

  const removePayment = async (id: string) => {
    const success = await DataStore.deletePayment(id);
    if (success) {
      setPayments((prev) => {
        const updatedPayments = prev.filter((p) => p.id !== id);
        refreshSummaryForDate(selectedDate, ordersRef.current, updatedPayments);
        return updatedPayments;
      });
      showToast('Payment voucher removed', 'info');
      return true;
    }
    return false;
  };

  const updateYesterdayOpeningBalance = async (amount: number) => {
    const updated = await DataStore.updateYesterdayBalance(selectedDate, amount);
    summariesCache.current.set(selectedDate, updated);
    setDaySummary(updated);
    showToast(`Yesterday opening balance updated to AED ${amount}`, 'success');
  };

  const refreshData = async () => {
    loadedMonths.current.clear();
    summariesCache.current.clear();
    await loadMonthData(selectedDate, true);
  };

  const resetToDefaultData = () => {
    DataStore.resetToSeed();
    loadedMonths.current.clear();
    summariesCache.current.clear();
    loadMonthData(selectedDate, true);
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
        refreshData,
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
