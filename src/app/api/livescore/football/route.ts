import { NextResponse } from 'next/server';
import { getMajorLeagueIds, getLeagueDisplayName } from '@/app/constants/league-mappings';
import { getTeamDisplayName, getTeamById } from '@/app/constants/teams';

// 매치 데이터 인터페이스 정의
interface MatchData {
  fixture: {
    id: number;
    timestamp: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
    extratime: {
      home: number | null;
      away: number | null;
    };
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
}

// 주요 리그 ID 목록 - 매핑 파일에서 가져옵니다
const MAJOR_LEAGUE_IDS = getMajorLeagueIds();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    // 모든 리그 포함 여부 (기본값: false)
    const includeAllLeagues = searchParams.get('all_leagues') === 'true';
    // 언어 설정 (기본값: ko)
    const language = (searchParams.get('lang') || 'ko') as 'ko' | 'en';

    console.log('API 요청 받음 - 날짜 파라미터:', date, '모든 리그 포함:', includeAllLeagues, '언어:', language);

    // API 키 확인
    const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
    if (!apiKey) {
      console.error('API 키가 설정되지 않았습니다');
      return NextResponse.json(
        { success: false, message: 'API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // API URL 구성
    let apiUrl;
    if (date) {
      apiUrl = `https://v3.football.api-sports.io/fixtures?date=${date}&timezone=Asia/Seoul`;
      console.log(`날짜별 경기 요청: ${date}`);
    } else {
      apiUrl = `https://v3.football.api-sports.io/fixtures?live=all&timezone=Asia/Seoul`;
      console.log('라이브 경기 요청');
    }

    console.log('요청 URL:', apiUrl);

    // API 요청
    const response = await fetch(apiUrl, {
      headers: {
        'x-apisports-key': apiKey
      },
      next: { revalidate: 30 }
    });

    // 응답 상태 확인
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 응답 오류:', response.status, errorText);
      return NextResponse.json(
        { success: false, message: `API 응답 오류 (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('API 응답 수신 - 총 경기 수:', data.response?.length || 0);
    
    if (!data.response || !Array.isArray(data.response)) {
      console.error('API 응답 형식 오류:', data);
      return NextResponse.json(
        { success: false, message: 'API 응답 형식이 올바르지 않습니다.', debug: data },
        { status: 500 }
      );
    }
    
    // 주요 리그만 필터링 (includeAllLeagues가 true면 모든 경기 포함)
    let filteredMatches = data.response;
    if (!includeAllLeagues) {
      filteredMatches = data.response.filter((match: MatchData) => 
        MAJOR_LEAGUE_IDS.includes(match.league.id)
      );
    }
    
    console.log('총 경기 수:', data.response.length);
    console.log('필터링 후 표시할 경기 수:', filteredMatches.length);
    
    const mappedData = filteredMatches.map((match: MatchData) => {
      // 리그 한국어/영어 이름 처리
      const leagueDisplayName = getLeagueDisplayName(match.league.id, {
        language,
        includeCountry: true
      });

      // 홈팀 이름 처리
      const homeTeamDisplayName = getTeamDisplayName(match.teams.home.id, {
        language,
        includeCountry: false
      });

      // 원정팀 이름 처리
      const awayTeamDisplayName = getTeamDisplayName(match.teams.away.id, {
        language,
        includeCountry: false
      });

      // 홈팀 정보
      const homeTeam = getTeamById(match.teams.home.id);
      // 원정팀 정보
      const awayTeam = getTeamById(match.teams.away.id);

      return {
        id: match.fixture.id,
        status: {
          code: match.fixture.status.short,
          name: match.fixture.status.long,
          elapsed: match.fixture.status.elapsed
        },
        time: {
          timestamp: match.fixture.timestamp,
          date: match.fixture.date,
          timezone: 'Asia/Seoul'
        },
        league: {
          id: match.league.id,
          name: leagueDisplayName || match.league.name, // 매핑된 이름이 없으면 원본 이름 사용
          origin_name: match.league.name, // 원본 이름도 함께 전달
          country: match.league.country,
          logo: match.league.logo,
          flag: match.league.flag
        },
        teams: {
          home: {
            id: match.teams.home.id,
            name: homeTeamDisplayName || match.teams.home.name, // 매핑된 이름이 없으면 원본 이름 사용
            origin_name: match.teams.home.name, // 원본 이름도 함께 전달
            logo: match.teams.home.logo,
            winner: match.teams.home.winner,
            country_ko: homeTeam?.country_ko,
            country_en: homeTeam?.country_en,
            code: homeTeam?.code
          },
          away: {
            id: match.teams.away.id,
            name: awayTeamDisplayName || match.teams.away.name, // 매핑된 이름이 없으면 원본 이름 사용
            origin_name: match.teams.away.name, // 원본 이름도 함께 전달
            logo: match.teams.away.logo,
            winner: match.teams.away.winner,
            country_ko: awayTeam?.country_ko,
            country_en: awayTeam?.country_en,
            code: awayTeam?.code
          }
        },
        goals: {
          home: match.goals.home || 0,
          away: match.goals.away || 0
        },
        score: {
          halftime: {
            home: match.score.halftime.home || 0,
            away: match.score.halftime.away || 0
          },
          fulltime: {
            home: match.score.fulltime.home || 0,
            away: match.score.fulltime.away || 0
          },
          extratime: {
            home: match.score.extratime.home || 0,
            away: match.score.extratime.away || 0
          },
          penalty: {
            home: match.score.penalty.home || 0,
            away: match.score.penalty.away || 0
          }
        }
      };
    });

    // 경기 상태별 통계
    const statusCounts: Record<string, number> = {};
    mappedData.forEach((match: ReturnType<typeof mappedData[0]>) => {
      const status = match.status.code;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('경기 상태별 통계:', statusCounts);

    return NextResponse.json({
      success: true,
      data: mappedData,
      meta: {
        total: data.response.length,
        filtered: mappedData.length,
        status: statusCounts,
        date: date || 'live',
        language
      }
    });

  } catch (error: unknown) {
    console.error('API 처리 중 오류 발생:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : '데이터를 가져오는데 실패했습니다',
        error: error instanceof Error ? error.stack : null
      },
      { status: 500 }
    );
  }
}
