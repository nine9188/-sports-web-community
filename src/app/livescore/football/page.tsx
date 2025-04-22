import { format } from 'date-fns';
import FootballLiveScoreClient from './components/FootballLiveScoreClient';
import { fetchMatchesByDate } from '@/app/actions/footballApi';
import { Match } from './types';
import { getTeamById } from '@/app/constants/teams';
import { getLeagueMappingById } from '@/app/constants/league-mappings';

// 기본 이미지 URL - 로고가 없을 때 사용
const DEFAULT_TEAM_LOGO = 'https://cdn.sportmonks.com/images/soccer/team_placeholder.png';

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
  const currentDate = new Date();
  // 옵셔널 체이닝과 nullish coalescing으로 안전하게 dateParam 추출
  const dateParam = searchParams?.date ?? format(currentDate, 'yyyy-MM-dd');
  
  try {
    // Server Action을 직접 호출하여 데이터 가져오기
    const matchesData = await fetchMatchesByDate(dateParam);
    
    // MatchData 타입을 클라이언트 컴포넌트의 Match 타입으로 변환 (+ 팀/리그 정보 매핑)
    const processedMatches: Match[] = matchesData.map(match => {
      // 한국어 팀명과 리그명 매핑
      const leagueInfo = match.league?.id ? getLeagueMappingById(match.league.id) : null;
      const homeTeamInfo = match.teams?.home?.id ? getTeamById(match.teams.home.id) : null;
      const awayTeamInfo = match.teams?.away?.id ? getTeamById(match.teams.away.id) : null;
      
      // 매핑된 정보 사용 (있는 경우)
      const homeTeamName = homeTeamInfo?.name_ko || match.teams.home.name;
      const awayTeamName = awayTeamInfo?.name_ko || match.teams.away.name;
      const leagueName = leagueInfo?.name_ko || match.league.name;
      
      return {
        id: match.id,
        status: {
          code: match.status.code,
          name: match.status.name
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
      <FootballLiveScoreClient
        initialMatches={processedMatches}
        initialDate={dateParam}
      />
    );
  } catch (error) {
    // 오류 발생 시 빈 데이터로 렌더링
    console.error('축구 경기 데이터 가져오기 실패:', error);
    return (
      <FootballLiveScoreClient
        initialMatches={[]}
        initialDate={dateParam}
      />
    );
  }
}