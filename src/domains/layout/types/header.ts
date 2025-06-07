/**
 * 헤더 컴포넌트에서 사용하는 사용자 데이터 타입
 */
export interface HeaderUserData {
  id: string;
  nickname: string;
  level: number;
  iconInfo: {
    iconUrl: string;
    iconName?: string;
  };
}

/**
 * 헤더 컴포넌트 기본 속성
 */
export type HeaderProps = {
  onProfileClick?: () => void;
  isSidebarOpen: boolean;
  userData?: HeaderUserData | null;
}; 