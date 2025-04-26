'use client';

import { useState, useEffect, Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import MatchHeader from '@/app/livescore/football/match/components/MatchHeader';
import TabNavigation from './TabNavigation';
import TabContent from './TabContent';
import { TabType } from '../types';

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl || 'events');
  const matchId = resolvedParams.id;

  // URL 파라미터의 탭을 감지하여 활성 탭 설정
  useEffect(() => {
    if (tabFromUrl && ['events', 'lineups', 'stats', 'standings'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  return (
    <div className="w-full">
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-40 rounded-lg"></div>}>
        <MatchHeader matchId={matchId} />
      </Suspense>
      
      <TabNavigation 
        activeTab={activeTab} 
        matchId={matchId} 
        onTabChange={setActiveTab} 
      />

      <TabContent activeTab={activeTab} matchId={matchId} />
    </div>
  );
}