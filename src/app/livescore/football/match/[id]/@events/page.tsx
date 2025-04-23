import { fetchMatchEvents } from '@/app/actions/livescore/matches/events';
import EventsContent from '@/app/livescore/football/match/components/tabs/Events';
import { cache } from 'react';

// 동적 렌더링 설정
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-cache';
export const revalidate = 60; // 60초마다 재검증

// 캐싱된 데이터 로딩 함수
const getEventsData = cache(async (matchId: string) => {
  try {
    return await fetchMatchEvents(matchId);
  } catch (error) {
    console.error('이벤트 데이터 로딩 실패:', error);
    return { events: [] };
  }
});

export default async function EventsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;
  
  // 서버 액션으로 이벤트 데이터만 가져오기 (캐싱 적용)
  const eventsData = await getEventsData(matchId);
  
  return (
    <div className="bg-white rounded-lg mt-4">
      <EventsContent 
        matchData={{ events: eventsData.events || [] }}
        matchId={matchId}
      />
    </div>
  );
} 