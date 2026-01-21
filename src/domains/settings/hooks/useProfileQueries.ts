'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNicknameTicketCount } from '@/domains/shop/actions/consumables';

// Query Keys
export const profileKeys = {
  all: ['profile'] as const,
  nicknameTicket: (userId: string) => [...profileKeys.all, 'nicknameTicket', userId] as const,
};

/**
 * 닉네임 변경권 개수를 가져오는 훅
 * - 프로필 설정 페이지에서 사용
 * - 캐싱을 통해 불필요한 요청 방지
 */
export function useNicknameTicketCount(userId: string | null, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: profileKeys.nicknameTicket(userId ?? ''),
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;
      return getNicknameTicketCount(userId);
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 15, // 15분
  });
}

/**
 * 닉네임 변경권 캐시를 업데이트하는 유틸리티 훅
 * - 닉네임 변경 후 캐시 업데이트
 */
export function useNicknameTicketCache() {
  const queryClient = useQueryClient();

  // 티켓 개수 감소 (변경권 사용 시)
  const decrementTicketCount = (userId: string) => {
    queryClient.setQueryData<number>(
      profileKeys.nicknameTicket(userId),
      (oldCount) => Math.max(0, (oldCount ?? 0) - 1)
    );
  };

  // 캐시 무효화 (새로고침)
  const invalidateTicketCount = (userId: string) => {
    queryClient.invalidateQueries({ queryKey: profileKeys.nicknameTicket(userId) });
  };

  return {
    decrementTicketCount,
    invalidateTicketCount,
  };
}
