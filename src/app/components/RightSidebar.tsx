'use client';

// import TopicTabs from './rsidebar/TopicTabs'; // 기존 클라이언트 컴포넌트 주석 처리
import ServerTopicTabs from './rsidebar/ServerTopicTabs'; // 서버 컴포넌트 임포트

export default function RightSidebar() {
  return (
    <aside className="hidden xl:block w-[280px] shrink-0">
      <div className="h-full pt-4">
        {/* <TopicTabs /> */}
        <ServerTopicTabs /> {/* 서버 컴포넌트 사용 */}
      </div>
    </aside>
  );
} 