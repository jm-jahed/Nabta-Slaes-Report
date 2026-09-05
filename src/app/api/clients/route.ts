export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { loadMonthlyData, saveMonthlyData } from '@/lib/dataManager';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const data = await loadMonthlyData(date || undefined);
    return NextResponse.json(data.clients || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, date } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const trimmedName = name.trim();
    const data = await loadMonthlyData(date || undefined);
    
    if (data.clients.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      return NextResponse.json({ error: 'Client already exists' }, { status: 400 });
    }

    const newClient = {
      id: 'cli-' + Date.now(),
      name: trimmedName,
      created_at: new Date().toISOString()
    };

    data.clients.push(newClient);
    await saveMonthlyData(data, date || undefined);

    return NextResponse.json(newClient);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
