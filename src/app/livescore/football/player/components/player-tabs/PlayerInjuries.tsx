'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Injury {
  fixture: {
    date: string;
  };
  league: {
    name: string;
    season: string;
  };
  team: {
    name: string;
    logo: string;
  };
  type: string;
  reason: string;
}

interface PlayerInjuriesProps {
  playerId: number;
  baseUrl?: string;
  injuriesData?: Injury[];
}

// 부상 유형 한글 매핑
const injuryTypeMap: { [key: string]: string } = {
  'Hamstring Injury': '허벅지 부상',
  'Knee Injury': '무릎 부상',
  'Ankle Injury': '발목 부상',
  'Muscle Injury': '근육 부상',
  'Thigh Injury': '허벅지 부상',
  'Calf Injury': '종아리 부상',
  'Foot Injury': '발 부상',
  'Back Injury': '등 부상',
  'Shoulder Injury': '어깨 부상',
  'Torn Muscle': '근육 파열',
  'Groin Injury': '사타구니 부상',
  'ACL Injury': '전방십자인대 부상',
  'MCL Injury': '내측부인대 부상',
  'Concussion': '뇌진탕',
  'Fracture': '골절',
  'Illness': '질병',
  'Sprain': '염좌',
  'Strain': '긴장',
  'Fever': '발열',
  'Bruise': '타박상',
  'COVID-19': '코로나19',
  'Injury': '부상',
  'Lacking Match Fitness': '경기 체력 부족',
  'Knock': '타박상',
  'Suspended': '출전 정지',
  'Broken Nose': '코 골절',
  'Head Injury': '머리 부상',
  'Facial Injury': '얼굴 부상',
  'Rib Injury': '갈비뼈 부상',
  'Hip Injury': '고관절 부상',
  'Arm Injury': '팔 부상',
  'Wrist Injury': '손목 부상',
  'Unknown': '알 수 없음',
  'Ligament Injury': '인대 부상',
  'Metatarsal Fracture': '중족골 골절',
  'Meniscus Injury': '반월상 연골 부상',
  'Tibia Fracture': '경골 골절',
  'Adductor Problems': '내전근 문제',
  'Personal Reasons': '개인 사정',
  'Coronavirus': '코로나바이러스',
  'Discomfort': '불편함',
  'Fatigue': '피로',
  'Rest': '휴식',
  'Heart Problems': '심장 문제',
  'Ankle Sprain': '발목 염좌',
  'Knee Sprain': '무릎 염좌',
  'Leg Injury': '다리 부상',
  'Abdominal Injury': '복부 부상',
  'Eye Injury': '눈 부상',
  'Finger Injury': '손가락 부상',
  'Toe Injury': '발가락 부상',
};

// 부상 사유 한글 매핑
const reasonMap: { [key: string]: string } = {
  'Muscle injury': '근육 부상',
  'Physical discomfort': '신체적 불편함',
  'Fitness issue': '체력 문제',
  'Tear in the abductor': '내전근 파열',
  'Recovery': '회복 중',
  'Not match fit': '경기력 회복 중',
  'Not fully fit': '완전히 회복되지 않음',
  'Knock': '타박상',
  'Slight knock': '경미한 타박상',
  'Missing due to illness': '질병으로 결장',
  'Missing the game due to injury': '부상으로 결장',
  'Injured in training': '훈련 중 부상',
  'Injured during the match': '경기 중 부상',
  'Injured during international duty': '국가대표 소집 중 부상',
  'Medical check': '의료 검사',
  'Medical leave': '의료 휴가',
  'Picked up a knock': '타박상 입음',
  'Rehabilitation': '재활 중',
  'Returning from injury': '부상에서 복귀 중',
  'Under observation': '관찰 중',
  'Undergoing treatment': '치료 중',
  'Under medical supervision': '의료진 관찰 중',
  'Unavailable': '출전 불가',
  'Coach Decision': '감독 결정',
  'Tactical decision': '전술적 결정',
  'Personal reasons': '개인 사정',
  'Family reasons': '가족 사정',
  'Rest': '휴식',
  'COVID-19 Protocol': '코로나19 수칙',
  'In self-isolation': '자가격리 중',
  'Tested positive for COVID-19': '코로나19 양성 판정',
  'Playing for national team': '국가대표팀 참가',
  'Loaned out': '임대 이적',
  'Not registered': '등록되지 않음',
  'Not in squad': '대표팀 미선발',
  'Suspension': '출전 정지',
  'Accumulation of yellow cards': '경고 누적',
  'Yellow card accumulation': '경고 누적',
  'Red card suspension': '퇴장으로 인한 출전 정지',
  'International duty': '국가대표 소집',
  'No reason given': '이유 없음',
};

