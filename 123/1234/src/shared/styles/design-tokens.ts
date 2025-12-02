/**
 * 디자인 시스템 토큰
 * 전체 애플리케이션의 일관된 UI를 위한 색상, 간격, 반경 등을 정의
 */

export const designTokens = {
  // 색상 시스템
  colors: {
    light: {
      // 페이지 배경
      background: '#F8F9FA',

      // 컨테이너
      container: '#FFFFFF',
      containerBorder: 'rgba(0, 0, 0, 0.05)', // 아주 연한 테두리

      // 컨테이너 헤더
      containerHeader: '#F5F5F5',
      containerHeaderHover: '#EAEAEA',

      // 버튼
      button: '#FFFFFF',
      buttonBorder: 'rgba(0, 0, 0, 0.1)',
      buttonText: '#1F2937', // gray-800

      // 텍스트
      text: {
        primary: '#111827',   // gray-900
        secondary: '#4B5563', // gray-600
        tertiary: '#6B7280',  // gray-500
      },
    },
    dark: {
      // 페이지 배경
      background: '#000000',

      // 컨테이너
      container: '#1D1D1D',
      containerBorder: 'rgba(255, 255, 255, 0.05)', // 아주 연한 테두리

      // 컨테이너 헤더
      containerHeader: '#262626',
      containerHeaderHover: '#333333',

      // 버튼
      button: '#262626',
      buttonBorder: 'rgba(255, 255, 255, 0.1)',
      buttonText: '#F0F0F0',

      // 텍스트
      text: {
        primary: '#F0F0F0',
        secondary: '#B4B4B4',
        tertiary: '#8C8C8C',
      },
    },
  },

  // 간격
  spacing: {
    containerGap: '0.5rem',    // gap-2
    containerPadding: '0.75rem', // p-3
    containerPaddingLarge: '1rem', // p-4
  },

  // 높이 (균일한 컨테이너 높이)
  height: {
    containerHeader: '48px',     // py-3 (12px * 2) + text-sm (20px line-height) + 4px
    leagueHeader: '52px',        // 리그 헤더 높이 (조금 더 큼)
    matchRow: '56px',            // 경기 행 높이
  },

  // 타이포그래피
  typography: {
    containerHeaderSize: '0.875rem',  // text-sm (14px)
    containerHeaderWeight: '700',     // font-bold
    leagueHeaderSize: '0.875rem',     // text-sm (14px)
    matchTextSize: '0.875rem',        // text-sm (14px)
  },

  // 반경
  radius: {
    container: '0.5rem', // rounded-lg
    button: '0.375rem',  // rounded-md
  },

  // 그림자
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  },

  // 호버 스타일
  hover: {
    light: '#EAEAEA',
    dark: '#333333',
  },
} as const;

// Tailwind 클래스 헬퍼
export const tailwindClasses = {
  // 컨테이너
  container: 'bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/5 dark:border-white/5',

  // 컨테이너 헤더
  containerHeader: 'bg-[#F5F5F5] dark:bg-[#262626] ',

  // 버튼
  button: 'bg-white dark:bg-[#262626] border border-black/10 dark:border-white/10 text-gray-800 dark:text-[#F0F0F0] rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-[#2D2D2D]',

  // 텍스트
  textPrimary: 'text-gray-900 dark:text-[#F0F0F0]',
  textSecondary: 'text-gray-600 dark:text-[#B4B4B4]',
  textTertiary: 'text-gray-500 dark:text-[#8C8C8C]',

  // 호버 (풀 사이즈, 여백 없음)
  hoverFull: 'hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors cursor-pointer',
} as const;
