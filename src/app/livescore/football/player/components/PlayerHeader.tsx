import Image from 'next/image';
import { PlayerData } from '../../types/player';

// 필요한 타입 정의
interface TeamData {
  id: number;
  name: string;
  logo: string;
}

interface LeagueData {
  id: number;
  name: string;
  country: string;
}

interface GamesData {
  position?: string;
}

interface StatisticsData {
  team: TeamData;
  league: LeagueData;
  games: GamesData;
}

interface PlayerHeaderProps {
  player: PlayerData;
}

export default function PlayerHeader({ player }: PlayerHeaderProps) {
  const { info, statistics } = player;
  
  // 생년월일 포맷팅
  const formatBirthDate = (dateString: string) => {
    if (!dateString) return '정보 없음';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // 통계 데이터를 적절한 타입으로 변환
  const playerStats = statistics as unknown as StatisticsData;
  
  // 포지션 정보 가져오기 (statistics에서)
  const position = playerStats?.games?.position || '';

  // 주팀 통계 가져오기
  const mainTeamStats = playerStats?.team ? { team: playerStats.team } : null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row items-stretch gap-6">
        {/* 선수 사진 및 기본 정보 */}
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:w-1/3">
          <div className="relative w-32 h-32 mx-auto md:mx-0">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 rounded-full border-4 border-white shadow-lg"></div>
              <Image
                src={info.photo}
                alt={info.name}
                width={128}
                height={128}
                className="rounded-full object-cover"
                unoptimized
              />
            </div>
            
            {mainTeamStats?.team && (
              <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center">
                <Image
                  src={mainTeamStats.team.logo}
                  alt={mainTeamStats.team.name || ''}
                  width={40}
                  height={40}
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
          </div>
          
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold">{info.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
              {mainTeamStats?.team && (
                <p className="text-gray-600">{mainTeamStats.team.name}</p>
              )}
            </div>
            {position && (
              <span className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {position}
              </span>
            )}
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="flex-1 mt-4 md:mt-0 md:ml-8 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-8 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">기본 정보</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
            <div className="overflow-hidden">
              <p className="text-sm text-gray-500">생년월일</p>
              <p className="font-medium text-sm whitespace-nowrap text-ellipsis overflow-hidden">
                {formatBirthDate(info.birth.date)}
              </p>
            </div>
            
            <div className="overflow-hidden">
              <p className="text-sm text-gray-500">나이</p>
              <p className="font-medium whitespace-nowrap text-ellipsis overflow-hidden">
                {info.age}세
              </p>
            </div>
            
            <div className="overflow-hidden">
              <p className="text-sm text-gray-500">출생지</p>
              <p className="font-medium text-sm whitespace-nowrap text-ellipsis overflow-hidden" title={`${info.birth.country || ''}${info.birth.place ? `, ${info.birth.place}` : ''}`}>
                {info.birth.country || ''}{info.birth.place ? `, ${info.birth.place}` : ''}
              </p>
            </div>
            
            <div className="overflow-hidden">
              <p className="text-sm text-gray-500">키</p>
              <p className="font-medium whitespace-nowrap text-ellipsis overflow-hidden">
                {info.height || '정보 없음'}
              </p>
            </div>
            
            <div className="overflow-hidden">
              <p className="text-sm text-gray-500">몸무게</p>
              <p className="font-medium whitespace-nowrap text-ellipsis overflow-hidden">
                {info.weight || '정보 없음'}
              </p>
            </div>
            
            <div className="overflow-hidden">
              <p className="text-sm text-gray-500">포지션</p>
              <p className="font-medium whitespace-nowrap text-ellipsis overflow-hidden">
                {position || '정보 없음'}
              </p>
            </div>
            
            {playerStats?.team && playerStats?.league && (
              <div className="md:col-span-2 lg:col-span-2 overflow-hidden">
                <p className="text-sm text-gray-500">소속팀</p>
                <div className="flex items-center gap-1 whitespace-nowrap text-ellipsis overflow-hidden">
                  <p className="font-medium text-sm">{playerStats.team.name}</p>
                  <span className="text-xs text-gray-500 truncate">({playerStats.league.name}, {playerStats.league.country})</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}