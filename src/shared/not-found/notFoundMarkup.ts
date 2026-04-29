export const notFoundStyles = `
  .nf-wrap{min-height:100vh;width:100%;display:flex;justify-content:center;padding:32px 0;box-sizing:border-box}
  .nf-inner{width:100%;max-width:768px;padding:0 16px;box-sizing:border-box}
  .nf-stack{display:flex;flex-direction:column;gap:16px}
  .nf-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:8px;overflow:hidden}
  .nf-head{padding:24px;border-bottom:1px solid rgba(0,0,0,.05)}
  .nf-title,.nf-subtitle,.nf-link-title,.nf-text{margin:0}
  .nf-title{font-size:18px;font-weight:600;line-height:1.5;color:#111827}
  .nf-body{padding:48px;text-align:center}
  .nf-code{font-size:96px;font-weight:700;color:#e5e7eb;line-height:1}
  .nf-message{display:flex;flex-direction:column;gap:8px;margin-top:24px}
  .nf-subtitle{font-size:20px;font-weight:600;color:#111827}
  .nf-text{color:#4b5563;font-size:13px;line-height:1.5}
  .nf-home{display:inline-flex;align-items:center;gap:8px;margin-top:32px;padding:10px 24px;border-radius:8px;background:#262626;color:#fff;text-decoration:none;font-size:13px;font-weight:500}
  .nf-links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;padding:24px}
  .nf-link-card{display:flex;align-items:flex-start;gap:12px;padding:16px;border:1px solid rgba(0,0,0,.05);border-radius:8px;color:inherit;text-decoration:none}
  .nf-link-card:hover{background:#f5f5f5}
  .nf-icon{width:48px;height:48px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .nf-icon svg{width:24px;height:24px}
  .nf-red{background:#fee2e2;color:#dc2626}
  .nf-blue{background:#dbeafe;color:#2563eb}
  .nf-green{background:#dcfce7;color:#16a34a}
  .nf-link-title{font-size:13px;font-weight:500;margin-bottom:4px;color:#111827}
  @media (max-width:640px){.nf-links{grid-template-columns:1fr}.nf-body{padding:48px 24px}.nf-code{font-size:80px}}
`;

export const notFoundBody = `
  <div class="nf-wrap" data-global-not-found>
    <div class="nf-inner nf-stack">
      <div class="nf-card">
        <div class="nf-head">
          <h1 class="nf-title">페이지를 찾을 수 없습니다</h1>
        </div>
        <div class="nf-body">
          <div class="nf-code">404</div>
          <div class="nf-message">
            <h2 class="nf-subtitle">요청하신 페이지를 찾을 수 없습니다</h2>
            <p class="nf-text">페이지가 삭제되었거나 주소가 변경되었을 수 있습니다.</p>
          </div>
          <a class="nf-home" href="/">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            메인페이지로 돌아가기
          </a>
        </div>
      </div>

      <div class="nf-card">
        <div class="nf-head">
          <h2 class="nf-title">이런 페이지는 어떠세요?</h2>
        </div>
        <div class="nf-links">
          <a class="nf-link-card" href="/boards/all?sort=hot">
            <span class="nf-icon nf-red">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path>
              </svg>
            </span>
            <span>
              <h3 class="nf-link-title">HOT 인기게시글</h3>
              <p class="nf-text">지금 인기있는 게시글</p>
            </span>
          </a>
          <a class="nf-link-card" href="/boards/all">
            <span class="nf-icon nf-blue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </span>
            <span>
              <h3 class="nf-link-title">전체 게시판</h3>
              <p class="nf-text">모든 게시판의 최신 글</p>
            </span>
          </a>
          <a class="nf-link-card" href="/livescore/football">
            <span class="nf-icon nf-green">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </span>
            <span>
              <h3 class="nf-link-title">라이브스코어</h3>
              <p class="nf-text">실시간 축구 경기 정보</p>
            </span>
          </a>
        </div>
      </div>
    </div>
  </div>
`;

export function getNotFoundHtml() {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>페이지를 찾을 수 없습니다 | 4590 Football</title>
  <style>
    body{margin:0;background:#f8fafc;color:#111827;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    ${notFoundStyles}
  </style>
</head>
<body>${notFoundBody}</body>
</html>`;
}
