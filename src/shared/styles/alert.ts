/**
 * 알림/에러 메시지 스타일 상수
 */

// 알림 기본 스타일
export const alertBaseStyles = 'flex items-start gap-3 p-4 rounded-lg';

// 알림 배경색
export const alertBgSuccess = 'bg-green-100 dark:bg-green-900/30';
export const alertBgWarning = 'bg-yellow-100 dark:bg-yellow-900/30';
export const alertBgError = 'bg-red-100 dark:bg-red-900/30';
export const alertBgInfo = 'bg-blue-100 dark:bg-blue-900/30';

// 알림 텍스트/아이콘 색상
export const alertTextSuccess = 'text-green-800 dark:text-green-400';
export const alertTextWarning = 'text-yellow-800 dark:text-yellow-400';
export const alertTextError = 'text-red-800 dark:text-red-400';
export const alertTextInfo = 'text-blue-800 dark:text-blue-400';

// 결합된 알림 스타일 (배경 + 텍스트)
export const alertSuccess = `${alertBgSuccess} ${alertTextSuccess}`;
export const alertWarning = `${alertBgWarning} ${alertTextWarning}`;
export const alertError = `${alertBgError} ${alertTextError}`;
export const alertInfo = `${alertBgInfo} ${alertTextInfo}`;

// 에러 메시지 박스 스타일 (페이지 레벨 에러)
export const errorBoxStyles = 'bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 p-6 text-center';
export const errorTitleStyles = 'text-xl font-semibold mb-3 text-gray-900 dark:text-[#F0F0F0]';
export const errorMessageStyles = 'text-sm text-gray-700 dark:text-gray-300 mb-4';
export const errorLinkStyles = 'inline-block bg-[#262626] dark:bg-[#3F3F3F] text-white hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] px-4 py-2 rounded text-sm transition-colors';
