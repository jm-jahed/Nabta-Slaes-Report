export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/serverTokenRegistry';
import { LocalFS } from '@/lib/localDataStore';

export async function GET() {
  if (!isSupabaseConfigured()) {
    const clients = LocalFS.getClients();
    return NextResponse.json(clients);
  }
  const { data } = await supabase.from('clients').select('*').order('name', { ascending: true });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name || name.trim() === '') return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const trimmedName = name.trim();

    if (!isSupabaseConfigured()) {
      const id = 'cli-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      const newClient = {
        id,
        name: trimmedName,
        created_at: new Date().toISOString()
      };
      const clients = LocalFS.getClients();
      if (clients.some((c: any) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
        return NextResponse.json({ error: 'Client already exists' }, { status: 409 });
      }
      clients.push(newClient);
      LocalFS.saveClients(clients);
      return NextResponse.json(newClient);
    }

    const { data: existing } = await supabase.from('clients').select('id').ilike('name', trimmedName).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: 'Client already exists' }, { status: 409 });
    }

    const { data, error } = await supabase.from('clients').insert({ name: trimmedName }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name } = await req.json();
    if (!id || !name || name.trim() === '') return NextResponse.json({ error: 'ID and Name are required' }, { status: 400 });
    
    const trimmedName = name.trim();

    if (!isSupabaseConfigured()) {
      const clients = LocalFS.getClients();
      if (clients.some((c: any) => c.id !== id && c.name.toLowerCase() === trimmedName.toLowerCase())) {
        return NextResponse.json({ error: 'Client name already exists' }, { status: 409 });
      }
      const index = clients.findIndex((c: any) => c.id === id);
      if (index !== -1) {
        clients[index].name = trimmedName;
        LocalFS.saveClients(clients);
        return NextResponse.json(clients[index]);
      }
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: existing } = await supabase.from('clients').select('id').ilike('name', trimmedName).neq('id', id).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: 'Client name already exists' }, { status: 409 });
    }

    const { data, error } = await supabase.from('clients').update({ name: trimmedName }).eq('id', id).select().single();
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
      let clients = LocalFS.getClients();
      clients = clients.filter((c: any) => c.id !== id);
      LocalFS.saveClients(clients);
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
