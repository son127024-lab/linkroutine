import { LinkItem } from './urlTools';

export type SubscriptionRecord = {
  monthId: string;
  qualifiedVisits: number;
  linkPoints: number;
  lifetimeQualifiedVisits: number;
  lifetimeLinkPoints: number;
  lastQualifiedAtByLink: Record<string, string>;
  lastPaidAt?: string;
  activeUntilMonth?: string;
  lastPaymentAmount?: number;
};

export type SubscriptionSummary = {
  baseFeePi: number;
  discountPi: number;
  nextFeePi: number;
  maxDiscountPi: number;
  minFeePi: number;
  qualifiedVisits: number;
  linkPoints: number;
  visitsUntilNextDiscount: number;
  discountSteps: number;
  isDiscountMaxed: boolean;
  directCashbackEnabled: false;
};

export type QualifiedVisitResult = {
  counted: boolean;
  reason: 'counted' | 'cooldown' | 'missing_link';
  record: SubscriptionRecord;
  summary: SubscriptionSummary;
};

const SUBSCRIPTION_KEY = 'linkroutine_subscription_v2';

export const SUBSCRIPTION_CONFIG = {
  baseFeePi: Number(process.env.NEXT_PUBLIC_MONTHLY_SUBSCRIPTION_PI || '1'),
  visitsPerDiscountStep: Number(process.env.NEXT_PUBLIC_VISITS_PER_DISCOUNT_STEP || '1000'),
  discountPerStepPi: Number(process.env.NEXT_PUBLIC_DISCOUNT_PER_STEP_PI || '0.1'),
  maxDiscountPi: Number(process.env.NEXT_PUBLIC_MAX_DISCOUNT_PI || '0.5'),
  minFeePi: Number(process.env.NEXT_PUBLIC_MIN_SUBSCRIPTION_FEE_PI || '0.5'),
  qualifiedVisitSeconds: Number(process.env.NEXT_PUBLIC_QUALIFIED_VISIT_SECONDS || '30'),
  cooldownMinutes: Number(process.env.NEXT_PUBLIC_VISIT_COOLDOWN_MINUTES || '10'),
} as const;

export function getMonthId(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
}

export function getNextMonthId(date = new Date()): string {
  return getMonthId(new Date(date.getFullYear(), date.getMonth() + 1, 1));
}

function createEmptyRecord(): SubscriptionRecord {
  return {
    monthId: getMonthId(),
    qualifiedVisits: 0,
    linkPoints: 0,
    lifetimeQualifiedVisits: 0,
    lifetimeLinkPoints: 0,
    lastQualifiedAtByLink: {},
  };
}

function normalizeRecord(record: Partial<SubscriptionRecord> | null): SubscriptionRecord {
  const currentMonth = getMonthId();
  if (!record) return createEmptyRecord();

  if (record.monthId !== currentMonth) {
    return {
      monthId: currentMonth,
      qualifiedVisits: 0,
      linkPoints: 0,
      lifetimeQualifiedVisits: Number(record.lifetimeQualifiedVisits || 0),
      lifetimeLinkPoints: Number(record.lifetimeLinkPoints || 0),
      lastQualifiedAtByLink: {},
      lastPaidAt: record.lastPaidAt,
      activeUntilMonth: record.activeUntilMonth,
      lastPaymentAmount: record.lastPaymentAmount,
    };
  }

  return {
    monthId: currentMonth,
    qualifiedVisits: Number(record.qualifiedVisits || 0),
    linkPoints: Number(record.linkPoints || 0),
    lifetimeQualifiedVisits: Number(record.lifetimeQualifiedVisits || 0),
    lifetimeLinkPoints: Number(record.lifetimeLinkPoints || 0),
    lastQualifiedAtByLink: record.lastQualifiedAtByLink || {},
    lastPaidAt: record.lastPaidAt,
    activeUntilMonth: record.activeUntilMonth,
    lastPaymentAmount: record.lastPaymentAmount,
  };
}

