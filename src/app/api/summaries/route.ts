export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { loadMonthlyData, saveMonthlyData } from '@/lib/dataManager';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    if (!dateStr) return NextResponse.json({ error: 'Date required' }, { status: 400 });

    const data = await loadMonthlyData(dateStr);
    
    // Find existing summary
    const existingSummary = data.day_summaries.find(s => s.date === dateStr);
    
    if (existingSummary) {
      // Calculate current today_balance in case payments/orders changed
      const dayOrders = data.orders.filter(o => o.date === dateStr);
      const dayPayments = data.payments.filter(p => p.date === dateStr);

      const jahed_balance = Number(dayOrders.reduce((s, o) => s + Number(o.jahed_balance || 0), 0).toFixed(2));
      const adjustments = Number(dayPayments.reduce((s, p) => s + Number(p.amount || 0), 0).toFixed(2));
      let nabta_yesterday_balance = Number(existingSummary.nabta_yesterday_balance || 0);

      // Auto-heal if 0 or undefined
      if (nabta_yesterday_balance === 0) {
        const prevSummaries = data.day_summaries
          .filter(s => s.date < dateStr)
          .sort((a, b) => b.date.localeCompare(a.date));
        if (prevSummaries.length > 0) {
          nabta_yesterday_balance = Number(prevSummaries[0].nabta_today_balance || 0);
          existingSummary.nabta_yesterday_balance = nabta_yesterday_balance;
        }
      }

      // New Formula: Prev Balance - Jahed + Adjustments
      const nabta_today_balance = Number((nabta_yesterday_balance - jahed_balance + adjustments).toFixed(2));
      
      const updatedSummary = {
        ...existingSummary,
        jahed_balance,
        paid: adjustments,
        nabta_today_balance,
        updated_at: new Date().toISOString()
      };

      // If it changed, save it
      if (
        existingSummary.jahed_balance !== jahed_balance || 
        existingSummary.paid !== adjustments || 
        existingSummary.nabta_today_balance !== nabta_today_balance
      ) {
        const index = data.day_summaries.findIndex(s => s.date === dateStr);
        data.day_summaries[index] = updatedSummary;
        await saveMonthlyData(data, dateStr);
      }

      return NextResponse.json(updatedSummary);
    }

    // No existing summary found - determine opening balance from previous day
    // Try to find the most recent summary prior to dateStr
    const prevSummaries = data.day_summaries
      .filter(s => s.date < dateStr)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    const openingBalance = prevSummaries.length > 0 ? prevSummaries[0].nabta_today_balance : 0;

    const dayOrders = data.orders.filter(o => o.date === dateStr);
    const dayPayments = data.payments.filter(p => p.date === dateStr);

    const jahed_balance = Number(dayOrders.reduce((s, o) => s + Number(o.jahed_balance || 0), 0).toFixed(2));
    const adjustments = Number(dayPayments.reduce((s, p) => s + Number(p.amount || 0), 0).toFixed(2));

    // New Formula: Prev Balance - Jahed + Adjustments
    const nabta_today_balance = Number((openingBalance - jahed_balance + adjustments).toFixed(2));

    const newSummary = {
      date: dateStr,
      nabta_yesterday_balance: openingBalance,
      jahed_balance,
      paid: adjustments,
      nabta_today_balance,
      updated_at: new Date().toISOString()
    };

    data.day_summaries.push(newSummary);
    await saveMonthlyData(data, dateStr);

    return NextResponse.json(newSummary);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, nabta_yesterday_balance } = body;

    const data = await loadMonthlyData(date);
    const index = data.day_summaries.findIndex(s => s.date === date);

    if (index !== -1) {
      const summary = data.day_summaries[index];
      summary.nabta_yesterday_balance = Number(nabta_yesterday_balance) || 0;
      
      // Recalculate
      const dayOrders = data.orders.filter(o => o.date === date);
      const dayPayments = data.payments.filter(p => p.date === date);

      const jahed_balance = Number(dayOrders.reduce((s, o) => s + Number(o.jahed_balance || 0), 0).toFixed(2));
      const adjustments = Number(dayPayments.reduce((s, p) => s + Number(p.amount || 0), 0).toFixed(2));

      // New Formula: Prev Balance - Jahed + Adjustments
      summary.nabta_today_balance = Number((summary.nabta_yesterday_balance - jahed_balance + adjustments).toFixed(2));
      summary.updated_at = new Date().toISOString();

      await saveMonthlyData(data, date);
      return NextResponse.json(summary);
    }

    return NextResponse.json({ error: 'Summary not found to update' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
