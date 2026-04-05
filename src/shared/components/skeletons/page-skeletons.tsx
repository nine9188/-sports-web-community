/**
 * 페이지별 Suspense fallback 스켈레톤
 * 각 페이지의 실제 레이아웃과 반응형 클래스를 정확히 매칭합니다.
 */

import React from 'react';

const sk = 'bg-gray-200 dark:bg-[#3A3A3A] rounded animate-pulse';
const skCircle = 'bg-gray-200 dark:bg-[#3A3A3A] rounded-full animate-pulse';
const card = 'bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 md:rounded-lg overflow-hidden';
const header = 'h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]';

// ============================================
// 매치 상세 페이지
// ============================================

/** 매치 헤더 스켈레톤 — MatchHeader 레이아웃 매칭 */
export function MatchHeaderSkeleton() {
  return (
    <div className={`mt-4 md:mt-0 mb-4 ${card} animate-pulse`}>
      {/* 상단 바: 리그 / 날짜 / 경기장 — h-12 */}
      <div className={`${header} border-b border-black/5 dark:border-white/10 md:rounded-t-lg`}>
        <div className="w-1/3 flex items-center gap-1.5 md:gap-2">
          <div className={`w-4 h-4 md:w-6 md:h-6 ${skCircle} flex-shrink-0`} />
          <div className={`h-3 w-16 md:w-20 ${sk}`} />
        </div>
        <div className="w-1/3 flex flex-col items-center">
          <div className={`h-3 w-20 ${sk} mb-1`} />
          <div className={`h-2.5 w-14 ${sk}`} />
        </div>
        <div className="hidden md:flex w-1/3 items-center justify-end">
          <div className={`h-3 w-24 ${sk}`} />
        </div>
        <div className="w-1/3 md:hidden" />
      </div>
      {/* 팀 + 스코어 */}
      <div className="flex justify-between items-center px-2 py-3 md:px-4 md:py-4">
        <div className="w-1/3 flex flex-col items-center">
          <div className={`w-12 h-12 md:w-16 md:h-16 ${skCircle} mb-1 md:mb-2`} />
          <div className={`h-3.5 w-16 md:w-20 ${sk} mb-1`} />
          <div className={`h-2.5 w-10 ${sk}`} />
        </div>
        <div className="flex flex-col items-center">
          <div className={`h-7 md:h-9 w-16 md:w-20 ${sk} mb-2`} />
          <div className={`h-2.5 w-12 ${sk}`} />
        </div>
        <div className="w-1/3 flex flex-col items-center">
          <div className={`w-12 h-12 md:w-16 md:h-16 ${skCircle} mb-1 md:mb-2`} />
          <div className={`h-3.5 w-16 md:w-20 ${sk} mb-1`} />
          <div className={`h-2.5 w-10 ${sk}`} />
        </div>
      </div>
      {/* 득점자 */}
      <div className="border-t border-black/5 dark:border-white/10 px-3 md:px-4 py-3">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="w-full md:w-5/12 space-y-2">
            <div className={`h-3 w-3/4 ${sk}`} />
            <div className={`h-3 w-1/2 ${sk}`} />
          </div>
          <div className="w-full md:w-5/12 space-y-2 mt-2 md:mt-0">
            <div className={`h-3 w-3/4 ${sk}`} />
            <div className={`h-3 w-1/2 ${sk}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** 매치 탭 스켈레톤 — 실제 TabList 스타일 매칭 */
function MatchTabSkeleton() {
  return (
    <div className="mb-4 bg-[#F5F5F5] dark:bg-[#262626] md:rounded-lg border border-black/7 dark:border-0 overflow-hidden flex">
      {/* 응원 탭 — 모바일에서만 */}
      <div className={`h-12 flex-1 xl:hidden ${sk}`} />
      {['전력', '이벤트', '라인업', '통계', '순위'].map((label, i) => (
        <div key={i} className={`h-12 flex-1 flex items-center justify-center ${i === 0 ? 'bg-white dark:bg-[#1D1D1D] border-b-2 border-[#262626] dark:border-[#F0F0F0]' : ''}`}>
          <div className={`h-3 w-8 ${i === 0 ? '' : sk}`} />
        </div>
      ))}
    </div>
  );
}

/** 매치 전력 탭 콘텐츠 스켈레톤 — Power.tsx 레이아웃 매칭 */
function MatchPowerContentSkeleton() {
  return (
    <>
      {/* 팀 비교 카드 */}
      <div className={`${card} mb-4 animate-pulse`}>
        <div className={`${header} border-b border-black/5 dark:border-white/10 md:rounded-t-lg`}>
          <div className={`h-3.5 w-16 ${sk}`} />
        </div>
        <div className="px-4 py-3">
          {/* VS 비교 행 — grid 3:1:3 */}
          <div className="grid grid-cols-[3fr_1fr_3fr] items-center gap-1">
            {/* 홈팀 */}
            <div className="flex items-center justify-end gap-2 px-1">
              <div className={`h-4 w-20 ${sk}`} />
              <div className={`w-8 h-8 ${skCircle}`} />
            </div>
            {/* VS */}
            <div className="text-center">
              <div className={`h-5 w-6 mx-auto ${sk}`} />
            </div>
            {/* 원정팀 */}
            <div className="flex items-center gap-2 px-1">
              <div className={`w-8 h-8 ${skCircle}`} />
              <div className={`h-4 w-20 ${sk}`} />
            </div>
          </div>
          {/* 순위 정보 */}
          <div className="grid grid-cols-[3fr_1fr_3fr] items-center gap-1 mt-2">
            <div className="flex justify-end px-1"><div className={`h-2.5 w-16 ${sk}`} /></div>
            <div />
            <div className="px-1"><div className={`h-2.5 w-16 ${sk}`} /></div>
          </div>
          {/* 평균 득점 바 */}
          <div className="grid grid-cols-[3fr_1fr_3fr] items-center gap-1 mt-4">
            <div className="flex items-center justify-end px-1 gap-2">
              <div className={`h-2 flex-1 ${sk}`} />
              <div className={`h-3.5 w-6 ${sk}`} />
            </div>
            <div className="flex justify-center"><div className={`h-2.5 w-12 ${sk}`} /></div>
            <div className="flex items-center px-1 gap-2">
              <div className={`h-3.5 w-6 ${sk}`} />
              <div className={`h-2 flex-1 ${sk}`} />
            </div>
          </div>
          {/* 평균 실점 바 */}
          <div className="grid grid-cols-[3fr_1fr_3fr] items-center gap-1 mt-3">
            <div className="flex items-center justify-end px-1 gap-2">
              <div className={`h-2 flex-1 ${sk}`} />
              <div className={`h-3.5 w-6 ${sk}`} />
            </div>
            <div className="flex justify-center"><div className={`h-2.5 w-12 ${sk}`} /></div>
            <div className="flex items-center px-1 gap-2">
              <div className={`h-3.5 w-6 ${sk}`} />
              <div className={`h-2 flex-1 ${sk}`} />
            </div>
          </div>
        </div>
      </div>

      {/* 최근 경기 */}
      <div className={`${card} mb-4 animate-pulse`}>
        <div className={`${header} border-b border-black/5 dark:border-white/10 md:rounded-t-lg`}>
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 ${skCircle}`} />
            <div className={`h-3.5 w-20 ${sk}`} />
          </div>
        </div>
        <div className="px-4 py-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5 p-1">
              <div className={`h-5 w-10 ${sk} rounded`} />
              <div className={`h-3 flex-1 ${sk}`} />
              <div className={`h-3 w-8 ${sk}`} />
            </div>
          ))}
        </div>
      </div>

      {/* 상대 전적 */}
      <div className={`${card} mb-4 animate-pulse`}>
        <div className={`${header} border-b border-black/5 dark:border-white/10 md:rounded-t-lg`}>
          <div className={`h-3.5 w-16 ${sk}`} />
        </div>
        <div className="px-4 py-3 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[3fr_1fr_3fr] gap-1 items-center p-2">
              <div className="flex items-center justify-end gap-2 px-1">
                <div className={`h-3 w-12 ${sk}`} />
                <div className={`w-5 h-5 ${skCircle}`} />
                <div className={`h-3.5 w-4 ${sk}`} />
              </div>
              <div className="flex flex-col items-center">
                <div className={`h-2.5 w-14 ${sk} mb-0.5`} />
                <div className={`h-2 w-10 ${sk}`} />
              </div>
              <div className="flex items-center gap-2 px-1">
                <div className={`h-3.5 w-4 ${sk}`} />
                <div className={`w-5 h-5 ${skCircle}`} />
                <div className={`h-3 w-12 ${sk}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/** 매치 탭+콘텐츠 스켈레톤 (헤더 제외) — 전력 탭 기본 */
export function MatchContentSkeleton() {
  return (
    <>
      {/* 모바일 경기 정보 — xl에서 숨김 */}
      <div className={`xl:hidden mb-4 ${card} animate-pulse`}>
        <div className={`${header} border-b border-black/5 dark:border-white/10`}>
          <div className={`h-3.5 w-16 ${sk}`} />
        </div>
        <div className="px-4 py-3 space-y-2.5">
          {['리그', '경기장', '심판', '시간'].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className={`h-3 w-12 ${sk}`} />
              <div className={`h-3 w-24 ${sk}`} />
            </div>
          ))}
        </div>
      </div>
      {/* 광고 */}
      <div className="mb-4"><div className={`h-24 ${sk}`} /></div>
      {/* 탭 */}
      <MatchTabSkeleton />
      {/* 전력 탭 콘텐츠 */}
      <MatchPowerContentSkeleton />
    </>
  );
}

/** 매치 사이드바 스켈레톤 — 실제 사이드바 4섹션 매칭 */
export function MatchSidebarSkeleton() {
  return (
    <div className="h-full pt-4">
      {/* 1. 경기 상세정보 — label:value 테이블 */}
      <div className={`${card} mb-4 animate-pulse`}>
        <div className={`${header} border-b border-black/5 dark:border-white/10 md:rounded-t-lg`}>
          <div className={`h-3.5 w-20 ${sk}`} />
        </div>
        <div className="px-4 py-3 space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className={`h-3 w-10 ${sk}`} />
              <div className={`h-3 ${i === 0 ? 'w-24' : i === 3 ? 'w-28' : 'w-16'} ${sk}`} />
            </div>
          ))}
        </div>
      </div>

      {/* 2. 승부 예측 — grid-cols-3 버튼 + 통계 바 */}
      <div className={`${card} mb-4 animate-pulse`}>
        <div className={`${header} border-b border-black/5 dark:border-white/10 md:rounded-t-lg`}>
          <div className={`h-3.5 w-16 ${sk}`} />
        </div>
        <div className="p-4">
          {/* 3컬럼 예측 버튼 */}
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border-2 border-black/7 dark:border-white/10 flex flex-col items-center justify-center">
                <div className={`w-8 h-8 ${i === 1 ? sk : skCircle} mb-1`} />
                <div className={`h-3 w-8 ${sk}`} />
              </div>
            ))}
          </div>
          {/* 통계 바 */}
          <div className="mt-3 p-3 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg space-y-2">
            <div className={`h-2.5 w-32 mx-auto ${sk} mb-2`} />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-4 ${i === 1 ? '' : ''} mr-2`}>
                  <div className={`w-full h-full ${i === 1 ? sk : skCircle}`} />
                </div>
                <div className="flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded-full h-2 mr-2">
                  <div className={`h-2 rounded-full ${sk}`} style={{ width: `${60 - i * 15}%` }} />
                </div>
                <div className={`h-3 w-8 ${sk}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 응원 댓글 */}
      <div className={`${card} mb-4 animate-pulse`}>
        <div className={`${header} border-b border-black/5 dark:border-white/10 md:rounded-t-lg`}>
          <div className={`h-3.5 w-16 ${sk}`} />
        </div>
        {/* 팀 선택 + 입력 */}
        <div className="p-4 border-b border-black/5 dark:border-white/10">
          <div className="flex space-x-2 mb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`flex-1 h-7 ${sk}`} />
            ))}
          </div>
          <div className={`h-16 w-full ${sk}`} />
        </div>
        {/* 댓글 리스트 */}
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3">
              <div className="flex items-center space-x-2 mb-1">
                <div className={`h-3 w-12 ${sk}`} />
                <div className={`h-3 w-8 ${sk}`} />
              </div>
              <div className={`h-3 w-full ${sk}`} />
            </div>
          ))}
        </div>
      </div>

      {/* 4. 관련 게시글 */}
      <div className={`${card} mt-4 animate-pulse`}>
        <div className={`${header} border-b border-black/5 dark:border-white/10 md:rounded-t-lg`}>
          <div className={`h-3.5 w-20 ${sk}`} />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`px-3 py-3 ${i !== 3 ? 'border-b border-black/5 dark:border-white/10' : ''}`}>
            <div className={`h-3.5 w-full ${sk}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 매치 전체 페이지 스켈레톤 (loading.tsx 대체) */
export function MatchPageSkeleton() {
  return (
    <div className="container">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <MatchHeaderSkeleton />
          <MatchContentSkeleton />
        </div>
        <aside className="hidden xl:block w-[300px] shrink-0">
          <MatchSidebarSkeleton />
        </aside>
      </div>
    </div>
  );
}

// ============================================
// 팀 상세 페이지
// ============================================

/** 팀 헤더 스켈레톤 — TeamHeader 2컬럼 레이아웃 매칭 */
export function TeamHeaderSkeleton() {
  return (
    <div className={`mb-4 ${card} animate-pulse`}>
      <div className="flex flex-col md:flex-row">
        {/* 왼쪽: 팀 로고 + 이름 — md:w-80 */}
        <div className="flex items-center p-3 md:p-4 md:w-80 flex-shrink-0">
          <div className={`w-12 h-12 ${skCircle} flex-shrink-0 mr-3`} />
          <div>
            <div className={`h-5 md:h-6 w-28 ${sk} mb-1.5`} />
            <div className={`h-3.5 w-16 ${sk}`} />
          </div>
        </div>
        {/* 오른쪽: 경기장 이미지 + 정보 */}
        <div className="border-t md:border-t-0 md:border-l border-black/5 dark:border-white/10 p-2 md:p-4 flex-1">
          <div className="flex gap-3">
            <div className={`w-24 h-16 md:w-36 md:h-24 ${sk} rounded flex-shrink-0`} />
            <div className="flex-1">
              <div className={`h-4 w-24 ${sk} mb-2`} />
              <div className={`h-3 w-36 ${sk} mb-1`} />
              <div className={`h-3 w-28 ${sk}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 팀 탭 스켈레톤 — 실제 TabList 스타일 매칭 (6탭) */
function TeamTabSkeleton() {
  const tabs = ['개요', '경기', '순위', '선수단', '이적', '통계'];
  return (
    <div className="mb-4 bg-[#F5F5F5] dark:bg-[#262626] md:rounded-lg border border-black/7 dark:border-0 overflow-hidden flex">
      {tabs.map((_, i) => (
        <div key={i} className={`h-12 flex-1 flex items-center justify-center ${i === 0 ? 'bg-white dark:bg-[#1D1D1D] border-b-2 border-[#262626] dark:border-[#F0F0F0]' : ''}`}>
          <div className={`h-3 w-6 ${i === 0 ? '' : sk}`} />
        </div>
      ))}
    </div>
  );
}

/** 팀 개요 탭 콘텐츠 스켈레톤 — Overview 레이아웃 매칭 */
function TeamOverviewSkeleton() {
  return (
    <div className="space-y-4">
      {/* 기본 정보 */}
      <div className={`${card} animate-pulse`}>
        <div className={`${header} border-b border-black/5 dark:border-white/10 md:rounded-t-lg`}>
          <div className={`h-3.5 w-16 ${sk}`} />
        </div>
        {/* 리그 정보 + 최근 5경기 헤더 */}
        <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
          <div className="flex-1 py-2 flex justify-center"><div className={`h-2.5 w-12 ${sk}`} /></div>
          <div className="flex-1 py-2 flex justify-center"><div className={`h-2.5 w-14 ${sk}`} /></div>
        </div>
        {/* 리그 로고 + 폼 배지 */}
        <div className="flex items-center py-3">
          <div className="flex-1 flex items-center justify-center gap-2">
            <div className={`w-6 h-6 ${skCircle}`} />
            <div className={`h-3 w-20 ${sk}`} />
          </div>
          <div className="flex-1 flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`w-6 h-6 ${sk}`} />
            ))}
          </div>
        </div>
        {/* 시즌 통계 헤더 */}
        <div className={`${header} border-y border-black/5 dark:border-white/10`}>
          <div className={`h-3.5 w-16 ${sk}`} />
        </div>
        {/* 통계 컬럼 헤더 */}
        <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 py-2 flex justify-center">
              <div className={`h-2.5 w-6 ${sk}`} />
            </div>
          ))}
        </div>
        {/* 통계 값 */}
        <div className="flex items-center py-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 flex justify-center">
              <div className={`h-4 w-6 ${sk}`} />
            </div>
          ))}
        </div>
        {/* 하단 버튼 */}
        <div className="h-10 border-t border-black/5 dark:border-white/10 flex items-center justify-center">
          <div className={`h-3.5 w-24 ${sk}`} />
        </div>
      </div>

      {/* 최근 경기 */}
      <div className={`${card} animate-pulse`}>
        <div className={`${header} border-b border-black/5 dark:border-white/10 md:rounded-t-lg`}>
          <div className={`h-3.5 w-16 ${sk}`} />
        </div>
        {/* 테이블 헤더 */}
        <div className="flex items-center h-10 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10 px-2 md:px-4">
          <div className={`h-2.5 w-10 ${sk}`} style={{ flex: '0 0 56px' }} />
          <div className={`h-2.5 w-8 ${sk} hidden md:block`} style={{ flex: '0 0 128px' }} />
          <div className={`h-2.5 w-10 flex-1 ${sk}`} />
          <div className={`h-2.5 w-8 ${sk}`} style={{ flex: '0 0 48px' }} />
        </div>
        {/* 경기 행들 — h-12 */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex items-center h-12 px-2 md:px-4 ${i !== 4 ? 'border-b border-black/5 dark:border-white/10' : ''}`}>
            <div className={`h-3 w-10 ${sk}`} style={{ flex: '0 0 56px' }} />
            <div className={`w-5 h-5 ${skCircle} hidden md:block mx-auto`} style={{ flex: '0 0 128px' }} />
            <div className="flex-1 flex items-center justify-center gap-1">
              <div className={`h-3 w-14 ${sk}`} />
              <div className={`w-5 h-5 ${skCircle}`} />
              <div className={`h-3.5 w-8 ${sk}`} />
              <div className={`w-5 h-5 ${skCircle}`} />
              <div className={`h-3 w-14 ${sk}`} />
            </div>
            <div className="flex justify-center" style={{ flex: '0 0 48px' }}>
              <div className={`w-6 h-6 ${sk}`} />
            </div>
          </div>
        ))}
        {/* 하단 버튼 */}
        <div className="h-10 border-t border-black/5 dark:border-white/10 flex items-center justify-center">
          <div className={`h-3.5 w-28 ${sk}`} />
        </div>
      </div>
    </div>
  );
}

