'use client';

import { getDashboardStats, type DashboardStats } from '../actions/dashboard';
import { useAsyncData } from './useLocalAsync';

export function useAdminDashboard() {
  return useAsyncData<DashboardStats>(() => getDashboardStats());
}
