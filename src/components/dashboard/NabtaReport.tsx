'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { NabtaDayBlock } from '@/lib/nabtaStore';
import { formatAED, formatNumber } from '@/lib/calculations';
import {
  Printer,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Building2,
  Calendar,
  CheckCircle2,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO, subDays } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

const DAYS_PER_PAGE = 10;

export default function NabtaReport() {
  const { logout, user } = useAuth();
  const [dayBlocks, setDayBlocks] = useState<NabtaDayBlock[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Load live data from server endpoint
  const loadReportData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/nabta/report`, { cache: 'no-store' });
      const data = await res.json();

      if (res.ok && data.valid) {
        setIsValid(true);
        setDayBlocks(data.dayBlocks || []);
      } else {
        setIsValid(false);
        setErrorMessage(data.error || 'Failed to load report data.');
      }
    } catch (err: any) {
      setIsValid(false);
      setErrorMessage('Network error connecting to report server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  // Pagination calculations
  const totalDays = dayBlocks.length;
  const totalPages = Math.max(1, Math.ceil(totalDays / DAYS_PER_PAGE));

  const pageStartIndex = (currentPage - 1) * DAYS_PER_PAGE;
  const pageEndIndex = Math.min(pageStartIndex + DAYS_PER_PAGE, totalDays);
  const currentDaysSlice = dayBlocks.slice(pageStartIndex, pageEndIndex);

  // Determine Report Period for the current 10-day slice
  const reportPeriodLabel = useMemo(() => {
    if (currentDaysSlice.length === 0) return 'No Data Available';
    const firstDay = currentDaysSlice[0]?.formattedDate || currentDaysSlice[0]?.date;
    const lastDay = currentDaysSlice[currentDaysSlice.length - 1]?.formattedDate || currentDaysSlice[currentDaysSlice.length - 1]?.date;
    return `${firstDay} — ${lastDay}`;
  }, [currentDaysSlice]);

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  // PDF Export Handler
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 26, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('NABTA SALES REPORT', 14, 14);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(52, 211, 153); // emerald-400
      doc.text(`Report Period: ${reportPeriodLabel} (Page ${currentPage} of ${totalPages})`, 14, 21);

      let currentY = 32;

      // Render each day block
      currentDaysSlice.forEach((day, dayIdx) => {
        // Check page overflow
        if (currentY > 235) {
          doc.addPage();
          currentY = 20;
        }

        // Day Title
        doc.setFillColor(241, 245, 249);
        doc.rect(14, currentY - 4, 182, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`Day ${pageStartIndex + dayIdx + 1}: ${day.formattedDate} (${day.orders.length} Orders)`, 16, currentY);
        currentY += 5;

        // Table
        const head = [['#', 'Client Name', 'Qty', 'Price (AED)', 'Nabta Bill', 'Client Bill', 'Jahed Balance']];
        const rows = day.orders.map((o, idx) => [
          idx + 1,
          o.client_name,
          formatNumber(o.qty),
          o.cost_price.toFixed(2),
          o.nabta_bill.toFixed(2),
          o.client_bill.toFixed(2),
          `+${o.jahed_balance.toFixed(2)}`,
        ]);

        if (day.orders.length === 0) {
          rows.push(['-', 'No orders recorded for this day', '-', '-', '0.00', '0.00', '0.00']);
        }

        autoTable(doc, {
          head,
          body: rows,
          startY: currentY,
          theme: 'grid',
          margin: { left: 14, right: 14 },
          headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8, fontStyle: 'bold' },
          styles: { fontSize: 7.5, cellPadding: 1.8 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 3;

        // Day Summary Box
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        
        const summaryLines = [
          `Nabta ${format(subDays(parseISO(day.date), 1), 'dd-MM-yy')} Balance: ${day.summary.nabta_yesterday_balance.toFixed(2)}`,
          `Jahed: ${(-day.summary.jahed_balance).toFixed(2)}`,
        ];

        if (day.no_pay_clients && day.no_pay_clients.length > 0) {
          day.no_pay_clients.forEach(c => {
            summaryLines.push(`${c.client_name} No Pay: ${c.amount.toFixed(2)}`);
          });
        }

        if (day.summary.paid > 0) {
          summaryLines.push(`Deposit: ${(-day.summary.paid).toFixed(2)} (${day.summary.paid_reason})`);
        }

        summaryLines.push(`Nabta ${format(parseISO(day.date), 'dd-MM-yy')} Balance: ${day.summary.nabta_today_balance.toFixed(2)}`);

        // Draw summary lines
        summaryLines.forEach(line => {
          doc.text(line, 14, currentY);
          currentY += 5;
        });

        currentY += 3;
      });

      const fileName = `Nabta_Sales_Report_Page_${currentPage}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF Generation Error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs sm:text-sm font-bold">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-rose-400">Error Loading Report</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {errorMessage}
          </p>
          <button onClick={logout} className="px-4 py-2 mt-4 rounded-xl bg-slate-800 text-slate-300 text-sm font-bold">Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white print:bg-white print:text-black overflow-x-hidden w-full max-w-full">
      {/* Top Read-Only Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 py-2.5 px-3 sm:px-6 print:hidden flex flex-wrap items-center justify-between gap-2 text-xs w-full">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] sm:text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Official Read-Only Financial Ledger (Logged in as {user?.name})</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px] sm:text-[11px]">
          <button
            onClick={loadReportData}
            title="Refresh live data"
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Sync</span>
          </button>
          <span>•</span>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 print:p-0 print:max-w-full w-full box-border">
        {/* 1. REPORT HEADER */}
        <header className="p-4 sm:p-7 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl space-y-4 print:border-none print:shadow-none print:p-0 w-full box-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 print:border-black pb-4 sm:pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20 print:hidden flex-shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white print:text-black leading-tight">
                    NABTA SALES REPORT
                  </h1>
                </div>
              </div>
              <div className="flex items-start sm:items-center gap-1.5 text-xs sm:text-sm text-emerald-400 print:text-black font-semibold">
                <Calendar className="w-3.5 h-3.5 mt-0.5 sm:mt-0 print:hidden flex-shrink-0" />
                <span className="leading-snug">Report Period: <b>{reportPeriodLabel}</b></span>
              </div>
            </div>

            {/* Print & PDF Buttons */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 print:hidden w-full sm:w-auto">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Print</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Page Info & Pagination Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 print:hidden">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Showing:</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-white font-bold font-mono text-[11px]">
                Days {pageStartIndex + 1}–{pageEndIndex} of {totalDays}
              </span>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-slate-200 border border-slate-700 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="px-2.5 py-1 text-xs font-bold text-emerald-400 font-mono text-center">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-slate-200 border border-slate-700 transition-all"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* 2. CHRONOLOGICAL 10 DAYS PER PAGE LIST */}
        <div className="space-y-6 sm:space-y-8 w-full">
          {currentDaysSlice.map((day, dayIndex) => {
            const dayNumber = pageStartIndex + dayIndex + 1;
            const totalQty = day.orders.reduce((sum, o) => sum + Number(o.qty || 0), 0);
            const totalNabtaBill = day.orders.reduce((sum, o) => sum + Number(o.nabta_bill || 0), 0);
            const totalClientBill = day.orders.reduce((sum, o) => sum + Number(o.client_bill || 0), 0);
            const totalJahedBalance = day.orders.reduce((sum, o) => sum + Number(o.jahed_balance || 0), 0);

            return (
              <section
                key={day.date}
                className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl print:border-black print:bg-transparent print:shadow-none print:break-inside-avoid w-full box-border"
              >
                {/* Day Header */}
                <div className="p-3.5 sm:p-5 border-b border-slate-800 bg-slate-850/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:border-black print:bg-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono print:text-black flex-shrink-0">
                      #{dayNumber}
                    </span>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-white print:text-black">
                        {day.formattedDate}
                      </h2>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 print:text-slate-600 font-mono">
                        Total = {day.orders.length} {day.orders.length === 1 ? 'Order' : 'Orders'}
                      </p>
                    </div>
                  </div>

                  <span className="self-start sm:self-auto text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono print:text-black border border-emerald-500/20">
                    Jahed: +{formatAED(day.summary.jahed_balance)}
                  </span>
                </div>

                {/* --- A. DESKTOP VIEW: STANDARD TABLE (Hidden on Mobile) --- */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 print:bg-slate-200 print:text-black print:border-black">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Client Name</th>
                        <th className="py-3 px-4 text-right">Qty</th>
                        <th className="py-3 px-4 text-right">Price</th>
                        <th className="py-3 px-4 text-right">Nabta Bill</th>
                        <th className="py-3 px-4 text-right">Client Bill</th>
                        <th className="py-3 px-4 text-right">Jahed Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm print:divide-slate-300">
                      {day.orders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-xs text-slate-500 print:text-black">
                            No orders recorded on this date.
                          </td>
                        </tr>
                      ) : (
                        day.orders.map((o) => (
                          <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4 font-mono text-xs text-slate-400 print:text-black whitespace-nowrap">
                              {day.date}
                            </td>
                            <td className="py-3 px-4 font-bold text-white print:text-black">
                              {o.client_name}
                              {o.notes && (
                                <span className="block text-[10px] text-slate-500 font-normal">
                                  {o.notes}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-200 print:text-black">
                              {formatNumber(o.qty)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-400 print:text-black text-xs">
                              {formatAED(o.cost_price)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-100 print:text-black">
                              {formatAED(o.nabta_bill)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-amber-400 print:text-black">
                              {formatAED(o.client_bill)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-400 print:text-black">
                              +{formatAED(o.jahed_balance)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>

                    {/* Day Orders Desktop Subtotal */}
                    {day.orders.length > 0 && (
                      <tfoot>
                        <tr className="border-t border-slate-800 bg-slate-950/80 font-bold text-xs uppercase tracking-wider print:bg-slate-100 print:border-black">
                          <td colSpan={2} className="py-2.5 px-4 text-slate-300 print:text-black">
                            Day #{dayNumber} Total
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-200 print:text-black">
                            {formatNumber(totalQty)}
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-500">-</td>
                          <td className="py-2.5 px-4 text-right font-mono text-white print:text-black">
                            {formatAED(totalNabtaBill)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-amber-400 print:text-black">
                            {formatAED(totalClientBill)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-emerald-400 print:text-black">
                            +{formatAED(totalJahedBalance)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* --- B. MOBILE VIEW: COMPACT ORDER CARDS (No Horizontal Scroll) --- */}
                <div className="md:hidden p-3 space-y-3 print:hidden">
                  {day.orders.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-3">No orders recorded for this day.</p>
                  ) : (
                    day.orders.map((o, ordIdx) => (
                      <div
                        key={o.id}
                        className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2.5 shadow-sm"
                      >
                        {/* Card Header: Client Name & Date */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-850 pb-2">
                          <div>
                            <h3 className="text-xs font-bold text-white leading-snug">
                              {o.client_name}
                            </h3>
                            {o.notes && (
                              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                {o.notes}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 flex-shrink-0 bg-slate-900 px-1.5 py-0.5 rounded">
                            {day.date}
                          </span>
                        </div>

                        {/* Card Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-850">
                            <span className="text-slate-400 font-medium">Qty:</span>
                            <span className="font-bold font-mono text-slate-200">{formatNumber(o.qty)}</span>
                          </div>

                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-850">
                            <span className="text-slate-400 font-medium">Price:</span>
                            <span className="font-bold font-mono text-slate-300">{formatAED(o.cost_price)}</span>
                          </div>

                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-850">
                            <span className="text-slate-400 font-medium">Nabta Bill:</span>
                            <span className="font-bold font-mono text-slate-100">{formatAED(o.nabta_bill)}</span>
                          </div>

                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-850">
                            <span className="text-slate-400 font-medium">Client Bill:</span>
                            <span className="font-bold font-mono text-amber-400">{formatAED(o.client_bill)}</span>
                          </div>
                        </div>

                        {/* Profit Row */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-850 text-xs">
                          <span className="text-slate-400 font-semibold">Jahed Balance:</span>
                          <span className="font-extrabold font-mono text-emerald-400">
                            +{formatAED(o.jahed_balance)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Mobile Day Subtotal Box */}
                  {day.orders.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-700/60 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-300">
                        <span>Day #{dayNumber} Subtotal ({day.orders.length} Orders)</span>
                        <span className="font-mono">{formatNumber(totalQty)} Qty</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Nabta: <b className="text-white font-mono">{formatAED(totalNabtaBill)}</b></span>
                        <span>Client: <b className="text-amber-400 font-mono">{formatAED(totalClientBill)}</b></span>
                        <span>Jahed: <b className="text-emerald-400 font-mono">+{formatAED(totalJahedBalance)}</b></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2.5 NO PAY CLIENTS SECTION */}
                {day.no_pay_clients && day.no_pay_clients.length > 0 && (
                  <div className="border-t border-slate-800/80 bg-slate-900/50">
                    <div className="p-3.5 sm:p-5 pb-0">
                      <h3 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-rose-400 print:text-black mb-3">
                        No Pay Clients
                      </h3>
                      
                      {/* Desktop Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                              <th className="py-2.5 px-4 w-1/2">Client Name</th>
                              <th className="py-2.5 px-4 w-1/2 text-right">No Pay Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-xs">
                            {day.no_pay_clients.map((c, i) => (
                              <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                <td className="py-2.5 px-4 font-bold text-white">{c.client_name}</td>
                                <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-400">
                                  {formatAED(c.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards (No Horizontal Scroll) */}
                      <div className="md:hidden grid grid-cols-1 gap-2 pb-4">
                        {day.no_pay_clients.map((c, i) => (
                          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/90 shadow-sm gap-1.5">
                            <span className="text-xs font-bold text-white">{c.client_name}</span>
                            <span className="text-xs font-mono font-bold text-rose-400">{formatAED(c.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. DAY SUMMARY BOX (Below Each Day's Table) */}
                <div className="p-3.5 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800 space-y-2.5 print:border-black print:bg-slate-50 w-full box-border">
                  <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 print:text-black">
                    Day Financial Summary
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden print:border-black print:bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider print:bg-slate-200 print:text-black">
                        <tr>
                          <th className="py-2.5 px-4 text-left font-bold">Summary</th>
                          <th className="py-2.5 px-4 text-right font-bold">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                        {/* Yesterday Balance */}
                        <tr className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-white print:text-black">
                            Nabta {format(subDays(parseISO(day.date), 1), 'dd-MM-yy')} Balance
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-white print:text-black">
                            {formatAED(day.summary.nabta_yesterday_balance)}
                          </td>
                        </tr>

                        {/* Jahed Balance */}
                        <tr className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-white print:text-black">
                            Jahed
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-white print:text-black">
                            {formatAED(-day.summary.jahed_balance)}
                          </td>
                        </tr>

                        {/* Individual No Pay Clients */}
                        {day.no_pay_clients && day.no_pay_clients.map((c, i) => (
                          <tr key={`nopay-${i}`} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-rose-400">
                              {c.client_name} No Pay
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-400">
                              {formatAED(c.amount)}
                            </td>
                          </tr>
                        ))}

                        {/* Paid Amount (if any) */}
                        {day.summary.paid > 0 && (
                          <tr className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-white print:text-black">
                              Deposit {day.summary.paid_reason && day.summary.paid_reason !== 'No payments recorded' ? `(${day.summary.paid_reason})` : ''}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-white print:text-black">
                              {formatAED(-day.summary.paid)}
                            </td>
                          </tr>
                        )}

                        {/* Today Balance */}
                        <tr className="bg-slate-850 print:bg-slate-100">
                          <td className="py-3 px-4 font-black text-emerald-400 print:text-black">
                            Nabta {format(parseISO(day.date), 'dd-MM-yy')} Balance
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 print:text-black">
                            {formatAED(day.summary.nabta_today_balance)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* Footer Pagination Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 print:hidden w-full box-border">
          <p className="text-[11px] sm:text-xs text-slate-400 font-mono text-center sm:text-left">
            Page {currentPage} of {totalPages} ({totalDays} Days)
          </p>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-white border border-slate-700 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-3 py-1 text-xs font-bold text-emerald-400 font-mono">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <footer className="text-center text-[10px] sm:text-[11px] text-slate-500 print:text-black pb-8">
          <p>This is a certified electronic ledger for Nabta Sales. Automatically calculated & verified.</p>
        </footer>
      </div>
    </div>
  );
}
