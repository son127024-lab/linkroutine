import { LinkCategory } from './categories';

export type LinkItem = {
  id: string;
  title: string;
  url: string;
  category: LinkCategory;
  icon: string;
  createdAt: string;
  lastOpenedAt?: string;
  openCount: number;
};

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Please paste a URL.');
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only http and https URLs are supported.');
  return url.toString();
}

export function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Saved Link';
  }
}

export function titleFromUrl(url: string): string {
  const host = extractHostname(url);
  const first = host.split('.')[0] || 'Link';
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function iconForUrl(category: LinkCategory, url: string): string {
  const host = extractHostname(url).toLowerCase();
  if (host.includes('youtube') || host.includes('youtu.be')) return '▶';
  if (category === 'Video') return '▶';
  if (category === 'News') return '📰';
  if (category === 'Search') return '🔍';
  if (category === 'Shopping') return '🛒';
  if (category === 'Work') return '🔧';
  if (category === 'Study') return '📚';
  if (category === 'Pi') return '◎';
  return '🔗';
}

export function detectYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.replace('/', '') || null;
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/watch')) return parsed.searchParams.get('v');
      if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2] || null;
      if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/')[2] || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function createLinkItem(inputUrl: string, category: LinkCategory): LinkItem {
  const url = normalizeUrl(inputUrl);
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: titleFromUrl(url),
    url,
    category,
    icon: iconForUrl(category, url),
    createdAt: new Date().toISOString(),
    openCount: 0,
  };
}
