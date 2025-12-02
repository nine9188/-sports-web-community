/**
 * 헤더 UI 컴포넌트들 - 스켈레톤 로딩 상태를 위한 컴포넌트 모음
 * 각 헤더 타입(매치, 플레이어, 팀)에 대한 스켈레톤 UI를 제공합니다.
 */

import React from 'react';

/**
 * 경기 헤더 스켈레톤 UI 컴포넌트
 * 경기 정보 로딩 중 표시되는 플레이스홀더 UI
 */
export function MatchHeaderSkeleton() {
  return (
    <div className="mt-4 md:mt-0 mb-4 bg-white p-4 rounded-lg shadow-sm animate-pulse">
      {/* 리그 정보 및 경기 상태 */}
      <div className="flex items-center gap-2 justify-between mb-3 border-b pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
        <div className="flex flex-col items-center">
          <div className="h-5 w-16 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="w-20"></div> {/* 균형을 위한 빈 공간 */}
      </div>
      
      {/* 팀 정보 및 스코어 */}
      <div className="flex justify-between items-center py-2">
        <div className="w-1/3 flex flex-col items-center">
          <div className="w-14 h-14 bg-gray-200 rounded-full mb-2"></div>
          <div className="h-4 w-20 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="flex flex-col items-center">
          <div className="h-8 w-20 bg-gray-200 rounded mb-2"></div>
          <div className="space-y-1">
            <div className="h-3 w-28 bg-gray-200 rounded"></div>
            <div className="h-3 w-28 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="w-1/3 flex flex-col items-center">
          <div className="w-14 h-14 bg-gray-200 rounded-full mb-2"></div>
          <div className="h-4 w-20 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
      
      {/* 득점자 자리 */}
      <div className="border-t pt-3 mt-3">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="w-full md:w-5/12 space-y-2">
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
          </div>
          <div className="w-full md:w-5/12 space-y-2 mt-2 md:mt-0">
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 선수 헤더 스켈레톤 UI 컴포넌트
 * 선수 프로필 정보 로딩 중 표시되는 플레이스홀더 UI
 */
export function PlayerHeaderSkeleton() {
  return (
    <div className="mb-4 bg-white p-4 rounded-lg shadow-sm animate-pulse mt-4 md:mt-0">
      <div className="flex flex-col md:flex-row items-stretch">
        {/* 선수 프로필 사진 및 기본 정보 */}
        <div className="flex flex-row items-center gap-4 md:gap-6 md:w-1/3">
          <div className="relative w-20 h-20 md:w-28 md:h-28 flex-shrink-0">
            <div className="w-20 h-20 md:w-28 md:h-28 bg-gray-300 rounded-full"></div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-200 rounded-full"></div>
          </div>
          
          <div className="text-left flex-1">
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-1/3 px-3 py-1"></div>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="flex-1 mt-4 md:mt-0 md:ml-8 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-8">
          <div className="h-5 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden">
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
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
 * 팀 정보 로딩 중 표시되는 플레이스홀더 UI
 */
export function TeamHeaderSkeleton() {
  return (
    <div className="mb-4 bg-white p-4 rounded-lg shadow-sm animate-pulse mt-4 md:mt-0">
      <div className="flex flex-col md:flex-row items-start">
        {/* 팀 로고 및 기본 정보 */}
        <div className="flex items-center p-2 md:p-4 md:w-96 flex-shrink-0">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-full flex-shrink-0 mr-3 md:mr-4"></div>
          <div className="flex flex-col justify-center">
            <div className="h-6 bg-gray-300 rounded w-40 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-3 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-10"></div>
            </div>
          </div>
        </div>

        {/* 홈구장 정보 */}
        <div className="border-t md:border-t-0 md:border-l border-gray-200 p-2 md:p-4 flex-1 w-full md:w-auto">
          <div className="flex gap-3">
            <div className="w-24 h-16 md:w-36 md:h-24 bg-gray-200 rounded overflow-hidden flex-shrink-0"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-300 rounded w-32 mb-2"></div>
              <div className="space-y-1 mb-2">
                <div className="h-3 bg-gray-200 rounded w-40"></div>
                <div className="h-3 bg-gray-200 rounded w-48"></div>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 