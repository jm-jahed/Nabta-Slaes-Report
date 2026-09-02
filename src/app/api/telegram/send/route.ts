import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token, chatId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const result = await sendTelegramMessage(message, chatId, token);

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Telegram message sent successfully!' });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
