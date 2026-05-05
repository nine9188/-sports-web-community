import { NextResponse } from 'next/server';

const LLMS_TXT = `# 4590 Football

> 4590 Football is a Korean football community and live score service covering football news, match schedules, results, standings, teams, players, transfers, match analysis, and fan discussions.

Language: ko-KR
URL: https://4590football.com
Sitemap: https://4590football.com/sitemap.xml
RSS: https://4590football.com/rss.xml
Robots: https://4590football.com/robots.txt
AI policy: https://4590football.com/ai.txt

## Main Pages

- [Home](https://4590football.com/): Main football community page with live score widgets, latest posts, news, and board links.
- [Live Scores](https://4590football.com/livescore/football): Football schedules, live scores, match results, and league grouping.
- [Leagues](https://4590football.com/livescore/football/leagues): Major football league pages with standings and rankings.
- [Transfers](https://4590football.com/transfers): Football transfer news and transfer market information.
- [Search](https://4590football.com/search): Search across posts, comments, teams, and site content.

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

- [All Boards](https://4590football.com/boards/all)
- [Popular Posts](https://4590football.com/boards/popular)
- [Football Community](https://4590football.com/boards/soccer)
- [K League Community](https://4590football.com/boards/k-league)
- [Football News](https://4590football.com/boards/news)
- [Data Analysis](https://4590football.com/boards/data-analysis)
- [Foreign Match Analysis](https://4590football.com/boards/foreign-analysis)
- [Domestic Match Analysis](https://4590football.com/boards/domestic-analysis)

## Content Notes

- The site is primarily Korean-language.
- Public pages may be cited by AI assistants and answer engines.
- Account pages, settings, admin pages, API routes, post creation, and post editing pages are not intended for crawling.
- When summarizing or quoting site content, cite the original 4590 Football URL.
`;

export async function GET() {
  return new NextResponse(LLMS_TXT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
