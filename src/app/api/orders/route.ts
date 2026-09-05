export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { loadMonthlyData, saveMonthlyData } from '@/lib/dataManager';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const data = await loadMonthlyData(date || undefined);
    const sortedOrders = data.orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return NextResponse.json(sortedOrders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
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

    const data = await loadMonthlyData(date);
    data.orders.push(newOrder);

    // Auto-insert client
    const trimmedName = client_name.trim();
    if (!data.clients.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      data.clients.push({ id: 'cli-' + Date.now(), name: trimmedName, created_at: new Date().toISOString() });
    }

    await saveMonthlyData(data, date);
    return NextResponse.json(newOrder);
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

    const data = await loadMonthlyData(body.date);
    const index = data.orders.findIndex(o => o.id === body.id);
    if (index !== -1) {
      data.orders[index] = { ...data.orders[index], ...updatedData };

      // Auto-insert client
      const trimmedName = body.client_name?.trim();
      if (trimmedName && !data.clients.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
        data.clients.push({ id: 'cli-' + Date.now(), name: trimmedName, created_at: new Date().toISOString() });
      }

      await saveMonthlyData(data, body.date);
      return NextResponse.json(data.orders[index]);
    }

    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
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
    data.orders = data.orders.filter(o => o.id !== id);
    await saveMonthlyData(data, date || undefined);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
