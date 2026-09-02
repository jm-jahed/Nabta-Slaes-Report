import { NextResponse } from 'next/server';
import { getServerSummaries, saveServerSummaries, getServerOrders, getServerPayments } from '@/lib/serverDataStore';
import { calculateDaySummary } from '@/lib/calculations';
import { format, subDays } from 'date-fns';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date');

  const summaries = getServerSummaries();

  if (dateStr) {
    const orders = getServerOrders();
    const payments = getServerPayments();

    const dayOrders = orders.filter((o) => o.date === dateStr);
    const jahed_balance = Number(
      dayOrders.reduce((sum, o) => sum + (Number(o.jahed_balance) || 0), 0).toFixed(2)
    );

    const dayPayments = payments.filter((p) => p.date === dateStr);
    const paid = Number(
      dayPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toFixed(2)
    );

    let nabta_yesterday_balance = 0;
    const yesterdayStr = format(subDays(new Date(dateStr), 1), 'yyyy-MM-dd');
    if (summaries[yesterdayStr]) {
      nabta_yesterday_balance = summaries[yesterdayStr].nabta_today_balance;
    } else {
      const sortedPastDates = Object.keys(summaries)
        .filter((d) => d < dateStr)
        .sort((a, b) => b.localeCompare(a));
      if (sortedPastDates.length > 0) {
        nabta_yesterday_balance = summaries[sortedPastDates[0]].nabta_today_balance;
      } else if (summaries[dateStr]?.nabta_yesterday_balance !== undefined) {
        nabta_yesterday_balance = summaries[dateStr].nabta_yesterday_balance;
      } else {
        nabta_yesterday_balance = 5000.0;
      }
    }

    const nabta_today_balance = calculateDaySummary(nabta_yesterday_balance, jahed_balance, paid);

    const summary = {
      date: dateStr,
      nabta_yesterday_balance,
      jahed_balance,
      paid,
      nabta_today_balance,
      updated_at: new Date().toISOString(),
    };

    summaries[dateStr] = summary;
    saveServerSummaries(summaries);

    return NextResponse.json(summary);
  }

  return NextResponse.json(summaries);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, nabta_yesterday_balance } = body;

    const summaries = getServerSummaries();
    const current = summaries[date] || {
      date,
      nabta_yesterday_balance: Number(nabta_yesterday_balance),
      jahed_balance: 0,
      paid: 0,
      nabta_today_balance: Number(nabta_yesterday_balance),
    };

    current.nabta_yesterday_balance = Number(nabta_yesterday_balance);
    current.nabta_today_balance = calculateDaySummary(
      current.nabta_yesterday_balance,
      current.jahed_balance,
      current.paid
    );

    summaries[date] = current;
    saveServerSummaries(summaries);

    return NextResponse.json(current);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error updating summary' }, { status: 500 });
  }
}
