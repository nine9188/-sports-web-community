'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LeagueLogo from './LeagueLogo';

// 리그 데이터 타입 정의
interface League {
  id: string;
  name: string;
  logo: string;
  url: string;
}

// NavBoardSelectorClient props 타입 정의
interface NavBoardSelectorClientProps {
  leagues: League[];
  backgroundImage: string;
}

export default function NavBoardSelectorClient({
  leagues,
  backgroundImage
}: NavBoardSelectorClientProps) {
  const [hoveredLeague, setHoveredLeague] = useState<string | null>(null);
  
  // 네비게이션 바 참조
  const navRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
        {/* 리그 목록과 이미지를 하나의 스크롤 영역에 배치 */}
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
              {leagues.map((league, index) => (
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
                    <LeagueLogo
                      src={league.logo}
                      alt={league.name}
                      size={56}
                      priority={index === 0}
                      className={hoveredLeague === league.id ? 'scale-110' : ''}
                    />
                  </div>
                </Link>
              ))}
            </div>
            
            {/* 손흥민 이미지 - 데스크탑에서만 표시 */}
            <div className="hidden md:flex h-full items-center pl-0 pr-0 shrink-0" style={{ scrollSnapAlign: 'end' }}>
              <div className="relative ml-2 flex justify-end w-[220px] h-[140px]">
                <Image
                  src={backgroundImage}
                  alt="손흥민 이미지"
                  fill
                  sizes="220px"
                  className="object-contain object-right-center"
                />
              </div>
            </div>
          </div>
        </>
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