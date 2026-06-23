'use client';

import { useState } from 'react';
import { authenticatePi, PiUser } from '@/lib/pi';

export default function PiAuthGate() {
  const [user, setUser] = useState<PiUser | null>(null);
  const [status, setStatus] = useState('Not connected');
  const [detail, setDetail] = useState('Real Pi SDK mode opens the Pi authorization window only from Pi Browser Sandbox.');

  async function handleConnect() {
    setStatus('Connecting to Pi...');
    try {
      const piUser = await authenticatePi();
      setUser(piUser);
      setStatus('Connected');
      setDetail(`Connected as @${piUser.username ?? 'pioneer'}. Payments scope requested.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Pi connection failed.';
      setStatus(message);
      setDetail('Check Vercel env: NEXT_PUBLIC_ENABLE_MOCK_PI=false, then open through Pi Browser → develop.pi Sandbox URL.');
      console.error('LinkRoutine Pi connection error:', error, window.__LINKROUTINE_PI_DEBUG__);
    }
  }

  return (
    <section className="authCard">
      <div>
        <p className="eyebrow">PIONEER ACCOUNT</p>
        <strong>{user?.username ? `@${user.username}` : status}</strong>
        <p className="microCopy">Pi auth uses username + payments scope for test payment readiness.</p>
        <p className="microCopy">{detail}</p>
      </div>
      <button className="primaryButton" onClick={handleConnect}>{user ? 'Connected' : 'Connect Pi'}</button>
    </section>
  );
}
