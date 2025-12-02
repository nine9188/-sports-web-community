/* eslint-disable @typescript-eslint/no-require-imports */

// 모듈로 선언하기 위한 export
export {};

// 즉시 실행 함수로 모든 코드를 캡슐화합니다
(async function() {
  const { createClient } = require('@supabase/supabase-js');
  const dotenv = require('dotenv');
  const { LEAGUES } = require('../leagues-data');

  dotenv.config({ path: '.env.local' });

  async function initLeagues() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('환경 변수가 설정되지 않았습니다.');
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    for (const league of LEAGUES) {
      try {
        console.log(`Fetching data for ${league.name}...`);
        
        const response = await fetch(
          `https://v3.football.api-sports.io/leagues?id=${league.id}`,
          {
            headers: {
              'x-rapidapi-host': 'v3.football.api-sports.io',
              'x-rapidapi-key': process.env.FOOTBALL_API_KEY || ''
            }
          }
        );

        const data = await response.json();
        const leagueData = data.response?.[0];

        if (leagueData) {
          const { error } = await supabase.from('leagues').upsert({
            id: leagueData.league.id,
            name: leagueData.league.name,
            country: leagueData.country.name,
            logo: leagueData.league.logo,
            flag: leagueData.country.flag
          });

          if (error) {
            console.error(`Error inserting ${league.name}:`, error);
          } else {
            console.log(`Successfully added ${league.name}`);
          }
        }
      } catch (error) {
        console.error(`Failed to fetch/insert ${league.name}:`, error);
      }
    }
  }

  try {
    await initLeagues();
    console.log('Finished initializing leagues');
  } catch (error) {
    console.error('Error initializing leagues:', error);
  }
})(); 