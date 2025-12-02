'use client';

import React from 'react';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingState = ({
  message = '로딩 중...',
  fullScreen = false,
  size = 'medium',
}: LoadingStateProps) => {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-[#1D1D1D]'
    : 'flex flex-col items-center justify-center py-8';

  const spinnerSizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  }[size];

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  }[size];

  return (
    <div className={containerClasses}>
      <div
        className={`animate-spin rounded-full border-2 border-current border-t-transparent text-gray-900 dark:text-[#F0F0F0] ${spinnerSizeClasses}`}
        role="status"
        aria-live="polite"
      />
      {message && <p className={`mt-3 font-medium text-gray-700 dark:text-gray-300 ${textSizeClasses}`}>{message}</p>}
    </div>
  );
};

export default LoadingState; 