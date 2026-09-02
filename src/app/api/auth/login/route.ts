import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (email === 'Nabta' && password === 'asd123@') {
      const response = NextResponse.json({
        success: true,
        user: { id: 'usr-nabta', email: 'Nabta', name: 'Nabta Admin', role: 'nabta' },
      });
      response.cookies.set('auth_session', JSON.stringify({ role: 'nabta', name: 'Nabta Admin' }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      return response;
    }

    if ((email === 'jahed2uae' || email === 'jahed2ua') && password === 'asdASD123@') {
      const response = NextResponse.json({
        success: true,
        user: { id: 'usr-admin', email: 'jahed2uae', name: 'Jahed Admin', role: 'admin' },
      });
      response.cookies.set('auth_session', JSON.stringify({ role: 'admin', name: 'Jahed Admin' }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid username or password.' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Authentication failed.' }, { status: 500 });
  }
}
