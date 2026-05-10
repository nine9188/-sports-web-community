'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DependencyList } from 'react';

type MutationCallbacks<TResult> = {
  onSuccess?: (result: TResult) => void;
  onError?: (error: unknown) => void;
};

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: DependencyList = [],
  enabled = true
) {
  const [data, setData] = useState<T>();
  const [isLoading, setIsLoading] = useState(enabled);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => {
    setVersion((current) => current + 1);
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
      setIsError(false);
      setError(null);

      try {
        const result = await loader();
        if (!cancelled) {
          setData(result);
        }
      } catch (caught) {
        if (!cancelled) {
          setIsError(true);
          setError(caught instanceof Error ? caught : new Error('Failed to load data'));
        }
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
  }, [enabled, version, ...deps]);

  return { data, isLoading, isFetching, isError, error, refetch };
}

export function useAsyncMutation<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
  onSuccess?: () => void
) {
  const [isPending, setIsPending] = useState(false);
  const [variables, setVariables] = useState<TInput>();

  const mutateAsync = useCallback(
    async (input: TInput) => {
      setVariables(input);
      setIsPending(true);

      try {
        const result = await mutationFn(input);
        onSuccess?.();
        return result;
      } finally {
        setIsPending(false);
      }
    },
    [mutationFn, onSuccess]
  );

  const mutate = useCallback(
    (input: TInput, callbacks?: MutationCallbacks<TResult>) => {
      mutateAsync(input)
        .then((result) => callbacks?.onSuccess?.(result))
        .catch((caught) => callbacks?.onError?.(caught));
    },
    [mutateAsync]
  );

  return { mutate, mutateAsync, isPending, variables };
}
