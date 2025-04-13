import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// 주요 리그 ID 목록
const MAJOR_LEAGUES: { [key: string]: number } = {
  premier: 39, // 프리미어리그
  laliga: 140, // 라리가
  bundesliga: 78, // 분데스리가
  serieA: 135, // 세리에 A
  ligue1: 61, // 리그앙
};

// 타입 정의
interface LeagueData {
  id: number;
  name: string;
  logo: string;
  country: string;
}

interface TeamData {
  id: number;
  name: string;
  logo: string;
}

interface StandingData {
  rank: number;
  team: TeamData;
  points: number;
  goalsDiff: number;
  form: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
  };
}

interface FormattedData {
  league: LeagueData;
  standings: StandingData[];
}

interface CacheItem {
  data: FormattedData;
  timestamp: number;
}

// API 응답 형식
interface ApiTeamStanding {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  form: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
  };
}

// 메모리 캐싱 강화
const CACHE: { [key: string]: CacheItem } = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간으로 증가 (하루에 한 번 정도 갱신)

// 디바운스 메커니즘 추가 (동일 요청 방지)
const REQUEST_THROTTLE: { [key: string]: number } = {};
const THROTTLE_WINDOW = 60 * 1000; // 1분으로 증가

// API 요청 제한 (개별 리그별)
const lastApiCallTimestamps: { [key: string]: number } = {};
const API_CALL_COOLDOWN = 6 * 60 * 60 * 1000; // 6시간 쿨다운

// 마지막 API 갱신 일자 관리
const lastApiUpdateDay: { [key: string]: number } = {};

export async function GET(request: Request) {
  try {
    // 현재 시즌 계산 (7월 기준)
    const currentDate = new Date();
    const season = currentDate.getMonth() < 6 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    
    // URL에서 리그 파라미터 추출
    const { searchParams } = new URL(request.url);
    const leagueParam = searchParams.get('league');
    
    // 요청한 리그 ID 결정 (기본값: 프리미어리그)
    let leagueId = MAJOR_LEAGUES.premier;
    if (leagueParam && MAJOR_LEAGUES[leagueParam]) {
      leagueId = MAJOR_LEAGUES[leagueParam];
    }
    
    // 캐시 키 생성
    const cacheKey = `standings_${leagueId}_${season}`;
    
    // 요청 헤더에서 서버 호출 여부 확인
    const headers = new Headers(request.headers);
    const isServerCall = headers.get('x-from-server') === '1';
    const forceRefresh = searchParams.get('refresh') === '1';
    const now = Date.now();
    const today = new Date().getDate();
    
    // 당일 이미 API를 호출했는지 확인
    const alreadyUpdatedToday = lastApiUpdateDay[cacheKey] === today;
    
    // 요청 쓰로틀링 (디바운싱)
    if (REQUEST_THROTTLE[cacheKey] && (now - REQUEST_THROTTLE[cacheKey]) < THROTTLE_WINDOW && !forceRefresh) {
      // 너무 빠른 중복 요청이면 캐시된 데이터 반환 (있는 경우)
      if (CACHE[cacheKey]) {
        return NextResponse.json({ 
          data: CACHE[cacheKey].data,
          cached: true,
          cachedAt: new Date(CACHE[cacheKey].timestamp).toISOString()
        });
      }
    }
    
    // 요청 시간 기록 (쓰로틀링용)
    REQUEST_THROTTLE[cacheKey] = now;
    
    // 캐시된 데이터가 있고 유효하다면 사용
    if (CACHE[cacheKey] && (now - CACHE[cacheKey].timestamp) < CACHE_TTL && !forceRefresh) {
      return NextResponse.json({ 
        data: CACHE[cacheKey].data,
        cached: true,
        cachedAt: new Date(CACHE[cacheKey].timestamp).toISOString()
      });
    }
    
    // 외부 API 요청 쿨다운 체크 (6시간 내에 동일 리그 요청 방지 및 당일 업데이트 여부 확인)
    const lastApiCall = lastApiCallTimestamps[cacheKey] || 0;
    if (!isServerCall && (now - lastApiCall) < API_CALL_COOLDOWN && alreadyUpdatedToday && !forceRefresh) {
      if (CACHE[cacheKey]) {
        return NextResponse.json({ 
          data: CACHE[cacheKey].data,
          cached: true,
          cachedAt: new Date(CACHE[cacheKey].timestamp).toISOString() 
        });
      }
    }
    
    // API 호출 시간 기록 및 당일 업데이트 기록
    lastApiCallTimestamps[cacheKey] = now;
    lastApiUpdateDay[cacheKey] = today;
    
    // 스탠딩 데이터 요청
    const standingsResponse = await fetch(
      `https://v3.football.api-sports.io/standings?league=${leagueId}&season=${season}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        next: { revalidate: 86400 } // 24시간 캐싱
      }
    );

    if (!standingsResponse.ok) {
      throw new Error(`API 응답 오류: ${standingsResponse.status}`);
    }

    const standingsData = await standingsResponse.json();
    
    // 리그 정보 및 스탠딩 데이터 추출
    const leagueInfo = standingsData.response?.[0]?.league || {};
    const standings = leagueInfo.standings?.[0] || [];
    
    // 필요한 데이터만 추출
    const formattedData: FormattedData = {
      league: {
        id: leagueInfo.id,
        name: leagueInfo.name,
        logo: leagueInfo.logo,
        country: leagueInfo.country
      },
      standings: standings.map((team: ApiTeamStanding) => ({
        rank: team.rank,
        team: {
          id: team.team.id,
          name: team.team.name,
          logo: team.team.logo
        },
        points: team.points,
        goalsDiff: team.goalsDiff,
        form: team.form,
        all: {
          played: team.all.played,
          win: team.all.win,
          draw: team.all.draw,
          lose: team.all.lose
        }
      }))
    };
    
    // 캐시에 저장
    CACHE[cacheKey] = {
      data: formattedData,
      timestamp: now
    };
    
    // 서버에서 호출된 경우 path 재검증 (필요 시)
    if (isServerCall) {
      revalidatePath(`/api/livescore/football/leagues/standings?league=${leagueParam || 'premier'}`);
    }
    
    return NextResponse.json({ 
      data: formattedData,
      cached: false,
      updatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching league standings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch standings data',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

