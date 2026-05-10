'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getEmoticonShopData,
  getPickerData,
  getPackDetail,
} from '@/domains/boards/actions/emoticons';

function useAsyncData<T>(loader: () => Promise<T>, enabled = true) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => {
    setVersion(value => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        const result = await loader();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setIsError(true);
          setError(err instanceof Error ? err : new Error('Failed to load data'));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
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
    isError,
    error,
    refetch,
  };
}

export function useEmoticonShopData() {
  return useAsyncData(useCallback(() => getEmoticonShopData(), []));
}

export function usePickerData() {
  return useAsyncData(useCallback(() => getPickerData(), []));
}

export function usePackDetail(packId: string | null) {
  return useAsyncData(
    useCallback(() => getPackDetail(packId!), [packId]),
    !!packId
  );
}

export function useEmoticonInvalidation() {
  return {
    invalidateAfterPurchase: (_packId?: string) => {},
    invalidateAfterOrderChange: () => {},
  };
}
