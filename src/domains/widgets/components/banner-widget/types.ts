import { Banner } from '../../types/banner';

// 상수 정의
export const MOBILE_BREAKPOINT = 768;
export const DEFAULT_AUTO_SLIDE_INTERVAL = 10000;
export const AUTO_PLAY_RESUME_DELAY = 3000;
export const SWIPE_THRESHOLD = 30; // 더 민감하게 조정
export const SWIPE_VELOCITY_THRESHOLD = 0.2; // 드래그 비율 기준 임계값
export const BANNER_HEIGHT = '210px';

// 터치 상태 타입
export interface TouchState {
  start: number | null;
  end: number | null;
}

// 배너 설정 타입
export interface BannerConfig {
  itemsPerView: number;
  autoSlideInterval: number;
  displayType: Banner['display_type'];
}

// 배너 위젯 Props 타입
export interface BannerWidgetProps {
  banners: Banner[];
}

// 개별 배너 래퍼 Props 타입
export interface BannerWrapperProps {
  banner: Banner;
  children: React.ReactNode;
  index: number;
}

// 슬라이드 버튼 Props 타입
export interface SlideButtonProps {
  direction: 'prev' | 'next';
  onClick: () => void;
}

// 인디케이터 Props 타입
export interface IndicatorsProps {
  banners: Banner[];
  currentIndex: number;
  onSlideChange: (index: number) => void;
} 