/** 팀 전체 페이지 스켈레톤 */
export function TeamPageSkeleton() {
  return (
    <>
      <TeamHeaderSkeleton />
      {/* 광고 */}
      <div className="mb-4"><div className={`h-24 ${sk}`} /></div>
      {/* 탭 */}
      <TeamTabSkeleton />
      {/* 개요 콘텐츠 */}
      <TeamOverviewSkeleton />
    </>
  );
}

// ============================================
// 선수 상세 페이지
// ============================================

/** 선수 헤더 스켈레톤 — PlayerHeader 정확한 레이아웃 매칭 */
export function PlayerHeaderSkeleton() {
  return (
    <div className={`mb-4 ${card} animate-pulse`}>
      {/* 사진 + 이름 + 팀 + 포지션 */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
            <div className={`w-16 h-16 md:w-20 md:h-20 ${skCircle}`} />
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-white dark:bg-[#1D1D1D] ${skCircle} shadow-lg`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`h-4 md:h-5 w-32 ${sk} mb-1.5`} />
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`h-3.5 w-20 ${sk}`} />
              <div className={`h-5 w-14 rounded ${sk}`} />
            </div>
            <div className={`h-3 w-24 ${sk}`} />
          </div>
        </div>
      </div>
      {/* 5컬럼 정보 바 — 키/몸무게/생년월일/나이/출생지 */}
      <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-t border-black/5 dark:border-white/10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-1 py-2 text-center">
            <div className={`h-2.5 w-10 mx-auto ${sk}`} />
          </div>
        ))}
      </div>
      <div className="flex items-center py-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-1 text-center relative">
            <div className={`h-3.5 w-10 mx-auto ${sk}`} />
            {i < 4 && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-[#EAEAEA] dark:bg-[#333333]" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/** 선수 탭 스켈레톤 — 실제 TabList 스타일 매칭 (6탭) */
function PlayerTabSkeleton() {
  return (
    <div className="mb-4 bg-[#F5F5F5] dark:bg-[#262626] md:rounded-lg border border-black/7 dark:border-0 overflow-hidden flex overflow-x-auto no-scrollbar">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`h-12 flex-1 flex items-center justify-center whitespace-nowrap ${i === 0 ? 'bg-white dark:bg-[#1D1D1D] border-b-2 border-[#262626] dark:border-[#F0F0F0]' : ''}`}>
          <div className={`h-3 w-10 ${i === 0 ? '' : sk}`} />
        </div>
      ))}
    </div>
  );
}