export function loadSubscriptionRecord(): SubscriptionRecord {
  if (typeof window === 'undefined') return createEmptyRecord();
  try {
    const raw = window.localStorage.getItem(SUBSCRIPTION_KEY);
    const record = normalizeRecord(raw ? (JSON.parse(raw) as SubscriptionRecord) : null);
    window.localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(record));
    return record;
  } catch {
    return createEmptyRecord();
  }
}

export function saveSubscriptionRecord(record: SubscriptionRecord) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(normalizeRecord(record)));
}

export function calculateSubscriptionSummary(record: SubscriptionRecord): SubscriptionSummary {
  const safeRecord = normalizeRecord(record);
  const steps = Math.floor(safeRecord.qualifiedVisits / SUBSCRIPTION_CONFIG.visitsPerDiscountStep);
  const discountPi = Math.min(
    steps * SUBSCRIPTION_CONFIG.discountPerStepPi,
    SUBSCRIPTION_CONFIG.maxDiscountPi,
  );
  const nextFeePi = Math.max(
    SUBSCRIPTION_CONFIG.baseFeePi - discountPi,
    SUBSCRIPTION_CONFIG.minFeePi,
  );
  const maxed = discountPi >= SUBSCRIPTION_CONFIG.maxDiscountPi;
  const nextStepAt = (steps + 1) * SUBSCRIPTION_CONFIG.visitsPerDiscountStep;

  return {
    baseFeePi: SUBSCRIPTION_CONFIG.baseFeePi,
    discountPi: Number(discountPi.toFixed(3)),
    nextFeePi: Number(nextFeePi.toFixed(3)),
    maxDiscountPi: SUBSCRIPTION_CONFIG.maxDiscountPi,
    minFeePi: SUBSCRIPTION_CONFIG.minFeePi,
    qualifiedVisits: safeRecord.qualifiedVisits,
    linkPoints: safeRecord.linkPoints,
    visitsUntilNextDiscount: maxed ? 0 : Math.max(nextStepAt - safeRecord.qualifiedVisits, 0),
    discountSteps: steps,
    isDiscountMaxed: maxed,
    directCashbackEnabled: false,
  };
}

export function recordQualifiedVisit(link: LinkItem | null): QualifiedVisitResult {
  const record = loadSubscriptionRecord();
  if (!link) {
    return { counted: false, reason: 'missing_link', record, summary: calculateSubscriptionSummary(record) };
  }

  const now = new Date();
  const lastRaw = record.lastQualifiedAtByLink[link.id];
  const cooldownMs = SUBSCRIPTION_CONFIG.cooldownMinutes * 60 * 1000;
  if (lastRaw) {
    const last = new Date(lastRaw).getTime();
    if (Number.isFinite(last) && now.getTime() - last < cooldownMs) {
      return { counted: false, reason: 'cooldown', record, summary: calculateSubscriptionSummary(record) };
    }
  }

  const updated: SubscriptionRecord = {
    ...record,
    qualifiedVisits: record.qualifiedVisits + 1,
    linkPoints: record.linkPoints + 1,
    lifetimeQualifiedVisits: record.lifetimeQualifiedVisits + 1,
    lifetimeLinkPoints: record.lifetimeLinkPoints + 1,
    lastQualifiedAtByLink: {
      ...record.lastQualifiedAtByLink,
      [link.id]: now.toISOString(),
    },
  };
  saveSubscriptionRecord(updated);
  return { counted: true, reason: 'counted', record: updated, summary: calculateSubscriptionSummary(updated) };
}

export function markSubscriptionPaid(amountPi: number): SubscriptionRecord {
  const record = loadSubscriptionRecord();
  const updated: SubscriptionRecord = {
    ...record,
    lastPaidAt: new Date().toISOString(),
    activeUntilMonth: getNextMonthId(),
    lastPaymentAmount: Number(amountPi.toFixed(3)),
  };
  saveSubscriptionRecord(updated);
  return updated;
}

export function isSubscriptionActive(record: SubscriptionRecord): boolean {
  if (!record.activeUntilMonth) return false;
  return record.activeUntilMonth >= getMonthId();
}
