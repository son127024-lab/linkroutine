export const categories = ['Video', 'News', 'Search', 'Shopping', 'Work', 'Study', 'Pi', 'Other'];

export const subscriptionConfig = {
  baseFeePi: 1,
  visitsPerDiscountStep: 1000,
  discountPerStepPi: 0.1,
  maxDiscountPi: 0.5,
  minFeePi: 0.5,
  cooldownMinutes: 10,
};

export function normalizeUrl(input) {
  const trimmed = String(input || '').trim();
  if (!trimmed) throw new Error('Please paste a URL.');
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only http and https URLs are supported.');
  return url.toString();
}

export function extractHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Saved Link';
  }
}

export function titleFromUrl(url) {
  const host = extractHostname(url);
  const first = host.split('.')[0] || 'Link';
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function iconForUrl(category, url) {
  const host = extractHostname(url).toLowerCase();
  if (host.includes('youtube') || host.includes('youtu.be')) return '▶';
  const map = { Video: '▶', News: '📰', Search: '🔍', Shopping: '🛒', Work: '🔧', Study: '📚', Pi: '◎', Other: '🔗' };
  return map[category] || '🔗';
}

export function detectYoutubeId(url) {
  const parsed = new URL(url);
  if (parsed.hostname.includes('youtu.be')) return parsed.pathname.replace('/', '') || null;
  if (parsed.hostname.includes('youtube.com')) {
    if (parsed.pathname.startsWith('/watch')) return parsed.searchParams.get('v');
    if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2] || null;
    if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/')[2] || null;
  }
  return null;
}

export function createLinkItem(inputUrl, category) {
  const url = normalizeUrl(inputUrl);
  return {
    id: `sim-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: titleFromUrl(url),
    url,
    category,
    icon: iconForUrl(category, url),
    createdAt: new Date().toISOString(),
    openCount: 0,
  };
}

export function addLink(existing, inputUrl, category) {
  return [createLinkItem(inputUrl, category), ...existing];
}

export function deleteLinks(existing, ids) {
  const set = new Set(ids);
  return existing.filter((item) => !set.has(item.id));
}

export function openLink(existing, id) {
  return existing.map((item) => item.id === id ? { ...item, openCount: item.openCount + 1, lastOpenedAt: new Date().toISOString() } : item);
}

export function createSubscriptionRecord() {
  return {
    monthId: '2026-06',
    qualifiedVisits: 0,
    linkPoints: 0,
    lifetimeQualifiedVisits: 0,
    lifetimeLinkPoints: 0,
    lastQualifiedAtByLink: {},
  };
}

export function calculateSubscriptionSummary(record) {
  const steps = Math.floor(record.qualifiedVisits / subscriptionConfig.visitsPerDiscountStep);
  const discountPi = Math.min(steps * subscriptionConfig.discountPerStepPi, subscriptionConfig.maxDiscountPi);
  const nextFeePi = Math.max(subscriptionConfig.baseFeePi - discountPi, subscriptionConfig.minFeePi);
  const maxed = discountPi >= subscriptionConfig.maxDiscountPi;
  const nextStepAt = (steps + 1) * subscriptionConfig.visitsPerDiscountStep;
  return {
    baseFeePi: subscriptionConfig.baseFeePi,
    discountPi: Number(discountPi.toFixed(3)),
    nextFeePi: Number(nextFeePi.toFixed(3)),
    minFeePi: subscriptionConfig.minFeePi,
    maxDiscountPi: subscriptionConfig.maxDiscountPi,
    qualifiedVisits: record.qualifiedVisits,
    linkPoints: record.linkPoints,
    visitsUntilNextDiscount: maxed ? 0 : Math.max(nextStepAt - record.qualifiedVisits, 0),
    directCashbackEnabled: false,
  };
}

export function recordQualifiedVisitInMemory(record, link, now = new Date()) {
  if (!link) return { counted: false, reason: 'missing_link', record, summary: calculateSubscriptionSummary(record) };
  const lastRaw = record.lastQualifiedAtByLink[link.id];
  if (lastRaw) {
    const last = new Date(lastRaw).getTime();
    const cooldownMs = subscriptionConfig.cooldownMinutes * 60 * 1000;
    if (Number.isFinite(last) && now.getTime() - last < cooldownMs) {
      return { counted: false, reason: 'cooldown', record, summary: calculateSubscriptionSummary(record) };
    }
  }
  const updated = {
    ...record,
    qualifiedVisits: record.qualifiedVisits + 1,
    linkPoints: record.linkPoints + 1,
    lifetimeQualifiedVisits: record.lifetimeQualifiedVisits + 1,
    lifetimeLinkPoints: record.lifetimeLinkPoints + 1,
    lastQualifiedAtByLink: { ...record.lastQualifiedAtByLink, [link.id]: now.toISOString() },
  };
  return { counted: true, reason: 'counted', record: updated, summary: calculateSubscriptionSummary(updated) };
}

export function markSubscriptionPaidInMemory(record, amountPi, now = new Date('2026-06-18T00:00:00Z')) {
  return {
    ...record,
    lastPaidAt: now.toISOString(),
    activeUntilMonth: '2026-07',
    lastPaymentAmount: Number(amountPi.toFixed(3)),
  };
}
