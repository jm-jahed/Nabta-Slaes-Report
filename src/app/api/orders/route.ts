import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/serverTokenRegistry';

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json([]);
  const { data } = await supabase.from('orders').select('*').order('date', { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  try {
    if (!isSupabaseConfigured()) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });
    const body = await req.json();
    const { date, client_name, qty, cost_price, client_price, notes } = body;

    const numQty = Number(qty) || 0;
    const numCost = Number(cost_price) || 0;
    const numClientPrice = Number(client_price) || 0;
    const nabta_bill = Number((numQty * numCost).toFixed(2));
    const client_bill = Number((numQty * numClientPrice).toFixed(2));
    const jahed_balance = Number((client_bill - nabta_bill).toFixed(2));

    const id = 'ord-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const { data, error } = await supabase.from('orders').insert({
      id, date, client_name,
      qty: numQty, cost_price: numCost, client_price: numClientPrice,
      nabta_bill, client_bill, jahed_balance,
      notes: notes || '',
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!isSupabaseConfigured()) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });
    const body = await req.json();
    const numQty = Number(body.qty) || 0;
    const numCost = Number(body.cost_price) || 0;
    const numClientPrice = Number(body.client_price) || 0;
    const nabta_bill = Number((numQty * numCost).toFixed(2));
    const client_bill = Number((numQty * numClientPrice).toFixed(2));
    const jahed_balance = Number((client_bill - nabta_bill).toFixed(2));

    const { data, error } = await supabase.from('orders')
      .update({ ...body, nabta_bill, client_bill, jahed_balance, updated_at: new Date().toISOString() })
      .eq('id', body.id).select().single();

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
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
