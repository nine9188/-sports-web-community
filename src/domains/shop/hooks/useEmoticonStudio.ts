'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getMySubmissions,
  getMySuspendedSubmissions,
  submitEmoticonPack,
  cancelSubmission,
  checkPackNameDuplicate,
} from '@/domains/shop/actions/emoticon-submissions';
import type { SubmitEmoticonFormData } from '@/domains/shop/types/emoticon-submission';

function useAsyncData<T>(loader: () => Promise<T>, enabled = true) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => {
    setVersion(value => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setIsFetching(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsFetching(true);
      setError(null);

      try {
        const result = await loader();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Failed to load data'));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsFetching(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [enabled, loader, version]);

  return {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

function useAsyncMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(async (input: TInput) => {
    setIsPending(true);
    try {
      return await mutationFn(input);
    } finally {
      setIsPending(false);
    }
  }, [mutationFn]);

  return {
    mutateAsync,
    isPending,
  };
}

export function useMySubmissions() {
  return useAsyncData(useCallback(() => getMySubmissions(), []));
}

export function useMySuspendedSubmissions() {
  return useAsyncData(useCallback(() => getMySuspendedSubmissions(), []));
}

export function useCheckPackName(name: string) {
  const trimmedName = name.trim();
  return useAsyncData(
    useCallback(() => checkPackNameDuplicate(trimmedName), [trimmedName]),
    trimmedName.length >= 2
  );
}

export function useSubmitPack() {
  return useAsyncMutation(useCallback((formData: SubmitEmoticonFormData) => submitEmoticonPack(formData), []));
}

export function useCancelSubmission() {
  return useAsyncMutation(useCallback((id: number) => cancelSubmission(id), []));
}