/** 선수 통계 탭 콘텐츠 스켈레톤 — 리그별 통계 테이블 매칭 */
function PlayerStatsContentSkeleton() {
  return (
    <div className="space-y-4">
      {/* 리그 섹션 (2개) */}
      {Array.from({ length: 2 }).map((_, leagueIdx) => (
        <div key={leagueIdx} className={`${card} animate-pulse`}>
          {/* 리그 헤더 — 리그 로고 + 리그명 | 팀 로고 + 팀명 */}
          <div className={`${header} border-b border-black/5 dark:border-white/10 md:rounded-t-lg justify-between`}>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 md:w-6 md:h-6 ${skCircle}`} />
              <div className={`h-3.5 w-20 ${sk}`} />
              <div className={`h-3 w-10 ${sk}`} />
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 md:w-6 md:h-6 ${skCircle}`} />
              <div className={`h-3.5 w-16 ${sk}`} />
            </div>
          </div>

          {/* 통계 테이블 1: 기본 정보 */}
          <div className="flex h-12 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            <div className="flex-1 px-4 flex items-center">
              <div className={`h-3.5 w-16 ${sk}`} />
            </div>
          </div>
          {/* 컬럼 헤더: 포지션/출전/선발/시간 */}
          <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-1 py-2 flex justify-center">
                <div className={`h-2.5 w-6 ${sk}`} />
              </div>
            ))}
          </div>
          {/* 값 */}
          <div className="flex items-center py-3 border-b border-black/5 dark:border-white/10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-1 text-center relative">
                <div className={`h-3.5 w-8 mx-auto ${sk}`} />
                {i < 3 && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />}
              </div>
            ))}
          </div>

          {/* 통계 테이블 2: 공격 + 패스 (2섹션) */}
          <div className="flex h-12 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            <div className="flex-1 px-4 flex items-center relative">
              <div className={`h-3.5 w-16 ${sk}`} />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-5 bg-gray-300 dark:bg-gray-500" />
            </div>
            <div className="flex-1 px-4 flex items-center">
              <div className={`h-3.5 w-16 ${sk}`} />
            </div>
          </div>
          <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-1 py-2 flex justify-center">
                <div className={`h-2.5 w-5 ${sk}`} />
              </div>
            ))}
          </div>
          <div className="flex items-center py-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-1 text-center relative">
                <div className={`h-3.5 w-6 mx-auto ${sk}`} />
                {i === 3 && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-300 dark:bg-gray-500" />}
                {i < 7 && i !== 3 && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** 선수 전체 페이지 스켈레톤 */
export function PlayerPageSkeleton() {
  return (
    <>
      <PlayerHeaderSkeleton />
      {/* 광고 */}
      <div className="mb-4"><div className={`h-24 ${sk}`} /></div>
      {/* 탭 */}
      <PlayerTabSkeleton />
      {/* 통계 콘텐츠 */}
      <PlayerStatsContentSkeleton />
    </>
  );
}

// ============================================
// 게시판 목록 페이지
// ============================================

/** 공지사항 행 스켈레톤 — 실제 NoticeList (standalone=false) + NoticeItem 매칭 */
function NoticeRowsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <>
      {/* 모바일 — 실제 NoticeItem: py-2 px-3, space-y-1 */}
      <div className="sm:hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`py-2 px-3 ${i !== count - 1 ? 'border-b border-black/5 dark:border-white/10' : ''}`}>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <div className={`h-5 w-8 rounded ${sk} flex-shrink-0`} />
                <div className={`h-3 w-3/5 ${sk}`} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className={`h-[11px] w-14 ${sk}`} />
                  <div className={`h-[11px] w-14 ${sk}`} />
                  <div className={`h-[11px] w-12 ${sk}`} />
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-[11px] w-8 ${sk}`} />
                  <div className={`h-[11px] w-10 ${sk}`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* 데스크톱 — 실제 NoticeList colgroup: 100px, flex, 120px, 70px, 40px, 40px */}
      <div className="hidden sm:block">
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '100px' }} />
            <col />
            <col style={{ width: '120px' }} />
            <col style={{ width: '70px' }} />
            <col style={{ width: '40px' }} />
            <col style={{ width: '40px' }} />
          </colgroup>
          <tbody>
            {Array.from({ length: count }).map((_, i) => (
              <tr key={i} className={i !== count - 1 ? 'border-b border-black/5 dark:border-white/10' : ''}>
                <td className="py-2 px-3 align-middle">
                  <div className="h-5 flex items-center justify-center">
                    <div className={`h-5 w-8 rounded ${sk}`} />
                  </div>
                </td>
                <td className="py-2 px-4 align-middle"><div className={`h-3 w-3/5 ${sk}`} /></td>
                <td className="py-2 px-3 align-middle"><div className={`h-3 w-14 ${sk}`} /></td>
                <td className="py-2 px-1 align-middle"><div className={`h-3 w-10 mx-auto ${sk}`} /></td>
                <td className="py-2 px-1 align-middle"><div className={`h-3 w-6 mx-auto ${sk}`} /></td>
                <td className="py-2 px-1 align-middle"><div className={`h-3 w-6 mx-auto ${sk}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** 게시판 목록 스켈레톤 — BoardDetailLayout 매칭 */
export function BoardListSkeleton() {
  return (
    <div className="container mx-auto animate-pulse">
      {/* 브레드크럼 — 실제 BoardBreadcrumbs: Container + px-4 py-2.5 + text-[13px] + ChevronRight + 각 항목 px-2 py-1 */}
      <div className={`${card} mb-4`}>
        <div className="px-4 py-3 flex items-center whitespace-nowrap">
          <div className="px-2 py-1"><div className={`h-[13px] w-[56px] ${sk}`} /></div>
          <div className="h-3.5 w-3.5 mx-1.5 flex-shrink-0 rounded-sm bg-gray-200 dark:bg-[#3A3A3A]" />
          <div className="px-2 py-1"><div className={`h-[13px] w-[72px] ${sk}`} /></div>
          <div className="h-3.5 w-3.5 mx-1.5 flex-shrink-0 rounded-sm bg-gray-200 dark:bg-[#3A3A3A]" />
          <div className="px-2 py-1"><div className={`h-[13px] w-[64px] ${sk}`} /></div>
        </div>
      </div>

      {/* 광고 — 실제 KakaoAd 전체 너비 */}
      <div className="flex justify-center mb-4">
        <div className="hidden md:block">
          <div className={`h-[90px] w-[728px] ${sk}`} />
        </div>
        <div className="md:hidden">
          <div className={`h-[100px] w-[320px] ${sk}`} />
        </div>
      </div>

      {/* 인기글 BEST — 실제 BoardPopularPosts 매칭 */}
      {/* 모바일: TrendingUp + 제목 + 1/2 + chevron */}
      <div className="md:hidden border border-black/7 dark:border-0 overflow-hidden bg-white dark:bg-[#1D1D1D] mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <div className="flex items-center">
            <div className={`w-4 h-4 mr-2 ${sk}`} />
            <div className={`h-[13px] w-[80px] ${sk}`} />
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-6 ${sk}`} />
            <div className={`w-6 h-6 ${sk}`} />
          </div>
        </div>
        <table className="w-full border-collapse">
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className={i !== 3 ? 'border-b border-black/5 dark:border-white/10' : ''}>
                <td className="py-3 px-3 align-middle w-6">
                  <div className={`h-4 w-3.5 ${sk}`} />
                </td>
                <td className="py-3 pr-3 align-middle max-w-0">
                  <div className="flex items-center gap-1">
                    <div className={`h-4 w-full max-w-[280px] ${sk}`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* PC: h-12 헤더 + TrendingUp icon + "이번주 BEST" / "이번달 BEST" */}
      <div className="hidden md:block border border-black/7 dark:border-0 md:rounded-lg overflow-hidden bg-white dark:bg-[#1D1D1D] mb-4">
        <div className="grid grid-cols-2">
          {[0, 1].map((col) => (
            <div key={col} className={col === 0 ? 'border-r border-black/5 dark:border-white/10' : ''}>
              <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] px-4 flex items-center border-b border-black/5 dark:border-white/10">
                <div className={`w-4 h-4 mr-2 ${sk}`} />
                <div className={`h-[13px] w-[80px] ${sk}`} />
              </div>
              <table className="w-full border-collapse">
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className={i !== 3 ? 'border-b border-black/5 dark:border-white/10' : ''}>
                      <td className="py-3 px-3 align-middle w-6">
                        <div className={`h-4 w-3.5 ${sk}`} />
                      </td>
                      <td className="py-3 pr-3 align-middle max-w-0">
                        <div className="flex items-center gap-1">
                          <div className={`h-4 w-full max-w-[280px] ${sk}`} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      {/* 게시판 헤더 + 공지사항 — 같은 Container (mb-4) */}
      <div className={`${card} mb-4`}>
        {/* 게시판 헤더 — 실제: 게시판 이름 + 글쓰기 버튼 (justify-between) */}
        <div className={`${header} border-b border-black/5 dark:border-white/10 md:rounded-t-lg justify-between`}>
          <div className={`h-3.5 w-16 ${sk}`} />
          <div className={`h-8 w-16 ${sk}`} />
        </div>
        {/* 공지사항 행 */}
        <NoticeRowsSkeleton count={2} />
      </div>

      {/* 탭 메뉴 (HoverMenu) — 실제: Container + px-4 py-2.5 + nav flex gap-2 + 탭 버튼들 */}
      <div className={`${card} mb-4`}>
        <div className="px-4 py-2.5">
          <nav className="flex items-center gap-2">
            <div className={`h-7 w-12 ${sk}`} />
            <div className="flex items-center gap-1 flex-1">
              <div className={`h-7 w-16 ${sk}`} />
              <div className={`h-7 w-20 ${sk}`} />
              <div className={`h-7 w-14 ${sk}`} />
              <div className={`h-7 w-16 ${sk}`} />
            </div>
          </nav>
        </div>
      </div>

      {/* 게시글 목록 — 별도 Container (PostList 자체 래핑) */}
      <div className={`${card} mt-2`}>
        {/* 모바일 (sm 미만) */}
        <div className="sm:hidden">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={`px-3 py-2.5 ${i !== 9 ? 'border-b border-black/5 dark:border-white/10' : ''}`}>
              <div className={`h-3.5 w-4/5 ${sk} mb-1.5`} />
              <div className="flex items-center gap-1.5">
                <div className={`h-2.5 w-12 ${sk}`} />
                <div className={`h-2.5 w-14 ${sk}`} />
                <div className={`h-2.5 w-10 ${sk}`} />
                <div className={`h-2.5 w-6 ${sk}`} />
              </div>
            </div>
          ))}
        </div>
        {/* 데스크톱 (sm 이상) — 실제 DesktopPostListServer 테이블 colgroup 매칭 */}
        <div className="hidden sm:block">
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '110px' }} />
              <col />
              <col style={{ width: '100px' }} />
              <col style={{ width: '65px' }} />
              <col style={{ width: '35px' }} />
              <col style={{ width: '35px' }} />
            </colgroup>
            <thead>
              <tr className="border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
                <th className="py-2 px-3"><div className={`h-3 w-10 mx-auto ${sk}`} /></th>
                <th className="py-2 px-4"><div className={`h-3 w-8 mx-auto ${sk}`} /></th>
                <th className="py-2 px-3"><div className={`h-3 w-10 mx-auto ${sk}`} /></th>
                <th className="py-2 px-1"><div className={`h-3 w-8 mx-auto ${sk}`} /></th>
                <th className="py-2 px-1"><div className={`h-3 w-6 mx-auto ${sk}`} /></th>
                <th className="py-2 px-1"><div className={`h-3 w-6 mx-auto ${sk}`} /></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className={i !== 9 ? 'border-b border-black/5 dark:border-white/10' : ''}>
                  <td className="py-2 pl-3 pr-1 align-middle">
                    <div className="flex items-center justify-center gap-1">
                      <div className={`w-5 h-5 ${skCircle}`} />
                      <div className={`h-3 w-10 ${sk}`} />
                    </div>
                  </td>
                  <td className="py-2 px-1 align-middle"><div className={`h-3 w-3/4 ${sk}`} /></td>
                  <td className="py-2 px-1 align-middle"><div className={`h-3 w-14 ${sk}`} /></td>
                  <td className="py-2 px-1 align-middle"><div className={`h-3 w-10 mx-auto ${sk}`} /></td>
                  <td className="py-2 px-1 align-middle"><div className={`h-3 w-6 mx-auto ${sk}`} /></td>
                  <td className="py-2 px-1 align-middle"><div className={`h-3 w-6 mx-auto ${sk}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 검색바 + 글쓰기 버튼 */}
      <div className="flex items-center justify-between mt-4 gap-2">
        <div className="flex-1 flex items-center gap-2">
          <div className={`h-9 w-20 ${sk}`} />
          <div className={`h-9 flex-1 max-w-[280px] ${sk}`} />
          <div className={`h-9 w-16 ${sk}`} />
        </div>
        <div className={`h-9 w-20 ${sk} hidden sm:block`} />
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center mt-4">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`w-8 h-8 ${sk}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 게시글 상세 페이지
// ============================================

/** 게시글 상세 스켈레톤 — PostDetailLayout 매칭 */
export function PostDetailSkeleton() {
  return (
    <div className="container mx-auto animate-pulse">
      {/* 브레드크럼 — BoardBreadcrumbs: Container + px-4 py-2.5 + 항목 px-2 py-1 */}
      <div className={`${card} mb-4`}>
        <div className="px-4 py-3 flex items-center whitespace-nowrap">
          <div className="px-2 py-1"><div className={`h-[13px] w-[56px] ${sk}`} /></div>
          <div className="h-3.5 w-3.5 mx-1.5 flex-shrink-0 rounded-sm bg-gray-200 dark:bg-[#3A3A3A]" />
          <div className="px-2 py-1"><div className={`h-[13px] w-[72px] ${sk}`} /></div>
          <div className="h-3.5 w-3.5 mx-1.5 flex-shrink-0 rounded-sm bg-gray-200 dark:bg-[#3A3A3A]" />
          <div className="px-2 py-1"><div className={`h-[13px] w-[64px] ${sk}`} /></div>
        </div>
      </div>

      {/* 게시글 본문 */}
      <div className={`${card} mb-4`}>
        {/* 제목 + 작성자 — 실제: px-4 py-3, 제목 text-lg mb-2 */}
        <div className="bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/7 dark:border-white/10 px-4 py-3">
          <div className={`h-5 w-3/4 ${sk} mb-2`} />
          {/* 모바일 — 실제: flex-wrap justify-between text-xs mb-1 + flex justify-end space-x-3 */}
          <div className="md:hidden">
            <div className="flex flex-wrap items-center justify-between text-xs mb-1">
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 ${skCircle}`} />
                <div className={`h-3 w-16 ${sk}`} />
              </div>
              <div className={`h-3 w-24 ${sk}`} />
            </div>
            <div className="flex justify-end space-x-3">
              <div className={`h-3 w-14 ${sk}`} />
              <div className={`h-3 w-10 ${sk}`} />
              <div className={`h-3 w-10 ${sk}`} />
            </div>
          </div>
          {/* 데스크톱 — 실제: flex-wrap justify-between text-xs, stats space-x-4 */}
          <div className="hidden md:flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-5 h-5 ${skCircle}`} />
              <div className={`h-3 w-20 ${sk}`} />
              <div className={`h-3 w-28 ${sk}`} />
            </div>
            <div className="flex items-center space-x-4">
              <div className={`h-3 w-16 ${sk}`} />
              <div className={`h-3 w-12 ${sk}`} />
              <div className={`h-3 w-12 ${sk}`} />
            </div>
          </div>
        </div>
        {/* 본문 — 실제: p-4 sm:p-6 */}
        <div className="p-4 sm:p-6 space-y-3">
          <div className={`h-4 w-full ${sk}`} />
          <div className={`h-4 w-full ${sk}`} />
          <div className={`h-4 w-5/6 ${sk}`} />
          <div className={`h-48 w-full ${sk} my-4`} />
          <div className={`h-4 w-full ${sk}`} />
          <div className={`h-4 w-4/5 ${sk}`} />
          <div className={`h-4 w-3/4 ${sk}`} />
        </div>
        {/* 좋아요/싫어요 — 실제: px-4 py-4 border-t, flex justify-center gap-4 mt-4 */}
        <div className="px-4 sm:px-6 py-4 border-t border-black/5 dark:border-white/10">
          <div className="flex justify-center items-center gap-4 mt-4">
            <div className={`h-10 w-24 ${sk} rounded-md`} />
            <div className={`h-10 w-24 ${sk} rounded-md`} />
          </div>
        </div>
      </div>

      {/* 포스트 네비게이션 — 실제: h-12 px-4 flex justify-around, 각 flex-1 text-center */}
      <div className={`${card} mb-4`}>
        <div className="h-12 px-4 flex flex-row items-center justify-around">
          <div className="flex-1 flex justify-center">
            <div className={`h-4 w-14 ${sk}`} />
          </div>
          <div className="flex-1 flex justify-center">
            <div className={`h-4 w-10 ${sk}`} />
          </div>
          <div className="flex-1 flex justify-center">
            <div className={`h-4 w-14 ${sk}`} />
          </div>
        </div>
      </div>

      {/* 댓글 섹션 — 실제: Container, h-12 header, comment py-3 px-4 */}
      <div className={`${card} mb-4`}>
        <div className={`${header} border-b border-black/5 dark:border-white/10 md:rounded-t-lg`}>
          <div className={`h-[13px] w-20 ${sk}`} />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-black/5 dark:border-white/10">
            {/* 작성자 + 날짜 — 실제: flex justify-between mb-1 */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 ${skCircle}`} />
                <div className={`h-3 w-16 ${sk}`} />
              </div>
              <div className={`h-3 w-20 ${sk}`} />
            </div>
            {/* 댓글 내용 — 실제: text-[13px] mb-2 leading-relaxed */}
            <div className={`h-4 w-4/5 ${sk} mb-2`} />
            {/* 액션 버튼 — 실제: flex justify-between */}
            <div className="flex items-center">
              <div className="flex items-center space-x-4">
                <div className={`h-3 w-8 ${sk}`} />
                <div className={`h-3 w-8 ${sk}`} />
              </div>
            </div>
          </div>
        ))}
        {/* 댓글 입력 — 실제: px-4 py-4 border-t, textarea rows=3 */}
        <div className="px-4 py-4 border-t border-black/7 dark:border-white/10">
          <div className={`h-[76px] w-full ${sk} rounded-lg mb-2`} />
          <div className="flex justify-end">
            <div className={`h-10 w-20 ${sk} rounded-md`} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 리그 상세 페이지
// ============================================

/** 리그 상세 스켈레톤 — League page 매칭 */
export function LeagueDetailSkeleton() {
  return (
    <div className="min-h-screen">
      {/* 리그 헤더 */}
      <div className={`${card} animate-pulse`}>
        <div className={`${header} border-b border-black/5 dark:border-white/10 md:rounded-t-lg gap-3`}>
          <div className={`w-8 h-8 ${skCircle}`} />
          <div className="flex-1">
            <div className={`h-5 w-40 ${sk} mb-1`} />
            <div className={`h-3 w-24 ${sk}`} />
          </div>
        </div>
        <div className="px-4 py-3">
          <div className={`h-3.5 w-full ${sk} mb-1.5`} />
          <div className={`h-3.5 w-3/4 ${sk}`} />
        </div>
      </div>

      {/* 광고 */}
      <div className="mt-4">
        <div className={`h-24 ${sk}`} />
      </div>

      {/* 순위 테이블 */}
      <div className={`mt-4 ${card} animate-pulse`}>
        <div className={`${header} border-b border-black/5 dark:border-white/10 md:rounded-t-lg`}>
          <div className={`h-4 w-20 ${sk}`} />
        </div>
        {/* 모바일 테이블 */}
        <div className="md:hidden">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={`px-3 py-2 flex items-center gap-2 ${i !== 9 ? 'border-b border-black/5 dark:border-white/10' : ''}`}>
              <div className={`h-3 w-4 ${sk}`} />
              <div className={`w-5 h-5 ${skCircle}`} />
              <div className={`h-3 w-20 ${sk} flex-1`} />
              <div className={`h-3 w-6 ${sk}`} />
              <div className={`h-3 w-6 ${sk}`} />
              <div className={`h-3 w-6 ${sk}`} />
            </div>
          ))}
        </div>
        {/* 데스크톱 테이블 */}
        <div className="hidden md:block">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={`px-4 py-2 flex items-center gap-3 ${i !== 9 ? 'border-b border-black/5 dark:border-white/10' : ''}`}>
              <div className={`h-3 w-4 ${sk}`} />
              <div className={`w-6 h-6 ${skCircle}`} />
              <div className={`h-3 w-32 ${sk}`} />
              <div className="flex-1" />
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className={`h-3 w-6 ${sk}`} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 득점/도움 랭킹 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((section) => (
          <div key={section} className={`${card} animate-pulse`}>
            <div className={`${header} border-b border-black/5 dark:border-white/10 md:rounded-t-lg`}>
              <div className={`h-4 w-24 ${sk}`} />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`px-4 py-2.5 flex items-center gap-3 ${i !== 4 ? 'border-b border-black/5 dark:border-white/10' : ''}`}>
                <div className={`h-3 w-4 ${sk}`} />
                <div className={`w-8 h-8 ${skCircle}`} />
                <div className="flex-1">
                  <div className={`h-3 w-24 ${sk} mb-1`} />
                  <div className={`h-2.5 w-16 ${sk}`} />
                </div>
                <div className={`h-4 w-8 ${sk}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
