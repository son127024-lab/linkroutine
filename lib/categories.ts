export type LinkCategory = 'Video' | 'News' | 'Search' | 'Shopping' | 'Work' | 'Study' | 'Pi' | 'Other';

export const CATEGORIES: Array<{ key: LinkCategory; label: string; icon: string; colorClass: string }> = [
  { key: 'Video', label: 'Video', icon: '▶', colorClass: 'catVideo' },
  { key: 'News', label: 'News', icon: '📰', colorClass: 'catNews' },
  { key: 'Search', label: 'Search', icon: '🔍', colorClass: 'catSearch' },
  { key: 'Shopping', label: 'Shopping', icon: '🛒', colorClass: 'catShopping' },
  { key: 'Work', label: 'Work', icon: '🔧', colorClass: 'catWork' },
  { key: 'Study', label: 'Study', icon: '📚', colorClass: 'catStudy' },
  { key: 'Pi', label: 'Pi', icon: '◎', colorClass: 'catPi' },
  { key: 'Other', label: 'Other', icon: '🔗', colorClass: 'catOther' },
];

export function getCategoryMeta(category: string) {
  return CATEGORIES.find((item) => item.key === category) ?? CATEGORIES[CATEGORIES.length - 1];
}
