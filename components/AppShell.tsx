'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import PiAuthGate from './PiAuthGate';
import UrlMailbox from './UrlMailbox';
import LinkIconGrid from './LinkIconGrid';
import SettingsPanel from './SettingsPanel';
import SmartViewer from './SmartViewer';
import SubscriptionPanel from './SubscriptionPanel';
import ExternalConnectionNotice from './ExternalConnectionNotice';
import { CATEGORIES, LinkCategory } from '@/lib/categories';
import { addLink, deleteLinks, loadLinks, saveLinks, updateLinkOpen } from '@/lib/storage';
import { loadSubscriptionRecord, recordQualifiedVisit, SubscriptionRecord } from '@/lib/subscription';
import { createLinkItem, LinkItem } from '@/lib/urlTools';
import { PiUser } from '@/lib/pi';

export default function AppShell() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<LinkCategory | 'All'>('All');
  const [viewerLink, setViewerLink] = useState<LinkItem | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [subscriptionRecord, setSubscriptionRecord] = useState<SubscriptionRecord | null>(null);
  const [piUser, setPiUser] = useState<PiUser | null>(null);

  useEffect(() => {
    setLinks(loadLinks());
    setSubscriptionRecord(loadSubscriptionRecord());
  }, []);

  const filteredLinks = useMemo(() => {
    if (activeCategory === 'All') return links;
    return links.filter((item) => item.category === activeCategory);
  }, [activeCategory, links]);

  function handleCreateLink(url: string, category: LinkCategory) {
    try {
      const item = createLinkItem(url, category);
      addLink(item);
      setLinks(loadLinks());
      setToast(`${item.title} saved.`);
      window.setTimeout(() => setToast(''), 1600);
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not save URL.');
      window.setTimeout(() => setToast(''), 2200);
    }
  }

  function handleOpenLink(item: LinkItem) {
    const updated = updateLinkOpen(item.id);
    setLinks(updated);
    const fresh = updated.find((link) => link.id === item.id) ?? item;
    setViewerLink(fresh);
  }

  const handleQualifiedVisit = useCallback((item: LinkItem) => {
    const result = recordQualifiedVisit(item);
    setSubscriptionRecord(result.record);
    if (result.counted) {
      setToast(`+1 Link Point. ${result.summary.qualifiedVisits.toLocaleString()} qualified visits this month.`);
      window.setTimeout(() => setToast(''), 2200);
    }
  }, []);

  function handleDelete(ids: string[]) {
    const updated = deleteLinks(ids);
    setLinks(updated);
    setToast(`${ids.length} link${ids.length > 1 ? 's' : ''} deleted.`);
    window.setTimeout(() => setToast(''), 1600);
  }

  function handleResetDemo() {
    const demo = [
      createLinkItem('https://youtube.com/watch?v=dQw4w9WgXcQ', 'Video'),
      createLinkItem('https://news.google.com', 'News'),
      createLinkItem('https://translate.google.com', 'Study'),
      createLinkItem('https://minepi.com', 'Pi'),
    ];
    saveLinks(demo);
    setLinks(demo);
  }

  if (viewerLink) {
    return <SmartViewer link={viewerLink} onClose={() => setViewerLink(null)} onQualifiedVisit={handleQualifiedVisit} />;
  }

  return (
    <main className="screenShell">
      <section className="phoneFrame">
        <header className="topBar">
          <div>
            <p className="eyebrow">MARPO GROUP LAB</p>
            <h1>LinkRoutine</h1>
            <p className="subtitle">Your daily link mailbox inside Pi Browser</p>
          </div>
          <button className="iconButton" onClick={() => setSettingsOpen(true)} aria-label="Open settings">
            ⚙
          </button>
        </header>

        {!piUser ? (
          <PiAuthGate onAuthenticated={setPiUser} />
        ) : (
          <>
            <section className="authCard connectedAccountCard">
              <div>
                <p className="eyebrow">PIONEER ACCOUNT</p>
                <strong>@{piUser.username ?? 'pioneer'}</strong>
                <p className="microCopy">Pi authorization completed with username + payments scope.</p>
              </div>
              <span className="statusPill activeStatus">CONNECTED</span>
            </section>

            {subscriptionRecord ? (
              <SubscriptionPanel record={subscriptionRecord} onRecordChange={setSubscriptionRecord} />
            ) : null}

            <ExternalConnectionNotice />

            <UrlMailbox onSave={handleCreateLink} />

            <nav className="categoryTabs" aria-label="Filter categories">
              <button className={activeCategory === 'All' ? 'tab activeTab' : 'tab'} onClick={() => setActiveCategory('All')}>
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  className={activeCategory === cat.key ? 'tab activeTab' : 'tab'}
                  onClick={() => setActiveCategory(cat.key)}
                >
                  <span>{cat.icon}</span> {cat.label}
                </button>
              ))}
            </nav>

            <section className="homePanel">
              <div className="panelTitleRow">
                <div>
                  <p className="eyebrow">MY LINK HOME</p>
                  <h2>Saved Icons</h2>
                </div>
                <button className="ghostButton" onClick={handleResetDemo}>Demo</button>
              </div>
              <LinkIconGrid links={filteredLinks} onOpen={handleOpenLink} />
            </section>
          </>
        )}

        {toast ? <div className="toast">{toast}</div> : null}
        {settingsOpen ? <SettingsPanel links={links} onClose={() => setSettingsOpen(false)} onDelete={handleDelete} /> : null}
      </section>
    </main>
  );
}
