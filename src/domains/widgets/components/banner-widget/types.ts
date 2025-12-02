import { Banner } from '../../types/banner';

// 상수 정의
export const MOBILE_BREAKPOINT = 768;
export const BANNER_HEIGHT = '210px';

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