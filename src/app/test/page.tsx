'use client';

import { useState } from 'react';
import {
  errorContainerStyles,
  errorCardStyles,
  errorIconStyles,
  errorTitleStyles,
  errorDescriptionStyles,
  errorDigestStyles,
  errorButtonContainerStyles,
  errorPrimaryButtonStyles,
  errorSecondaryButtonStyles,
  domainErrorConfig,
  DomainErrorType
} from '@/shared/styles/error';
import {
  skeletonBase,
  skeletonCard,
  skeletonHeader,
  skeletonText,
  skeletonDivider
} from '@/shared/styles';
import Spinner from '@/shared/components/Spinner';

const domains: DomainErrorType[] = ['boards', 'livescore', 'shop', 'auth', 'settings'];

type TabType = 'error' | 'skeleton';
type SkeletonPageType = 'home' | 'board-list' | 'board-list-image' | 'popular-posts' | 'all-posts' | 'post-detail' | 'livescore' | 'match' | 'settings' | 'shop' | 'league-detail' | 'search' | 'transfers' | 'team' | 'player' | 'user-profile';

export default function ErrorLoadingTestPage() {
  const [selectedDomain, setSelectedDomain] = useState<DomainErrorType>('boards');
  const [activeTab, setActiveTab] = useState<TabType>('skeleton');
  const [selectedSkeletonPage, setSelectedSkeletonPage] = useState<SkeletonPageType>('board-list');

  const skeletonPages: { id: SkeletonPageType; label: string; path: string }[] = [
    { id: 'home', label: '메인 (홈)', path: '/' },
    { id: 'board-list', label: '게시판 목록 (텍스트)', path: '/boards/[slug]' },
    { id: 'board-list-image', label: '게시판 목록 (이미지/핫딜)', path: '/boards/(hotdeal)/hotdeal' },
    { id: 'popular-posts', label: '인기글', path: '/boards/popular' },
    { id: 'all-posts', label: '전체글', path: '/boards/all' },
    { id: 'post-detail', label: '게시글 상세', path: '/boards/[slug]/[postNumber]' },
    { id: 'livescore', label: '라이브스코어', path: '/livescore/football' },
    { id: 'match', label: '경기 상세', path: '/livescore/football/match/[id]' },
    { id: 'league-detail', label: '리그 상세', path: '/livescore/football/leagues/[id]' },
    { id: 'team', label: '팀 상세', path: '/livescore/football/team/[id]' },
    { id: 'player', label: '플레이어 상세', path: '/livescore/football/player/[id]' },
    { id: 'user-profile', label: '유저 프로필', path: '/user/[publicId]' },
    { id: 'search', label: '검색결과', path: '/search' },
    { id: 'transfers', label: '이적시장', path: '/transfers' },
    { id: 'settings', label: '설정', path: '/settings' },
    { id: 'shop', label: '상점', path: '/shop' },
  ];

  return (
    <div className="min-h-screen p-8 bg-[#F5F5F5] dark:bg-[#121212]">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-[#F0F0F0]">
        UI 컴포넌트 테스트
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Error, Loading, Skeleton 컴포넌트 미리보기
      </p>

      {/* 메인 탭 */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'skeleton', label: '스켈레톤' },
          { id: 'error', label: '에러' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#262626] dark:bg-[#3F3F3F] text-white'
                : 'bg-white dark:bg-[#1D1D1D] text-gray-700 dark:text-gray-300 border border-black/7 dark:border-white/10 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'skeleton' && (
        <>
          {/* 스켈레톤 페이지 선택 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {skeletonPages.map((page) => (
              <button
                key={page.id}
                onClick={() => setSelectedSkeletonPage(page.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSkeletonPage === page.id
                    ? 'bg-[#262626] dark:bg-[#3F3F3F] text-white'
                    : 'bg-white dark:bg-[#1D1D1D] text-gray-700 dark:text-gray-300 border border-black/7 dark:border-white/10 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
                }`}
              >
                {page.label}
              </button>
            ))}
          </div>

          {/* 현재 선택된 페이지 정보 */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>파일 경로:</strong> src/app{skeletonPages.find(p => p.id === selectedSkeletonPage)?.path}/loading.tsx
            </p>
          </div>

          {/* 스켈레톤 비교 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 현재 스켈레톤 */}
            <Section title="현재 스켈레톤" subtitle="실제 사용 중인 loading.tsx">
              <div className="bg-[#F5F5F5] dark:bg-[#121212] rounded-lg p-4 min-h-[400px]">
                <CurrentSkeleton page={selectedSkeletonPage} />
              </div>
            </Section>

            {/* 권장 스켈레톤 */}
            <Section title="권장 스켈레톤" subtitle="실제 UI 구조에 맞춘 개선안">
              <div className="bg-[#F5F5F5] dark:bg-[#121212] rounded-lg p-4 min-h-[400px]">
                <RecommendedSkeleton page={selectedSkeletonPage} />
              </div>
            </Section>
          </div>

          {/* 수정 코드 예시 */}
          <Section title="수정 코드" subtitle="권장 스켈레톤 구현 코드">
            <CodePreview page={selectedSkeletonPage} />
          </Section>
        </>
      )}

      {activeTab === 'error' && (
        <>
          {/* 도메인 선택 탭 */}
          <div className="flex flex-wrap gap-2 mb-8">
            {domains.map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDomain === domain
                    ? 'bg-[#262626] dark:bg-[#3F3F3F] text-white'
                    : 'bg-white dark:bg-[#1D1D1D] text-gray-700 dark:text-gray-300 border border-black/7 dark:border-white/10 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
                }`}
              >
                {domainErrorConfig[domain].icon} {domain}
              </button>
            ))}
          </div>

          {/* Error 미리보기 */}
          <Section title="Error 컴포넌트" subtitle={`${selectedDomain}/error.tsx 미리보기`}>
            <ErrorPreview domain={selectedDomain} />
          </Section>

          {/* Loading 미리보기 */}
          <Section title="Loading 컴포넌트" subtitle="Spinner 컴포넌트 미리보기">
            <LoadingPreview />
          </Section>

          {/* 전체 도메인 Error 비교 */}
          <Section title="전체 도메인 Error 비교" subtitle="모든 도메인의 에러 페이지 한눈에 보기">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {domains.map((domain) => (
                <ErrorMiniPreview key={domain} domain={domain} />
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

// ============================================
// 현재 스켈레톤 컴포넌트들
// ============================================

function CurrentSkeleton({ page }: { page: SkeletonPageType }) {
  switch (page) {
    case 'home':
      return <CurrentHomeSkeleton />;
    case 'board-list':
      return <CurrentBoardListSkeleton />;
    case 'board-list-image':
      return <CurrentBoardListImageSkeleton />;
    case 'popular-posts':
      return <CurrentPopularPostsSkeleton />;
    case 'all-posts':
      return <CurrentAllPostsSkeleton />;
    case 'post-detail':
      return <CurrentPostDetailSkeleton />;
    case 'livescore':
      return <CurrentLivescoreSkeleton />;
    case 'match':
      return <CurrentMatchSkeleton />;
    case 'league-detail':
      return <CurrentLeagueDetailSkeleton />;
    case 'team':
      return <CurrentTeamSkeleton />;
    case 'player':
      return <CurrentPlayerSkeleton />;
    case 'user-profile':
      return <CurrentUserProfileSkeleton />;
    case 'search':
      return <CurrentSearchSkeleton />;
    case 'transfers':
      return <CurrentTransfersSkeleton />;
    case 'settings':
      return <CurrentSettingsSkeleton />;
    case 'shop':
      return <CurrentShopSkeleton />;
    default:
      return null;
  }
}

function CurrentHomeSkeleton() {
  return (
    <div className="scale-90 origin-top space-y-4">
      {/* 게시판 바로가기 아이콘 (6개) */}
      <nav className="w-full grid grid-cols-6 gap-2 bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 p-3 rounded-lg">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={`${skeletonBase} w-12 h-12 rounded-lg`} />
            <div className={`${skeletonText} w-8`} />
          </div>
        ))}
      </nav>

      {/* 라이브스코어 위젯 */}
      <div className={skeletonCard}>
        <div className="h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-24`} />
          <div className={`${skeletonText} w-16`} />
        </div>
        <div className="h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626]">
          <div className="flex items-center gap-3">
            <div className={`${skeletonBase} w-5 h-5 rounded-full`} />
            <div className={`${skeletonText} w-28`} />
          </div>
          <div className={`${skeletonBase} w-4 h-4 rounded`} />
        </div>
        <div className={skeletonDivider}>
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-12 px-4 flex items-center">
              <div className={`${skeletonBase} w-14 h-5 rounded`} />
              <div className="flex-1 flex items-center justify-center gap-2">
                <div className={`${skeletonText} w-16`} />
                <div className={`${skeletonBase} w-6 h-6 rounded-full`} />
                <div className={`${skeletonText} w-10`} />
                <div className={`${skeletonBase} w-6 h-6 rounded-full`} />
                <div className={`${skeletonText} w-16`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 게시판 모음 위젯 */}
      <div className={skeletonCard}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-20`} />
        </div>
        <div className="px-4 py-2 flex gap-2 border-b border-black/5 dark:border-white/10">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className={`${skeletonBase} w-16 h-7 rounded-full`} />
          ))}
        </div>
        <div className={skeletonDivider}>
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className={`${skeletonText} w-14`} />
              <div className={`${skeletonText} flex-1`} />
              <div className={`${skeletonText} w-10`} />
            </div>
          ))}
        </div>
      </div>

      {/* 최신 게시글 위젯 */}
      <div className={skeletonCard}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-20`} />
        </div>
        <div className={skeletonDivider}>
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className={`${skeletonText} w-14`} />
              <div className={`${skeletonText} flex-1`} />
              <div className={`${skeletonText} w-10`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CurrentBoardListSkeleton() {
  return (
    <div className="scale-90 origin-top">
      {/* 브레드크럼 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <div className={`${skeletonText} w-8`} />
            <div className={`${skeletonBase} w-3.5 h-3.5 rounded`} />
            <div className={`${skeletonText} w-16`} />
            <div className={`${skeletonBase} w-3.5 h-3.5 rounded`} />
            <div className={`${skeletonText} w-20`} />
          </div>
        </div>
      </div>

      {/* 게시판 헤더 + 공지 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
          <div className={`${skeletonText} w-24`} />
          <div className="ml-auto">
            <div className={`${skeletonBase} w-8 h-8 rounded-full`} />
          </div>
        </div>
        {/* 공지사항 영역 */}
        <div className="px-4 py-2 border-b border-black/5 dark:border-white/10">
          <div className={`${skeletonText} w-48`} />
        </div>
      </div>

      {/* 인기글 위젯 - PC (오늘 BEST / 이번주 BEST) */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="grid grid-cols-2">
          {/* 오늘 BEST */}
          <div className="border-r border-black/5 dark:border-white/10">
            <div className="h-12 px-4 flex items-center gap-2 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
              <div className={`${skeletonBase} w-4 h-4 rounded`} />
              <div className={`${skeletonText} w-20`} />
            </div>
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="px-3 py-1.5 flex items-center gap-2">
                  <div className={`${skeletonText} w-4`} />
                  <div className={`${skeletonText} flex-1`} />
                </div>
              ))}
            </div>
          </div>
          {/* 이번주 BEST */}
          <div>
            <div className="h-12 px-4 flex items-center gap-2 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
              <div className={`${skeletonBase} w-4 h-4 rounded`} />
              <div className={`${skeletonText} w-24`} />
            </div>
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="px-3 py-1.5 flex items-center gap-2">
                  <div className={`${skeletonText} w-4`} />
                  <div className={`${skeletonText} flex-1`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 호버 메뉴 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1">
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
          </div>
        </div>
      </div>

      {/* 게시글 목록 */}
      <div className={skeletonCard}>
        <div className={skeletonDivider}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className={`${skeletonText} w-14`} />
              <div className={`${skeletonText} flex-1`} />
              <div className={`${skeletonText} w-16 hidden sm:block`} />
              <div className={`${skeletonText} w-10`} />
            </div>
          ))}
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center gap-2 mt-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className={`${skeletonBase} w-10 h-10`} />
        ))}
      </div>
    </div>
  );
}

