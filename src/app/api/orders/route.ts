import { NextResponse } from 'next/server';
import { getServerOrders, saveServerOrders } from '@/lib/serverDataStore';
import { computeOrderFields } from '@/lib/calculations';
import { Order } from '@/types';

export async function GET() {
  const orders = getServerOrders();
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, client_name, qty, cost_price, client_price, notes } = body;

    const numQty = Number(qty) || 0;
    const numCost = Number(cost_price) || 0;
    const numClientPrice = Number(client_price) || 0;

    const computed = computeOrderFields({
      qty: numQty,
      cost_price: numCost,
      client_price: numClientPrice,
    });

    const newOrder: Order = {
      id: 'ord-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      date,
      client_name,
      qty: numQty,
      cost_price: numCost,
      client_price: numClientPrice,
      nabta_bill: computed.nabta_bill,
      client_bill: computed.client_bill,
      jahed_balance: computed.jahed_balance,
      notes: notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const current = getServerOrders();
    const updated = [newOrder, ...current];
    saveServerOrders(updated);

    return NextResponse.json(newOrder);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error creating order' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body: Order = await req.json();
    const computed = computeOrderFields({
      qty: Number(body.qty) || 0,
      cost_price: Number(body.cost_price) || 0,
      client_price: Number(body.client_price) || 0,
    });

    const updatedOrder: Order = {
      ...body,
      ...computed,
      updated_at: new Date().toISOString(),
    };

    const current = getServerOrders();
    const updated = current.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
    saveServerOrders(updated);

    return NextResponse.json(updatedOrder);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error updating order' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const current = getServerOrders();
    saveServerOrders(current.filter((o) => o.id !== id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error deleting order' }, { status: 500 });
  }
}
