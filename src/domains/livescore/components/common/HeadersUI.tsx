/**
 * 헤더 UI 컴포넌트들 - 스켈레톤 로딩 상태를 위한 컴포넌트 모음
 * 각 헤더 타입(매치, 플레이어, 팀)에 대한 스켈레톤 UI를 제공합니다.
 * 실제 컴포넌트의 반응형 레이아웃과 정확히 일치합니다.
 */

import React from 'react';

const sk = 'bg-gray-200 dark:bg-[#3A3A3A] rounded animate-pulse';
const skCircle = 'bg-gray-200 dark:bg-[#3A3A3A] rounded-full animate-pulse';

/**
 * 경기 헤더 스켈레톤 UI 컴포넌트
 * 실제 MatchHeader 레이아웃:
 * - 상단: h-12, 리그/날짜/경기장(md에서만 보임) 3컬럼
 * - 중앙: 홈팀(w-1/3) / 스코어 / 원정팀(w-1/3)
 * - 하단: 득점자 (모바일: flex-col, PC: flex-row 3컬럼)
 */
export function MatchHeaderSkeleton() {
  return (
    <div className="mt-4 md:mt-0 mb-4 bg-white dark:bg-[#1D1D1D] rounded-none md:rounded-lg shadow-sm overflow-hidden border border-black/7 dark:border-0 animate-pulse">
      {/* 상단 바: 리그 / 날짜 / 경기장 — h-12 3컬럼 */}
      <div className="h-12 flex items-center bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
        {/* 리그 정보 — w-1/3 */}
        <div className="w-1/3 flex items-center gap-1.5 md:gap-2 px-3">
          <div className={`w-4 h-4 md:w-6 md:h-6 ${skCircle} flex-shrink-0`} />
          <div className={`h-3 w-16 md:w-20 ${sk}`} />
        </div>
        {/* 날짜/라운드 — w-1/3 */}
        <div className="w-1/3 flex flex-col items-center">
          <div className={`h-3 w-20 ${sk} mb-1`} />
          <div className={`h-2.5 w-14 ${sk}`} />
        </div>
        {/* 경기장 — w-1/3, 모바일 숨김 */}
        <div className="hidden md:flex w-1/3 items-center justify-end px-3">
          <div className={`h-3 w-24 ${sk}`} />
        </div>
        {/* 모바일에서 오른쪽 빈 공간 */}
        <div className="w-1/3 md:hidden" />
      </div>

      {/* 팀 정보 및 스코어 — px-2 py-3 md:px-4 md:py-4 */}
      <div className="flex justify-between items-center px-2 py-3 md:px-4 md:py-4">
        {/* 홈팀 — w-1/3 */}
        <div className="w-1/3 flex flex-col items-center">
          <div className={`w-12 h-12 md:w-16 md:h-16 ${skCircle} mb-1 md:mb-2`} />
          <div className={`h-3.5 w-16 md:w-20 ${sk} mb-1`} />
          <div className={`h-2.5 w-10 ${sk}`} />
        </div>
        {/* 스코어 — 중앙 */}
        <div className="flex flex-col items-center">
          <div className={`h-7 md:h-9 w-16 md:w-20 ${sk} mb-2`} />
          <div className={`h-2.5 w-12 ${sk}`} />
        </div>
        {/* 원정팀 — w-1/3 */}
        <div className="w-1/3 flex flex-col items-center">
          <div className={`w-12 h-12 md:w-16 md:h-16 ${skCircle} mb-1 md:mb-2`} />
          <div className={`h-3.5 w-16 md:w-20 ${sk} mb-1`} />
          <div className={`h-2.5 w-10 ${sk}`} />
        </div>
      </div>

      {/* 득점자 — 모바일: flex-col (w-full), PC: flex-row (w-1/3 × 3) */}
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

/**
 * 선수 헤더 스켈레톤 UI 컴포넌트
 * 실제 PlayerHeader 레이아웃:
 * - 모바일: 사진(w-20 h-20) + 이름 가로 배치, 기본정보 grid-cols-2
 * - PC: 사진(w-28 h-28) + 이름 | 기본정보 grid-cols-3~4
 */
export function PlayerHeaderSkeleton() {
  return (
    <div className="mb-4 bg-white dark:bg-[#1D1D1D] p-4 rounded-lg shadow-sm animate-pulse mt-4 md:mt-0">
      <div className="flex flex-col md:flex-row items-stretch">
        {/* 선수 프로필 사진 및 기본 정보 */}
        <div className="flex flex-row items-center gap-4 md:gap-6 md:w-1/3">
          <div className="relative flex-shrink-0">
            <div className={`w-20 h-20 md:w-28 md:h-28 ${skCircle}`} />
            <div className={`absolute -bottom-2 -right-2 w-8 h-8 ${skCircle}`} />
          </div>
          <div className="flex-1">
            <div className={`h-5 md:h-6 w-3/4 ${sk} mb-2`} />
            <div className={`h-3.5 md:h-4 w-1/2 ${sk} mb-2`} />
            <div className={`h-5 w-16 ${sk}`} />
          </div>
        </div>

        {/* 기본 정보 — 모바일: grid-cols-2, PC: grid-cols-3~4 */}
        <div className="flex-1 mt-4 md:mt-0 md:ml-8 border-t md:border-t-0 md:border-l border-black/7 dark:border-white/10 pt-4 md:pt-0 md:pl-8">
          <div className={`h-4 md:h-5 w-1/4 ${sk} mb-4`} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className={`h-2.5 md:h-3 w-1/2 ${sk} mb-1`} />
                <div className={`h-3.5 md:h-4 w-3/4 ${sk}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 팀 헤더 스켈레톤 UI 컴포넌트
 * 실제 TeamHeader 레이아웃:
 * - 모바일: 로고(w-16 h-16) + 팀명 | 홈구장 세로 배치
 * - PC: 로고(w-20 h-20) + 팀명 | 홈구장 가로 배치
 */
export function TeamHeaderSkeleton() {
  return (
    <div className="mb-4 bg-white dark:bg-[#1D1D1D] p-4 rounded-lg shadow-sm animate-pulse mt-4 md:mt-0">
      <div className="flex flex-col md:flex-row items-start">
        {/* 팀 로고 및 기본 정보 */}
        <div className="flex items-center p-2 md:p-4 md:w-96 flex-shrink-0">
          <div className={`w-16 h-16 md:w-20 md:h-20 ${skCircle} flex-shrink-0 mr-3 md:mr-4`} />
          <div className="flex flex-col justify-center">
            <div className={`h-5 md:h-6 w-36 md:w-40 ${sk} mb-2`} />
            <div className={`h-3.5 md:h-4 w-24 md:w-28 ${sk} mb-2`} />
            <div className="flex items-center gap-2 mt-1">
              <div className={`h-3 w-16 ${sk}`} />
              <div className={`h-3.5 w-10 ${sk}`} />
            </div>
          </div>
        </div>

        {/* 홈구장 정보 */}
        <div className="border-t md:border-t-0 md:border-l border-black/7 dark:border-white/10 p-2 md:p-4 flex-1 w-full md:w-auto">
          <div className="flex gap-3">
            <div className={`w-24 h-16 md:w-36 md:h-24 ${sk} flex-shrink-0`} />
            <div className="flex-1">
              <div className={`h-4 md:h-5 w-28 md:w-32 ${sk} mb-2`} />
              <div className="space-y-1 mb-2">
                <div className={`h-2.5 md:h-3 w-32 md:w-40 ${sk}`} />
                <div className={`h-2.5 md:h-3 w-40 md:w-48 ${sk}`} />
              </div>
              <div className="flex flex-wrap gap-3">
                <div className={`h-2.5 md:h-3 w-20 md:w-24 ${sk}`} />
                <div className={`h-2.5 md:h-3 w-20 md:w-24 ${sk}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
