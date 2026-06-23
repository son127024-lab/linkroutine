export default function ExternalConnectionNotice() {
  return (
    <section className="noticeCard" aria-label="External connection notice">
      <div className="noticeIcon">🔒</div>
      <div>
        <p className="eyebrow">EXTERNAL SITE NOTICE</p>
        <p className="noticeText">
          Some external websites may not open inside LinkRoutine due to current Pi Browser and website security limits.
          External site connection features may be expanded after the full Open Mainnet environment becomes available.
        </p>
        <p className="noticeText koNotice">
          일부 외부 사이트는 현재 Pi Browser 및 각 웹사이트의 보안 정책으로 인해 LinkRoutine 안에서 바로 열리지 않을 수 있습니다.
          외부 사이트 연결 기능은 완전 오픈 메인넷 이후 확장될 수 있습니다.
        </p>
      </div>
    </section>
  );
}