function CurrentBoardListImageSkeleton() {
  return (
    <div className="scale-90 origin-top">
      {/* 브레드크럼 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <div className={`${skeletonText} w-8`} />
            <div className={`${skeletonBase} w-3.5 h-3.5 rounded`} />
            <div className={`${skeletonText} w-16`} />
            <div className={`${skeletonBase} w-3.5 h-3.5 rounded`} />
            <div className={`${skeletonText} w-20`} />
          </div>
        </div>
      </div>

      {/* 게시판 헤더 + 공지 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
          <div className={`${skeletonText} w-24`} />
          <div className="ml-auto">
            <div className={`${skeletonBase} w-8 h-8 rounded-full`} />
          </div>
        </div>
        <div className="px-4 py-2 border-b border-black/5 dark:border-white/10">
          <div className={`${skeletonText} w-48`} />
        </div>
      </div>

      {/* 인기글 위젯 - PC (오늘 BEST / 이번주 BEST) */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="grid grid-cols-2">
          {/* 오늘 BEST */}
          <div className="border-r border-black/5 dark:border-white/10">
            <div className="h-12 px-4 flex items-center gap-2 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
              <div className={`${skeletonBase} w-4 h-4 rounded`} />
              <div className={`${skeletonText} w-20`} />
            </div>
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="px-3 py-1.5 flex items-center gap-2">
                  <div className={`${skeletonText} w-4`} />
                  <div className={`${skeletonText} flex-1`} />
                </div>
              ))}
            </div>
          </div>
          {/* 이번주 BEST */}
          <div>
            <div className="h-12 px-4 flex items-center gap-2 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
              <div className={`${skeletonBase} w-4 h-4 rounded`} />
              <div className={`${skeletonText} w-24`} />
            </div>
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="px-3 py-1.5 flex items-center gap-2">
                  <div className={`${skeletonText} w-4`} />
                  <div className={`${skeletonText} flex-1`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 호버 메뉴 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1">
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
          </div>
        </div>
      </div>

      {/* 게시글 목록 - image-table 타입 (썸네일 포함) */}
      <div className={skeletonCard}>
        <div className={skeletonDivider}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-2">
              {/* 추천 수 (데스크톱) */}
              <div className="hidden sm:flex flex-col items-center gap-1 min-w-[40px]">
                <div className={`${skeletonText} w-6`} />
                <div className={`${skeletonBase} w-4 h-4 rounded`} />
              </div>

              {/* 썸네일 이미지 */}
              <div className={`${skeletonBase} w-20 h-14 sm:w-24 sm:h-16 rounded-lg flex-shrink-0`} />

              {/* 게시글 정보 */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className={`${skeletonText} w-full max-w-[300px]`} />
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`${skeletonText} w-16`} />
                    <div className={`${skeletonText} w-12`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`${skeletonText} w-10`} />
                    <div className={`${skeletonText} w-10`} />
                    <div className={`${skeletonText} w-12`} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center gap-2 mt-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className={`${skeletonBase} w-10 h-10`} />
        ))}
      </div>
    </div>
  );
}

