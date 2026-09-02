import { NextResponse } from 'next/server';
import { getServerPayments, saveServerPayments } from '@/lib/serverDataStore';
import { Payment } from '@/types';

export async function GET() {
  const payments = getServerPayments();
  return NextResponse.json(payments);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, amount, reason, payment_method, recipient } = body;

    const newPayment: Payment = {
      id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      date,
      amount: Number(amount) || 0,
      reason,
      payment_method: payment_method || 'Cash',
      recipient: recipient || '',
      created_at: new Date().toISOString(),
    };

    const current = getServerPayments();
    const updated = [newPayment, ...current];
    saveServerPayments(updated);

    return NextResponse.json(newPayment);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error creating payment' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const current = getServerPayments();
    saveServerPayments(current.filter((p) => p.id !== id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error deleting payment' }, { status: 500 });
  }
}
