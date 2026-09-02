import { NextResponse } from 'next/server';
import { LocalFS } from '@/lib/localDataStore';
import { isSupabaseConfigured } from '@/lib/serverTokenRegistry';

// Seed endpoint: called automatically to initialize /tmp data on Vercel
// when no persistent DB is configured.
export async function POST() {
  if (isSupabaseConfigured()) {
    return NextResponse.json({ message: 'Supabase is configured — seeding not needed.' });
  }

  const existingOrders = LocalFS.getOrders();

  // Don't overwrite if data already exists
  if (existingOrders.length > 0) {
    return NextResponse.json({ message: `Already seeded: ${existingOrders.length} orders.` });
  }

  return NextResponse.json({ message: 'Seed data loaded from defaults.', count: LocalFS.getOrders().length });
}

export async function GET() {
  const isDB = isSupabaseConfigured();
  const orders = isDB ? null : LocalFS.getOrders();
  return NextResponse.json({
    supabase_configured: isDB,
    is_vercel: Boolean(process.env.VERCEL),
    data_dir: process.env.VERCEL ? '/tmp/jahed-data' : '.data',
    order_count: orders?.length ?? 'N/A (using Supabase)',
    persistence_note: isDB
      ? 'Supabase connected — full persistence enabled'
      : process.env.VERCEL
        ? 'WARNING: Using /tmp — data resets on cold starts. Add Supabase env vars for persistence.'
        : 'Using local .data/ folder — persistent on local machine',
  });
}
