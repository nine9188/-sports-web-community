/**
 * 도메인별 error.tsx에서 사용하는 공통 스타일
 */

// 컨테이너 스타일
export const errorContainerStyles = 'container mx-auto min-h-[60vh] flex items-center justify-center';

// 카드 스타일
export const errorCardStyles = 'bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 p-8 text-center max-w-md';

// 아이콘 스타일
export const errorIconStyles = 'text-5xl mb-4';

// 제목 스타일
export const errorTitleStyles = 'text-xl font-semibold mb-3 text-gray-900 dark:text-[#F0F0F0]';

// 설명 스타일
export const errorDescriptionStyles = 'text-sm text-gray-700 dark:text-gray-300 mb-6';

// 에러 코드 스타일
export const errorDigestStyles = 'text-xs text-gray-500 dark:text-gray-400 mb-4';

// 버튼 컨테이너 스타일
export const errorButtonContainerStyles = 'flex flex-col sm:flex-row gap-3 justify-center';

// Primary 버튼 스타일 (다시 시도)
export const errorPrimaryButtonStyles = 'inline-block bg-[#262626] dark:bg-[#3F3F3F] text-white hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] px-4 py-2 rounded text-sm transition-colors';

// Secondary 버튼 스타일 (돌아가기 링크)
export const errorSecondaryButtonStyles = 'inline-block border border-black/7 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] px-4 py-2 rounded text-sm transition-colors';

// 도메인별 에러 설정
export const domainErrorConfig = {
  boards: {
    icon: '📋',
    title: '게시판 로딩 중 문제가 발생했습니다',
    description: '게시글을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    backUrl: '/boards/all',
    backLabel: '게시판 목록으로'
  },
  livescore: {
    icon: '⚽',
    title: '경기 정보를 불러올 수 없습니다',
    description: '실시간 경기 데이터를 가져오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    backUrl: '/livescore/football',
    backLabel: '라이브스코어 홈으로'
  },
  shop: {
    icon: '🛒',
    title: '상점 페이지 오류',
    description: '상점 정보를 불러오는 중 문제가 발생했습니다.',
    backUrl: '/shop',
    backLabel: '상점 홈으로'
  },
  auth: {
    icon: '🔐',
    title: '인증 처리 중 오류',
    description: '로그인/회원가입 처리 중 문제가 발생했습니다.',
    backUrl: '/signin',
    backLabel: '로그인으로'
  },
  settings: {
    icon: '⚙️',
    title: '설정 페이지 오류',
    description: '설정을 불러오거나 저장하는 중 문제가 발생했습니다.',
    backUrl: '/settings/profile',
    backLabel: '설정으로'
  }
} as const;

export type DomainErrorType = keyof typeof domainErrorConfig;
