import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/serverTokenRegistry';

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json([]);
  const { data } = await supabase.from('payments').select('*').order('date', { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  try {
    if (!isSupabaseConfigured()) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });
    const body = await req.json();
    const id = 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const { data, error } = await supabase.from('payments').insert({
      id,
      date: body.date,
      amount: Number(body.amount) || 0,
      reason: body.reason || 'Paid',
      payment_method: body.payment_method || 'Cash',
      recipient: body.recipient || '',
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!isSupabaseConfigured()) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
