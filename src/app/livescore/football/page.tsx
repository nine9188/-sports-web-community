import { fetchMatchesByDate, MatchData } from '@/domains/livescore/actions/footballApi';
import LiveScoreView from '@/domains/livescore/components/football/MainView/LiveScoreView';
import TrackPageVisit from '@/domains/layout/components/TrackPageVisit';
import { getTeamById } from '@/domains/livescore/constants/teams/index';
import { getLeagueById } from '@/domains/livescore/constants/league-mappings';
import { Match } from '@/domains/livescore/types/match';
import { generatePageMetadataWithDefaults } from '@/shared/utils/metadataNew';

export async function generateMetadata() {
  return generatePageMetadataWithDefaults('/livescore/football', {
    title: '라이브스코어 - 4590 Football',
    description: '실시간 축구 경기 결과와 일정을 확인하세요. 전 세계 주요 리그 경기를 한눈에.',
  });
}

// 기본 이미지 URL - 로고가 없을 때 사용
const DEFAULT_TEAM_LOGO = 'https://cdn.sportmonks.com/images/soccer/team_placeholder.png';

// KST 기준의 현재 날짜(yyyy-MM-dd) 문자열 생성
const getKstDateString = (): string => {
  const nowUtc = new Date();
  const kstNow = new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);
  return kstNow.toISOString().split('T')[0];
};

// 서버 컴포넌트로 변경 - Server Action을 직접 호출
// searchParams 타입을 Promise로 감싸도록 수정
export default async function FootballLiveScorePage({ 
  searchParams: searchParamsPromise // Promise를 명시적으로 받음
}: { 
  searchParams?: Promise<{ date?: string }> // 타입 정의 수정
}) {
  // Promise를 await으로 해소
  const searchParams = await searchParamsPromise;

  // 요청된 날짜 파라미터를 사용하거나 현재 날짜를 기본값으로 사용
  // KST 기준으로 기본 날짜를 생성
  const dateParam = searchParams?.date ?? getKstDateString();
  
  try {
    // Server Action을 직접 호출하여 데이터 가져오기
    const matchesData = await fetchMatchesByDate(dateParam);
    
    // MatchData 타입을 클라이언트 컴포넌트의 Match 타입으로 변환 (+ 팀/리그 정보 매핑)
    const processedMatches: Match[] = matchesData.map((match: MatchData) => {
      // 한국어 팀명과 리그명 매핑
      const leagueInfo = match.league?.id ? getLeagueById(match.league.id) : null;
      const homeTeamInfo = match.teams?.home?.id ? getTeamById(match.teams.home.id) : null;
      const awayTeamInfo = match.teams?.away?.id ? getTeamById(match.teams.away.id) : null;
      
      // 매핑된 정보 사용 (있는 경우)
      const homeTeamName = homeTeamInfo?.name_ko || match.teams.home.name;
      const awayTeamName = awayTeamInfo?.name_ko || match.teams.away.name;
      const leagueName = leagueInfo?.nameKo || match.league.name;
      
      return {
        id: match.id,
        status: {
          code: match.status.code,
          name: match.status.name,
          elapsed: match.status.elapsed
        },
        time: {
          date: match.time.date,
          time: match.time.timestamp
        },
        league: {
          id: match.league.id,
          name: leagueName, // 매핑된 리그 이름 사용
          country: match.league.country,
          logo: match.league.logo || '',
          flag: match.league.flag || ''
        },
        teams: {
          home: {
            id: match.teams.home.id,
            name: homeTeamName, // 매핑된 팀 이름 사용
            img: match.teams.home.logo || DEFAULT_TEAM_LOGO,
            score: match.goals.home,
            form: '',
            formation: undefined
          },
          away: {
            id: match.teams.away.id,
            name: awayTeamName, // 매핑된 팀 이름 사용
            img: match.teams.away.logo || DEFAULT_TEAM_LOGO, 
            score: match.goals.away,
            form: '',
            formation: undefined
          }
        }
      };
    });
    
    // 클라이언트 컴포넌트에 초기 데이터 전달
    return (
      <>
        <TrackPageVisit id="livescore" slug="livescore/football" name="라이브스코어" />
        <LiveScoreView
          initialMatches={processedMatches}
          initialDate={dateParam}
        />
      </>
    );
  } catch (error) {
    // 오류 발생 시 빈 데이터로 렌더링
    console.error('축구 경기 데이터 가져오기 실패:', error);
    return (
      <>
        <TrackPageVisit id="livescore" slug="livescore/football" name="라이브스코어" />
        <LiveScoreView
          initialMatches={[]}
          initialDate={dateParam}
        />
      </>
    );
  }
}