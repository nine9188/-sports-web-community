'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Image from 'next/image';
import { X, Clock, Trophy, Shield, Users } from 'lucide-react';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol } from '@fortawesome/free-solid-svg-icons';
import { fetchMultiDayMatches, MatchData } from '@/domains/livescore/actions/footballApi';
import Link from 'next/link';

interface LiveScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// API 응답 타입
interface MultiDayMatchesResponse {
  success: boolean;
  dates?: {
    yesterday: string;
    today: string;
    tomorrow: string;
  };
  meta?: {
    totalMatches: number;
  };
  data?: {
    yesterday: { matches: MatchData[] };
    today: { matches: MatchData[] };
    tomorrow: { matches: MatchData[] };
  };
  error?: string;
}

// 간단한 이미지 컴포넌트 - Next.js Image 사용
const SafeImage = React.memo(function SafeImage({ 
  src, 
  alt, 
  className, 
  fallbackIcon: FallbackIcon = Shield,
  size = 24 
}: { 
  src?: string; 
  alt: string; 
  className?: string; 
  fallbackIcon?: React.ComponentType<{ className?: string }>;
  size?: number;
}) {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // src가 변경될 때마다 상태 초기화
  useEffect(() => {
    setHasError(false);
    setLoaded(false);
  }, [src]);

  const handleImageError = () => {
    setHasError(true);
  };

  // 이미지가 없거나 에러가 발생한 경우 아이콘 표시
  if (!src || hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded ${className}`} 
        style={{ width: size, height: size }}
      >
        <FallbackIcon className="w-3 h-3 text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        className={`object-contain rounded transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onError={handleImageError}
        onLoad={() => setLoaded(true)}
        priority={false}
        unoptimized={true} // 외부 이미지이므로 최적화 비활성화
      />
    </div>
  );
});

// 경기 상태에 따른 스타일 반환
const getMatchStatusStyle = (statusCode: string) => {
  switch (statusCode) {
    case 'LIVE':
    case '1H':
    case '2H':
    case 'HT':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'FT':
    case 'AET':
    case 'PEN':
      return 'bg-gray-100 text-gray-800 border border-gray-200';
    case 'NS':
    case 'TBD':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200';
  }
};

// 경기 상태에 따른 텍스트 반환 - elapsed 시간 포함
const getStatusText = (statusCode: string, statusDescription: string, elapsed?: number | null) => {
  switch (statusCode) {
    case 'LIVE':
    case '1H':
    case '2H':
      // 진행중인 경기는 elapsed 시간 표시
      if (elapsed && elapsed > 0) {
        return `${elapsed}'`;
      }
      // elapsed가 없거나 0인 경우 기본 텍스트
      if (statusCode === '1H') return '전반전';
      if (statusCode === '2H') return '후반전';
      return '진행중';
    case 'HT':
      return '하프타임';
    case 'FT':
      return '종료';
    case 'AET':
      return '연장 종료';
    case 'PEN':
      return '승부차기 종료';
    case 'NS':
      return '예정';
    case 'TBD':
      return '미정';
    case 'CANC':
      return '취소됨';
    case 'PST':
      return '연기됨';
    case 'SUSP':
      return '중단됨';
    default:
      return statusDescription || statusCode;
  }
};