function CurrentPopularPostsSkeleton() {
  return (
    <div className="scale-90 origin-top">
      {/* 게시판 헤더 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
          <div className={`${skeletonText} w-32`} />
          <div className="ml-auto">
            <div className={`${skeletonBase} w-8 h-8 rounded-full`} />
          </div>
        </div>
      </div>

      {/* 기간 필터 (오늘/이번주/이번달/전체) */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className={`${skeletonBase} w-12 h-8 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-8 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-8 rounded-md`} />
            <div className={`${skeletonBase} w-12 h-8 rounded-md`} />
          </div>
        </div>
      </div>

      {/* 호버 메뉴 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1">
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
          </div>
        </div>
      </div>

      {/* 게시글 목록 - 카드 스타일 (썸네일 포함) */}
      <div className={skeletonCard}>
        <div className={skeletonDivider}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-2">
              {/* 추천 수 (데스크톱) */}
              <div className="hidden sm:flex flex-col items-center gap-1 min-w-[40px]">
                <div className={`${skeletonText} w-6`} />
                <div className={`${skeletonBase} w-4 h-4 rounded`} />
              </div>

              {/* 썸네일 이미지 */}
              <div className={`${skeletonBase} w-20 h-14 sm:w-24 sm:h-16 rounded-lg flex-shrink-0`} />

              {/* 게시글 정보 */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className={`${skeletonText} w-full max-w-[300px]`} />
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`${skeletonText} w-16`} />
                    <div className={`${skeletonText} w-12`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`${skeletonText} w-10`} />
                    <div className={`${skeletonText} w-10`} />
                    <div className={`${skeletonText} w-12`} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center gap-2 mt-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className={`${skeletonBase} w-10 h-10`} />
        ))}
      </div>
    </div>
  );
}

function CurrentAllPostsSkeleton() {
  return (
    <div className="scale-90 origin-top">
      {/* 게시판 헤더 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
          <div className={`${skeletonText} w-20`} />
          <div className="ml-auto">
            <div className={`${skeletonBase} w-8 h-8 rounded-full`} />
          </div>
        </div>
      </div>

      {/* 호버 메뉴 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1">
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
          </div>
        </div>
      </div>

      {/* 게시글 목록 - 카드 스타일 (썸네일 포함) */}
      <div className={skeletonCard}>
        <div className={skeletonDivider}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-2">
              {/* 추천 수 (데스크톱) */}
              <div className="hidden sm:flex flex-col items-center gap-1 min-w-[40px]">
                <div className={`${skeletonText} w-6`} />
                <div className={`${skeletonBase} w-4 h-4 rounded`} />
              </div>

              {/* 썸네일 이미지 */}
              <div className={`${skeletonBase} w-20 h-14 sm:w-24 sm:h-16 rounded-lg flex-shrink-0`} />

              {/* 게시글 정보 */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className={`${skeletonText} w-full max-w-[300px]`} />
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`${skeletonText} w-16`} />
                    <div className={`${skeletonText} w-12`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`${skeletonText} w-10`} />
                    <div className={`${skeletonText} w-10`} />
                    <div className={`${skeletonText} w-12`} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center gap-2 mt-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className={`${skeletonBase} w-10 h-10`} />
        ))}
      </div>
    </div>
  );
}

