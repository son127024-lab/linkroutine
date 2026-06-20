import { NextResponse } from 'next/server';
import { approvePiPayment } from '@/lib/paymentServer';

export async function POST(request: Request) {
  try {
    const { paymentId } = await request.json();
    const result = await approvePiPayment(paymentId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown approve error' },
      { status: 400 },
    );
  }
}
