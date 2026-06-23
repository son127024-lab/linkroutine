export type PiUser = {
  uid?: string;
  username?: string;
  accessToken?: string;
};

type PiAuthResponse = PiUser & {
  user?: PiUser;
  token?: string;
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
      authenticate: (scopes: string[], onIncompletePaymentFound: (payment: unknown) => void) => Promise<PiAuthResponse>;
      createPayment: (paymentData: PaymentData, callbacks: PiPaymentCallbacks) => void;
    };
  }
}

let piInitPromise: Promise<void> | null = null;
let piInitialized = false;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    initialized: piInitialized,
    ...extra,
  };
}

async function waitForPiSdk(timeoutMs = 18000) {
  if (typeof window === 'undefined') return false;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (window.Pi && typeof window.Pi.init === 'function' && typeof window.Pi.authenticate === 'function') {
      setPiDebug({ sdkDetected: true, waitMs: Date.now() - start });
      return true;
    }
    await sleep(150);
  }

  setPiDebug({ sdkDetected: false, timeoutMs });
  return false;
}

function normalizePiUser(auth: PiAuthResponse): PiUser {
  const nestedUser = auth?.user ?? {};
  const normalized: PiUser = {
    uid: auth?.uid ?? nestedUser.uid,
    username: auth?.username ?? nestedUser.username,
    accessToken: auth?.accessToken ?? auth?.token ?? nestedUser.accessToken,
  };

  setPiDebug({ phase: 'auth:normalized_user', rawAuth: auth, normalized });
  return normalized;
}

function isPiNotInitializedError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.toLowerCase().includes('init') || message.toLowerCase().includes('initialized');
}

export async function initPi({ force = false }: { force?: boolean } = {}) {
  if (typeof window === 'undefined') return;

  if (!force && piInitialized) return;
  if (!force && piInitPromise) return piInitPromise;

  if (force) {
    piInitialized = false;
    piInitPromise = null;
  }

  piInitPromise = (async () => {
    setPiDebug({ phase: force ? 'initPi:force_start' : 'initPi:start' });

    if (shouldUseMockPi()) {
      piInitialized = true;
      setPiDebug({ phase: 'initPi:mock' });
      return;
    }

    const found = await waitForPiSdk();
    if (!found || !window.Pi) {
      throw new Error('Pi Network SDK was not detected. Open LinkRoutine from Pi Browser → develop.pi Sandbox URL.');
    }

    window.Pi.init({
      version: '2.0',
      sandbox: process.env.NEXT_PUBLIC_PI_SANDBOX === 'true',
    });

    // Pi Browser may expose window.Pi before its internal bridge is fully ready.
    // A short delay prevents "Call init() before any other method" on the first auto-auth attempt.
    await sleep(900);

    piInitialized = true;
    setPiDebug({ phase: 'initPi:done', initialized: true });
  })();

  try {
    await piInitPromise;
  } finally {
    if (!piInitialized) piInitPromise = null;
  }
}

async function callAuthenticate() {
  if (!window.Pi) throw new Error('Pi SDK was not detected after initialization.');

  setPiDebug({ phase: 'authenticate:request', scopes: ['username', 'payments'] });
  const rawAuth = await window.Pi.authenticate(['username', 'payments'], (payment) => {
    console.warn('Incomplete Pi payment found:', payment);
    setPiDebug({ phase: 'authenticate:incomplete_payment_found', payment });
  });

  return normalizePiUser(rawAuth);
}

export async function authenticatePi(): Promise<PiUser> {
  if (shouldUseMockPi()) {
    await initPi();
    return { uid: 'mock-user', username: 'mock_pioneer', accessToken: 'mock-access-token' };
  }

  try {
    await initPi();
    return await callAuthenticate();
  } catch (firstError) {
    setPiDebug({ phase: 'authenticate:first_error', firstError });

    // If the first automatic attempt fires slightly before Pi Browser bridge is ready,
    // force init one more time and retry once without making the user press Retry.
    if (isPiNotInitializedError(firstError)) {
      await initPi({ force: true });
      await sleep(700);
      return await callAuthenticate();
    }

    throw firstError;
  }
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
  const amount = Number(process.env.NEXT_PUBLIC_TEST_PAYMENT_AMOUNT || '1');
  await initPi();

  if (!window.Pi) {
    if (!shouldUseMockPi()) throw new Error('Pi SDK was not detected. Open this app inside Pi Browser Sandbox.');
    await sleep(450);
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
    await sleep(450);
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
