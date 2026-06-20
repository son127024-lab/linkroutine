import { LinkItem } from './urlTools';

const STORAGE_KEY = 'linkroutine_links_v1';
const UNLOCK_KEY = 'linkroutine_unlock_v1';

export function loadLinks(): LinkItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LinkItem[]) : [];
  } catch {
    return [];
  }
}

export function saveLinks(links: LinkItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

export function addLink(link: LinkItem) {
  const links = loadLinks();
  saveLinks([link, ...links]);
}

export function updateLinkOpen(id: string) {
  const links = loadLinks().map((item) =>
    item.id === id
      ? { ...item, openCount: item.openCount + 1, lastOpenedAt: new Date().toISOString() }
      : item,
  );
  saveLinks(links);
  return links;
}

export function deleteLinks(ids: string[]) {
  const deleteSet = new Set(ids);
  const links = loadLinks().filter((item) => !deleteSet.has(item.id));
  saveLinks(links);
  return links;
}

export function isUnlocked() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(UNLOCK_KEY) === 'true';
}

export function setUnlocked(value: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(UNLOCK_KEY, value ? 'true' : 'false');
}
