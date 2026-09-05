import { NextResponse } from 'next/server';
import { loadMonthlyData } from '@/lib/dataManager';
import { format, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    
    // Load monthly data (if no date is provided, it loads current month)
    const data = await loadMonthlyData(dateStr || undefined);

    const orders = data.orders || [];
    const payments = data.payments || [];
    const summariesArr = data.day_summaries || [];
    
    const summaries: Record<string, any> = {};
    summariesArr.forEach((s) => { summaries[s.date] = s; });

    // Collect unique dates
    const datesSet = new Set<string>();
    orders.forEach((o) => o.date && datesSet.add(o.date));
    payments.forEach((p) => p.date && datesSet.add(p.date));
    Object.keys(summaries).forEach((d) => datesSet.add(d));

    const sortedDates = Array.from(datesSet).sort((a, b) => a.localeCompare(b));

    // Global No Pay calculation across ALL orders
    const globalNoPayMap = new Map<string, number>();
    orders.forEach((o) => {
      const amountReceived = o.amount_received !== undefined ? Number(o.amount_received) : Number(o.client_bill || o.client_amount || 0);
      const noPayAmount = Math.max(0, Number(o.client_bill || o.client_amount || 0) - amountReceived);
      if (noPayAmount > 0) {
        globalNoPayMap.set(o.client_name, (globalNoPayMap.get(o.client_name) || 0) + noPayAmount);
      }
    });
    const globalNoPayClients = Array.from(globalNoPayMap.entries()).map(([client_name, amount]) => ({ client_name, amount: Number(amount.toFixed(2)) }));
    const totalGlobalNoPay = Number(globalNoPayClients.reduce((sum, c) => sum + c.amount, 0).toFixed(2));

    // Build sanitized day blocks
    let runningBalance = 0;
    const dayBlocks = sortedDates.map((d) => {
      const dayOrders = orders.filter((o) => o.date === d);
      const dayPayments = payments.filter((p) => p.date === d);

      const sanitizedOrders = dayOrders.map((o) => ({
        id: o.id,
        date: o.date,
        client_name: o.client_name,
        qty: Number(o.qty || o.quantity || 0),
        cost_price: Number(o.cost_price || o.unit_price || 0),
        nabta_bill: Number(o.nabta_bill || o.total_amount || 0),
        client_bill: Number(o.client_bill || o.client_amount || 0),
        jahed_balance: Number(o.jahed_balance || (Number(o.client_bill || o.client_amount || 0) - Number(o.nabta_bill || o.total_amount || 0)) || 0),
        notes: o.notes || '',
        amount_received: Number(o.amount_received || o.client_bill || o.client_amount || 0)
      }));

      const jahed_balance = Number(sanitizedOrders.reduce((s, o) => s + o.jahed_balance, 0).toFixed(2));
      const paid = Number(dayPayments.reduce((s, p) => s + Number(p.amount || 0), 0).toFixed(2));
      const paidReasons = dayPayments.map((p) => p.reason || '').filter(Boolean).join('; ') || '';

      const noPayMap = new Map<string, number>();
      dayOrders.forEach(o => {
        const amountReceived = o.amount_received !== undefined ? Number(o.amount_received) : Number(o.client_bill || o.client_amount || 0);
        const noPayAmount = Math.max(0, Number(o.client_bill || o.client_amount || 0) - amountReceived);
        if (noPayAmount > 0) {
          noPayMap.set(o.client_name, (noPayMap.get(o.client_name) || 0) + noPayAmount);
        }
      });
      const no_pay_clients = Array.from(noPayMap.entries()).map(([client_name, amount]) => ({ client_name, amount: Number(amount.toFixed(2)) }));
      const total_no_pay_amount = Number(no_pay_clients.reduce((sum, c) => sum + c.amount, 0).toFixed(2));

      const isFirstDay = d === sortedDates[0];
      const nabta_yesterday_balance = isFirstDay
        ? (summaries[d]?.nabta_yesterday_balance !== undefined ? Number(summaries[d].nabta_yesterday_balance) : 0)
        : runningBalance;

      const nabta_today_balance = summaries[d]?.nabta_today_balance !== undefined
        ? Number(summaries[d].nabta_today_balance)
        : Number((nabta_yesterday_balance - jahed_balance - total_no_pay_amount + paid).toFixed(2));

      runningBalance = nabta_today_balance;

      let formattedDate = d;
      try { formattedDate = format(parseISO(d), 'dd MMMM yyyy'); } catch {}

      return {
        date: d,
        formattedDate,
        orders: sanitizedOrders,
        summary: { nabta_yesterday_balance, jahed_balance, paid, paid_reason: paidReasons, nabta_today_balance, total_no_pay_amount },
        no_pay_clients
      };
    });

    return NextResponse.json(
      { valid: true, generatedAt: new Date().toISOString(), totalDays: dayBlocks.length, globalNoPayClients, totalGlobalNoPay, dayBlocks },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: error.message }, { status: 500 });
  }
}
