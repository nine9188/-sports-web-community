import { NextResponse } from 'next/server';
import { siteConfig } from '@/shared/config';

function buildLlmsTxt() {
  const baseUrl = siteConfig.url;

  return `# 4590 Football

> 4590 Football is a Korean football community and live score service covering football news, match schedules, results, standings, teams, players, transfers, match analysis, and fan discussions.

Language: ko-KR
URL: ${baseUrl}
Sitemap: ${baseUrl}/sitemap.xml
RSS: ${baseUrl}/rss.xml
Robots: ${baseUrl}/robots.txt
AI policy: ${baseUrl}/ai.txt

## Main Pages

- [Home](${baseUrl}/): Main football community page with live score widgets, latest posts, news, and board links.
- [Live Scores](${baseUrl}/livescore/football): Football schedules, live scores, match results, and league grouping.
- [Leagues](${baseUrl}/livescore/football/leagues): Major football league pages with standings and rankings.
- [Transfers](${baseUrl}/transfers): Football transfer news and transfer market information.
- [Shop](${baseUrl}/shop): Point shop main page.

## Football Data Pages

- Team pages: /livescore/football/team/{teamId}/{slug}
  - Team overview, fixtures, standings, squad, transfers, and statistics.
- Player pages: /livescore/football/player/{playerId}/{slug}
  - Player profile, season statistics, fixture statistics, rankings, transfers, injuries, and trophies.
- Match pages: /livescore/football/match/{fixtureId}/{slug}
  - Match header, score, events, lineups, statistics, standings, highlights, and support comments.
- League pages: /livescore/football/leagues/{leagueId}/{slug}
  - League standings, top scorers, top assists, teams, and fixtures.

## Community Boards

- [All Boards](${baseUrl}/boards/all)
- [Popular Posts](${baseUrl}/boards/popular)
- [Football Community](${baseUrl}/boards/soccer)
- [K League Community](${baseUrl}/boards/k-league)
- [Football News](${baseUrl}/boards/news)
- [Data Analysis](${baseUrl}/boards/data-analysis)
- [Foreign Match Analysis](${baseUrl}/boards/foreign-analysis)
- [Domestic Match Analysis](${baseUrl}/boards/domestic-analysis)

## Content Notes

- The site is primarily Korean-language.
- Public pages may be cited by AI assistants and answer engines.
- Account pages, settings, admin pages, API routes, post creation, and post editing pages are not intended for crawling.
- When summarizing or quoting site content, cite the original 4590 Football URL.
`;
}

export async function GET() {
  return new NextResponse(buildLlmsTxt(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
