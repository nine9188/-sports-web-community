'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, type DashboardStats } from '../actions/dashboard';
import { adminKeys } from '@/shared/constants/queryKeys';

export function useAdminDashboard() {
  return useQuery<DashboardStats>({
    queryKey: adminKeys.dashboard(),
    queryFn: () => getDashboardStats(),
    staleTime: 1000 * 60 * 5, // 5분
  });
}
