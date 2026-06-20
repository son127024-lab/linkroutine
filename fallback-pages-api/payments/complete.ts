import type { NextApiRequest, NextApiResponse } from 'next';
import { completePiPayment } from '@/lib/paymentServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  try {
    const result = await completePiPayment(req.body.paymentId, req.body.txid);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ ok: false, error: error instanceof Error ? error.message : 'Unknown complete error' });
  }
}
