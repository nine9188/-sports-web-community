import { siteConfig } from '@/shared/config';
import {
  getSitemapSupabase,
  buildSitemapIndexXml,
  sitemapResponse,
} from '../sitemaps/utils';

// ISR: 1시간마다 자동 갱신
export const revalidate = 3600;

const BASE = siteConfig.url;

const MATCH_LEAGUE_SLUGS = [
  'epl', 'laliga', 'bundesliga', 'seriea', 'ligue1',
  'eredivisie', 'primeira', 'kleague',
  'ucl', 'uel', 'uecl',
];

const TEAM_LEAGUE_SLUGS = [
  'epl', 'laliga', 'bundesliga', 'seriea', 'ligue1',
  'eredivisie', 'primeira', 'kleague',
];

// teamNameToSlug 결과를 미리 계산해서 하드코딩
const PLAYER_TEAMS: Record<string, string[]> = {
  epl: [
    'arsenal', 'aston-villa', 'bournemouth', 'brentford', 'brighton', 'burnley',
    'chelsea', 'crystal-palace', 'everton', 'fulham', 'leeds', 'liverpool',
    'manchester-city', 'manchester-united', 'newcastle', 'nottingham-forest',
    'sunderland', 'tottenham', 'west-ham', 'wolves',
  ],
  laliga: [
    'alaves', 'athletic-club', 'atletico-madrid', 'barcelona', 'celta-vigo',
    'elche', 'espanyol', 'getafe', 'girona', 'levante', 'mallorca', 'osasuna',
    'oviedo', 'rayo-vallecano', 'real-betis', 'real-madrid', 'real-sociedad',
    'sevilla', 'valencia', 'villarreal',
  ],
  bundesliga: [
    '1899-hoffenheim', '1-fc-heidenheim', '1fc-kln', 'bayer-leverkusen',
    'bayern-mnchen', 'borussia-dortmund', 'borussia-mnchengladbach',
    'eintracht-frankfurt', 'fc-augsburg', 'fc-st-pauli', 'fsv-mainz-05',
    'hamburger-sv', 'rb-leipzig', 'sc-freiburg', 'union-berlin',
    'vfb-stuttgart', 'vfl-wolfsburg', 'werder-bremen',
  ],
  seriea: [
    'ac-milan', 'as-roma', 'atalanta', 'bologna', 'cagliari', 'como',
    'cremonese', 'fiorentina', 'genoa', 'inter', 'juventus', 'lazio',
    'lecce', 'napoli', 'parma', 'pisa', 'sassuolo', 'torino', 'udinese', 'verona',
  ],
  ligue1: [
    'angers', 'auxerre', 'le-havre', 'lens', 'lille', 'lorient', 'lyon',
    'marseille', 'metz', 'monaco', 'nantes', 'nice', 'paris-fc',
    'paris-saint-germain', 'rennes', 'stade-brestois-29', 'strasbourg', 'toulouse',
  ],
  eredivisie: [
    'ajax', 'az-alkmaar', 'excelsior', 'fc-volendam', 'feyenoord',
    'fortuna-sittard', 'go-ahead-eagles', 'groningen', 'heerenveen', 'heracles',
    'nac-breda', 'nec-nijmegen', 'pec-zwolle', 'psv-eindhoven',
    'sparta-rotterdam', 'telstar', 'twente', 'utrecht',
  ],
  primeira: [
    'alverca', 'arouca', 'avs', 'benfica', 'casa-pia', 'estoril', 'estrela',
    'famalicao', 'fc-porto', 'gil-vicente', 'guimaraes', 'moreirense',
    'nacional', 'rio-ave', 'santa-clara', 'sc-braga', 'sporting-cp', 'tondela',
  ],
  kleague: [
    'daegu-fc', 'daejeon-citizen', 'fc-anyang', 'fc-seoul', 'gangwon-fc',
    'gimcheon-sangmu-fc', 'gwangju-fc', 'jeju-united-fc', 'jeonbuk-motors',
    'pohang-steelers', 'suwon-city-fc', 'ulsan-hyundai-fc',
  ],
};

// ─── 라우트 핸들러 ─────────────────────────────────────────────────

export async function GET() {
  const sitemaps: { loc: string }[] = [];

  // 1. static
  sitemaps.push({ loc: `${BASE}/sitemaps/static.xml` });

  // 2. posts (모든 게시판 slug 조회 → 빈 게시판도 빈 XML 반환)
  try {
    const supabase = getSitemapSupabase();
    const { data: boards } = await supabase
      .from('boards')
      .select('slug')
      .not('slug', 'is', null);

    if (boards) {
      for (const b of boards) {
        if (b.slug) {
          sitemaps.push({ loc: `${BASE}/sitemaps/posts/${b.slug}.xml` });
        }
      }
    }
  } catch (error) {
    console.error('Sitemap index: posts query error', error);
  }
  sitemaps.push({ loc: `${BASE}/sitemaps/posts/recent.xml` });

  // 3. matches (리그별)
  for (const slug of MATCH_LEAGUE_SLUGS) {
    sitemaps.push({ loc: `${BASE}/sitemaps/matches/${slug}.xml` });
  }

  // 4. teams (리그별)
  for (const slug of TEAM_LEAGUE_SLUGS) {
    sitemaps.push({ loc: `${BASE}/sitemaps/teams/${slug}.xml` });
  }

  // 5. players (리그/팀별)
  for (const [league, teams] of Object.entries(PLAYER_TEAMS)) {
    for (const team of teams) {
      sitemaps.push({ loc: `${BASE}/sitemaps/players/${league}/${team}.xml` });
    }
  }

  return sitemapResponse(buildSitemapIndexXml(sitemaps), 3600);
}
