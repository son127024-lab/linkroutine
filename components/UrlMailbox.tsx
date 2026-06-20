'use client';

import { useState } from 'react';
import { CATEGORIES, LinkCategory } from '@/lib/categories';

type Props = {
  onSave: (url: string, category: LinkCategory) => void;
};

export default function UrlMailbox({ onSave }: Props) {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<LinkCategory>('Video');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(url, category);
    setUrl('');
  }

  async function handlePasteButton() {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch {
      // Clipboard can be blocked by browser policy. Manual paste still works.
    }
  }

  return (
    <section className="mailboxCard">
      <div className="mailboxHeader">
        <div>
          <p className="eyebrow">URL MAILBOX</p>
          <h2>📮 Paste once. Create an icon.</h2>
        </div>
        <button className="ghostButton" onClick={handlePasteButton} type="button">Paste</button>
      </div>

      <form className="mailboxForm" onSubmit={handleSubmit}>
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Paste your URL here"
          aria-label="URL input"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <select value={category} onChange={(event) => setCategory(event.target.value as LinkCategory)} aria-label="Category select">
          {CATEGORIES.map((cat) => (
            <option value={cat.key} key={cat.key}>{cat.icon} {cat.label}</option>
          ))}
        </select>
        <button className="saveButton" type="submit">Save</button>
      </form>
    </section>
  );
}
