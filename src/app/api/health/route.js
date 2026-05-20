import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'flollama',
    status: 'online',
    timestamp: new Date().toISOString(),
  });
}
