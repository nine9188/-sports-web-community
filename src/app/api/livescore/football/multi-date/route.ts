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

/**
 * 단일 날짜에 대한 API 데이터를 가져오는 함수
 */
async function fetchMatchesForDate(date: string, apiKey: string, includeAllLeagues: boolean = false, debug: boolean = false) {
  try {
    if (debug) console.log(`[Multi-API] ${date} 날짜 경기 데이터 요청 시작 (${new Date().toISOString()})`);
    
    const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${date}&timezone=Asia/Seoul`;
    
    if (debug) console.log(`[Multi-API] ${date} 요청 URL: ${apiUrl}`);
    
    const startTime = Date.now();
    const response = await fetch(apiUrl, {
      headers: {
        'x-apisports-key': apiKey,
        'Cache-Control': 'no-cache, no-store'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    const endTime = Date.now();

    if (debug) {
      console.log(`[Multi-API] ${date} API 요청 완료 (${endTime - startTime}ms):`, {
        url: apiUrl,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
    }

    if (!response.ok) {
      console.error(`[Multi-API] ${date} 응답 오류:`, response.status, response.statusText);
      return { success: false, data: [], date };
    }

    const responseText = await response.text();
    if (debug) console.log(`[Multi-API] ${date} 응답 데이터 길이: ${responseText.length} 바이트`);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (err) {
      console.error(`[Multi-API] ${date} JSON 파싱 오류:`, err);
      console.log(`[Multi-API] ${date} 응답 텍스트 일부:`, responseText.substring(0, 500));
      return { success: false, data: [], date, error: 'JSON 파싱 오류' };
    }
    
    if (!data.response || !Array.isArray(data.response)) {
      console.error(`[Multi-API] ${date} 응답 형식 오류`, data);
      return { success: false, data: [], date, error: '응답 형식 오류' };
    }
    
    // 주요 리그만 필터링 (includeAllLeagues가 true면 모든 경기 포함)
    let filteredMatches = data.response;
    if (!includeAllLeagues) {
      filteredMatches = data.response.filter((match: MatchData) => 
        MAJOR_LEAGUE_IDS.includes(match.league.id)
      );
      if (debug) console.log(`[Multi-API] ${date} 필터링 후 경기 수:`, filteredMatches.length, '/', data.response.length);
    }
    
    return { 
      success: true, 
      data: filteredMatches,
      date,
      total: data.response.length,
      filtered: filteredMatches.length
    };
  } catch (error) {
    console.error(`[Multi-API] ${date} 처리 중 오류:`, error);
    return { success: false, data: [], date, error: String(error) };
  }
}

/**
 * 매치 데이터를 가공하는 함수
 */
function processMatchData(match: MatchData, language: 'ko' | 'en' = 'ko') {
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
      name: leagueDisplayName || match.league.name,
      origin_name: match.league.name,
      country: match.league.country,
      logo: match.league.logo,
      flag: match.league.flag
    },
    teams: {
      home: {
        id: match.teams.home.id,
        name: homeTeamDisplayName || match.teams.home.name,
        origin_name: match.teams.home.name,
        logo: match.teams.home.logo,
        winner: match.teams.home.winner,
        country_ko: homeTeam?.country_ko,
        country_en: homeTeam?.country_en,
        code: homeTeam?.code
      },
      away: {
        id: match.teams.away.id,
        name: awayTeamDisplayName || match.teams.away.name,
        origin_name: match.teams.away.name,
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
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 디버그 모드
    const debug = searchParams.get('debug') === 'true';
    
    // 요청정보 로깅
    if (debug) {
      console.log('[Multi-API] 원본 요청 URL:', request.url);
      console.log('[Multi-API] searchParams:', Object.fromEntries(searchParams.entries()));
    }
    
    // 모든 리그 포함 여부 (기본값: false)
    const includeAllLeagues = searchParams.get('all_leagues') === 'true';
    // 언어 설정 (기본값: ko)
    const language = (searchParams.get('lang') || 'ko') as 'ko' | 'en';

    // API 키 확인
    const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
    if (!apiKey) {
      console.error('[Multi-API] API 키가 설정되지 않았습니다.');
      return NextResponse.json(
        { success: false, message: 'API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 기준 날짜 설정 (기본값: 오늘)
    const today = new Date();
    
    // 어제, 오늘, 내일 날짜 계산
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // ISO 날짜 문자열로 변환
    const formattedYesterday = yesterday.toISOString().split('T')[0];
    const formattedToday = today.toISOString().split('T')[0];
    const formattedTomorrow = tomorrow.toISOString().split('T')[0];
    
    if (debug) {
      console.log('[Multi-API] 조회 날짜:', {
        yesterday: formattedYesterday,
        today: formattedToday,
        tomorrow: formattedTomorrow,
        client_time: today.toString()
      });
    }

    // 3개 날짜에 대한 API 데이터를 병렬로 가져오기
    if (debug) console.log('[Multi-API] API 요청 시작 (3개 날짜)');
    
    const [yesterdayResult, todayResult, tomorrowResult] = await Promise.all([
      fetchMatchesForDate(formattedYesterday, apiKey, includeAllLeagues, debug),
      fetchMatchesForDate(formattedToday, apiKey, includeAllLeagues, debug),
      fetchMatchesForDate(formattedTomorrow, apiKey, includeAllLeagues, debug)
    ]);
    
    if (debug) console.log('[Multi-API] 모든 API 요청 완료');

    // 각 날짜별 데이터 처리
    const processedYesterday = yesterdayResult.success 
      ? (yesterdayResult.data as MatchData[])
          .filter(match => !['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(match.fixture.status.short))
          .map(match => processMatchData(match, language))
      : [];
      
    const processedToday = todayResult.success 
      ? (todayResult.data as MatchData[])
          .filter(match => !['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(match.fixture.status.short))
          .map(match => processMatchData(match, language))
      : [];
      
    const processedTomorrow = tomorrowResult.success 
      ? (tomorrowResult.data as MatchData[])
          .map(match => processMatchData(match, language))
      : [];
    
    // 각 날짜별 데이터 개수 확인
    console.log('[Multi-API] 최종 데이터 개수:', {
      yesterday: processedYesterday.length,
      today: processedToday.length,
      tomorrow: processedTomorrow.length,
      total: processedYesterday.length + processedToday.length + processedTomorrow.length
    });

    // 응답 구성
    const response = {
      success: true,
      dates: {
        yesterday: formattedYesterday, 
        today: formattedToday, 
        tomorrow: formattedTomorrow
      },
      data: {
        yesterday: {
          matches: processedYesterday,
          count: processedYesterday.length,
          date: formattedYesterday,
          success: yesterdayResult.success
        },
        today: {
          matches: processedToday,
          count: processedToday.length,
          date: formattedToday,
          success: todayResult.success
        },
        tomorrow: {
          matches: processedTomorrow,
          count: processedTomorrow.length,
          date: formattedTomorrow,
          success: tomorrowResult.success
        }
      },
      meta: {
        totalMatches: processedYesterday.length + processedToday.length + processedTomorrow.length,
        language,
        debug,
        timestamp: new Date().toISOString()
      }
    };
    
    if (debug) {
      console.log('[Multi-API] 응답 전송:', {
        success: true,
        matches: {
          yesterday: processedYesterday.length,
          today: processedToday.length,
          tomorrow: processedTomorrow.length,
          total: processedYesterday.length + processedToday.length + processedTomorrow.length
        }
      });
    }
    
    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('[Multi-API] 전체 처리 중 오류:', error);
    
    // 상세한 오류 정보를 포함한 응답
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : '데이터를 가져오는데 실패했습니다',
        error: error instanceof Error ? error.stack : null,
        timestamp: new Date().toISOString(),
        type: error instanceof Error ? error.name : typeof error
      },
      { status: 500 }
    );
  }
} 