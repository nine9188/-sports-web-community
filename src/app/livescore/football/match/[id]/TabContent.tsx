import { Suspense } from 'react';
import { TabType } from '../types';
import Events from '../components/tabs/Events';
import Lineups from '../components/tabs/Lineups';
import Stats from '../components/tabs/Stats';
import Standings from '../components/tabs/Standings';

const LoadingComponent = () => (
  <div className="mb-4 bg-white rounded-lg border p-4">
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  </div>
);

interface TabContentProps {
  activeTab: TabType;
  matchId: string;
}

export default function TabContent({ activeTab, matchId }: TabContentProps) {
  return (
    <Suspense fallback={<LoadingComponent />}>
      {activeTab === 'events' && (
        <Events matchId={matchId} />
      )}
      
      {activeTab === 'lineups' && (
        <Lineups matchId={matchId} />
      )}
      
      {activeTab === 'stats' && (
        <Stats matchId={matchId} />
      )}
      
      {activeTab === 'standings' && (
        <Standings matchId={matchId} />
      )}
    </Suspense>
  );
} 