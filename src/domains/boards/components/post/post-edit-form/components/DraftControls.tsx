import { Button } from '@/shared/components/ui';
import type { PostDraft } from '@/domains/boards/actions/posts/index';

type DraftStatus = 'idle' | 'saving' | 'saved' | 'error';

type DraftControlsProps = {
  categoryId: string;
  draftStatus: DraftStatus;
  draftSavedAt: string | null;
  drafts: PostDraft[];
  showDraftList: boolean;
  formatDraftTime: (value: string | null) => string;
  onSaveDraft: () => void;
  onOpenDraftList: () => void;
  onRestoreDraft: (draft: PostDraft) => void;
  onDeleteDraft: (draftId: string) => void;
};

export function DraftControls({
  categoryId,
  draftStatus,
  draftSavedAt,
  drafts,
  showDraftList,
  formatDraftTime,
  onSaveDraft,
  onOpenDraftList,
  onRestoreDraft,
  onDeleteDraft,
}: DraftControlsProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 rounded-md border border-black/7 bg-[#FAFAFA] px-3 py-2 dark:border-white/10 dark:bg-[#262626] sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[12px] text-gray-500 dark:text-gray-400">
          {draftStatus === 'saving' && '임시저장 중...'}
          {draftStatus === 'saved' && draftSavedAt && `임시저장됨 ${formatDraftTime(draftSavedAt)} · 3일 후 자동 삭제`}
          {draftStatus === 'error' && '임시저장 실패'}
          {draftStatus === 'idle' && '작성 중 자동으로 임시저장됩니다. 버튼으로 즉시 저장할 수도 있습니다.'}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onSaveDraft}
            disabled={draftStatus === 'saving' || !categoryId}
            className="h-8 px-3 text-[12px]"
          >
            임시저장
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenDraftList}
            disabled={!categoryId}
            className="h-8 px-3 text-[12px]"
          >
            임시저장 불러오기
          </Button>
        </div>
      </div>

      {showDraftList && (
        <div className="rounded-md border border-black/7 bg-white p-2 dark:border-white/10 dark:bg-[#1D1D1D]">
          {drafts.length === 0 ? (
            <div className="px-2 py-3 text-[13px] text-gray-500 dark:text-gray-400">
              불러올 임시저장이 없습니다.
            </div>
          ) : (
            <div className="space-y-1">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex flex-col gap-2 rounded border border-black/7 px-3 py-2 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">
                      {draft.title || '제목 없음'}
                    </div>
                    <div className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">
                      {formatDraftTime(draft.updatedAt)} 저장됨
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRestoreDraft(draft)}
                      className="h-8 px-3 text-[12px]"
                    >
                      불러오기
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteDraft(draft.id)}
                      className="h-8 px-3 text-[12px] text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
