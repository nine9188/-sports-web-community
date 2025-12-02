/* eslint-disable @typescript-eslint/no-require-imports */

// 모듈로 선언하기 위한 export
export {};

// 즉시 실행 함수로 모든 코드를 캡슐화합니다
(async function() {
  const { createClient } = require('@supabase/supabase-js');
  const dotenv = require('dotenv');
  const { 
    PREMIER_LEAGUE_TEAMS, 
    LA_LIGA_TEAMS, 
    BUNDESLIGA_TEAMS,
    LIGUE_1_TEAMS,
    SERIE_A_TEAMS,
    EREDIVISIE_TEAMS,
    K_LEAGUE_TEAMS
  } = require('../teams-data');

  dotenv.config({ path: '.env.local' });

  // 모든 팀 데이터 합치기
  const ALL_TEAMS = [
    ...PREMIER_LEAGUE_TEAMS,
    ...LA_LIGA_TEAMS,
    ...BUNDESLIGA_TEAMS,
    ...LIGUE_1_TEAMS,
    ...SERIE_A_TEAMS,
    ...EREDIVISIE_TEAMS,
    ...K_LEAGUE_TEAMS
  ];

  async function initTeams() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('환경 변수가 설정되지 않았습니다.');
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    for (const team of ALL_TEAMS) {
      try {
        console.log(`Fetching data for ${team.name}...`);
        
        const response = await fetch(
          `https://v3.football.api-sports.io/teams?id=${team.id}`,
          {
            headers: {
              'x-rapidapi-host': 'v3.football.api-sports.io',
              'x-rapidapi-key': process.env.FOOTBALL_API_KEY || ''
            }
          }
        );

        const data = await response.json();
        const teamData = data.response?.[0];

        if (teamData) {
          const { error } = await supabase.from('teams').upsert({
            id: teamData.team.id,
            name: teamData.team.name,
            country: teamData.team.country,
            founded: teamData.team.founded,
            logo: teamData.team.logo,
            venue_name: teamData.venue?.name,
            venue_city: teamData.venue?.city,
            venue_capacity: teamData.venue?.capacity
          });

          if (error) {
            console.error(`Error inserting ${team.name}:`, error);
          } else {
            console.log(`Successfully added ${team.name}`);
          }
        }
      } catch (error) {
        console.error(`Failed to fetch/insert ${team.name}:`, error);
      }
    }
  }

  try {
    await initTeams();
    console.log('Finished initializing teams');
  } catch (error) {
    console.error('Error initializing teams:', error);
  }
})(); 