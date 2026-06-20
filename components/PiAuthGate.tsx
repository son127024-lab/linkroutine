'use client';

import { useState } from 'react';
import { authenticatePi, PiUser } from '@/lib/pi';

export default function PiAuthGate() {
  const [user, setUser] = useState<PiUser | null>(null);
  const [status, setStatus] = useState('Not connected');

  async function handleConnect() {
    setStatus('Connecting to Pi...');
    try {
      const piUser = await authenticatePi();
      setUser(piUser);
      setStatus('Connected');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Pi connection failed.');
    }
  }

  return (
    <section className="authCard">
      <div>
        <p className="eyebrow">PIONEER ACCOUNT</p>
        <strong>{user?.username ? `@${user.username}` : status}</strong>
        <p className="microCopy">Pi auth uses username + payments scope for test payment readiness.</p>
      </div>
      <button className="primaryButton" onClick={handleConnect}>{user ? 'Connected' : 'Connect Pi'}</button>
    </section>
  );
}
