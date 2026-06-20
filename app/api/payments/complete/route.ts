import { NextResponse } from 'next/server';
import { completePiPayment } from '@/lib/paymentServer';

export async function POST(request: Request) {
  try {
    const { paymentId, txid } = await request.json();
    const result = await completePiPayment(paymentId, txid);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown complete error' },
      { status: 400 },
    );
  }
}
