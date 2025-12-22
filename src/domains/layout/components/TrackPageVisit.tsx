'use client';

import { useEffect } from 'react';
import { addRecentlyVisited } from '../utils/recentlyVisited';

interface TrackPageVisitProps {
  id: string;
  slug: string;
  name: string;
}

/**
 * 페이지 방문을 최근방문에 기록하는 클라이언트 컴포넌트
 * 서버 컴포넌트 페이지에서 사용 가능
 */
export default function TrackPageVisit({ id, slug, name }: TrackPageVisitProps) {
  useEffect(() => {
    addRecentlyVisited({ id, slug, name });
  }, [id, slug, name]);

  return null; // 아무것도 렌더링하지 않음
}
