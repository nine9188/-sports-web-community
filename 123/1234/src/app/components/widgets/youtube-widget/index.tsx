import { fetchYouTubeVideos } from './youtube-fetcher';
import YouTubeWidgetClient from './youtube-widget-client';

interface YouTubeWidgetProps {
  boardSlug?: string;
}

export default async function YouTubeWidget({ 
  boardSlug = 'kbs-sports'
}: YouTubeWidgetProps) {
  // 서버 컴포넌트에서 직접 Supabase 데이터 가져오기
  const videos = await fetchYouTubeVideos(boardSlug);
  
  // 클라이언트 컴포넌트에 데이터 전달
  return <YouTubeWidgetClient videos={videos} boardSlug={boardSlug} />;
} 