function CurrentPostDetailSkeleton() {
  return (
    <div className="scale-90 origin-top">
      {/* 브레드크럼 */}
      <div className="flex gap-2 mb-4 py-2">
        <div className={`${skeletonBase} w-12 h-4 rounded`} />
        <span className="text-gray-300 dark:text-gray-600">&gt;</span>
        <div className={`${skeletonBase} w-16 h-4 rounded`} />
        <span className="text-gray-300 dark:text-gray-600">&gt;</span>
        <div className={`${skeletonBase} w-20 h-4 rounded`} />
      </div>

      {/* 게시글 컨테이너 */}
      <div className={`${skeletonCard} mb-4`}>
        {/* 게시글 헤더 */}
        <div className="p-4 border-b border-black/5 dark:border-white/10">
          {/* 제목 */}
          <div className={`${skeletonBase} w-3/4 h-7 rounded mb-4`} />
          {/* 작성자 정보 */}
          <div className="flex items-center gap-3">
            <div className={`${skeletonBase} w-10 h-10 rounded-full`} />
            <div className="flex-1">
              <div className={`${skeletonBase} w-20 h-4 rounded mb-1`} />
              <div className="flex gap-3">
                <div className={`${skeletonBase} w-24 h-3 rounded`} />
                <div className={`${skeletonBase} w-16 h-3 rounded`} />
              </div>
            </div>
          </div>
        </div>

        {/* 게시글 본문 */}
        <div className="p-4 min-h-[120px]">
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className={`${skeletonText} ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-5/6' : 'w-4/5'}`} />
            ))}
          </div>
        </div>

        {/* 좋아요/싫어요 버튼 */}
        <div className="p-4 border-t border-black/5 dark:border-white/10">
          <div className="flex justify-center gap-4">
            <div className={`${skeletonBase} w-24 h-10 rounded-lg`} />
            <div className={`${skeletonBase} w-24 h-10 rounded-lg`} />
          </div>
        </div>
      </div>

      {/* 하단 버튼 영역 (PostFooter) */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-12 px-4 flex items-center justify-around">
          <div className={`${skeletonBase} w-16 h-7 rounded`} />
          <div className={`${skeletonBase} w-16 h-7 rounded`} />
          <div className={`${skeletonBase} w-16 h-7 rounded`} />
        </div>
      </div>

      {/* 이전글/다음글 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className={skeletonDivider}>
          <div className="px-4 py-3 flex items-center gap-3">
            <div className={`${skeletonBase} w-14 h-4 rounded`} />
            <div className={`${skeletonText} flex-1`} />
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <div className={`${skeletonBase} w-14 h-4 rounded`} />
            <div className={`${skeletonText} flex-1`} />
          </div>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-20`} />
        </div>
        <div className="p-4 space-y-4">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className={`${skeletonBase} w-10 h-10 rounded-full flex-shrink-0`} />
              <div className="flex-1 space-y-2">
                <div className={`${skeletonText} w-16`} />
                <div className={`${skeletonText} w-full`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 호버 메뉴 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1">
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
          </div>
        </div>
      </div>

      {/* 관련 게시글 목록 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className={skeletonDivider}>
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className={`${skeletonText} w-14`} />
              <div className={`${skeletonText} flex-1`} />
              <div className={`${skeletonText} w-10`} />
            </div>
          ))}
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center gap-2">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className={`${skeletonBase} w-10 h-10 rounded`} />
        ))}
      </div>
    </div>
  );
}

function CurrentMatchSkeleton() {
  return (
    <div className="scale-90 origin-top">
      <div className="flex gap-4">
        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-w-0">
          {/* 경기 헤더 */}
          <div className="mb-4 bg-white dark:bg-[#1D1D1D] p-4 rounded-lg border border-black/7 dark:border-0">
            {/* 리그 정보 + 날짜 */}
            <div className="flex items-center gap-2 justify-between mb-3 border-b border-black/5 dark:border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <div className={`${skeletonBase} w-6 h-6 rounded-full`} />
                <div className={`${skeletonBase} h-4 w-20 rounded`} />
              </div>
              <div className="flex flex-col items-center">
                <div className={`${skeletonBase} h-5 w-16 rounded mb-1`} />
                <div className={`${skeletonBase} h-3 w-24 rounded`} />
              </div>
              <div className="w-20" />
            </div>

            {/* 팀 vs 팀 */}
            <div className="flex justify-between items-center py-2">
              <div className="w-1/3 flex flex-col items-center">
                <div className={`${skeletonBase} w-14 h-14 rounded-full mb-2`} />
                <div className={`${skeletonBase} h-4 w-20 rounded mb-1`} />
              </div>
              <div className="flex flex-col items-center">
                <div className={`${skeletonBase} h-8 w-20 rounded mb-2`} />
              </div>
              <div className="w-1/3 flex flex-col items-center">
                <div className={`${skeletonBase} w-14 h-14 rounded-full mb-2`} />
                <div className={`${skeletonBase} h-4 w-20 rounded mb-1`} />
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className={`${skeletonCard} mb-4`}>
            <div className="px-4 py-3 flex gap-4">
              {['개요', '라인업', '통계', '순위'].map((_, i) => (
                <div key={i} className={`${skeletonBase} w-16 h-8 rounded`} />
              ))}
            </div>
          </div>

          {/* 탭 콘텐츠 */}
          <div className={skeletonCard}>
            <div className="p-4 space-y-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className={`${skeletonText} ${i % 2 === 0 ? 'w-full' : 'w-3/4'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* 사이드바 - 데스크탑에서만 표시 */}
        <aside className="hidden xl:block w-[200px] shrink-0">
          {/* 경기 상세정보 스켈레톤 */}
          <div className={skeletonCard}>
            <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
              <div className={`${skeletonBase} w-20 h-4 rounded`} />
            </div>
            <div className="px-4 py-3 space-y-2.5">
              {Array(7).fill(0).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className={`${skeletonBase} w-10 h-3 rounded`} />
                  <div className={`${skeletonBase} w-16 h-3 rounded`} />
                </div>
              ))}
            </div>
          </div>

          {/* 승무패 예측 스켈레톤 */}
          <div className={`${skeletonCard} mt-3`}>
            <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
              <div className={`${skeletonBase} w-16 h-4 rounded`} />
            </div>
            <div className="p-3">
              <div className="flex justify-between gap-1 mb-2">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className={`${skeletonBase} flex-1 h-8 rounded`} />
                ))}
              </div>
              <div className={`${skeletonBase} w-full h-2 rounded-full`} />
            </div>
          </div>

          {/* 응원 댓글 스켈레톤 */}
          <div className={`${skeletonCard} mt-3`}>
            <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
              <div className={`${skeletonBase} w-16 h-4 rounded`} />
            </div>
            <div className="p-3 space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`${skeletonBase} w-6 h-6 rounded-full shrink-0`} />
                  <div className="flex-1 space-y-1">
                    <div className={`${skeletonBase} w-12 h-2 rounded`} />
                    <div className={`${skeletonBase} w-full h-3 rounded`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CurrentSettingsSkeleton() {
  return (
    <div className="scale-90 origin-top max-w-md mx-auto">
      {/* 설정 헤더 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className={skeletonHeader} />
      </div>

      {/* 설정 메뉴 */}
      <div className={skeletonCard}>
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-4 flex items-center gap-4">
              <div className={`${skeletonBase} w-10 h-10 rounded-full`} />
              <div className="flex-1 space-y-2">
                <div className={`${skeletonText} w-24`} />
                <div className={`${skeletonText} w-40 opacity-60`} />
              </div>
              <div className={`${skeletonBase} w-6 h-6 rounded`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CurrentShopSkeleton() {
  return (
    <div className="scale-90 origin-top">
      {/* 상점 헤더 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
          <div className={`${skeletonText} w-24`} />
          <div className="ml-auto flex items-center gap-2">
            <div className={`${skeletonText} w-20`} />
          </div>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="p-4 flex gap-2">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className={`${skeletonBase} h-9 w-20 rounded-full`} />
          ))}
        </div>
      </div>

      {/* 아이템 그리드 */}
      <div className={skeletonCard}>
        <div className={skeletonHeader} />
        <div className="p-4 grid grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={`${skeletonBase} w-16 h-16 rounded-lg`} />
              <div className={`${skeletonText} w-12`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CurrentLeagueDetailSkeleton() {
  return (
    <div className="scale-90 origin-top space-y-4">
      {/* 리그 헤더 */}
      <div className={skeletonCard}>
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className={`${skeletonBase} w-16 h-16 rounded-lg`} />
            <div className="flex-1">
              <div className={`${skeletonBase} w-40 h-6 rounded mb-2`} />
              <div className={`${skeletonText} w-24`} />
            </div>
          </div>
        </div>
      </div>

      {/* 순위 테이블 */}
      <div className={skeletonCard}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-20`} />
        </div>

        {/* 테이블 헤더 */}
        <div className="px-4 py-3 border-b border-black/5 dark:border-white/10 flex items-center gap-4">
          <div className={`${skeletonText} w-8`} />
          <div className={`${skeletonText} w-32`} />
          <div className={`${skeletonText} w-8`} />
          <div className={`${skeletonText} w-8`} />
          <div className={`${skeletonText} w-8`} />
        </div>

        {/* 테이블 행들 */}
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-black/5 dark:border-white/10 flex items-center gap-4">
            <div className={`${skeletonText} w-6`} />
            <div className="flex items-center gap-2 w-32">
              <div className={`${skeletonBase} w-6 h-6 rounded`} />
              <div className={`${skeletonText} w-20`} />
            </div>
            <div className={`${skeletonText} w-6`} />
            <div className={`${skeletonText} w-6`} />
            <div className={`${skeletonText} w-8`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CurrentUserProfileSkeleton() {
  return (
    <div className="scale-90 origin-top">
      {/* 프로필 헤더 */}
      <div className={skeletonCard}>
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className={`${skeletonBase} w-20 h-20 rounded-full`} />
            <div className="flex-1">
              <div className={`${skeletonBase} w-32 h-6 rounded mb-2`} />
              <div className="flex items-center gap-2 mb-2">
                <div className={`${skeletonBase} w-16 h-5 rounded`} />
                <div className={`${skeletonText} w-20`} />
              </div>
              <div className="flex items-center gap-4">
                <div className={`${skeletonText} w-16`} />
                <div className={`${skeletonText} w-16`} />
                <div className={`${skeletonText} w-16`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 + 게시글 목록 */}
      <div className={`${skeletonCard} mt-4`}>
        <div className="px-4 py-2.5 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-1">
            <div className={`${skeletonBase} w-20 h-8 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-8 rounded-md`} />
          </div>
        </div>

        <div className={skeletonDivider}>
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className={`${skeletonText} w-14`} />
              <div className={`${skeletonText} flex-1`} />
              <div className={`${skeletonText} w-10`} />
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-2 py-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className={`${skeletonBase} w-10 h-10 rounded`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CurrentSearchSkeleton() {
  return (
    <div className="scale-90 origin-top">
      {/* 검색 헤더 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-4 sm:px-6">
          <div className={`${skeletonBase} w-48 h-6 rounded mb-2`} />
          <div className={`${skeletonText} w-64`} />
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-3 flex gap-2">
          <div className={`${skeletonBase} w-16 h-8 rounded-full`} />
          <div className={`${skeletonBase} w-12 h-8 rounded-full`} />
          <div className={`${skeletonBase} w-16 h-8 rounded-full`} />
          <div className={`${skeletonBase} w-12 h-8 rounded-full`} />
        </div>
      </div>

      {/* 검색 결과 목록 */}
      <div className={skeletonCard}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-20`} />
        </div>
        <div className={skeletonDivider}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className={`${skeletonBase} w-10 h-10 rounded-full flex-shrink-0`} />
              <div className="flex-1 space-y-2">
                <div className={`${skeletonText} w-3/4`} />
                <div className={`${skeletonText} w-1/2 opacity-70`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center gap-2 mt-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className={`${skeletonBase} w-10 h-10 rounded`} />
        ))}
      </div>
    </div>
  );
}

function CurrentTransfersSkeleton() {
  return (
    <div className="scale-90 origin-top">
      {/* 헤더 섹션 */}
      <div className={skeletonCard}>
        <div className="h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-20`} />
          <div className="flex items-center gap-2">
            <div className={`${skeletonBase} w-2 h-2 rounded-full`} />
            <div className={`${skeletonText} w-24`} />
          </div>
        </div>
        <div className="px-4 py-3 bg-white dark:bg-[#1D1D1D]">
          <div className={`${skeletonText} w-64`} />
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className={`${skeletonCard} mt-4`}>
        <div className="px-4 py-3 flex flex-wrap gap-2">
          <div className={`${skeletonBase} w-28 h-9 rounded-lg`} />
          <div className={`${skeletonBase} w-28 h-9 rounded-lg`} />
          <div className={`${skeletonBase} w-24 h-9 rounded-lg`} />
          <div className={`${skeletonBase} w-20 h-9 rounded-lg`} />
        </div>
      </div>

      {/* 이적 목록 */}
      <div className={`${skeletonCard} mt-4`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-28`} />
        </div>
        <div className={skeletonDivider}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className={`${skeletonBase} w-10 h-10 rounded-full flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className={`${skeletonText} w-24 mb-1`} />
                <div className="flex items-center gap-2">
                  <div className={`${skeletonBase} w-5 h-5 rounded`} />
                  <div className={`${skeletonText} w-20`} />
                  <span className="text-gray-400">→</span>
                  <div className={`${skeletonBase} w-5 h-5 rounded`} />
                  <div className={`${skeletonText} w-20`} />
                </div>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                <div className={`${skeletonText} w-16 mb-1`} />
                <div className={`${skeletonText} w-20 opacity-70`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CurrentTeamSkeleton() {
  return (
    <div className="scale-90 origin-top">
      {/* 팀 헤더 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="flex flex-col md:flex-row items-start">
          {/* 팀 로고 및 기본 정보 */}
          <div className="flex items-center p-2 md:p-4 md:w-96 flex-shrink-0">
            <div className={`${skeletonBase} w-16 h-16 md:w-20 md:h-20 rounded-lg mr-3 md:mr-4 flex-shrink-0`} />
            <div className="flex flex-col justify-center">
              <div className={`${skeletonBase} w-32 h-6 rounded mb-2`} />
              <div className={`${skeletonText} w-20 mb-1`} />
              <div className="flex items-center gap-2">
                <div className={`${skeletonText} w-24`} />
                <div className={`${skeletonBase} w-10 h-5 rounded`} />
              </div>
            </div>
          </div>

          {/* 홈구장 정보 */}
          <div className="border-t md:border-t-0 md:border-l border-black/5 dark:border-white/10 p-2 md:p-4 flex-1 w-full">
            <div className="flex gap-3">
              <div className={`${skeletonBase} w-24 h-16 md:w-36 md:h-24 rounded flex-shrink-0`} />
              <div className="flex-1">
                <div className={`${skeletonBase} w-32 h-5 rounded mb-2`} />
                <div className={`${skeletonText} w-40 mb-1`} />
                <div className={`${skeletonText} w-28`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1">
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
          </div>
        </div>
      </div>

      {/* 탭 콘텐츠 - 개요 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 최근 경기 */}
        <div className={skeletonCard}>
          <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
            <div className={`${skeletonText} w-20`} />
          </div>
          <div className="p-4 space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`${skeletonText} w-16`} />
                <div className={`${skeletonBase} w-5 h-5 rounded`} />
                <div className={`${skeletonText} w-20`} />
                <div className={`${skeletonText} w-10`} />
                <div className={`${skeletonBase} w-5 h-5 rounded`} />
                <div className={`${skeletonText} w-20`} />
              </div>
            ))}
          </div>
        </div>

        {/* 리그 순위 */}
        <div className={skeletonCard}>
          <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
            <div className={`${skeletonText} w-20`} />
          </div>
          <div className="p-4 space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`${skeletonText} w-6`} />
                <div className={`${skeletonBase} w-5 h-5 rounded`} />
                <div className={`${skeletonText} flex-1`} />
                <div className={`${skeletonText} w-8`} />
                <div className={`${skeletonText} w-8`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrentPlayerSkeleton() {
  return (
    <div className="scale-90 origin-top">
      {/* 선수 헤더 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* 선수 사진 */}
            <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
              <div className={`${skeletonBase} w-full h-full rounded-full`} />
              <div className={`${skeletonBase} absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 rounded-full`} />
            </div>

            {/* 선수 정보 */}
            <div className="flex-1 min-w-0">
              <div className={`${skeletonBase} w-32 h-6 rounded mb-2`} />
              <div className="flex items-center gap-2 mb-1">
                <div className={`${skeletonBase} w-5 h-5 rounded`} />
                <div className={`${skeletonText} w-24`} />
              </div>
              <div className={`${skeletonText} w-16`} />
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col">
                <div className={`${skeletonText} w-12 mb-1 opacity-70`} />
                <div className={`${skeletonText} w-20`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1">
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
          </div>
        </div>
      </div>

      {/* 탭 콘텐츠 - 통계 */}
      <div className={skeletonCard}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-24`} />
        </div>

        {/* 시즌 통계 테이블 */}
        <div className="p-4">
          {/* 테이블 헤더 */}
          <div className="flex items-center gap-4 mb-3 pb-2 border-b border-black/5 dark:border-white/10">
            <div className={`${skeletonText} w-16`} />
            <div className={`${skeletonText} w-12`} />
            <div className={`${skeletonText} w-10`} />
            <div className={`${skeletonText} w-10`} />
            <div className={`${skeletonText} w-10`} />
            <div className={`${skeletonText} w-10`} />
          </div>

          {/* 테이블 행들 */}
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <div className="flex items-center gap-2 w-32">
                <div className={`${skeletonBase} w-5 h-5 rounded`} />
                <div className={`${skeletonText} w-20`} />
              </div>
              <div className={`${skeletonText} w-8`} />
              <div className={`${skeletonText} w-8`} />
              <div className={`${skeletonText} w-8`} />
              <div className={`${skeletonText} w-8`} />
              <div className={`${skeletonText} w-8`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CurrentLivescoreSkeleton() {
  return (
    <div className="scale-90 origin-top">
      {/* 날짜 네비게이션 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-14 flex items-center justify-center gap-2 px-4">
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className={`${skeletonBase} w-12 h-10 rounded-lg`} />
          ))}
        </div>
      </div>

      {/* 리그별 경기 목록 */}
      {Array(3).fill(0).map((_, leagueIdx) => (
        <div key={leagueIdx} className={`${skeletonCard} mb-4`}>
          {/* 리그 헤더 */}
          <div className="h-12 px-4 flex items-center gap-2 bg-[#F5F5F5] dark:bg-[#262626]">
            <div className={`${skeletonBase} w-6 h-6 rounded-full`} />
            <div className={`${skeletonText} w-32`} />
          </div>
          {/* 경기 목록 */}
          <div className={skeletonDivider}>
            {Array(3).fill(0).map((_, matchIdx) => (
              <div key={matchIdx} className="px-4 py-3 flex items-center">
                <div className={`${skeletonText} w-12`} />
                <div className="flex-1 flex items-center justify-center gap-2">
                  <div className={`${skeletonText} w-20`} />
                  <div className={`${skeletonBase} w-6 h-6 rounded-full`} />
                  <div className={`${skeletonText} w-10`} />
                  <div className={`${skeletonBase} w-6 h-6 rounded-full`} />
                  <div className={`${skeletonText} w-20`} />
                </div>
                <div className={`${skeletonText} w-12`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// 권장 스켈레톤 컴포넌트들
// ============================================

function RecommendedSkeleton({ page }: { page: SkeletonPageType }) {
  switch (page) {
    case 'home':
      return <CurrentHomeSkeleton />;
    case 'board-list':
      return <RecommendedBoardListSkeleton />;
    case 'board-list-image':
      return <CurrentBoardListImageSkeleton />;
    case 'popular-posts':
      return <CurrentPopularPostsSkeleton />;
    case 'all-posts':
      return <CurrentAllPostsSkeleton />;
    case 'post-detail':
      return <RecommendedPostDetailSkeleton />;
    case 'livescore':
      return <CurrentLivescoreSkeleton />;
    case 'match':
      return <RecommendedMatchSkeleton />;
    case 'league-detail':
      return <CurrentLeagueDetailSkeleton />;
    case 'team':
      return <CurrentTeamSkeleton />;
    case 'player':
      return <CurrentPlayerSkeleton />;
    case 'user-profile':
      return <CurrentUserProfileSkeleton />;
    case 'search':
      return <CurrentSearchSkeleton />;
    case 'transfers':
      return <CurrentTransfersSkeleton />;
    case 'settings':
      return <RecommendedSettingsSkeleton />;
    case 'shop':
      return <RecommendedShopSkeleton />;
    default:
      return null;
  }
}

function RecommendedBoardListSkeleton() {
  return (
    <div className="scale-90 origin-top">
      {/* 게시판 헤더 + 공지 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
          <div className={`${skeletonText} w-24`} />
          <div className="ml-auto">
            <div className={`${skeletonBase} w-8 h-8 rounded-full`} />
          </div>
        </div>
        {/* 공지사항 영역 */}
        <div className="px-4 py-2 border-b border-black/5 dark:border-white/10">
          <div className={`${skeletonText} w-48`} />
        </div>
      </div>

      {/* 인기글 위젯 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="p-4">
          <div className="flex gap-2 mb-3">
            <div className={`${skeletonBase} w-16 h-8 rounded-full`} />
            <div className={`${skeletonBase} w-16 h-8 rounded-full`} />
          </div>
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`${skeletonBase} w-5 h-5 rounded`} />
                <div className={`${skeletonText} flex-1`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 호버 메뉴 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1">
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
          </div>
        </div>
      </div>

      {/* 게시글 목록 */}
      <div className={skeletonCard}>
        <div className={skeletonDivider}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className={`${skeletonText} w-14`} />
              <div className={`${skeletonText} flex-1`} />
              <div className={`${skeletonText} w-16 hidden sm:block`} />
              <div className={`${skeletonText} w-10`} />
            </div>
          ))}
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center gap-2 mt-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className={`${skeletonBase} w-10 h-10`} />
        ))}
      </div>
    </div>
  );
}

function RecommendedPostDetailSkeleton() {
  return (
    <div className="scale-90 origin-top">
      {/* 브레드크럼 */}
      <div className="flex gap-2 mb-4">
        <div className={`${skeletonText} w-16`} />
        <span className="text-gray-300">/</span>
        <div className={`${skeletonText} w-20`} />
      </div>

      {/* 게시글 카드 */}
      <div className={skeletonCard}>
        {/* 헤더 */}
        <div className="p-4 border-b border-black/5 dark:border-white/10">
          <div className={`${skeletonBase} w-3/4 h-6 rounded mb-3`} />
          <div className="flex gap-4">
            <div className={`${skeletonText} w-20`} />
            <div className={`${skeletonText} w-24`} />
            <div className={`${skeletonText} w-16`} />
          </div>
        </div>

        {/* 본문 */}
        <div className="p-4">
          <div className="space-y-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className={`${skeletonText} ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-5/6' : 'w-4/5'}`} />
            ))}
          </div>
        </div>

        {/* 좋아요/싫어요 */}
        <div className="flex justify-center gap-4 py-4 border-t border-black/5 dark:border-white/10">
          <div className={`${skeletonBase} w-20 h-10 rounded-lg`} />
          <div className={`${skeletonBase} w-20 h-10 rounded-lg`} />
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className={`${skeletonCard} mt-4`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-20`} />
        </div>
        <div className="p-4 space-y-4">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className={`${skeletonBase} w-10 h-10 rounded-full flex-shrink-0`} />
              <div className="flex-1 space-y-2">
                <div className={`${skeletonText} w-24`} />
                <div className={`${skeletonText} w-full`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecommendedMatchSkeleton() {
  return (
    <div className="scale-90 origin-top">
      <div className="flex gap-4">
        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-w-0">
          {/* 경기 헤더 */}
          <div className="mb-4 bg-white dark:bg-[#1D1D1D] p-4 rounded-lg border border-black/7 dark:border-0">
            {/* 리그 정보 + 날짜 */}
            <div className="flex items-center gap-2 justify-between mb-3 border-b border-black/5 dark:border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <div className={`${skeletonBase} w-6 h-6 rounded-full`} />
                <div className={`${skeletonBase} h-4 w-20 rounded`} />
              </div>
              <div className="flex flex-col items-center">
                <div className={`${skeletonBase} h-5 w-16 rounded mb-1`} />
                <div className={`${skeletonBase} h-3 w-24 rounded`} />
              </div>
              <div className="w-20" />
            </div>

            {/* 팀 vs 팀 */}
            <div className="flex justify-between items-center py-2">
              <div className="w-1/3 flex flex-col items-center">
                <div className={`${skeletonBase} w-14 h-14 rounded-full mb-2`} />
                <div className={`${skeletonBase} h-4 w-20 rounded mb-1`} />
              </div>
              <div className="flex flex-col items-center">
                <div className={`${skeletonBase} h-8 w-20 rounded mb-2`} />
              </div>
              <div className="w-1/3 flex flex-col items-center">
                <div className={`${skeletonBase} w-14 h-14 rounded-full mb-2`} />
                <div className={`${skeletonBase} h-4 w-20 rounded mb-1`} />
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className={`${skeletonCard} mb-4`}>
            <div className="px-4 py-3 flex gap-4">
              {['개요', '라인업', '통계', '순위'].map((_, i) => (
                <div key={i} className={`${skeletonBase} w-16 h-8 rounded`} />
              ))}
            </div>
          </div>

          {/* 탭 콘텐츠 */}
          <div className={skeletonCard}>
            <div className="p-4 space-y-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className={`${skeletonText} ${i % 2 === 0 ? 'w-full' : 'w-3/4'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* 사이드바 - 데스크탑에서만 표시 */}
        <aside className="hidden xl:block w-[200px] shrink-0">
          {/* 경기 상세정보 스켈레톤 */}
          <div className={skeletonCard}>
            <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
              <div className={`${skeletonBase} w-20 h-4 rounded`} />
            </div>
            <div className="px-4 py-3 space-y-2.5">
              {Array(7).fill(0).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className={`${skeletonBase} w-10 h-3 rounded`} />
                  <div className={`${skeletonBase} w-16 h-3 rounded`} />
                </div>
              ))}
            </div>
          </div>

          {/* 승무패 예측 스켈레톤 */}
          <div className={`${skeletonCard} mt-3`}>
            <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
              <div className={`${skeletonBase} w-16 h-4 rounded`} />
            </div>
            <div className="p-3">
              <div className="flex justify-between gap-1 mb-2">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className={`${skeletonBase} flex-1 h-8 rounded`} />
                ))}
              </div>
              <div className={`${skeletonBase} w-full h-2 rounded-full`} />
            </div>
          </div>

          {/* 응원 댓글 스켈레톤 */}
          <div className={`${skeletonCard} mt-3`}>
            <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
              <div className={`${skeletonBase} w-16 h-4 rounded`} />
            </div>
            <div className="p-3 space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`${skeletonBase} w-6 h-6 rounded-full shrink-0`} />
                  <div className="flex-1 space-y-1">
                    <div className={`${skeletonBase} w-12 h-2 rounded`} />
                    <div className={`${skeletonBase} w-full h-3 rounded`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RecommendedSettingsSkeleton() {
  return (
    <div className="scale-90 origin-top max-w-md mx-auto">
      {/* 설정 헤더 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-16`} />
        </div>
      </div>

      {/* 설정 메뉴 */}
      <div className={skeletonCard}>
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-4 flex items-center gap-4">
              <div className={`${skeletonBase} w-10 h-10 rounded-full`} />
              <div className="flex-1 space-y-2">
                <div className={`${skeletonText} w-24`} />
                <div className={`${skeletonText} w-40 opacity-60`} />
              </div>
              <div className={`${skeletonBase} w-6 h-6 rounded`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecommendedShopSkeleton() {
  return (
    <div className="scale-90 origin-top">
      {/* 상점 헤더 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
          <div className={`${skeletonText} w-24`} />
          <div className="ml-auto flex items-center gap-2">
            <div className={`${skeletonBase} w-6 h-6 rounded`} />
            <div className={`${skeletonText} w-20`} />
          </div>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="p-4 flex gap-2">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className={`${skeletonBase} h-9 w-20 rounded-full`} />
          ))}
        </div>
      </div>

      {/* 아이템 그리드 */}
      <div className={skeletonCard}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-20`} />
        </div>
        <div className="p-4 grid grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={`${skeletonBase} w-16 h-16 rounded-lg`} />
              <div className={`${skeletonText} w-12`} />
              <div className={`${skeletonText} w-10 opacity-60`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 코드 미리보기
// ============================================

function CodePreview({ page }: { page: SkeletonPageType }) {
  const codes: Record<SkeletonPageType, string> = {
    'home': `// src/app/loading.tsx
// 메인 페이지 스켈레톤 - 5개 위젯 구조 반영
// 이미 최적화된 상태`,

    'board-list': `import { skeletonBase, skeletonCard, skeletonHeader, skeletonText, skeletonDivider } from '@/shared/styles';

export default function BoardDetailLoading() {
  return (
    <div className="container mx-auto">
      {/* 게시판 헤더 + 공지 */}
      <div className={\`\${skeletonCard} mb-4\`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
          <div className={\`\${skeletonText} w-24\`} />
          <div className="ml-auto">
            <div className={\`\${skeletonBase} w-8 h-8 rounded-full\`} />
          </div>
        </div>
        <div className="px-4 py-2 border-b border-black/5 dark:border-white/10">
          <div className={\`\${skeletonText} w-48\`} />
        </div>
      </div>

      {/* 인기글 위젯 */}
      <div className={\`\${skeletonCard} mb-4\`}>
        <div className="p-4">
          <div className="flex gap-2 mb-3">
            <div className={\`\${skeletonBase} w-16 h-8 rounded-full\`} />
            <div className={\`\${skeletonBase} w-16 h-8 rounded-full\`} />
          </div>
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={\`\${skeletonBase} w-5 h-5 rounded\`} />
                <div className={\`\${skeletonText} flex-1\`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 호버 메뉴 */}
      <div className={\`\${skeletonCard} mb-4\`}>
        <div className="px-4 py-2 flex gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className={\`\${skeletonText} w-16\`} />
          ))}
        </div>
      </div>

      {/* 게시글 목록 */}
      <div className={skeletonCard}>
        <div className={skeletonDivider}>
          {Array(15).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className={\`\${skeletonText} w-14\`} />
              <div className={\`\${skeletonText} flex-1\`} />
              <div className={\`\${skeletonText} w-16 hidden sm:block\`} />
              <div className={\`\${skeletonText} w-10\`} />
            </div>
          ))}
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center gap-2 mt-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className={\`\${skeletonBase} w-10 h-10\`} />
        ))}
      </div>
    </div>
  );
}`,

    'board-list-image': `// src/app/boards/(hotdeal)/loading.tsx
// 핫딜 게시판 전용 라우트 그룹 스켈레톤
// 썸네일 이미지 + 추천수 레이아웃 (image-table 타입)
//
// 적용 게시판: hotdeal, hotdeal-food, hotdeal-apptech,
// hotdeal-beauty, hotdeal-appliance, hotdeal-living,
// hotdeal-sale, hotdeal-mobile`,

    'popular-posts': `// src/app/boards/popular/loading.tsx
// 인기글 페이지 전용 스켈레톤
// 기간 필터 + 카드 스타일 게시글 목록`,

    'all-posts': `// src/app/boards/all/loading.tsx
// 전체글 페이지 전용 스켈레톤
// 카드 스타일 게시글 목록`,

    'post-detail': `import { skeletonBase, skeletonCard, skeletonText } from '@/shared/styles';

export default function PostDetailLoading() {
  return (
    <div className="container mx-auto">
      {/* 브레드크럼 */}
      <div className="flex gap-2 mb-4">
        <div className={\`\${skeletonText} w-16\`} />
        <span className="text-gray-300">/</span>
        <div className={\`\${skeletonText} w-20\`} />
      </div>

      {/* 게시글 카드 */}
      <div className={skeletonCard}>
        <div className="p-4 border-b border-black/5 dark:border-white/10">
          <div className={\`\${skeletonBase} w-3/4 h-6 rounded mb-3\`} />
          <div className="flex gap-4">
            <div className={\`\${skeletonText} w-20\`} />
            <div className={\`\${skeletonText} w-24\`} />
            <div className={\`\${skeletonText} w-16\`} />
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-3">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className={\`\${skeletonText} \${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-5/6' : 'w-4/5'}\`} />
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4 py-4 border-t border-black/5 dark:border-white/10">
          <div className={\`\${skeletonBase} w-20 h-10 rounded-lg\`} />
          <div className={\`\${skeletonBase} w-20 h-10 rounded-lg\`} />
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className={\`\${skeletonCard} mt-4\`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={\`\${skeletonText} w-20\`} />
        </div>
        <div className="p-4 space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className={\`\${skeletonBase} w-10 h-10 rounded-full flex-shrink-0\`} />
              <div className="flex-1 space-y-2">
                <div className={\`\${skeletonText} w-24\`} />
                <div className={\`\${skeletonText} w-full\`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`,

    'livescore': `import { skeletonBase, skeletonCard, skeletonText, skeletonDivider } from '@/shared/styles';

export default function FootballLivescoreLoading() {
  return (
    <div className="min-h-screen">
      {/* 날짜 네비게이션 */}
      <div className={\`\${skeletonCard} mb-4\`}>
        <div className="h-14 flex items-center justify-center gap-2 px-4">
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className={\`\${skeletonBase} w-12 h-10 rounded-lg\`} />
          ))}
        </div>
      </div>

      {/* 리그별 경기 목록 */}
      {Array(3).fill(0).map((_, leagueIdx) => (
        <div key={leagueIdx} className={\`\${skeletonCard} mb-4\`}>
          {/* 리그 헤더 */}
          <div className="h-12 px-4 flex items-center gap-2 bg-[#F5F5F5] dark:bg-[#262626]">
            <div className={\`\${skeletonBase} w-6 h-6 rounded-full\`} />
            <div className={\`\${skeletonText} w-32\`} />
          </div>
          {/* 경기 목록 */}
          <div className={skeletonDivider}>
            {Array(3).fill(0).map((_, matchIdx) => (
              <div key={matchIdx} className="px-4 py-3 flex items-center">
                <div className={\`\${skeletonText} w-12\`} />
                <div className="flex-1 flex items-center justify-center gap-2">
                  <div className={\`\${skeletonText} w-20\`} />
                  <div className={\`\${skeletonBase} w-6 h-6 rounded-full\`} />
                  <div className={\`\${skeletonText} w-10\`} />
                  <div className={\`\${skeletonBase} w-6 h-6 rounded-full\`} />
                  <div className={\`\${skeletonText} w-20\`} />
                </div>
                <div className={\`\${skeletonText} w-12\`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}`,

    'match': `// 이미 HeadersUI.tsx의 MatchHeaderSkeleton이 있음
// 추가로 탭과 콘텐츠 스켈레톤 필요시:

import { skeletonBase, skeletonCard, skeletonText } from '@/shared/styles';
import { MatchHeaderSkeleton } from '@/domains/livescore/components/common/HeadersUI';

export default function MatchLoading() {
  return (
    <div className="container mx-auto">
      <MatchHeaderSkeleton />

      {/* 탭 네비게이션 */}
      <div className={\`\${skeletonCard} mb-4\`}>
        <div className="px-4 py-3 flex gap-4">
          {['개요', '라인업', '통계', '순위'].map((_, i) => (
            <div key={i} className={\`\${skeletonBase} w-16 h-8 rounded\`} />
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className={skeletonCard}>
        <div className="p-4 space-y-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className={\`\${skeletonText} \${i % 2 === 0 ? 'w-full' : 'w-3/4'}\`} />
          ))}
        </div>
      </div>
    </div>
  );
}`,

    'league-detail': `// src/app/livescore/football/leagues/[id]/loading.tsx
// 이미 최적화된 상태`,

    'team': `// src/app/livescore/football/team/[id]/loading.tsx
// 이미 최적화된 상태`,

    'player': `// src/app/livescore/football/player/[id]/loading.tsx
// 이미 최적화된 상태`,

    'user-profile': `// src/app/user/[publicId]/loading.tsx
// 이미 최적화된 상태`,

    'search': `// src/app/search/loading.tsx
// 이미 최적화된 상태`,

    'transfers': `// src/app/transfers/loading.tsx
// 이미 최적화된 상태`,

    'settings': `// 현재 settings/loading.tsx가 이미 잘 되어있음
// 그대로 사용 권장`,

    'shop': `// 현재 shop/loading.tsx가 이미 잘 되어있음
// 그대로 사용 권장`,
  };

  return (
    <div className="bg-[#1e1e1e] rounded-lg p-4 overflow-x-auto">
      <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
        {codes[page]}
      </pre>
    </div>
  );
}

// ============================================
// 기존 컴포넌트들
// ============================================

function ErrorPreview({ domain }: { domain: DomainErrorType }) {
  const config = domainErrorConfig[domain];

  return (
    <div className="bg-[#F5F5F5] dark:bg-[#121212] rounded-lg p-4">
      <div className={errorContainerStyles} style={{ minHeight: '40vh' }}>
        <div className={errorCardStyles}>
          <div className={errorIconStyles}>{config.icon}</div>
          <h1 className={errorTitleStyles}>{config.title}</h1>
          <p className={errorDescriptionStyles}>{config.description}</p>
          <p className={errorDigestStyles}>
            오류 코드: abc123xyz
          </p>
          <div className={errorButtonContainerStyles}>
            <button className={errorPrimaryButtonStyles}>
              다시 시도
            </button>
            <a href="#" className={errorSecondaryButtonStyles}>
              {config.backLabel}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorMiniPreview({ domain }: { domain: DomainErrorType }) {
  const config = domainErrorConfig[domain];

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-4 text-center">
      <div className="text-3xl mb-2">{config.icon}</div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0] mb-1">
        {domain}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {config.title}
      </p>
      <div className="flex gap-2 justify-center">
        <span className="text-xs px-2 py-1 bg-[#F5F5F5] dark:bg-[#262626] rounded text-gray-600 dark:text-gray-400">
          {config.backUrl}
        </span>
      </div>
    </div>
  );
}

function LoadingPreview() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Spinner 사이즈</p>
        <div className="flex items-end gap-8 flex-wrap">
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <div key={size} className="text-center">
              <div className="flex items-center justify-center h-16">
                <Spinner size={size} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{size}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 p-4 bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">{title}</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{subtitle}</p>
      {children}
    </div>
  );
}
