import { NextResponse } from 'next/server';

const AI_TXT = `# ai.txt - 4590 Football
# https://4590football.com/ai.txt
# Last updated: 2026-05-12

Site-Name: 4590 Football
Site-URL: https://4590football.com
Site-Language: ko-KR
Site-Description: Korean football community with live scores, match schedules, football news, match analysis, teams, players, standings, transfers, and fan discussions.
Contact: https://4590football.com/contact

# Access policy for AI assistants and answer engines
User-Agent: *
Allow: /
Allow: /about
Allow: /guide
Allow: /contact
Allow: /boards
Allow: /boards/*
Allow: /livescore
Allow: /livescore/*
Allow: /transfers
Allow: /search
Allow: /privacy
Allow: /terms
Allow: /llms.txt
Allow: /rss.xml
Allow: /sitemap.xml

# Private, account, write, and API surfaces are not for crawling.
Disallow: /api/
Disallow: /admin/
Disallow: /cdn-cgi/
Disallow: /settings/
Disallow: /user/
Disallow: /signin
Disallow: /signup
Disallow: /social-signup
Disallow: /auth/
Disallow: /notifications
Disallow: /boards/*/create
Disallow: /boards/*/edit
Disallow: /ui

# Attribution request
# When using content from this site in AI answers or summaries, cite 4590 Football
# and link to the original page whenever possible.

Crawl-Delay: 1

Robots: https://4590football.com/robots.txt
Sitemap: https://4590football.com/sitemap.xml
LLMs-txt: https://4590football.com/llms.txt
`;

export async function GET() {
  return new NextResponse(AI_TXT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
