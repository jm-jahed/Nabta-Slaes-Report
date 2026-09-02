import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/serverTokenRegistry';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ activeToken: null, allTokens: [], error: 'Supabase not configured' });
  }
  const { data, error } = await supabase
    .from('nabta_tokens')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const activeToken = (data || []).find((t) => t.is_active) || null;
  return NextResponse.json({ activeToken, allTokens: data || [] });
}

export async function POST(req: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }
    const body = await req.json().catch(() => ({}));
    const name = body.name || 'Nabta Shareable Live Link';

    // Deactivate all previous tokens
    await supabase.from('nabta_tokens').update({ is_active: false }).eq('is_active', true);

    // Generate new cryptographic token
    const tokenStr = 'nabta_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, '0')).join('');

    const { data, error } = await supabase
      .from('nabta_tokens')
      .insert({ token: tokenStr, name, is_active: true })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, token: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error generating token' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }
    const body = await req.json();
    const { token } = body;
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    const { error } = await supabase
      .from('nabta_tokens')
      .update({ is_active: false })
      .eq('token', token);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
