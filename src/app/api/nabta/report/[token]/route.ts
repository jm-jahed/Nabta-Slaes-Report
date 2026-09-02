import { NextResponse } from 'next/server';
import { isServerTokenValid } from '@/lib/serverTokenRegistry';
import { getServerOrders, getServerPayments, getServerSummaries } from '@/lib/serverDataStore';
import { format, parseISO } from 'date-fns';

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  const token = params.token;

  // 1. Verify token validity
  if (!isServerTokenValid(token)) {
    return NextResponse.json(
      {
        valid: false,
        error: 'The report link is invalid, expired, or has been revoked by administration.',
      },
      { status: 403 }
    );
  }

  // 2. Fetch live data from server store
  const orders = getServerOrders();
  const payments = getServerPayments();
  const summaries = getServerSummaries();

  // 3. Collect unique dates and sort chronologically from oldest to newest
  const datesSet = new Set<string>();
  orders.forEach((o) => o.date && datesSet.add(o.date));
  payments.forEach((p) => p.date && datesSet.add(p.date));
  Object.keys(summaries).forEach((d) => datesSet.add(d));

  if (datesSet.size === 0) {
    datesSet.add(format(new Date(), 'yyyy-MM-dd'));
  }

  const sortedDates = Array.from(datesSet).sort((a, b) => a.localeCompare(b));

  // 4. Build sanitized chronological day blocks
  let runningYesterdayBalance = 5000.0;
  const dayBlocks = [];

  for (let i = 0; i < sortedDates.length; i++) {
    const dateStr = sortedDates[i];
    const dayOrders = orders.filter((o) => o.date === dateStr);
    const dayPayments = payments.filter((p) => p.date === dateStr);

    // STRICT SANITIZATION: ABSOLUTELY NO client_price in response object!
    const sanitizedOrders = dayOrders.map((o) => ({
      id: o.id,
      date: o.date,
      client_name: o.client_name,
      qty: Number(o.qty || 0),
      cost_price: Number(o.cost_price || 0), // Labeled as "Price" in UI table
      nabta_bill: Number(o.nabta_bill || (o.qty * o.cost_price).toFixed(2)),
      client_bill: Number(o.client_bill || 0),
      jahed_balance: Number(o.jahed_balance || 0),
      notes: o.notes || '',
    }));

    const jahed_balance = Number(
      sanitizedOrders.reduce((sum, o) => sum + o.jahed_balance, 0).toFixed(2)
    );

    const paid = Number(
      dayPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0).toFixed(2)
    );

    const paidReasons = dayPayments
      .map((p) => p.reason || '')
      .filter(Boolean)
      .join('; ') || '';

    const nabta_yesterday_balance = summaries[dateStr]?.nabta_yesterday_balance !== undefined
      ? Number(summaries[dateStr].nabta_yesterday_balance)
      : runningYesterdayBalance;

    const nabta_today_balance = Number(
      (nabta_yesterday_balance - jahed_balance - paid).toFixed(2)
    );

    runningYesterdayBalance = nabta_today_balance;

    let formattedDate = dateStr;
    try {
      formattedDate = format(parseISO(dateStr), 'dd MMMM yyyy');
    } catch (e) {}

    dayBlocks.push({
      date: dateStr,
      formattedDate,
      orders: sanitizedOrders,
      summary: {
        nabta_yesterday_balance,
        jahed_balance,
        paid,
        paid_reason: paidReasons,
        nabta_today_balance,
      },
    });
  }

  return NextResponse.json(
    {
      valid: true,
      token,
      generatedAt: new Date().toISOString(),
      totalDays: dayBlocks.length,
      dayBlocks,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