export default function PlayerInjuries({
  playerId,
  baseUrl = '',
  injuriesData: initialInjuriesData = [] 
}: PlayerInjuriesProps) {
  const [injuriesData, setInjuriesData] = useState<Injury[]>(initialInjuriesData);
  const [loading, setLoading] = useState<boolean>(initialInjuriesData.length === 0);
  const [error, setError] = useState<string | null>(null);

  // 컴포넌트 마운트 시 부상 데이터 가져오기
  useEffect(() => {
    // 이미 데이터가 있으면 가져오지 않음
    if (initialInjuriesData.length > 0) return;
    
    const fetchInjuriesData = async () => {
      try {
        setLoading(true);
        
        // API 요청 URL 설정
        const apiUrl = baseUrl 
          ? `${baseUrl}/api/livescore/football/players/${playerId}/injuries` 
          : `/api/livescore/football/players/${playerId}/injuries`;
        
        const response = await fetch(apiUrl, { cache: 'no-store' });
        
        if (!response.ok) {
          throw new Error('부상 정보를 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setInjuriesData(data || []);
      } catch (error) {
        console.error('부상 데이터 로딩 오류:', error);
        setError('부상 정보를 불러오는데 실패했습니다.');
        setInjuriesData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInjuriesData();
  }, [playerId, baseUrl, initialInjuriesData.length]);

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    if (!dateString) return '날짜 정보 없음';
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

  // 부상 유형 한글 변환 함수
  const translateInjuryType = (type: string) => {
    return injuryTypeMap[type] || type;
  };

  // 부상 사유 한글 변환 함수
  const translateReason = (reason: string) => {
    // 정확히 일치하는 사유가 있으면 바로 반환
    if (reasonMap[reason]) return reasonMap[reason];
    
    // 일치하는 사유가 없으면 유사한 키워드를 찾아 변환
    const lowerReason = reason.toLowerCase();
    
    if (lowerReason.includes('hamstring')) return '햄스트링 부상';
    if (lowerReason.includes('knee')) return '무릎 부상';
    if (lowerReason.includes('ankle')) return '발목 부상';
    if (lowerReason.includes('calf')) return '종아리 부상';
    if (lowerReason.includes('thigh')) return '허벅지 부상';
    if (lowerReason.includes('muscle')) return '근육 부상';
    if (lowerReason.includes('back')) return '등 부상';
    if (lowerReason.includes('shoulder')) return '어깨 부상';
    if (lowerReason.includes('foot')) return '발 부상';
    if (lowerReason.includes('groin')) return '사타구니 부상';
    if (lowerReason.includes('fracture')) return '골절';
    if (lowerReason.includes('broken')) return '골절';
    if (lowerReason.includes('acl')) return '전방십자인대 부상';
    if (lowerReason.includes('mcl')) return '내측부인대 부상';
    if (lowerReason.includes('concussion')) return '뇌진탕';
    if (lowerReason.includes('illness') || lowerReason.includes('sick')) return '질병';
    if (lowerReason.includes('covid')) return '코로나19';
    if (lowerReason.includes('virus')) return '바이러스 감염';
    if (lowerReason.includes('sprain')) return '염좌';
    if (lowerReason.includes('strain')) return '긴장';
    if (lowerReason.includes('fever')) return '발열';
    if (lowerReason.includes('bruise')) return '타박상';
    if (lowerReason.includes('knock')) return '타박상';
    if (lowerReason.includes('fitness')) return '체력 문제';
    if (lowerReason.includes('recovery')) return '회복 중';
    if (lowerReason.includes('rehab')) return '재활 중';
    if (lowerReason.includes('rest')) return '휴식';
    if (lowerReason.includes('suspended')) return '출장 정지';
    if (lowerReason.includes('personal')) return '개인 사정';
    
    // 매칭되는 것이 없을 경우 원본 반환
    return reason;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg">
        <div className="flex flex-col justify-center items-center py-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-1"></div>
          <p className="text-gray-600 text-sm">부상 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg">
        <div className="flex flex-col justify-center items-center py-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!injuriesData || injuriesData.length === 0) {
    return (
      <div className="bg-white rounded-lg">
        <div className="text-center py-3 text-gray-500">부상 기록이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg">
      <div>
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          {injuriesData.map((injury, index) => (
            <div key={index} className="relative pl-6 pb-3">
              <div className="absolute left-2 top-2 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"></div>
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <div className="mr-1">{formatDate(injury.fixture.date)}</div>
                  <div>•</div>
                  <div className="ml-1">{injury.league.name}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 flex-shrink-0 bg-white rounded-full border border-gray-200 flex items-center justify-center overflow-hidden p-0">
                    <Image
                      src={injury.team.logo || '/placeholder-team.png'}
                      alt={injury.team.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-team.png';
                      }}
                    />
                  </div>
                  <div className="text-sm font-medium truncate">{injury.team.name}</div>
                </div>
                
                <div className="mt-1.5 p-1.5 bg-red-50 rounded-md text-xs">
                  <div className="font-medium text-red-800">부상 유형: {translateInjuryType(injury.type)}</div>
                  <div className="text-red-700 mt-0.5">사유: {translateReason(injury.reason)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 