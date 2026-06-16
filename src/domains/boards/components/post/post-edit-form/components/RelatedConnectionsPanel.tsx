import { CalendarDays, Shield, UserRound } from 'lucide-react';
import type { RelatedPostCta } from '@/domains/boards/utils/post/extractRelatedCtasFromContent';

function RelatedConnectionIcon({ type }: { type: RelatedPostCta['type'] }) {
  if (type === 'match') return <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />;
  if (type === 'player') return <UserRound className="h-3.5 w-3.5" aria-hidden="true" />;
  return <Shield className="h-3.5 w-3.5" aria-hidden="true" />;
}

type RelatedConnectionsPanelProps = {
  relatedConnections: RelatedPostCta[];
  autoTags: string[];
};

export function RelatedConnectionsPanel({
  relatedConnections,
  autoTags,
}: RelatedConnectionsPanelProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">관련 연결</span>
        <span className="hidden text-[12px] text-gray-500 dark:text-gray-400 sm:inline">
          팀/선수/경기 카드를 삽입하면 관련 페이지 연결이 자동 등록됩니다.
        </span>
      </div>

      <div className="rounded-md border border-black/7 bg-[#FAFAFA] px-3 py-2 dark:border-white/10 dark:bg-[#262626]">
        {relatedConnections.length > 0 ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {relatedConnections.map((connection) => (
                <span
                  key={connection.key}
                  className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-black/7 bg-white px-2.5 text-[12px] font-medium text-gray-700 dark:border-white/10 dark:bg-[#1D1D1D] dark:text-gray-300"
                  title={`${connection.label} ${connection.actionLabel}`}
                >
                  <span className="shrink-0 text-gray-500 dark:text-gray-400">
                    <RelatedConnectionIcon type={connection.type} />
                  </span>
                  <span className="truncate">{connection.label}</span>
                </span>
              ))}
            </div>

            {autoTags.length > 0 && (
              <div className="space-y-1.5 border-t border-black/5 pt-2 dark:border-white/10">
                <div className="text-[12px] text-gray-500 dark:text-gray-400">
                  자동 분류 키워드 {autoTags.length}개
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {autoTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex h-6 max-w-full items-center rounded-full bg-[#F0F0F0] px-2 text-[11px] font-medium text-gray-600 dark:bg-[#333333] dark:text-gray-300"
                      title={tag}
                    >
                      <span className="truncate">{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-gray-500 dark:text-gray-400">
              아직 연결된 카드가 없습니다.
            </p>
            <p className="text-[12px] text-gray-400 dark:text-gray-500">
              경기, 팀, 선수 카드를 본문에 추가해보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
