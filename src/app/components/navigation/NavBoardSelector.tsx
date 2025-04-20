// 서버 컴포넌트 작성
import { createClient } from '@/app/lib/supabase.server';
import NavBoardSelectorClient from './NavBoardSelectorClient';

// 리그 데이터 타입 정의
interface League {
  id: string;
  name: string;
  logo: string;
  url: string;
}

// 네비게이션 바 props 타입 정의
interface NavBoardSelectorProps {
  backgroundImage?: string;
}

// 서버에서 리그 데이터를 가져오는 함수
async function getLeagues(): Promise<League[]> {
  try {
    const supabase = await createClient();
    
    // 프리미어리그, 라리가, 리그앙, 분데스리가, 세리에A, K리그1 가져오기
    const { data, error } = await supabase
      .from('leagues')
      .select('id, name, logo')
      .in('name', ['Premier League', 'La Liga', 'Ligue 1', 'Bundesliga', 'Serie A', 'K League 1']);
    
    if (error) {
      throw error;
    }
    
    if (data) {
      // URL 정보 추가
      return data.map(league => {
        let url = '';
        if (league.name === 'Premier League') url = '/boards/premier';
        else if (league.name === 'La Liga') url = '/boards/laliga';
        else if (league.name === 'Ligue 1') url = '/boards/LIGUE1';
        else if (league.name === 'Bundesliga') url = '/boards/bundesliga';
        else if (league.name === 'Serie A') url = '/boards/serie-a';
        else if (league.name === 'K League 1') url = '/boards/k-league-1';
        
        return { ...league, url };
      });
    }
  } catch (err) {
    console.error('리그 데이터를 가져오는 중 오류 발생:', err);
  }
  
  // 오류 발생 시 또는 데이터가 없을 경우 더미 데이터 반환
  return [
    {
      id: '39',
      name: 'Premier League',
      logo: 'https://media.api-sports.io/football/leagues/39.png',
      url: '/boards/premier'
    },
    {
      id: '140',
      name: 'La Liga',
      logo: 'https://media.api-sports.io/football/leagues/140.png',
      url: '/boards/laliga'
    },
    {
      id: '61',
      name: 'Ligue 1',
      logo: 'https://media.api-sports.io/football/leagues/61.png',
      url: '/boards/LIGUE1'
    },
    {
      id: '78',
      name: 'Bundesliga',
      logo: 'https://media.api-sports.io/football/leagues/78.png',
      url: '/boards/bundesliga'
    },
    {
      id: '135',
      name: 'Serie A',
      logo: 'https://media.api-sports.io/football/leagues/135.png',
      url: '/boards/serie-a'
    },
    {
      id: '292',
      name: 'K League 1',
      logo: 'https://media.api-sports.io/football/leagues/292.png',
      url: '/boards/k-league-1'
    }
  ];
}

export default async function NavBoardSelector({
  backgroundImage = '/213/20241124173016789001-removebg-preview.png', // 선수 이미지
}: NavBoardSelectorProps) {
  // 서버에서 리그 데이터 가져오기
  const leagues = await getLeagues();
  
  return (
    <NavBoardSelectorClient 
      leagues={leagues} 
      backgroundImage={backgroundImage} 
    />
  );
} 