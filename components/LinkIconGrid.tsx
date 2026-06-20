'use client';

import { LinkItem } from '@/lib/urlTools';
import { getCategoryMeta } from '@/lib/categories';

type Props = {
  links: LinkItem[];
  onOpen: (link: LinkItem) => void;
};

export default function LinkIconGrid({ links, onOpen }: Props) {
  if (!links.length) {
    return (
      <div className="emptyState">
        <div className="emptyPhone">📱</div>
        <p>No saved icons yet.</p>
        <span>Paste a URL into the mailbox to create your first LinkRoutine icon.</span>
      </div>
    );
  }

  return (
    <div className="iconGrid">
      {links.map((link) => {
        const meta = getCategoryMeta(link.category);
        return (
          <button className="linkIcon" onClick={() => onOpen(link)} key={link.id}>
            <span className={`appIcon ${meta.colorClass}`}>{link.icon}</span>
            <strong>{link.title}</strong>
            <small>{link.category}</small>
          </button>
        );
      })}
    </div>
  );
}
