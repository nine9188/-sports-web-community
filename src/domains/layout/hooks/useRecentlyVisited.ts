'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RecentBoard,
  getRecentlyVisited,
  addRecentlyVisited as addToStorage,
  removeRecentlyVisited as removeFromStorage,
  clearRecentlyVisited as clearFromStorage,
  getExpandedState,
  setExpandedState
} from '../utils/recentlyVisited';

export function useRecentlyVisited() {
  const [recentBoards, setRecentBoards] = useState<RecentBoard[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 초기 로드 (SSR 안전)
  useEffect(() => {
    setIsMounted(true);
    setRecentBoards(getRecentlyVisited());
    setIsExpanded(getExpandedState());
  }, []);

  // storage 이벤트 리스너 (다른 탭/컴포넌트 동기화)
  useEffect(() => {
    if (!isMounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'recently_visited_boards') {
        setRecentBoards(getRecentlyVisited());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isMounted]);

  // 게시판 추가
  const addBoard = useCallback((board: Omit<RecentBoard, 'visitedAt'>) => {
    addToStorage(board);
    setRecentBoards(getRecentlyVisited());
  }, []);

  // 게시판 제거
  const removeBoard = useCallback((boardId: string) => {
    removeFromStorage(boardId);
    setRecentBoards(getRecentlyVisited());
  }, []);

  // 전체 삭제
  const clearAll = useCallback(() => {
    clearFromStorage();
    setRecentBoards([]);
  }, []);

  // 펼침 상태 토글
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => {
      const newState = !prev;
      setExpandedState(newState);
      return newState;
    });
  }, []);

  return {
    recentBoards,
    isExpanded,
    isMounted,
    addBoard,
    removeBoard,
    clearAll,
    toggleExpanded
  };
}
