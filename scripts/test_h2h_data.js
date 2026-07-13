const dotenv = require('dotenv');
const path = require('path');

// .env.local 로딩
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Node.js ESM 모듈 호환 임포트 우회 또는 직접 API 호출 모방
const API_BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.FOOTBALL_API_KEY || '';

async function testSpainRecentForm() {
  console.log('FOOTBALL_API_KEY loaded:', API_KEY ? 'YES (length: ' + API_KEY.length + ')' : 'NO');
  
  const teamId = 9; // 스페인
  const last = 5;
  
  const queryParams = new URLSearchParams({
    team: String(teamId),
    last: String(last * 3)
  });

  try {
    const url = `${API_BASE_URL}/fixtures?${queryParams.toString()}`;
    console.log('Requesting URL:', url);

    const response = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': API_KEY,
      }
    });

    const data = await response.json();
    console.log('API Status:', data.errors || 'OK');
    console.log('Results count:', data.results);

    const allFixtures = Array.isArray(data.response) ? data.response : [];
    const finishedStatuses = ['FT', 'AET', 'PEN'];
    const fixtures = allFixtures.filter(
      m => finishedStatuses.includes(m?.fixture?.status?.short ?? '')
    );

    console.log('Finished matches count:', fixtures.length);

    fixtures.sort((a, b) => {
      const ta = new Date(a?.fixture?.date || 0).getTime();
      const tb = new Date(b?.fixture?.date || 0).getTime();
      return tb - ta;
    });

    const selected = fixtures.slice(0, last);
    console.log('--- SPAIN RECENT 5 MATCHES FROM FOOTBALL API ---');
    selected.forEach((m, idx) => {
      console.log(`[${idx+1}] Date: ${m.fixture.date} | ${m.teams.home.name} ${m.goals.home} - ${m.goals.away} ${m.teams.away.name} (${m.fixture.status.short})`);
    });
  } catch (error) {
    console.error('Error during fetch:', error);
  }
}

testSpainRecentForm();
