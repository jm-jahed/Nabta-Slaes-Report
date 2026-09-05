export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { loadMonthlyData } from '@/lib/dataManager';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }
    
    const data = await loadMonthlyData(date);
    
    // Sort orders descending
    if (data.orders) {
      data.orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    // Sort payments descending
    if (data.payments) {
      data.payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    // Sort day summaries descending
    if (data.day_summaries) {
      data.day_summaries.sort((a, b) => b.date.localeCompare(a.date));
    }
    
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
