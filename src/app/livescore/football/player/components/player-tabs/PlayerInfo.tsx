import Image from 'next/image';
import { PlayerData } from '../../../types/player';

interface PlayerInfoProps {
  player: PlayerData;
}

export default function PlayerInfo({ player }: PlayerInfoProps) {
  const { info } = player;
  
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

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:w-1/3">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="relative w-full h-64 mx-auto">
            <Image
              src={info.photo || '/images/player-placeholder.png'}
              alt={info.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
          
          {info.injured && (
            <div className="mt-4 bg-red-100 text-red-800 p-2 rounded-md text-center">
              부상 중
            </div>
          )}
        </div>
      </div>
      
      <div className="md:w-2/3">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold mb-4">기본 정보</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">이름</p>
              <p className="font-medium">{info.firstname} {info.lastname}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">나이</p>
              <p className="font-medium">{info.age}세</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">국적</p>
              <p className="font-medium">{info.nationality}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">생년월일</p>
              <p className="font-medium">{formatBirthDate(info.birth.date)}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">출생지</p>
              <p className="font-medium">{info.birth.place || '정보 없음'}, {info.birth.country || ''}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">키</p>
              <p className="font-medium">{info.height || '정보 없음'}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">몸무게</p>
              <p className="font-medium">{info.weight || '정보 없음'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 