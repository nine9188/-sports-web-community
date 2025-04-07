import { NextResponse } from 'next/server';

// 부상 유형 한글 매핑
const typeMap: { [key: string]: string } = {
  'Missing Fixture': '결장',
  'Questionable': '출전 불투명',
  'Unknown': '미정'
};

// 부상 사유 한글 매핑
const reasonMap: { [key: string]: string } = {
  "Coach's decision": '감독 결정',
  'Thigh Injury': '허벅지 부상',
  'National selection': '국가대표 차출',
  'Rest': '휴식',
  'Knock': '타박상',
  'Muscle Injury': '근육 부상',
  'Ankle Injury': '발목 부상',
  'Knee Injury': '무릎 부상',
  'Hamstring': '햄스트링',
  'Calf Injury': '종아리 부상',
  'Back Injury': '등 부상',
  'Shoulder Injury': '어깨 부상',
  'Illness': '질병',
  'Suspended': '출전 정지',
  'Foot Injury': '발 부상'
};

interface Team {
  name: string;
  logo: string;
}

interface League {
  name: string;
  season: string | number;
}

interface Fixture {
  date: string;
}

interface Injury {
  fixture: Fixture;
  league: League;
  team: Team;
  player?: {
    type?: string;
    reason?: string;
  };
  type?: string;
  reason?: string;
}

interface FormattedInjury {
  fixture: {
    date: string;
  };
  league: {
    name: string;
    season: string | number;
  };
  team: {
    name: string;
    logo: string;
  };
  type: string;
  reason: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 현재 시즌과 이전 시즌 계산
    const currentYear = new Date().getFullYear();
    const seasons = [
      `${currentYear}`,
      `${currentYear-1}`,
      `${currentYear-2}`
    ];

    // 모든 시즌의 부상 데이터를 가져오기 위한 Promise 배열
    const injuryPromises = seasons.map(season => 
      fetch(
        `https://v3.football.api-sports.io/injuries?player=${id}&season=${season}`,
        {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          },
          cache: 'no-store'
        }
      )
    );

    // 모든 요청을 병렬로 처리
    const responses = await Promise.all(injuryPromises);
    
    // 모든 응답 데이터 수집
    let allInjuries: Injury[] = [];
    
    for (const response of responses) {
      if (response.ok) {
        const data = await response.json();
        if (data.response && data.response.length > 0) {
          allInjuries = [...allInjuries, ...data.response];
        }
      }
    }

    if (allInjuries.length === 0) {
      return NextResponse.json([]);
    }

    // 부상 데이터 포맷팅
    const formattedInjuries = allInjuries.map((injury: Injury) => {
      // 타입과 이유 값 안전하게 추출
      const playerType = injury.player?.type;
      const injuryType = injury.type;
      const playerReason = injury.player?.reason;
      const injuryReason = injury.reason;
      
      // 타입과 이유 결정 (우선순위: 매핑 값 > 원본 값 > 기본값)
      const typeKey = playerType || injuryType || '';
      const reasonKey = playerReason || injuryReason || '';
      
      const mappedType = typeKey ? (typeMap[typeKey] || typeKey) : '정보 없음';
      const mappedReason = reasonKey ? (reasonMap[reasonKey] || reasonKey) : '정보 없음';
      
      return {
        fixture: {
          date: injury.fixture.date,
        },
        league: {
          name: injury.league.name,
          season: injury.league.season,
        },
        team: {
          name: injury.team.name,
          logo: injury.team.logo,
        },
        type: mappedType,
        reason: mappedReason
      };
    });

    // 날짜 기준 내림차순 정렬
    const sortedInjuries = formattedInjuries.sort((a: FormattedInjury, b: FormattedInjury) => 
      new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
    );

    return NextResponse.json(sortedInjuries);

  } catch (error) {
    console.error('부상 API 오류:', error);
    return NextResponse.json(
      { 
        error: '부상 데이터를 가져오는데 실패했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
} 