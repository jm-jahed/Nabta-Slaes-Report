export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { loadMonthlyData, saveMonthlyData } from '@/lib/dataManager';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const data = await loadMonthlyData(date || undefined);
    const sortedPayments = data.payments.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    return NextResponse.json(sortedPayments);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, amount, reason, payment_method, recipient } = body;

    const newPayment = {
      id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      date,
      amount: Number(amount) || 0,
      reason: reason || '',
      payment_method: payment_method || 'Cash',
      recipient: recipient || '',
      created_at: new Date().toISOString()
    };

    const data = await loadMonthlyData(date);
    data.payments.push(newPayment);
    await saveMonthlyData(data, date);

    return NextResponse.json(newPayment);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const date = searchParams.get('date');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const data = await loadMonthlyData(date || undefined);
    data.payments = data.payments.filter(p => p.id !== id);
    await saveMonthlyData(data, date || undefined);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
