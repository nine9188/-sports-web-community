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
  const { PREMIER_LEAGUE_TEAMS } = require('../teams-data');

  dotenv.config({ path: '.env.local' });

  // 입스위치 타운 팀 찾기
  const IPSWICH_TEAM = PREMIER_LEAGUE_TEAMS.find((team: Team) => team.name === "Ipswich Town");

  if (!IPSWICH_TEAM) {
    console.error('입스위치 타운 팀 데이터를 찾을 수 없습니다.');
    return;
  }

  async function initIpswichTeam() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('환경 변수가 설정되지 않았습니다.');
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 직접 입스위치 타운 데이터를 삽입 (API 타임아웃 우회)
    try {
      console.log(`Manually adding ${IPSWICH_TEAM.name} (ID: ${IPSWICH_TEAM.id})...`);
      
      // 입스위치 타운 기본 데이터
      const ipswichData = {
        id: IPSWICH_TEAM.id,
        name: IPSWICH_TEAM.name,
        country: "England",
        founded: 1878,
        logo: `https://media.api-sports.io/football/teams/${IPSWICH_TEAM.id}.png`,
        venue_name: "Portman Road",
        venue_city: "Ipswich, Suffolk",
        venue_capacity: 30311
      };
      
      const { error } = await supabase.from('teams').upsert(ipswichData);

      if (error) {
        console.error(`Error inserting ${IPSWICH_TEAM.name}:`, error);
      } else {
        console.log(`Successfully added ${IPSWICH_TEAM.name}`);
      }
    } catch (error: unknown) {
      console.error(`Failed to insert ${IPSWICH_TEAM.name}:`, error);
    }
  }

  try {
    await initIpswichTeam();
    console.log('Finished initializing Ipswich Town team');
  } catch (error: unknown) {
    console.error('Error initializing Ipswich Town team:', error);
  }
})(); 