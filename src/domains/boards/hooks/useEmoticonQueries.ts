'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getEmoticonShopData,
  getPickerData,
  getPackDetail,
  type EmoticonShopData,
} from '@/domains/boards/actions/emoticons';

const shopDataListeners = new Set<() => void>();
const pickerDataListeners = new Set<() => void>();
const packDetailListeners = new Map<string, Set<() => void>>();

function registerListener(listeners: Set<() => void>, listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function registerPackDetailListener(packId: string | null, listener: () => void) {
  if (!packId) return () => {};

  const listeners = packDetailListeners.get(packId) ?? new Set<() => void>();
  listeners.add(listener);
  packDetailListeners.set(packId, listeners);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      packDetailListeners.delete(packId);
    }
  };
}

function notify(listeners: Iterable<() => void>) {
  for (const listener of listeners) {
    listener();
  }
}

function useAsyncData<T>(loader: () => Promise<T>, enabled = true, initialData?: T) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(enabled && initialData === undefined);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => {
    setVersion(value => value + 1);
  }, []);

  const mutate = useCallback((updater: T | undefined | ((current: T | undefined) => T | undefined)) => {
    setData(current => (
      typeof updater === 'function'
        ? (updater as (current: T | undefined) => T | undefined)(current)
        : updater
    ));
  }, []);

  useEffect(() => {
    if (!enabled && version === 0) {
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
    mutate,
  };
}

export function useEmoticonShopData(options: { enabled?: boolean; initialData?: EmoticonShopData } = {}) {
  const enabled = options.enabled ?? true;
  const result = useAsyncData(useCallback(() => getEmoticonShopData(), []), enabled, options.initialData);

  useEffect(() => registerListener(shopDataListeners, result.refetch), [result.refetch]);

  return result;
}

export function usePickerData() {
  const result = useAsyncData(useCallback(() => getPickerData(), []));

  useEffect(() => registerListener(pickerDataListeners, result.refetch), [result.refetch]);

  return result;
}

export function usePackDetail(packId: string | null) {
  const result = useAsyncData(
    useCallback(() => getPackDetail(packId!), [packId]),
    !!packId
  );

  useEffect(() => registerPackDetailListener(packId, result.refetch), [packId, result.refetch]);

  return result;
}

export function useEmoticonInvalidation() {
  return {
    invalidateAfterPurchase: (packId?: string) => {
      notify(shopDataListeners);
      notify(pickerDataListeners);
      if (packId) {
        notify(packDetailListeners.get(packId) ?? []);
      }
    },
    invalidateAfterOrderChange: () => {
      notify(pickerDataListeners);
    },
  };
}
