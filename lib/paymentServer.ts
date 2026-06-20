export async function approvePiPayment(paymentId: string) {
  const apiKey = process.env.PI_API_KEY;
  if (!paymentId) throw new Error('Missing paymentId');
  if (!apiKey || apiKey === 'replace_with_your_pi_developer_api_key') {
    return { ok: true, mock: true, paymentId, step: 'approve' };
  }

  const res = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Key ${apiKey}` },
  });

  if (!res.ok) throw new Error(`Pi approve failed: ${res.status}`);
  return res.json();
}

export async function completePiPayment(paymentId: string, txid: string) {
  const apiKey = process.env.PI_API_KEY;
  if (!paymentId) throw new Error('Missing paymentId');
  if (!txid) throw new Error('Missing txid');
  if (!apiKey || apiKey === 'replace_with_your_pi_developer_api_key') {
    return { ok: true, mock: true, paymentId, txid, step: 'complete' };
  }

  const res = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ txid }),
  });

  if (!res.ok) throw new Error(`Pi complete failed: ${res.status}`);
  return res.json();
}
