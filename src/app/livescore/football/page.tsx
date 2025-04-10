import { format } from 'date-fns';
import FootballLiveScoreClient from './components/FootballLiveScoreClient';
import { getFootballScores } from '@/app/lib/footballApi';
import { Match } from './types';

// 기본 이미지 URL - 로고가 없을 때 사용
const DEFAULT_TEAM_LOGO = 'https://cdn.sportmonks.com/images/soccer/team_placeholder.png';

// 서버 컴포넌트로 변경 - 외부 API를 서버에서 직접 가져옴
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
        time: match.time.timestamp
      },
      league: {
        id: match.league.id,
        name: match.league.name,
        country: match.league.country,
        logo: match.league.logo || '',
        flag: match.league.flag || ''
      },
      teams: {
        home: {
          id: match.teams.home.id,
          name: match.teams.home.name,
          img: match.teams.home.logo || DEFAULT_TEAM_LOGO,
          score: match.goals.home,
          form: '',
          formation: undefined
        },
        away: {
          id: match.teams.away.id,
          name: match.teams.away.name,
          img: match.teams.away.logo || DEFAULT_TEAM_LOGO, 
          score: match.goals.away,
          form: '',
          formation: undefined
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