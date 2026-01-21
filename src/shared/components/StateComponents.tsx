'use client';

import { memo, ReactNode } from 'react';
import Spinner from './Spinner';
import { Container, ContainerContent, Button } from './ui';

// =============================================================================
// Types
// =============================================================================

interface BaseStateProps {
  /** 컨테이너 사용 여부 (기본: true) */
  withContainer?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

interface LoadingStateProps extends BaseStateProps {
  /** 로딩 메시지 */
  message?: string;
  /** 스피너 크기 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface ErrorStateProps extends BaseStateProps {
  /** 에러 제목 */
  title?: string;
  /** 에러 메시지 */
  message?: string;
  /** 재시도 버튼 표시 */
  onRetry?: () => void;
  /** 재시도 버튼 텍스트 */
  retryText?: string;
}

interface EmptyStateProps extends BaseStateProps {
  /** 빈 상태 제목 */
  title?: string;
  /** 빈 상태 메시지 */
  message?: string;
  /** 아이콘 (기본: 빈 박스 아이콘) */
  icon?: ReactNode;
  /** 액션 버튼 */
  action?: ReactNode;
}

// =============================================================================
// Loading State
// =============================================================================

/**
 * 로딩 상태 컴포넌트
 *
 * @example
 * // 컨테이너 없이 인라인
 * <LoadingState withContainer={false} size="sm" />
 *
 * @example
 * // 컨테이너와 함께 (기본)
 * <LoadingState message="데이터를 불러오는 중..." />
 */
export const LoadingState = memo(({
  message = '데이터를 불러오는 중...',
  size = 'lg',
  withContainer = true,
  className = '',
}: LoadingStateProps) => {
  const content = (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <Spinner size={size} className="mb-3" />
      {message && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      )}
    </div>
  );

  if (!withContainer) return content;

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerContent>{content}</ContainerContent>
    </Container>
  );
});

LoadingState.displayName = 'LoadingState';

// =============================================================================
// Error State
// =============================================================================

/**
 * 에러 상태 컴포넌트
 *
 * @example
 * // 재시도 버튼 없이
 * <ErrorState message="네트워크 오류가 발생했습니다." />
 *
 * @example
 * // 재시도 버튼과 함께
 * <ErrorState
 *   message="데이터를 불러올 수 없습니다."
 *   onRetry={() => refetch()}
 * />
 */
export const ErrorState = memo(({
  title = '오류 발생',
  message = '오류가 발생했습니다.',
  onRetry,
  retryText = '다시 시도',
  withContainer = true,
  className = '',
}: ErrorStateProps) => {
  const content = (
    <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
      <div className="text-red-500 dark:text-red-400 mb-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-base font-medium text-gray-900 dark:text-[#F0F0F0] mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="text-sm">
          {retryText}
        </Button>
      )}
    </div>
  );

  if (!withContainer) return content;

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerContent>{content}</ContainerContent>
    </Container>
  );
});

ErrorState.displayName = 'ErrorState';

// =============================================================================
// Empty State
// =============================================================================

/**
 * 빈 상태 컴포넌트
 *
 * @example
 * // 기본 사용
 * <EmptyState title="알림이 없습니다" message="새로운 소식이 있으면 알려드릴게요" />
 *
 * @example
 * // 커스텀 아이콘과 액션
 * <EmptyState
 *   icon={<Bell className="h-12 w-12" />}
 *   title="알림이 없습니다"
 *   action={<Button>새 알림 확인</Button>}
 * />
 */
export const EmptyState = memo(({
  title = '데이터가 없습니다',
  message = '현재 이 정보를 제공할 수 없습니다.',
  icon,
  action,
  withContainer = true,
  className = '',
}: EmptyStateProps) => {
  const defaultIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-12 w-12 mx-auto"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );

  const content = (
    <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
      <div className="text-gray-400 dark:text-gray-500 mb-3">
        {icon || defaultIcon}
      </div>
      <h3 className="text-base font-medium text-gray-900 dark:text-[#F0F0F0] mb-1">
        {title}
      </h3>
      {message && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );

  if (!withContainer) return content;

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerContent>{content}</ContainerContent>
    </Container>
  );
});

EmptyState.displayName = 'EmptyState';

// =============================================================================
// Inline Loading (간단한 인라인 로딩)
// =============================================================================

/**
 * 간단한 인라인 로딩 컴포넌트
 * 높이를 지정하여 사용합니다.
 *
 * @example
 * <InlineLoading height="h-40" />
 */
export const InlineLoading = memo(({
  height = 'h-40',
  size = 'md',
}: {
  height?: string;
  size?: 'sm' | 'md' | 'lg';
}) => (
  <div className={`flex items-center justify-center ${height}`}>
    <Spinner size={size} />
  </div>
));

InlineLoading.displayName = 'InlineLoading';

// =============================================================================
// Inline Error (간단한 인라인 에러)
// =============================================================================

/**
 * 간단한 인라인 에러 컴포넌트
 *
 * @example
 * <InlineError message="데이터를 불러올 수 없습니다" />
 */
export const InlineError = memo(({
  message = '오류가 발생했습니다',
  height = 'h-40',
}: {
  message?: string;
  height?: string;
}) => (
  <div className={`flex items-center justify-center ${height} text-red-500 dark:text-red-400 text-sm`}>
    {message}
  </div>
));

InlineError.displayName = 'InlineError';

// =============================================================================
// Inline Empty (간단한 인라인 빈 상태)
// =============================================================================

/**
 * 간단한 인라인 빈 상태 컴포넌트
 *
 * @example
 * <InlineEmpty message="검색 결과가 없습니다" />
 */
export const InlineEmpty = memo(({
  message = '데이터가 없습니다',
  height = 'h-40',
}: {
  message?: string;
  height?: string;
}) => (
  <div className={`flex items-center justify-center ${height} text-gray-500 dark:text-gray-400 text-sm`}>
    {message}
  </div>
));

InlineEmpty.displayName = 'InlineEmpty';
