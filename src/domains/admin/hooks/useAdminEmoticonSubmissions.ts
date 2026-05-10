'use client';

import { useEffect } from 'react';
import {
  getSubmissions,
  getSubmissionDetail,
  approveSubmission,
  rejectSubmission,
  suspendSubmission,
} from '@/domains/admin/actions/emoticon-submissions';
import type { SubmissionStatus } from '@/domains/shop/types/emoticon-submission';
import { useAsyncData, useAsyncMutation } from './useLocalAsync';

const listeners = new Set<() => void>();

function notifySubmissionsChanged() {
  listeners.forEach((listener) => listener());
}

export function useAdminSubmissions(filter: 'all' | SubmissionStatus = 'all') {
  const query = useAsyncData(() => getSubmissions(filter), [filter]);

  useEffect(() => {
    listeners.add(query.refetch);
    return () => {
      listeners.delete(query.refetch);
    };
  }, [query.refetch]);

  return query;
}

export function useAdminSubmissionDetail(id: number | null) {
  const query = useAsyncData(() => getSubmissionDetail(id!), [id], id !== null);

  useEffect(() => {
    listeners.add(query.refetch);
    return () => {
      listeners.delete(query.refetch);
    };
  }, [query.refetch]);

  return query;
}

export function useApproveSubmission() {
  return useAsyncMutation(
    ({ id, finalPrice }: { id: number; finalPrice?: number }) => approveSubmission(id, finalPrice),
    notifySubmissionsChanged
  );
}

export function useRejectSubmission() {
  return useAsyncMutation(
    ({ id, reason }: { id: number; reason: string }) => rejectSubmission(id, reason),
    notifySubmissionsChanged
  );
}

export function useSuspendSubmission() {
  return useAsyncMutation(
    ({ id, reason }: { id: number; reason: string }) => suspendSubmission(id, reason),
    notifySubmissionsChanged
  );
}
