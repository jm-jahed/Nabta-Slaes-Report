export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/serverTokenRegistry';
import { LocalFS } from '@/lib/localDataStore';

export async function GET() {
  if (!isSupabaseConfigured()) {
    const orders = LocalFS.getOrders().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return NextResponse.json(orders);
  }
  const { data } = await supabase.from('orders').select('*').order('date', { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, client_name, qty, cost_price, client_price, notes, paid_status, amount_received } = body;

    const numQty = Number(qty) || 0;
    const numCost = Number(cost_price) || 0;
    const numClientPrice = Number(client_price) || 0;
    const nabta_bill = Number((numQty * numCost).toFixed(2));
    const client_bill = Number((numQty * numClientPrice).toFixed(2));
    const jahed_balance = Number((client_bill - nabta_bill).toFixed(2));
    const amtReceived = Number(amount_received) || 0;

    let computed_paid_status = 'Unpaid';
    if (amtReceived >= client_bill && client_bill > 0) {
      computed_paid_status = 'Paid';
    } else if (amtReceived > 0) {
      computed_paid_status = 'Partial';
    }

    const id = 'ord-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    
    const newOrder = {
      id, date, client_name,
      qty: numQty, cost_price: numCost, client_price: numClientPrice,
      nabta_bill, client_bill, jahed_balance,
      notes: notes || '',
      paid_status: computed_paid_status,
      amount_received: amtReceived,
      created_at: new Date().toISOString()
    };

    if (!isSupabaseConfigured()) {
      const orders = LocalFS.getOrders();
      orders.push(newOrder);
      LocalFS.saveOrders(orders);
      return NextResponse.json(newOrder);
    }

    const { data, error } = await supabase.from('orders').insert(newOrder).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const numQty = Number(body.qty) || 0;
    const numCost = Number(body.cost_price) || 0;
    const numClientPrice = Number(body.client_price) || 0;
    const nabta_bill = Number((numQty * numCost).toFixed(2));
    const client_bill = Number((numQty * numClientPrice).toFixed(2));
    const jahed_balance = Number((client_bill - nabta_bill).toFixed(2));
    const amtReceived = Number(body.amount_received) || 0;

    let computed_paid_status = 'Unpaid';
    if (amtReceived >= client_bill && client_bill > 0) {
      computed_paid_status = 'Paid';
    } else if (amtReceived > 0) {
      computed_paid_status = 'Partial';
    }

    const updatedData = { 
      ...body, 
      nabta_bill, 
      client_bill, 
      jahed_balance, 
      paid_status: computed_paid_status,
      amount_received: amtReceived,
      updated_at: new Date().toISOString() 
    };

    if (!isSupabaseConfigured()) {
      const orders = LocalFS.getOrders();
      const index = orders.findIndex((o: any) => o.id === body.id);
      if (index !== -1) {
        orders[index] = { ...orders[index], ...updatedData };
        LocalFS.saveOrders(orders);
        return NextResponse.json(orders[index]);
      }
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data, error } = await supabase.from('orders')
      .update(updatedData)
      .eq('id', body.id).select().single();

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
      let orders = LocalFS.getOrders();
      orders = orders.filter((o: any) => o.id !== id);
      LocalFS.saveOrders(orders);
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
