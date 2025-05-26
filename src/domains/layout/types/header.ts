/**
 * 헤더 컴포넌트에서 사용하는 사용자 데이터 타입
 */
export type HeaderUserData = {
  id: string;
  email: string;
  nickname?: string;
  isAdmin?: boolean;
  level?: number;
  iconInfo: {
    iconId: number | null;
    iconUrl: string;
    iconName: string;
  };
};

/**
 * 헤더 컴포넌트 기본 속성
 */
export type HeaderProps = {
  onMenuClick: () => void;
  onProfileClick?: () => void;
  isSidebarOpen: boolean;
  userData?: HeaderUserData | null;
}; 