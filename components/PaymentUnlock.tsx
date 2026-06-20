'use client';

import { useEffect, useState } from 'react';
import { createTestPayment } from '@/lib/pi';
import { isUnlocked, setUnlocked } from '@/lib/storage';

export default function PaymentUnlock() {
  const [unlocked, setLocalUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Test Pi payment connection is ready.');

  useEffect(() => {
    setLocalUnlocked(isUnlocked());
  }, []);

  async function handleTestPay() {
    setBusy(true);
    setMessage('Opening Pi test payment...');
    try {
      await createTestPayment(() => {
        setUnlocked(true);
        setLocalUnlocked(true);
        setMessage('Test unlock completed.');
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Payment failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="paymentCard">
      <div>
        <p className="eyebrow">TEST PAYMENT SDK</p>
        <strong>{unlocked ? 'Unlocked' : 'Sandbox Ready'}</strong>
        <p className="microCopy">{message}</p>
      </div>
      <button className="secondaryButton" onClick={handleTestPay} disabled={busy}>
        {busy ? 'Testing...' : 'Test Pay'}
      </button>
    </section>
  );
}
