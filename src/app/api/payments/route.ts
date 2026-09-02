import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/serverTokenRegistry';
import { LocalFS } from '@/lib/localDataStore';

export async function GET() {
  if (!isSupabaseConfigured()) {
    const payments = LocalFS.getPayments().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return NextResponse.json(payments);
  }
  const { data } = await supabase.from('payments').select('*').order('date', { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    
    const newPayment = {
      id,
      date: body.date,
      amount: Number(body.amount) || 0,
      reason: body.reason || 'Paid',
      payment_method: body.payment_method || 'Cash',
      recipient: body.recipient || '',
      created_at: new Date().toISOString()
    };

    if (!isSupabaseConfigured()) {
      const payments = LocalFS.getPayments();
      payments.push(newPayment);
      LocalFS.savePayments(payments);
      return NextResponse.json(newPayment);
    }

    const { data, error } = await supabase.from('payments').insert(newPayment).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    if (!isSupabaseConfigured()) {
      let payments = LocalFS.getPayments();
      payments = payments.filter((p: any) => p.id !== id);
      LocalFS.savePayments(payments);
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
