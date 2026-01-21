'use client';

import type { ReportWithReporter, ReportStatus, ReportTargetType } from '@/domains/reports/types';

export type { ReportWithReporter, ReportStatus, ReportTargetType };

export interface SelectedAuthor {
  id: string;
  nickname: string;
  reportId: string;
}

export interface DropdownPosition {
  top: number;
  left: number;
}

export type ActionType = 'delete' | 'hide' | 'suspend_user' | 'suspend_author';
