import React from 'react';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * 공통 로딩 스피너 컴포넌트
 *
 * 프로젝트 전체에서 통일된 로딩 UI를 제공합니다.
 * 다른 스피너 구현체(Loader2, 커스텀 div 등)를 사용하지 말고 이 컴포넌트를 사용하세요.
 *
 * @param size - 스피너 크기 (기본값: 'md')
 *   - xs: 16px (w-4 h-4) - 인라인 텍스트나 작은 버튼용
 *   - sm: 20px (w-5 h-5) - 작은 UI 요소용
 *   - md: 24px (w-6 h-6) - 기본, 일반적인 사용
 *   - lg: 32px (w-8 h-8) - 큰 영역용
 *   - xl: 40px (w-10 h-10) - 전체 페이지 로딩 상태용
 *
 * @param className - 추가 CSS 클래스 (여백 조정 등)
 *
 * @example
 * // 기본 사용
 * <Spinner />
 *
 * @example
 * // 큰 사이즈로 중앙 정렬
 * <div className="flex items-center justify-center py-8">
 *   <Spinner size="lg" />
 * </div>
 *
 * @example
 * // 작은 인라인 스피너
 * <button disabled>
 *   <Spinner size="xs" className="mr-2" />
 *   로딩 중...
 * </button>
 */
export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    xs: 'w-4 h-4 border-[1.5px]',
    sm: 'w-5 h-5 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-10 h-10 border-[3px]'
  };

  return (
    <div
      className={`${sizeClasses[size]} border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-[#F0F0F0] rounded-full animate-spin ${className}`}
      role="status"
      aria-label="로딩 중"
    />
  );
}
