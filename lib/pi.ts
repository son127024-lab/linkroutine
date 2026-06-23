export type PiUser = {
  uid?: string;
  username?: string;
  accessToken?: string;
};

type PaymentData = {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
};

type PiPaymentCallbacks = {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: unknown, payment?: unknown) => void;
};

declare global {
  interface Window {
    __LINKROUTINE_PI_DEBUG__?: Record<string, unknown>;
    Pi?: {
      init: (config: { version: string; sandbox?: boolean }) => void;
      authenticate: (scopes: string[], onIncompletePaymentFound: (payment: unknown) => void) => Promise<PiUser>;
      createPayment: (paymentData: PaymentData, callbacks: PiPaymentCallbacks) => void;
    };
  }
}

export function shouldUseMockPi() {
  return process.env.NEXT_PUBLIC_ENABLE_MOCK_PI === 'true';
}

function setPiDebug(extra: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.__LINKROUTINE_PI_DEBUG__ = {
    mockPi: process.env.NEXT_PUBLIC_ENABLE_MOCK_PI,
    sandbox: process.env.NEXT_PUBLIC_PI_SANDBOX,
    hasWindowPi: Boolean(window.Pi),
    userAgent: window.navigator.userAgent,
    ...extra,
  };
}

async function waitForPiSdk(timeoutMs = 6000) {
  if (typeof window === 'undefined') return false;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.Pi) {
      setPiDebug({ sdkDetected: true });
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  setPiDebug({ sdkDetected: false, timeoutMs });
  return false;
}

export async function initPi() {
  if (typeof window === 'undefined') return;
  setPiDebug({ phase: 'initPi:start' });
  if (shouldUseMockPi()) {
    setPiDebug({ phase: 'initPi:mock' });
    return;
  }
  const found = await waitForPiSdk();
  if (!found || !window.Pi) {
    throw new Error('Pi SDK was not detected. Open the Vercel Development URL from Pi Browser Sandbox and confirm NEXT_PUBLIC_ENABLE_MOCK_PI=false.');
  }
  window.Pi.init({ version: '2.0', sandbox: process.env.NEXT_PUBLIC_PI_SANDBOX === 'true' });
  setPiDebug({ phase: 'initPi:done', initialized: true });
}

export async function authenticatePi(): Promise<PiUser> {
  await initPi();
  if (!window.Pi) {
    if (!shouldUseMockPi()) throw new Error('Pi SDK was not detected after initialization.');
    return { uid: 'mock-user', username: 'mock_pioneer', accessToken: 'mock-access-token' };
  }
  setPiDebug({ phase: 'authenticate:requesting', scopes: ['username', 'payments'] });
  return window.Pi.authenticate(['username', 'payments'], (payment) => {
    console.warn('Incomplete Pi payment found:', payment);
  });
}

export async function createTestPayment(onUnlocked: () => void) {
  const amount = Number(process.env.NEXT_PUBLIC_TEST_PAYMENT_AMOUNT || '0.01');
  await initPi();
  if (!window.Pi) {
    if (!shouldUseMockPi()) throw new Error('Pi SDK was not detected. Open this app inside Pi Browser Sandbox.');
    await new Promise((resolve) => setTimeout(resolve, 450));
    onUnlocked();
    return;
  }
  setPiDebug({ phase: 'payment:test:create', amount });

  window.Pi.createPayment(
    {
      amount,
      memo: 'LinkRoutine test unlock',
      metadata: { app: 'LinkRoutine', type: 'test_unlock' },
    },
    {
      onReadyForServerApproval: async (paymentId: string) => {
        await fetch('/api/payments/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId }),
        });
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        const res = await fetch('/api/payments/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, txid }),
        });
        if (!res.ok) throw new Error('Payment completion failed.');
        onUnlocked();
      },
      onCancel: (paymentId: string) => console.info('Payment cancelled:', paymentId),
      onError: (error: unknown) => console.error('Pi payment error:', error),
    },
  );
}

export async function createSubscriptionPayment(amount: number, onPaid: () => void) {
  await initPi();
  const safeAmount = Number(amount.toFixed(3));
  if (!window.Pi) {
    if (!shouldUseMockPi()) throw new Error('Pi SDK was not found. Open this app inside Pi Browser.');
    await new Promise((resolve) => setTimeout(resolve, 450));
    onPaid();
    return;
  }

  setPiDebug({ phase: 'payment:subscription:create', amount: safeAmount });

  window.Pi.createPayment(
    {
      amount: safeAmount,
      memo: `LinkRoutine monthly subscription ${safeAmount} Pi`,
      metadata: {
        app: 'LinkRoutine',
        type: 'monthly_subscription',
        amount: safeAmount,
        directCashback: false,
      },
    },
    {
      onReadyForServerApproval: async (paymentId: string) => {
        await fetch('/api/payments/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId }),
        });
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        const res = await fetch('/api/payments/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, txid }),
        });
        if (!res.ok) throw new Error('Subscription payment completion failed.');
        onPaid();
      },
      onCancel: (paymentId: string) => console.info('Subscription payment cancelled:', paymentId),
      onError: (error: unknown) => console.error('Pi subscription payment error:', error),
    },
  );
}
