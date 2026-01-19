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
import Spinner from '@/shared/components/Spinner';

const domains: DomainErrorType[] = ['boards', 'livescore', 'shop', 'auth', 'settings'];

export default function ErrorLoadingTestPage() {
  const [selectedDomain, setSelectedDomain] = useState<DomainErrorType>('boards');

  return (
    <div className="min-h-screen p-8 bg-[#F5F5F5] dark:bg-[#121212]">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-[#F0F0F0]">
        Error & Loading 테스트
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        도메인별 error.tsx 및 loading 컴포넌트 미리보기
      </p>

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

      {/* 루트 Error 미리보기 */}
      <Section title="루트 Error (전역 폴백)" subtitle="src/app/error.tsx">
        <RootErrorPreview />
      </Section>
    </div>
  );
}

// Error 미리보기 컴포넌트
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

// Error 미니 미리보기
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

// 루트 Error 미리보기
function RootErrorPreview() {
  return (
    <div className="bg-[#F5F5F5] dark:bg-[#121212] rounded-lg p-4">
      <div className={errorContainerStyles} style={{ minHeight: '40vh' }}>
        <div className={errorCardStyles}>
          <div className={errorIconStyles}>&#x26A0;&#xFE0F;</div>
          <h1 className={errorTitleStyles}>문제가 발생했습니다</h1>
          <p className={errorDescriptionStyles}>
            일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
          </p>
          <p className={errorDigestStyles}>
            오류 코드: abc123xyz
          </p>
          <div className={errorButtonContainerStyles}>
            <button className={errorPrimaryButtonStyles}>
              다시 시도
            </button>
            <a href="#" className={errorSecondaryButtonStyles}>
              메인페이지로 이동
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading 미리보기 컴포넌트
function LoadingPreview() {
  return (
    <div className="space-y-6">
      {/* Spinner 사이즈 비교 */}
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

      {/* 실제 로딩 상태 시뮬레이션 */}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">실제 로딩 상태</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 페이지 로딩 */}
          <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-8">
            <div className="flex flex-col items-center justify-center py-8">
              <Spinner size="lg" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">페이지 로딩 중...</p>
            </div>
          </div>

          {/* 버튼 로딩 */}
          <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-8">
            <div className="space-y-4">
              <button className="w-full py-3 px-4 bg-[#262626] dark:bg-[#3F3F3F] text-white rounded-lg font-medium flex items-center justify-center gap-2">
                <Spinner size="sm" />
                <span>처리 중...</span>
              </button>
              <button className="w-full py-3 px-4 border border-black/7 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg font-medium flex items-center justify-center gap-2">
                <Spinner size="sm" />
                <span>로딩 중...</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 인라인 로딩 */}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">인라인 로딩</p>
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
            데이터를 불러오는 중입니다 <Spinner size="xs" />
          </p>
        </div>
      </div>
    </div>
  );
}

// 헬퍼 컴포넌트
function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 p-4 bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">{title}</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{subtitle}</p>
      {children}
    </div>
  );
}
