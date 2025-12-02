/* eslint-disable @typescript-eslint/no-require-imports */

// 모듈로 선언하기 위한 export
export {};

// 팀 인터페이스 정의
interface Team {
  id: number;
  name: string;
}

// 즉시 실행 함수로 모든 코드를 캡슐화합니다
(async function() {
  const { createClient } = require('@supabase/supabase-js');
  const dotenv = require('dotenv');
  const { 
    PREMIER_LEAGUE_TEAMS, 
    LA_LIGA_TEAMS, 
    BUNDESLIGA_TEAMS
  } = require('../teams-data');

  dotenv.config({ path: '.env.local' });

  // 타임아웃 발생한 팀들과 ID가 변경된 입스위치 타운 추출
  const TEAMS_TO_INIT: Team[] = [
    // 라리가 팀들
    LA_LIGA_TEAMS.find((team: Team) => team.name === "Osasuna"),
    LA_LIGA_TEAMS.find((team: Team) => team.name === "Almeria"),
    LA_LIGA_TEAMS.find((team: Team) => team.name === "Rayo Vallecano"),
    
    // 분데스리가 팀들
    BUNDESLIGA_TEAMS.find((team: Team) => team.name === "Bayern Munich"),
    BUNDESLIGA_TEAMS.find((team: Team) => team.name === "VfB Stuttgart"),
    BUNDESLIGA_TEAMS.find((team: Team) => team.name === "Werder Bremen"),
    
    // 프리미어리그 팀
    PREMIER_LEAGUE_TEAMS.find((team: Team) => team.name === "Ipswich Town"),
  ].filter(Boolean) as Team[]; // 없는 경우 필터링

  if (TEAMS_TO_INIT.length === 0) {
    console.error('초기화할 팀 데이터를 찾을 수 없습니다.');
    return;
  }

  async function initTeams() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('환경 변수가 설정되지 않았습니다.');
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 요청 사이에 지연을 추가하는 함수
    const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

    for (const team of TEAMS_TO_INIT) {
      try {
        console.log(`Fetching data for ${team.name}...`);
        
        // 요청 타임아웃 설정 (20초)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20초 타임아웃
        
        try {
          const response = await fetch(
            `https://v3.football.api-sports.io/teams?id=${team.id}`,
            {
              headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': process.env.FOOTBALL_API_KEY || ''
              },
              signal: controller.signal
            }
          );
          
          clearTimeout(timeoutId); // 응답을 받았으므로 타임아웃 취소
          
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
          } else {
            console.error(`No data returned for ${team.name}`);
          }
        } catch (error: unknown) {
          clearTimeout(timeoutId); // 에러 발생 시 타임아웃 취소
          
          if (error instanceof Error && error.name === 'AbortError') {
            console.error(`Request for ${team.name} timed out after 20 seconds`);
          } else {
            throw error;
          }
        }
        
        // 다음 API 요청 전에 3초 대기 (API 제한 방지)
        await delay(3000);
        
      } catch (error: unknown) {
        console.error(`Failed to fetch/insert ${team.name}:`, error);
      }
    }
  }

  try {
    await initTeams();
    console.log('Finished initializing teams');
  } catch (error: unknown) {
    console.error('Error initializing teams:', error);
  }
})(); 