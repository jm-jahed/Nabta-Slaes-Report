import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/serverTokenRegistry';
import { LocalFS } from '@/lib/localDataStore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date');

  if (!isSupabaseConfigured()) {
    let summaries = LocalFS.getDaySummaries();
    const allOrders = LocalFS.getOrders();
    const allPayments = LocalFS.getPayments();

    if (dateStr) {
      const storedSummary = summaries.find((s: any) => s.date === dateStr);

      // Always recalculate from live orders to keep Admin and Nabta in sync
      const orders = allOrders.filter((o: any) => o.date === dateStr);
      const payments = allPayments.filter((p: any) => p.date === dateStr);
      const jahed_balance = Number(orders.reduce((s: number, o: any) => s + (o.jahed_balance || 0), 0).toFixed(2));
      const paid = Number(payments.reduce((s: number, p: any) => s + (p.amount || 0), 0).toFixed(2));

      // Use stored opening balance if available, otherwise carry from previous day
      let nabta_yesterday_balance: number;
      if (storedSummary?.nabta_yesterday_balance !== undefined) {
        nabta_yesterday_balance = Number(storedSummary.nabta_yesterday_balance);
      } else {
        const prevSummary = summaries.filter((s: any) => s.date < dateStr).sort((a: any, b: any) => b.date.localeCompare(a.date))[0];
        nabta_yesterday_balance = prevSummary ? Number(prevSummary.nabta_today_balance) : 5000;
      }

      const nabta_today_balance = Number((nabta_yesterday_balance - jahed_balance - paid).toFixed(2));
      const summary = { date: dateStr, nabta_yesterday_balance, jahed_balance, paid, nabta_today_balance, updated_at: new Date().toISOString() };

      // Update stored summary with fresh calculation
      const idx = summaries.findIndex((s: any) => s.date === dateStr);
      if (idx !== -1) { summaries[idx] = summary; } else { summaries.push(summary); }
      LocalFS.saveDaySummaries(summaries);

      return NextResponse.json(summary);
    }

    // For the full map, recalculate each day live
    const map: Record<string, any> = {};
    summaries.forEach((s: any) => { map[s.date] = s; });
    return NextResponse.json(map);
  }

  if (dateStr) {
    // Fetch or recalculate summary for a specific date
    const [ordersRes, paymentsRes, summaryRes] = await Promise.all([
      supabase.from('orders').select('jahed_balance').eq('date', dateStr),
      supabase.from('payments').select('amount').eq('date', dateStr),
      supabase.from('day_summaries').select('*').eq('date', dateStr).maybeSingle(),
    ]);

    const jahed_balance = Number(
      (ordersRes.data || []).reduce((s, o) => s + Number(o.jahed_balance || 0), 0).toFixed(2)
    );
    const paid = Number(
      (paymentsRes.data || []).reduce((s, p) => s + Number(p.amount || 0), 0).toFixed(2)
    );

    // Get yesterday's today balance as yesterday balance
    const { data: prevSummary } = await supabase
      .from('day_summaries')
      .select('nabta_today_balance')
      .lt('date', dateStr)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nabta_yesterday_balance = summaryRes.data?.nabta_yesterday_balance !== undefined
      ? Number(summaryRes.data.nabta_yesterday_balance)
      : prevSummary ? Number(prevSummary.nabta_today_balance) : 5000;

    const nabta_today_balance = Number((nabta_yesterday_balance - jahed_balance - paid).toFixed(2));

    const summary = {
      date: dateStr, nabta_yesterday_balance, jahed_balance, paid, nabta_today_balance,
      updated_at: new Date().toISOString(),
    };

    // Upsert summary
    await supabase.from('day_summaries').upsert(summary, { onConflict: 'date' });

    return NextResponse.json(summary);
  }

  const { data } = await supabase.from('day_summaries').select('*');
  const map: Record<string, any> = {};
  (data || []).forEach((s) => { map[s.date] = s; });
  return NextResponse.json(map);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, nabta_yesterday_balance } = body;

    if (!isSupabaseConfigured()) {
      const orders = LocalFS.getOrders().filter((o: any) => o.date === date);
      const payments = LocalFS.getPayments().filter((p: any) => p.date === date);
      const jahed_balance = orders.reduce((s: number, o: any) => s + (o.jahed_balance || 0), 0);
      const paid = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const nabta_today_balance = Number(nabta_yesterday_balance) - jahed_balance - paid;
      
      const summary = { date, nabta_yesterday_balance: Number(nabta_yesterday_balance), jahed_balance, paid, nabta_today_balance, updated_at: new Date().toISOString() };
      let summaries = LocalFS.getDaySummaries();
      const index = summaries.findIndex((s: any) => s.date === date);
      if (index !== -1) {
        summaries[index] = summary;
      } else {
        summaries.push(summary);
      }
      LocalFS.saveDaySummaries(summaries);
      return NextResponse.json(summary);
    }

    // Recalculate with new opening balance
    const [ordersRes, paymentsRes] = await Promise.all([
      supabase.from('orders').select('jahed_balance').eq('date', date),
      supabase.from('payments').select('amount').eq('date', date),
    ]);
    const jahed_balance = Number(
      (ordersRes.data || []).reduce((s, o) => s + Number(o.jahed_balance || 0), 0).toFixed(2)
    );
    const paid = Number(
      (paymentsRes.data || []).reduce((s, p) => s + Number(p.amount || 0), 0).toFixed(2)
    );
    const nabta_today_balance = Number((Number(nabta_yesterday_balance) - jahed_balance - paid).toFixed(2));

    const summary = { date, nabta_yesterday_balance: Number(nabta_yesterday_balance), jahed_balance, paid, nabta_today_balance };
    await supabase.from('day_summaries').upsert(summary, { onConflict: 'date' });
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
