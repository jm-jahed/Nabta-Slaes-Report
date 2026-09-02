import { NextResponse } from 'next/server';
import {
  getServerTokens,
  createNewServerToken,
  revokeServerToken,
} from '@/lib/serverTokenRegistry';

export async function GET() {
  const tokens = getServerTokens();
  const activeToken = tokens.find((t) => t.isActive) || null;
  return NextResponse.json({ activeToken, allTokens: tokens });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = body.name || 'Nabta Shareable Live Link';
    const newToken = createNewServerToken(name);
    return NextResponse.json({ success: true, token: newToken });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error generating token' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { token } = body;
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }
    const success = revokeServerToken(token);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error revoking token' }, { status: 500 });
  }
}
