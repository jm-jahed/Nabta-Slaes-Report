'use client';

import React, { useState } from 'react';
import { Order, Payment } from '@/types';
import { formatAED, formatNumber } from '@/lib/calculations';
import { FileSpreadsheet, FileText, Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface ExportButtonsProps {
  orders: Order[];
  payments: Payment[];
  filterTitle: string;
  dateRangeText: string;
}

export default function ExportButtons({
  orders,
  payments,
  filterTitle,
  dateRangeText,
}: ExportButtonsProps) {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // 1. EXCEL EXPORT
  const exportToExcel = () => {
    setIsExportingExcel(true);
    try {
      // Prepare Orders Sheet
      const ordersData = orders.map((o, idx) => ({
        '#': idx + 1,
        'Date': o.date,
        'Client Name': o.client_name,
        'Quantity': o.qty,
        'Cost Price (AED)': o.cost_price,
        'Nabta Bill (AED)': o.nabta_bill,
        'Client Bill (AED)': o.client_bill,
        'Jahed Balance (AED)': o.jahed_balance,
        'Notes': o.notes || '',
      }));

      // Add Total Row
      const totalQty = orders.reduce((sum, o) => sum + Number(o.qty || 0), 0);
      const totalNabta = orders.reduce((sum, o) => sum + Number(o.nabta_bill || 0), 0);
      const totalClient = orders.reduce((sum, o) => sum + Number(o.client_bill || 0), 0);
      const totalJahed = orders.reduce((sum, o) => sum + Number(o.jahed_balance || 0), 0);

      ordersData.push({
        '#': 'TOTAL' as any,
        'Date': '',
        'Client Name': `${orders.length} Orders`,
        'Quantity': totalQty,
        'Cost Price (AED)': '' as any,
        'Nabta Bill (AED)': totalNabta,
        'Client Bill (AED)': totalClient,
        'Jahed Balance (AED)': totalJahed,
        'Notes': '',
      });

      // Prepare Payments Sheet
      const paymentsData = payments.map((p, idx) => ({
        '#': idx + 1,
        'Date': p.date,
        'Reason / Note': p.reason,
        'Payment Method': p.payment_method || 'Cash',
        'Recipient': p.recipient || '',
        'Amount (AED)': p.amount,
      }));

      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      paymentsData.push({
        '#': 'TOTAL' as any,
        'Date': '',
        'Reason / Note': `${payments.length} Payments`,
        'Payment Method': '',
        'Recipient': '',
        'Amount (AED)': totalPaid,
      });

      const wb = XLSX.utils.book_new();

      const wsOrders = XLSX.utils.json_to_sheet(ordersData);
      const wsPayments = XLSX.utils.json_to_sheet(paymentsData);

      // Set column widths
      wsOrders['!cols'] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 28 },
        { wch: 10 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
        { wch: 24 },
      ];

      XLSX.utils.book_append_sheet(wb, wsOrders, 'Orders Report');
      XLSX.utils.book_append_sheet(wb, wsPayments, 'Payments Log');

      const fileName = `Sales_Payment_Report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Excel Export Error:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // 2. PDF EXPORT
  const exportToPDF = () => {
    setIsExportingPDF(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Title & Branding
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 297, 24, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('SALES & PAYMENT REPORT', 14, 15);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(52, 211, 153); // emerald-400
      doc.text(`Period: ${dateRangeText} | Filter: ${filterTitle}`, 160, 15);

      // Financial Summary Block
      const totalQty = orders.reduce((sum, o) => sum + Number(o.qty || 0), 0);
      const totalNabta = orders.reduce((sum, o) => sum + Number(o.nabta_bill || 0), 0);
      const totalClient = orders.reduce((sum, o) => sum + Number(o.client_bill || 0), 0);
      const totalJahed = orders.reduce((sum, o) => sum + Number(o.jahed_balance || 0), 0);
      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Orders: ${orders.length}   |   Total Qty: ${formatNumber(totalQty)}   |   Total Client Bill: AED ${formatNumber(totalClient)}   |   Jahed Balance (Profit): AED ${formatNumber(totalJahed)}   |   Paid Out: AED ${formatNumber(totalPaid)}`, 14, 32);

      // Orders Table
      const tableHeaders = [
        ['#', 'Date', 'Client Name', 'Qty', 'Cost (AED)', 'Nabta Bill', 'Client Bill', 'Jahed Balance', 'Notes'],
      ];

      const tableRows = orders.map((o, idx) => [
        idx + 1,
        o.date,
        o.client_name,
        formatNumber(o.qty),
        o.cost_price.toFixed(2),
        o.nabta_bill.toFixed(2),
        o.client_bill.toFixed(2),
        `+${o.jahed_balance.toFixed(2)}`,
        o.notes || '-',
      ]);

      // Add Summary Row
      tableRows.push([
        'TOTAL',
        '-',
        `${orders.length} Records`,
        formatNumber(totalQty),
        '-',
        totalNabta.toFixed(2),
        totalClient.toFixed(2),
        `+${totalJahed.toFixed(2)}`,
        '',
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 38,
        theme: 'grid',
        headStyles: {
          fillColor: [16, 185, 129], // emerald-600
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
        },
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generated on ${format(new Date(), 'PPpp')} — Page ${i} of ${pageCount}`,
          14,
          205
        );
      }

      const fileName = `Sales_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      {/* Excel Export Button */}
      <button
        onClick={exportToExcel}
        disabled={isExportingExcel || orders.length === 0}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
      >
        {isExportingExcel ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
        <span>Export Excel</span>
      </button>

      {/* PDF Export Button */}
      <button
        onClick={exportToPDF}
        disabled={isExportingPDF || orders.length === 0}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
      >
        {isExportingPDF ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        <span>Export PDF</span>
      </button>
    </div>
  );
}
