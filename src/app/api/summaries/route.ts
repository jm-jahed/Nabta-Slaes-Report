import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/serverTokenRegistry';

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({});
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date');

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
    if (!isSupabaseConfigured()) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });
    const body = await req.json();
    const { date, nabta_yesterday_balance } = body;

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
