import { Session } from '@supabase/supabase-js';

/**
 * 통합 사용자 데이터 타입
 * 서버에서 1번만 fetch하여 모든 컴포넌트에서 사용
 */
export interface FullUserData {
  // 기본 정보
  id: string;
  email: string | null;
  nickname: string | null;
  username: string | null;

  // 레벨/포인트
  level: number;
  exp: number;
  points: number;

  // 아이콘
  icon_id: number | null;
  icon_url: string | null;
  icon_name: string | null;

  // 통계
  postCount: number;
  commentCount: number;

  // 권한
  is_admin: boolean;
}

/**
 * 헤더용 사용자 데이터 (기존 구조와 호환)
 */
export interface HeaderUserData {
  id: string;
  nickname: string | null;
  email?: string | null;
  level: number;
  exp?: number;
  points?: number;
  iconInfo: {
    iconUrl: string;
    iconName?: string;
  } | null;
  isAdmin: boolean;
}

/**
 * 사이드바용 사용자 데이터 (FullUserData의 부분집합)
 */
export type SidebarUserData = Pick<FullUserData,
  'id' | 'nickname' | 'level' | 'exp' | 'points' |
  'icon_url' | 'icon_name' | 'postCount' | 'commentCount'
>;

/**
 * 사용자 통계 데이터
 */
export interface UserStats {
  postCount: number;
  commentCount: number;
}

/**
 * 서버에서 반환하는 전체 데이터 (세션 포함)
 */
export interface FullUserDataWithSession extends FullUserData {
  session: Session | null;
}
