const TRUSTED_BOTS = [
  "Googlebot",
  "Google-InspectionTool",
  "Bingbot",
  "Yeti",
  "Daum",
  "Daumoa",
];

const BLOCKED_BOTS = [
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "Bytespider",
  "PetalBot",
  "ClaudeBot",
  "GPTBot",
  "CCBot",
  "DataForSeoBot",
  "SERanking",
  "Amazonbot",
  "BLEXBot",
  "Applebot",
  "Barkrowler",
  "Baiduspider",
];

const HEAVY_PREFIXES = [
  "/boards/",
  "/livescore/football/",
  "/transfers/team/",
  "/user/",
  "/admin/",
  "/api/",
];

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>4590 football</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f6f7f9;
      color: #14181f;
      display: grid;
      min-height: 100vh;
      place-items: center;
    }
    main {
      width: min(680px, calc(100vw - 40px));
      padding: 28px;
      border: 1px solid #d9dee7;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 12px 34px rgba(20, 24, 31, .08);
    }
    h1 { margin: 0 0 12px; font-size: 28px; line-height: 1.2; }
    p { margin: 0 0 12px; line-height: 1.65; color: #3b4350; }
    small { color: #687385; }
    @media (prefers-color-scheme: dark) {
      body { background: #0f1217; color: #f2f5f8; }
      main { background: #171b22; border-color: #2b3340; box-shadow: none; }
      p { color: #c7ced8; }
      small { color: #98a3b3; }
    }
  </style>
</head>
<body>
  <main>
    <h1>4590 football</h1>
    <p>현재 트래픽 보호와 서버 이전 작업을 진행 중입니다.</p>
    <p>봇 트래픽으로 기존 호스팅이 일시 중단되어, 임시 보호 모드로 서비스 중입니다.</p>
    <small>잠시 후 다시 접속해 주세요.</small>
  </main>
</body>
</html>`;

function isTrustedBot(userAgent) {
  return TRUSTED_BOTS.some((bot) => userAgent.includes(bot));
}

function isBlockedBot(userAgent) {
  return BLOCKED_BOTS.some((bot) => userAgent.includes(bot));
}

function isHeavyPath(pathname) {
  return HEAVY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const userAgent = request.headers.get("user-agent") || "";

    if (isBlockedBot(userAgent)) {
      return new Response("blocked", { status: 403 });
    }

    if (url.pathname === "/robots.txt") {
      return new Response(
        [
          "User-agent: AhrefsBot",
          "Disallow: /",
          "User-agent: SemrushBot",
          "Disallow: /",
          "User-agent: MJ12bot",
          "Disallow: /",
          "User-agent: DotBot",
          "Disallow: /",
          "User-agent: Bytespider",
          "Disallow: /",
          "User-agent: PetalBot",
          "Disallow: /",
          "User-agent: *",
          "Disallow: /admin/",
          "Disallow: /api/",
          "Crawl-delay: 10",
          "Sitemap: https://4590fb.com/sitemap.xml",
          "",
        ].join("\n"),
        {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        },
      );
    }

    if (url.pathname === "/sitemap.xml") {
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://4590fb.com/</loc></url>\n</urlset>\n`,
        {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        },
      );
    }

    if (isHeavyPath(url.pathname) && !isTrustedBot(userAgent)) {
      return new Response(html, {
        status: 503,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "retry-after": "600",
        },
      });
    }

    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  },
};
