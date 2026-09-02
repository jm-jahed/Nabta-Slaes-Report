'use client';

import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ReportFilters from '@/components/reports/ReportFilters';
import ExportButtons from '@/components/reports/ExportButtons';
import { useData } from '@/context/DataContext';
import { formatAED, formatNumber } from '@/lib/calculations';
import { FileBarChart2, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export default function ReportsPage() {
  const { orders, payments } = useData();

  const [period, setPeriod] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'custom'>('all');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClient, setSelectedClient] = useState('');

  // Extract unique client list
  const clientsList = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.client_name) set.add(o.client_name);
    });
    return Array.from(set).sort();
  }, [orders]);

  // Adjust dates based on period tabs
  const handlePeriodChange = (newPeriod: 'all' | 'daily' | 'weekly' | 'monthly' | 'custom') => {
    setPeriod(newPeriod);
    const now = new Date();
    if (newPeriod === 'daily') {
      setStartDate(format(now, 'yyyy-MM-dd'));
      setEndDate(format(now, 'yyyy-MM-dd'));
    } else if (newPeriod === 'weekly') {
      setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    } else if (newPeriod === 'monthly') {
      setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
    } else if (newPeriod === 'all') {
      setStartDate('2020-01-01');
      setEndDate(format(now, 'yyyy-MM-dd'));
    }
  };

  const handleReset = () => {
    setPeriod('all');
    setSelectedClient('');
    setStartDate('2020-01-01');
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
  };

  // Filter Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Date filter
      if (period !== 'all') {
        if (o.date < startDate || o.date > endDate) return false;
      }
      // Client filter
      if (selectedClient && o.client_name !== selectedClient) {
        return false;
      }
      return true;
    });
  }, [orders, period, startDate, endDate, selectedClient]);

  // Filter Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (period !== 'all') {
        if (p.date < startDate || p.date > endDate) return false;
      }
      return true;
    });
  }, [payments, period, startDate, endDate]);

  // Aggregated totals
  const totalQty = filteredOrders.reduce((sum, o) => sum + Number(o.qty || 0), 0);
  const totalNabtaBill = filteredOrders.reduce((sum, o) => sum + Number(o.nabta_bill || 0), 0);
  const totalClientBill = filteredOrders.reduce((sum, o) => sum + Number(o.client_bill || 0), 0);
  const totalJahedProfit = filteredOrders.reduce((sum, o) => sum + Number(o.jahed_balance || 0), 0);
  const totalPaid = filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const netSurplus = totalJahedProfit - totalPaid;

  const dateRangeLabel = period === 'all' ? 'All Time' : `${startDate} to ${endDate}`;

  return (
    <MainLayout>
      {/* Top Admin Reports Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Internal Reports & Financial Export
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
              {filteredOrders.length} Filtered Orders
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Filter by Daily, Weekly, Monthly, Date Range, or Client Name & download formatted Excel/PDF
          </p>
        </div>

        {/* Export Buttons */}
        <ExportButtons
          orders={filteredOrders}
          payments={filteredPayments}
          filterTitle={selectedClient ? `Client: ${selectedClient}` : 'All Clients'}
          dateRangeText={dateRangeLabel}
        />
      </div>

      {/* Filter Toolbar */}
      <ReportFilters
        period={period}
        setPeriod={handlePeriodChange}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        clientsList={clientsList}
        onReset={handleReset}
      />

      {/* Report Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Quantity</p>
          <p className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {formatNumber(totalQty)}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Nabta Cost</p>
          <p className="text-xl sm:text-2xl font-black font-mono text-slate-700 dark:text-slate-300 mt-1">
            {formatAED(totalNabtaBill)}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Client Bill</p>
          <p className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
            {formatAED(totalClientBill)}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jahed Total Profit</p>
          <p className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatAED(totalJahedProfit)}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-500/40 text-white shadow-lg col-span-2 lg:col-span-1">
          <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Net Profit - Paid Out</p>
          <p className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
            {formatAED(netSurplus)}
          </p>
        </div>
      </div>

      {/* Filtered Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-white">
            Orders Breakdown ({filteredOrders.length} records)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {dateRangeLabel}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-850/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4 text-right">Qty</th>
                <th className="py-3 px-4 text-right">Cost (AED)</th>
                <th className="py-3 px-4 text-right">Nabta Bill</th>
                <th className="py-3 px-4 text-right">Client Bill</th>
                <th className="py-3 px-4 text-right">Jahed Profit</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No orders match the specified filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o, idx) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {o.date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {o.client_name}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold font-mono">
                      {formatNumber(o.qty)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500 text-xs">
                      {formatAED(o.cost_price)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold font-mono text-slate-800 dark:text-slate-200">
                      {formatAED(o.nabta_bill)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold font-mono text-amber-600 dark:text-amber-400">
                      {formatAED(o.client_bill)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                      +{formatAED(o.jahed_balance)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {o.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {filteredOrders.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850/90 font-bold text-xs uppercase tracking-wider">
                  <td colSpan={3} className="py-4 px-4 text-slate-900 dark:text-white">
                    Aggregated Total ({filteredOrders.length} Orders)
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-slate-900 dark:text-white">
                    {formatNumber(totalQty)}
                  </td>
                  <td></td>
                  <td className="py-4 px-4 text-right font-mono text-slate-900 dark:text-white">
                    {formatAED(totalNabtaBill)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-amber-600 dark:text-amber-400">
                    {formatAED(totalClientBill)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    +{formatAED(totalJahedProfit)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
