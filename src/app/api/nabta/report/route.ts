import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/serverTokenRegistry';
import { LocalFS } from '@/lib/localDataStore';
import { format, parseISO } from 'date-fns';

// Force dynamic rendering — this route reads live data and must NOT be statically cached
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let orders: any[] = [];
    let payments: any[] = [];
    let summariesArr: any[] = [];

    if (isSupabaseConfigured()) {
      const [ordersRes, paymentsRes, summariesRes] = await Promise.all([
        supabase.from('orders').select('id,date,client_name,qty,cost_price,nabta_bill,client_bill,jahed_balance,notes,amount_received,paid_status').order('date', { ascending: true }),
        supabase.from('payments').select('id,date,amount,reason,payment_method,recipient').order('date', { ascending: true }),
        supabase.from('day_summaries').select('*').order('date', { ascending: true }),
      ]);
      orders = ordersRes.data || [];
      payments = paymentsRes.data || [];
      summariesArr = summariesRes.data || [];
    } else {
      orders = LocalFS.getOrders();
      payments = LocalFS.getPayments();
      summariesArr = LocalFS.getDaySummaries();
    }
    const summaries: Record<string, any> = {};
    summariesArr.forEach((s) => { summaries[s.date] = s; });

    // 2. Collect unique dates
    const datesSet = new Set<string>();
    orders.forEach((o) => o.date && datesSet.add(o.date));
    payments.forEach((p) => p.date && datesSet.add(p.date));
    Object.keys(summaries).forEach((d) => datesSet.add(d));

    const sortedDates = Array.from(datesSet).sort((a, b) => a.localeCompare(b));

    // Global No Pay calculation across ALL orders
    const globalNoPayMap = new Map<string, number>();
    orders.forEach((o) => {
      const noPayAmount = Math.max(0, Number(o.client_bill || 0) - Number(o.amount_received || 0));
      if (noPayAmount > 0) {
        globalNoPayMap.set(o.client_name, (globalNoPayMap.get(o.client_name) || 0) + noPayAmount);
      }
    });
    const globalNoPayClients = Array.from(globalNoPayMap.entries()).map(([client_name, amount]) => ({ client_name, amount: Number(amount.toFixed(2)) }));
    const totalGlobalNoPay = Number(globalNoPayClients.reduce((sum, c) => sum + c.amount, 0).toFixed(2));

    // 3. Build sanitized day blocks — NO client_price ever!
    let runningBalance = 0;
    const dayBlocks = sortedDates.map((dateStr) => {
      const dayOrders = orders.filter((o) => o.date === dateStr);
      const dayPayments = payments.filter((p) => p.date === dateStr);

      const sanitizedOrders = dayOrders.map((o) => ({
        id: o.id,
        date: o.date,
        client_name: o.client_name,
        qty: Number(o.qty || 0),
        cost_price: Number(o.cost_price || 0),
        nabta_bill: Number(o.nabta_bill || 0),
        client_bill: Number(o.client_bill || 0),
        jahed_balance: Number(o.jahed_balance || 0),
        notes: o.notes || '',
        amount_received: Number(o.amount_received || 0)
      }));

      const jahed_balance = Number(sanitizedOrders.reduce((s, o) => s + o.jahed_balance, 0).toFixed(2));
      const paid = Number(dayPayments.reduce((s, p) => s + Number(p.amount || 0), 0).toFixed(2));
      const paidReasons = dayPayments.map((p) => p.reason || '').filter(Boolean).join('; ') || '';

      const noPayMap = new Map<string, number>();
      dayOrders.forEach(o => {
        const noPayAmount = Math.max(0, Number(o.client_bill || 0) - Number(o.amount_received || 0));
        if (noPayAmount > 0) {
          noPayMap.set(o.client_name, (noPayMap.get(o.client_name) || 0) + noPayAmount);
        }
      });
      const no_pay_clients = Array.from(noPayMap.entries()).map(([client_name, amount]) => ({ client_name, amount: Number(amount.toFixed(2)) }));
      const total_no_pay_amount = Number(no_pay_clients.reduce((sum, c) => sum + c.amount, 0).toFixed(2));

      const nabta_yesterday_balance = summaries[dateStr]?.nabta_yesterday_balance !== undefined
        ? Number(summaries[dateStr].nabta_yesterday_balance)
        : runningBalance;

      const nabta_today_balance = Number((nabta_yesterday_balance - jahed_balance + total_no_pay_amount - paid).toFixed(2));
      runningBalance = nabta_today_balance;

      let formattedDate = dateStr;
      try { formattedDate = format(parseISO(dateStr), 'dd MMMM yyyy'); } catch {}

      return {
        date: dateStr,
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
