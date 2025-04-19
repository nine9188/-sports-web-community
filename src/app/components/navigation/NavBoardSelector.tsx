'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/app/lib/supabase-browser';
import Link from 'next/link';

// 리그 데이터 타입 정의
interface League {
  id: string;
  name: string;
  logo: string;
  url: string; // URL 정보 추가
}

// 네비게이션 바 props 타입 정의
interface NavBoardSelectorProps {
  backgroundImage?: string;
}

export default function NavBoardSelector({
  backgroundImage = '/213/20241124173016789001-removebg-preview.png', // 선수 이미지
}: NavBoardSelectorProps) {
  // 리그 데이터 상태
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredLeague, setHoveredLeague] = useState<string | null>(null);
  
  // 네비게이션 바 참조
  const navRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Supabase에서 리그 데이터 가져오기
  useEffect(() => {
    async function fetchLeagues() {
      try {
        setIsLoading(true);
        
        const supabase = createClient();
        
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
          const leaguesWithUrl = data.map(league => {
            let url = '';
            if (league.name === 'Premier League') url = '/boards/premier';
            else if (league.name === 'La Liga') url = '/boards/laliga';
            else if (league.name === 'Ligue 1') url = '/boards/LIGUE1';
            else if (league.name === 'Bundesliga') url = '/boards/bundesliga';
            else if (league.name === 'Serie A') url = '/boards/serie-a';
            else if (league.name === 'K League 1') url = '/boards/k-league-1';
            
            return { ...league, url };
          });
          
          setLeagues(leaguesWithUrl);
        } else {
          // 데이터가 없으면 더미 데이터 사용
          setLeagues([
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
          ]);
        }
      } catch (err) {
        console.error('리그 데이터를 가져오는 중 오류 발생:', err);
        setError('리그 데이터를 불러오는 데 실패했습니다.');
        
        // 오류 발생 시 더미 데이터 사용
        setLeagues([
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
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLeagues();
  }, []);

  return (
    <div 
      ref={navRef} 
      className="mb-4 bg-white rounded-lg border overflow-hidden relative mt-4 md:mt-0 hidden md:block"
      style={{ 
        background: `linear-gradient(90deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)`, // 연한 회색 그라데이션
        height: 'auto', // 높이를 자동으로 조정
      }}
    >
      {/* 메인 스크롤 컨테이너 */}
      <div 
        ref={scrollRef}
        className="flex flex-col md:flex-row items-center overflow-x-auto overflow-y-hidden w-full no-scrollbar px-4 h-full md:mb-0 mb-1"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {/* 로딩 상태 표시 */}
        {isLoading ? (
          <div className="flex-grow flex justify-center items-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-400"></div>
          </div>
        ) : error ? (
          <div className="flex-grow flex justify-center items-center text-gray-500">
            <p>{error}</p>
          </div>
        ) : (
          /* 리그 목록과 이미지를 하나의 스크롤 영역에 배치 */
          <>
            {/* 모바일 전용 - 게시판 바로가기 텍스트를 상단에 배치 */}
            <div className="w-full text-left md:hidden mb-2 text-sm font-medium text-gray-700">
              게시판 바로가기
            </div>
            
            <div className="flex items-center w-max relative">
              {/* 데스크탑 전용 - 게시판 바로가기 텍스트 */}
              <div className="hidden md:block mr-4 font-medium text-gray-700 whitespace-nowrap">
                게시판 바로가기
              </div>
              
              {/* 리그 목록 */}
              <div className="flex items-center pl-2 pr-2">
                {leagues.map((league) => (
                  <Link 
                    href={league.url} 
                    key={league.id}
                  >
                    <div 
                      className={`flex flex-col items-center cursor-pointer transition-all mx-3 sm:mx-3 md:mx-5 ${
                        hoveredLeague === league.id 
                          ? 'scale-110' 
                          : hoveredLeague && hoveredLeague !== league.id 
                            ? 'opacity-60' 
                            : ''
                      }`}
                      style={{ scrollSnapAlign: 'center' }}
                      onMouseEnter={() => setHoveredLeague(league.id)}
                      onMouseLeave={() => setHoveredLeague(null)}
                    >
                      <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 relative">
                        <Image
                          src={league.logo}
                          alt={league.name}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 40px, (max-width: 768px) 48px, 56px"
                          priority
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* 손흥민 이미지 - 데스크탑에서만 표시 */}
              <div className="hidden md:flex h-full items-center pl-0 pr-0 shrink-0" style={{ scrollSnapAlign: 'end' }}>
                <div className="ml-2 flex justify-end w-[220px]">
                  <Image
                    src={backgroundImage}
                    alt="손흥민 이미지"
                    width={220}
                    height={140}
                    style={{ 
                      objectFit: 'contain', 
                      objectPosition: 'right center',
                    }}
                    priority
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* 모바일을 위한 추가 스타일 */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        /* 스크롤바 숨기기 */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* 미디어 쿼리로 반응형 처리 */
        @media (min-width: 768px) {
          .responsive-container {
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
} 