// 개별 경기 컴포넌트
const MatchItem = React.memo(function MatchItem({ 
  match, 
  onClose 
}: { 
  match: MatchData; 
  onClose: () => void;
}) {
  const isLive = ['LIVE', '1H', '2H', 'HT'].includes(match.status?.code || '');
  const isFinished = ['FT', 'AET', 'PEN'].includes(match.status?.code || '');
  
  // 경기 클릭 핸들러
  const handleMatchClick = () => {
    onClose(); // 모달 닫기
    window.location.href = `/livescore/football/match/${match.id}`;
  };
  
  return (
    <div 
      className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
      onClick={handleMatchClick}
    >
      {/* 리그 정보 */}
      {match.league && (
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-600">
          {match.league.id ? (
            <ApiSportsImage 
              imageId={match.league.id}
              imageType={ImageType.Leagues}
              alt={match.league.name || '리그'}
              width={16}
              height={16}
              className="object-contain rounded"
              loading="eager"
              priority
              fetchPriority="high"
            />
          ) : (
            <Trophy className="w-4 h-4 text-gray-400" />
          )}
          <span className="truncate">{match.league.name || '알 수 없는 리그'}</span>
          {match.displayDate && (
            <span className="ml-auto text-gray-500">{match.displayDate}</span>
          )}
        </div>
      )}
      
      {/* 경기 정보 */}
      <div className="flex items-center justify-between">
        {/* 홈팀 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {match.teams?.home?.logo ? (
            <ApiSportsImage 
              src={match.teams.home.logo} 
              imageId={match.teams.home.id}
              imageType={ImageType.Teams}
              alt={match.teams?.home?.name || '홈팀'}
              width={24}
              height={24}
              className="object-contain rounded"
            />
          ) : (
            <div className="flex items-center justify-center bg-gray-100 rounded w-6 h-6">
              <Users className="w-3 h-3 text-gray-400" />
            </div>
          )}
          <span className="text-sm font-medium truncate">
            {match.teams?.home?.name || '홈팀'}
          </span>
        </div>
        
        {/* 스코어 또는 시간 */}
        <div className="flex items-center gap-2 mx-4 flex-shrink-0">
          {match.goals && (isLive || isFinished) ? (
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800 mb-1">
                {match.goals.home || 0} - {match.goals.away || 0}
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${getMatchStatusStyle(match.status?.code || '')}`}>
                {getStatusText(match.status?.code || '', match.status?.name || '', match.status?.elapsed)}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">
                {match.time?.date ? new Date(match.time.date).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Seoul'
                }) : '--:--'}
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${getMatchStatusStyle(match.status?.code || '')}`}>
                {getStatusText(match.status?.code || '', match.status?.name || '', match.status?.elapsed)}
              </div>
            </div>
          )}
        </div>
        
        {/* 원정팀 */}
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <span className="text-sm font-medium truncate">
            {match.teams?.away?.name || '원정팀'}
          </span>
          {match.teams?.away?.logo ? (
            <ApiSportsImage 
              src={match.teams.away.logo} 
              imageId={match.teams.away.id}
              imageType={ImageType.Teams}
              alt={match.teams?.away?.name || '원정팀'}
              width={24}
              height={24}
              className="object-contain rounded"
            />
          ) : (
            <div className="flex items-center justify-center bg-gray-100 rounded w-6 h-6">
              <Users className="w-3 h-3 text-gray-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default function LiveScoreModal({ isOpen, onClose }: LiveScoreModalProps) {
  const [allMatches, setAllMatches] = useState<{
    yesterday: MatchData[];
    today: MatchData[];
    tomorrow: MatchData[];
  }>({
    yesterday: [],
    today: [],
    tomorrow: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<'yesterday' | 'today' | 'tomorrow'>('today');
  // 강제 리로드 제거로 재마운트 유발을 방지

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen) {
      loadMatches();
    }
  }, [isOpen]);

  // 탭 변경 시 이미지 강제 리로드
  const handleTabChange = (newDate: 'yesterday' | 'today' | 'tomorrow') => {
    setSelectedDate(newDate);
  };

  const loadMatches = async () => {
    setLoading(true);
    try {
      const result = await fetchMultiDayMatches() as MultiDayMatchesResponse;
      
      if (result.success && result.data) {
        // 정렬 함수: 예정(NS/TBD) ↑, 진행중(LIVE/1H/2H/HT) →, 종료/연기/취소 ↓
        const sortByStatus = (a: MatchData, b: MatchData) => {
          const codeOf = (m?: MatchData) => (m?.status?.code || '').toUpperCase();
          const rankOf = (code: string) => {
            if (code === 'NS' || code === 'TBD') return 0; // 예정 최상단
            if (code === 'LIVE' || code === '1H' || code === '2H' || code === 'HT') return 1; // 진행중 중간
            if (code === 'FT' || code === 'AET' || code === 'PEN') return 3; // 종료 하단
            if (code === 'PST' || code === 'CANC' || code === 'SUSP') return 4; // 연기/취소 더 하단
            return 2; // 기타 상태는 중간 그룹
          };
          const ra = rankOf(codeOf(a));
          const rb = rankOf(codeOf(b));
          if (ra !== rb) return ra - rb;
          return 0;
        };
        
        // 어제 경기
        const yesterdayMatches = Array.isArray(result.data.yesterday?.matches) 
          ? result.data.yesterday.matches.map((match: MatchData) => ({
              ...match,
              displayDate: '어제'
            })).sort(sortByStatus)
          : [];
        
        // 오늘 경기
        const todayMatches = Array.isArray(result.data.today?.matches)
          ? result.data.today.matches.map((match: MatchData) => ({
              ...match,
              displayDate: '오늘'
            })).sort(sortByStatus)
          : [];
          
        // 내일 경기
        const tomorrowMatches = Array.isArray(result.data.tomorrow?.matches)
          ? result.data.tomorrow.matches.map((match: MatchData) => ({
              ...match,
              displayDate: '내일'
            })).sort(sortByStatus)
          : [];
        
        setAllMatches({
          yesterday: yesterdayMatches,
          today: todayMatches,
          tomorrow: tomorrowMatches
        });
        
        // 강제 리로드 제거 (이미지 페이드인으로 전환)
        
      } else {
        console.error('라이브스코어 데이터 로드 실패:', result.error);
        setAllMatches({
          yesterday: [],
          today: [],
          tomorrow: []
        });
      }
    } catch (error) {
      console.error('라이브스코어 데이터 로드 실패:', error);
      setAllMatches({
        yesterday: [],
        today: [],
        tomorrow: []
      });
    } finally {
      setLoading(false);
    }
  };

  // 선택된 날짜의 경기 목록
  const currentMatches = allMatches[selectedDate] || [];

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } flex flex-col`}>
        
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faFutbol} className="h-4 w-4 text-green-600" />
            <div>
              <h2 className="text-sm font-semibold">라이브스코어</h2>
              <p className="text-xs text-gray-500">최근 3일간 주요 경기</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 날짜 선택 탭 */}
        <div className="flex border-b bg-gray-50">
          {[
            { key: 'yesterday', label: '어제' },
            { key: 'today', label: '오늘' },
            { key: 'tomorrow', label: '내일' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key as 'yesterday' | 'today' | 'tomorrow')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                selectedDate === key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 경기 목록 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm">경기 정보 로딩중...</span>
              </div>
            </div>
          ) : currentMatches.length > 0 ? (
            <div className="p-4 space-y-3">
              {currentMatches.map(match => (
                <MatchItem key={`match-${match.id}`} match={match} onClose={onClose} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Trophy className="h-8 w-8 mb-2" />
              <p className="text-sm">예정된 경기가 없습니다</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t bg-gray-50 space-y-3">
          <Link 
            href="/livescore/football"
            onClick={onClose}
            className="block w-full text-center py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            전체 라이브스코어 보기
          </Link>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>실시간 업데이트</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
} 