'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { authenticatePi, PiUser } from '@/lib/pi';

type Props = {
  onAuthenticated: (user: PiUser) => void;
};

export default function PiAuthGate({ onAuthenticated }: Props) {
  const startedRef = useRef(false);
  const [status, setStatus] = useState('Preparing Pi authorization...');
  const [detail, setDetail] = useState('LinkRoutine will open the Pi Allow window automatically.');
  const [failed, setFailed] = useState(false);

  const startAuth = useCallback(async () => {
    setFailed(false);
    setStatus('Opening Pi Network authorization...');
    setDetail('Please approve username + payments permission to continue.');

    try {
      const piUser = await authenticatePi();
      setStatus(`Connected as @${piUser.username ?? 'pioneer'}`);
      setDetail('Pi account connected. Subscription payment is now available.');
      onAuthenticated(piUser);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Pi connection failed.';
      setFailed(true);
      setStatus(message);
      setDetail('If the Allow window does not open, use Pi Browser → develop.pi → LinkRoutine Sandbox URL, then press Retry.');
      console.error('LinkRoutine Pi auto-auth error:', error, window.__LINKROUTINE_PI_DEBUG__);
    }
  }, [onAuthenticated]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Give Pi Browser and the SDK script a moment to finish mounting before auto-auth.
    const timer = window.setTimeout(() => {
      startAuth();
    }, 650);

    return () => window.clearTimeout(timer);
  }, [startAuth]);

  return (
    <section className="authCard authGateCard">
      <div>
        <p className="eyebrow">PIONEER ACCOUNT</p>
        <strong>{status}</strong>
        <p className="microCopy">{detail}</p>
        <p className="microCopy">The app dashboard opens only after Pi username + payments authorization is completed.</p>
      </div>
      {failed ? (
        <button className="primaryButton" onClick={startAuth}>Retry Pi Auth</button>
      ) : (
        <div className="authSpinner" aria-label="Opening Pi authorization" />
      )}
    </section>
  );
}
