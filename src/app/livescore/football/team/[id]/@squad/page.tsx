import { fetchCachedTeamSquad, type Player as ApiPlayer, type Coach as ApiCoach } from '@/app/actions/livescore/teams/squad';
import Squad from '../../components/tabs/Squad';

// Squad 컴포넌트에서 사용하는 타입 정의
interface Coach {
  id: number;
  name: string;
  age: number;
  photo: string;
  position: 'Coach';
}

interface Player {
  id: number;
  name: string;
  age: number;
  number: number;
  position: string;
  photo: string;
  stats: {
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
}

// Type guard 함수들
function isApiCoach(member: ApiPlayer | ApiCoach): member is ApiCoach {
  return member.position === 'Coach';
}

export default async function SquadPage({ params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    
    // 선수단 정보 가져오기
    const squadResponse = await fetchCachedTeamSquad(id);
    
    // 데이터 변환
    const squad: (Player | Coach)[] = squadResponse.success && squadResponse.data 
      ? squadResponse.data.map(member => {
          if (isApiCoach(member)) {
            // 코치 타입 변환
            const coach: Coach = {
              id: member.id,
              name: member.name,
              age: member.age,
              photo: member.photo,
              position: 'Coach'
            };
            return coach;
          } else {
            // 선수 타입 변환
            const player: Player = {
              id: member.id,
              name: member.name,
              age: member.age,
              number: member.number || 0, // undefined일 경우 0으로 설정
              position: member.position,
              photo: member.photo,
              stats: {
                appearances: 0,
                goals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0
              }
            };
            return player;
          }
        })
      : [];
    
    return <Squad squad={squad} />;
    
  } catch (error) {
    console.error('Squad 탭 오류:', error);
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        선수단 정보를 불러오는데 실패했습니다.
      </div>
    );
  }
} 