/* eslint-disable @typescript-eslint/no-require-imports */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const WORLD_CUP_LEAGUE_ID = 1;
const WORLD_CUP_SEASON = 2026;

const KOREAN_NAMES = {
  Algeria: '알제리',
  Argentina: '아르헨티나',
  Australia: '호주',
  Austria: '오스트리아',
  Belgium: '벨기에',
  'Bosnia & Herzegovina': '보스니아 헤르체고비나',
  Brazil: '브라질',
  Canada: '캐나다',
  'Cape Verde Islands': '카보베르데',
  Colombia: '콜롬비아',
  'Congo DR': '콩고민주공화국',
  Croatia: '크로아티아',
  Curaçao: '퀴라소',
  Curacao: '퀴라소',
  'Czech Republic': '체코',
  Ecuador: '에콰도르',
  Egypt: '이집트',
  England: '잉글랜드',
  France: '프랑스',
  Germany: '독일',
  Ghana: '가나',
  Haiti: '아이티',
  Iran: '이란',
  Iraq: '이라크',
  'Ivory Coast': '코트디부아르',
  Japan: '일본',
  Jordan: '요르단',
  Mexico: '멕시코',
  Morocco: '모로코',
  Netherlands: '네덜란드',
  'New Zealand': '뉴질랜드',
  Norway: '노르웨이',
  Panama: '파나마',
  Paraguay: '파라과이',
  Portugal: '포르투갈',
  Qatar: '카타르',
  'Saudi Arabia': '사우디아라비아',
  Scotland: '스코틀랜드',
  Senegal: '세네갈',
  'South Africa': '남아프리카공화국',
  'South Korea': '대한민국',
  Spain: '스페인',
  Sweden: '스웨덴',
  Switzerland: '스위스',
  Tunisia: '튀니지',
  Türkiye: '튀르키예',
  Turkey: '튀르키예',
  Uruguay: '우루과이',
  USA: '미국',
  Uzbekistan: '우즈베키스탄',
};

function buildSlug(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchWorldCupTeams() {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) throw new Error('FOOTBALL_API_KEY is not set.');

  const params = new URLSearchParams({
    league: String(WORLD_CUP_LEAGUE_ID),
    season: String(WORLD_CUP_SEASON),
  });

  const response = await fetch(`https://v3.football.api-sports.io/teams?${params}`, {
    headers: {
      'x-rapidapi-host': 'v3.football.api-sports.io',
      'x-rapidapi-key': key,
    },
  });

  if (!response.ok) {
    throw new Error(`API-FOOTBALL request failed: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data.response) ? data.response : [];
}

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service env vars are not set.');

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  const apiRows = await fetchWorldCupTeams();
  const rows = apiRows.map((item) => {
    const team = item.team || {};
    const venue = item.venue || null;
    const name = team.name || `Team ${team.id}`;
    const nameKo = KOREAN_NAMES[name] || name;
    const countryKo = KOREAN_NAMES[team.country] || nameKo;

    return {
      team_id: team.id,
      name,
      name_ko: nameKo,
      display_name: name,
      short_name: name === 'South Korea' ? '한국' : null,
      code: team.code || null,
      logo_url: team.logo || null,
      league_id: WORLD_CUP_LEAGUE_ID,
      league_name: 'World Cup',
      league_name_ko: '월드컵',
      league_logo_url: 'https://media.api-sports.io/football/leagues/1.png',
      country: team.country || null,
      country_ko: countryKo,
      founded: team.founded || null,
      venue_id: venue?.id || null,
      venue_name: venue?.name || null,
      venue_city: venue?.city || null,
      venue_capacity: venue?.capacity || null,
      venue_address: venue?.address || null,
      venue_surface: venue?.surface || null,
      current_season: WORLD_CUP_SEASON,
      is_active: true,
      search_keywords: [...new Set([name, nameKo, team.country, countryKo, team.code].filter(Boolean))],
      slug: buildSlug(name),
      api_data: {
        team,
        venue,
        worldCupSeason: WORLD_CUP_SEASON,
        lastSync: new Date().toISOString(),
      },
    };
  });

  const missingKoreanNames = rows.filter((row) => row.name === row.name_ko).map((row) => row.name);
  if (missingKoreanNames.length > 0) {
    throw new Error(`Missing Korean names: ${missingKoreanNames.join(', ')}`);
  }

  const { error } = await supabase
    .from('football_teams')
    .upsert(rows, { onConflict: 'team_id' });

  if (error) throw error;

  console.log(`Upserted ${rows.length} World Cup teams.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
