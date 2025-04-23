import { fetchMatchEvents } from '@/app/actions/livescore/matches/events';
import EventsContent from '@/app/livescore/football/match/components/tabs/Events';

export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';
export const revalidate = 0;

export default async function EventsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;
  
  // 서버 액션으로 이벤트 데이터 가져오기
  const eventsData = await fetchMatchEvents(matchId);
  
  return (
    <div className="bg-white rounded-lg mt-4">
      <EventsContent 
        matchData={{ events: eventsData.events || [] }}
        matchId={matchId}
      />
    </div>
  );
} 