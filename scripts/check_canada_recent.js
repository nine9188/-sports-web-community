const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apiKey = process.env.FOOTBALL_API_KEY || process.env.RAPID_API_KEY || process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '';

async function main() {
  if (!apiKey) {
    console.error('No API key found in env');
    return;
  }
  
  // Canada's team ID is 5529
  const url = 'https://v3.football.api-sports.io/fixtures?team=5529&last=15';
  console.log('Fetching url:', url);
  const response = await fetch(url, {
    headers: {
      'x-apisports-key': apiKey
    }
  });
  
  const data = await response.json();
  console.log('Response status/errors:', data.errors);
  const list = data.response || [];
  console.log('Canada recent fixtures count in API:', list.length);
  if (list.length > 0) {
    console.log(JSON.stringify(list.map(f => ({
      id: f.fixture.id,
      date: f.fixture.date,
      league: f.league.name,
      home: f.teams.home.name,
      away: f.teams.away.name,
      status: f.fixture.status.short,
      goals: f.goals
    })), null, 2));
  } else {
    console.log('No matches found for Canada in API.');
  }
}

main();
