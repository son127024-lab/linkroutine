'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { authenticatePi, PiUser } from '@/lib/pi';

type Props = {
  onAuthenticated: (user: PiUser) => void;
};

export default function PiAuthGate({ onAuthenticated }: Props) {
  const startedRef = useRef(false);
  const [status, setStatus] = useState('Opening Pi Network authorization...');
  const [detail, setDetail] = useState('Please approve username + payments permission to continue.');
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
      setDetail('Open LinkRoutine from Pi Browser → develop.pi Sandbox URL. Vercel env must use NEXT_PUBLIC_ENABLE_MOCK_PI=false.');
      console.error('LinkRoutine Pi auto-auth error:', error, window.__LINKROUTINE_PI_DEBUG__);
    }
  }, [onAuthenticated]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startAuth();
  }, [startAuth]);

  return (
    <section className="authCard authGateCard">
      <div>
        <p className="eyebrow">PIONEER ACCOUNT</p>
        <strong>{status}</strong>
        <p className="microCopy">{detail}</p>
        <p className="microCopy">LinkRoutine starts with Pi authorization before opening the app dashboard.</p>
      </div>
      {failed ? (
        <button className="primaryButton" onClick={startAuth}>Retry Pi Auth</button>
      ) : (
        <div className="authSpinner" aria-label="Opening Pi authorization" />
      )}
    </section>
  );
}
