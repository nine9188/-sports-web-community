import type { LogLevel, LogCategory } from './types';

// 레벨별 색상 매핑 (다크모드 지원)
export const LEVEL_COLORS: Record<LogLevel, string> = {
  DEBUG: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  INFO: 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200',
  WARN: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
  ERROR: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
  FATAL: 'bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-300',
};

// 카테고리별 색상 매핑 (다크모드 지원)
export const CATEGORY_COLORS: Record<LogCategory, string> = {
  auth: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
  api: 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200',
  database: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
  user_action: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
  system: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  admin: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
  security: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
};
