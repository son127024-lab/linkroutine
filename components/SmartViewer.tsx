'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { detectYoutubeId, LinkItem } from '@/lib/urlTools';

type Props = {
  link: LinkItem;
  onClose: () => void;
  onQualifiedVisit: (link: LinkItem) => void;
};

export default function SmartViewer({ link, onClose, onQualifiedVisit }: Props) {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const [wide, setWide] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);
  const [qualified, setQualified] = useState(false);

  const youtubeId = useMemo(() => detectYoutubeId(link.url), [link.url]);
  const viewerUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}?playsinline=1&rel=0` : link.url;
  const qualifiedSeconds = Number(process.env.NEXT_PUBLIC_QUALIFIED_VISIT_SECONDS || '30');

  useEffect(() => {
    setQualified(false);
    const timer = window.setTimeout(() => {
      setQualified(true);
      onQualifiedVisit(link);
    }, Math.max(1, qualifiedSeconds) * 1000);
    return () => window.clearTimeout(timer);
  }, [link, onQualifiedVisit, qualifiedSeconds]);

  async function requestFullScreen() {
    const element = viewerRef.current;
    if (!element) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await element.requestFullscreen();
    } catch {
      alert('Fullscreen is not supported by this browser or website. Try Wide Assist or Open Original.');
    }
  }

  function openOriginal() {
    window.location.href = link.url;
  }

  return (
    <main className={wide ? 'viewerShell wideMode' : 'viewerShell'} ref={viewerRef}>
      <header className="viewerTopBar">
        <button className="closeButton" onClick={onClose}>×</button>
        <div>
          <strong>{link.title}</strong>
          <small>{qualified ? 'Qualified visit counted for Link Points' : `Stay ${qualifiedSeconds}s to count a qualified visit`} · {link.url}</small>
        </div>
      </header>

      <section className="viewerStage">
        {iframeFailed ? (
          <div className="blockedCard">
            <h2>This site blocked embedded viewing.</h2>
            <p>Use Open Original to continue in Pi Browser. External site connection features may be expanded after the full Open Mainnet environment becomes available.</p>
            <p className="koNotice">일부 외부 사이트는 현재 보안 정책으로 인해 앱 안에서 바로 열리지 않을 수 있습니다. 외부 사이트 연결 기능은 완전 오픈 메인넷 이후 확장될 수 있습니다.</p>
            <button className="primaryButton" onClick={openOriginal}>Open Original Site</button>
          </div>
        ) : (
          <iframe
            title={link.title}
            src={viewerUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            onError={() => setIframeFailed(true)}
          />
        )}
      </section>

      <footer className="viewerControls">
        <button onClick={requestFullScreen}>FULL SCREEN</button>
        <button onClick={() => setWide((value) => !value)}>{wide ? 'NORMAL' : 'WIDE ASSIST'}</button>
        <button onClick={openOriginal}>OPEN ORIGINAL</button>
      </footer>
    </main>
  );
}
