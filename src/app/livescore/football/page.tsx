import { format } from 'date-fns';
import FootballLiveScoreClient from './components/FootballLiveScoreClient';
import { getFootballScores } from '@/app/lib/footballApi';
import { Match } from './types';

// 기본 이미지 URL - 로고가 없을 때 사용
const DEFAULT_TEAM_LOGO = 'https://cdn.sportmonks.com/images/soccer/team_placeholder.png';

// 서버 컴포넌트로 변경 - 외부 API를 서버에서 직접 가져옴
export default async function FootballLiveScorePage({
  searchParams
}: {
  searchParams?: { date?: string }
}) {
  // 요청된 날짜 파라미터를 사용하거나 현재 날짜를 기본값으로 사용
  const currentDate = new Date();
  const dateParam = searchParams?.date || format(currentDate, 'yyyy-MM-dd');
  
  try {
    // 서버에서 직접 데이터 가져오기
    const scores = await getFootballScores(dateParam);
    
    // API 데이터를 클라이언트 컴포넌트가 사용하는 Match 타입으로 변환
    const processedScores: Match[] = scores.map(match => ({
      id: match.id,
      status: {
        code: match.status.code,
        name: match.status.name
      },
      time: {
        date: match.time.date,
        time: match.time.timestamp // number | null로 타입 정의되어 있음
      },
      league: {
        id: match.league.id,
        name: match.league.name,
        country: match.league.country,
        logo: match.league.logo || '', // string | undefined로 타입 정의되어 있음
        flag: match.league.flag || '' // string | undefined로 타입 정의되어 있음
      },
      teams: {
        home: {
          id: match.teams.home.id,
          name: match.teams.home.name,
          // 여기서 logo를 img로 변환 (비어있는 경우 기본 이미지 사용)
          img: match.teams.home.logo || DEFAULT_TEAM_LOGO,
          score: match.goals.home,
          form: '', // 필수 필드이므로 빈 문자열로 설정
          formation: undefined // 옵셔널 필드
        },
        away: {
          id: match.teams.away.id,
          name: match.teams.away.name,
          // 여기서 logo를 img로 변환 (비어있는 경우 기본 이미지 사용)
          img: match.teams.away.logo || DEFAULT_TEAM_LOGO, 
          score: match.goals.away,
          form: '', // 필수 필드이므로 빈 문자열로 설정
          formation: undefined // 옵셔널 필드
        }
      }
    }));

    // 클라이언트 컴포넌트에 초기 데이터 전달
    return (
      <FootballLiveScoreClient
        initialMatches={processedScores}
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