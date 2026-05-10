'use client';

import { useEffect, useState } from 'react';
import { getNicknameTicketCount } from '@/domains/shop/actions/consumables';

const ticketCountListeners = new Set<(userId: string, nextCount?: number) => void>();

export function useNicknameTicketCount(
  userId: string | null,
  options: { enabled?: boolean; initialData?: number } = {}
) {
  const { enabled = true, initialData } = options;
  const [data, setData] = useState(initialData ?? 0);
  const [isLoading, setIsLoading] = useState(enabled && !!userId && initialData === undefined);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !userId) return;

    let cancelled = false;

    async function loadCount() {
      if (initialData === undefined) setIsLoading(true);
      setError(null);

      try {
        const count = await getNicknameTicketCount(userId!);
        if (!cancelled) setData(count);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Failed to load ticket count'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadCount();

    const listener = (changedUserId: string, nextCount?: number) => {
      if (changedUserId !== userId) return;
      if (typeof nextCount === 'number') {
        setData(nextCount);
      } else {
        loadCount();
      }
    };
    ticketCountListeners.add(listener);

    return () => {
      cancelled = true;
      ticketCountListeners.delete(listener);
    };
  }, [enabled, userId, initialData]);

  return {
    data,
    isLoading,
    error,
  };
}

export function useNicknameTicketCache() {
  const decrementTicketCount = (userId: string) => {
    ticketCountListeners.forEach(listener => listener(userId, undefined));
  };

  const invalidateTicketCount = (userId: string) => {
    ticketCountListeners.forEach(listener => listener(userId, undefined));
  };

  return {
    decrementTicketCount,
    invalidateTicketCount,
  };
}
