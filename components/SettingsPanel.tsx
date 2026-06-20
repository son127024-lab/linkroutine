'use client';

import { useState } from 'react';
import { LinkItem } from '@/lib/urlTools';

type Props = {
  links: LinkItem[];
  onClose: () => void;
  onDelete: (ids: string[]) => void;
};

export default function SettingsPanel({ links, onClose, onDelete }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function handleDelete() {
    if (!selected.length) return;
    const ok = window.confirm(`Delete ${selected.length} selected URL${selected.length > 1 ? 's' : ''}?`);
    if (!ok) return;
    onDelete(selected);
    setSelected([]);
  }

  return (
    <div className="modalBackdrop" role="dialog" aria-modal="true" aria-label="Settings">
      <section className="settingsPanel">
        <header className="settingsHeader">
          <div>
            <p className="eyebrow">SETTINGS</p>
            <h2>Saved URL List</h2>
          </div>
          <button className="iconButton" onClick={onClose}>×</button>
        </header>

        <div className="savedList">
          {links.length ? (
            links.map((link) => (
              <label className="savedRow" key={link.id}>
                <input type="checkbox" checked={selected.includes(link.id)} onChange={() => toggle(link.id)} />
                <span className="savedIcon">{link.icon}</span>
                <span>
                  <strong>{link.title}</strong>
                  <small>{link.url}</small>
                </span>
              </label>
            ))
          ) : (
            <p className="microCopy">No saved URLs to manage.</p>
          )}
        </div>

        <footer className="settingsFooter">
          <button className="dangerButton" disabled={!selected.length} onClick={handleDelete}>Delete Selected</button>
          <button className="secondaryButton" onClick={onClose}>Done</button>
        </footer>
      </section>
    </div>
  );
}
