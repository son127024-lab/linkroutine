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

let piInitPromise: Promise<void> | null = null;
let piInitialized = false;

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
    href: window.location.href,
    ...extra,
  };
}

async function waitForPiSdk(timeoutMs = 12000) {
  if (typeof window === 'undefined') return false;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (window.Pi) {
      setPiDebug({ sdkDetected: true, waitMs: Date.now() - start });
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  setPiDebug({ sdkDetected: false, timeoutMs });
  return false;
}

export async function initPi() {
  if (typeof window === 'undefined') return;

  if (piInitialized) return;
  if (piInitPromise) return piInitPromise;

  piInitPromise = (async () => {
    setPiDebug({ phase: 'initPi:start' });

    if (shouldUseMockPi()) {
      piInitialized = true;
      setPiDebug({ phase: 'initPi:mock' });
      return;
    }

    const found = await waitForPiSdk();
    if (!found || !window.Pi) {
      throw new Error('Pi Network SDK was not initialized. Open this app from Pi Browser → develop.pi Sandbox URL, and confirm NEXT_PUBLIC_ENABLE_MOCK_PI=false.');
    }

    window.Pi.init({
      version: '2.0',
      sandbox: process.env.NEXT_PUBLIC_PI_SANDBOX === 'true',
    });

    piInitialized = true;
    setPiDebug({ phase: 'initPi:done', initialized: true });
  })();

  try {
    await piInitPromise;
  } finally {
    if (!piInitialized) piInitPromise = null;
  }
}

export async function authenticatePi(): Promise<PiUser> {
  await initPi();

  if (!window.Pi) {
    if (!shouldUseMockPi()) {
      throw new Error('Pi SDK was not detected after initialization. Use Pi Browser Sandbox URL, not normal Chrome/Edge.');
    }
    return { uid: 'mock-user', username: 'mock_pioneer', accessToken: 'mock-access-token' };
  }

  setPiDebug({ phase: 'authenticate:auto_request', scopes: ['username', 'payments'] });
  return window.Pi.authenticate(['username', 'payments'], (payment) => {
    console.warn('Incomplete Pi payment found:', payment);
    setPiDebug({ phase: 'authenticate:incomplete_payment_found', payment });
  });
}

async function approvePayment(paymentId: string) {
  const res = await fetch('/api/payments/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId }),
  });
  if (!res.ok) throw new Error('Payment approval failed on server.');
}

async function completePayment(paymentId: string, txid: string) {
  const res = await fetch('/api/payments/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId, txid }),
  });
  if (!res.ok) throw new Error('Payment completion failed on server.');
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
        await approvePayment(paymentId);
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        await completePayment(paymentId, txid);
        onUnlocked();
      },
      onCancel: (paymentId: string) => {
        console.info('Payment cancelled:', paymentId);
        setPiDebug({ phase: 'payment:test:cancelled', paymentId });
      },
      onError: (error: unknown) => {
        console.error('Pi payment error:', error);
        setPiDebug({ phase: 'payment:test:error', error });
      },
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
      memo: `LinkRoutine Monthly Pro Subscription ${safeAmount} Pi`,
      metadata: {
        app: 'LinkRoutine',
        product: 'linkroutine_monthly_pro',
        type: 'monthly_subscription',
        period: 'monthly',
        amount: safeAmount,
        directCashback: false,
      },
    },
    {
      onReadyForServerApproval: async (paymentId: string) => {
        await approvePayment(paymentId);
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        await completePayment(paymentId, txid);
        onPaid();
      },
      onCancel: (paymentId: string) => {
        console.info('Subscription payment cancelled:', paymentId);
        setPiDebug({ phase: 'payment:subscription:cancelled', paymentId });
      },
      onError: (error: unknown) => {
        console.error('Pi subscription payment error:', error);
        setPiDebug({ phase: 'payment:subscription:error', error });
      },
    },
  );
}
