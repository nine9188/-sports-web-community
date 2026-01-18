'use client';

import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '@/shared/context/AuthContext';
import { useIcon } from '@/shared/context/IconContext';

interface UseLogoutOptions {
  /** 로그아웃 후 리다이렉트할 URL (기본값: '/') */
  redirectTo?: string;
  /** 로그아웃 후 콜백 함수 */
  onLogoutComplete?: () => void;
  /** 토스트 메시지 표시 여부 (기본값: true) */
  showToast?: boolean;
}

/**
 * 로그아웃 로직을 통합한 훅
 *
 * 기능:
 * - AuthContext의 logoutUser 호출
 * - IconContext 상태 초기화
 * - 성공/실패 토스트 표시
 * - 페이지 리다이렉트
 */
export function useLogout(options: UseLogoutOptions = {}) {
  const { redirectTo = '/', onLogoutComplete, showToast = true } = options;
  const { logoutUser } = useAuth();
  const { updateUserIconState } = useIcon();

  const logout = useCallback(async () => {
    try {
      // AuthContext의 logoutUser 함수 호출
      await logoutUser();

      // 아이콘 상태 초기화
      updateUserIconState('', '');

      // 콜백 실행
      onLogoutComplete?.();

      // 성공 토스트
      if (showToast) {
        toast.success('로그아웃되었습니다.');
      }

      // 페이지 리다이렉트 (window.location 사용으로 확실한 상태 초기화)
      window.location.href = redirectTo;
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      if (showToast) {
        toast.error('로그아웃 중 오류가 발생했습니다.');
      }
      throw error;
    }
  }, [logoutUser, updateUserIconState, redirectTo, onLogoutComplete, showToast]);

  return { logout };
}

export default useLogout;
