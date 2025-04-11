import TopicTabs from './rsidebar/TopicTabs';

export default function RightSidebar() {
  return (
    <aside className="hidden xl:block w-[280px] shrink-0">
      <div className="h-full pt-4">
        <TopicTabs />
      </div>
    </aside>
  );
} 