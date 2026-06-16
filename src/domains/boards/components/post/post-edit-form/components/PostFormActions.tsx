import { Button } from '@/shared/components/ui';

type DraftStatus = 'idle' | 'saving' | 'saved' | 'error';

type PostFormActionsProps = {
  isSubmitting: boolean;
  isCreateMode: boolean;
  draftStatus: DraftStatus;
  onCancel: () => void;
};

export function PostFormActions({
  isSubmitting,
  isCreateMode,
  draftStatus,
  onCancel,
}: PostFormActionsProps) {
  return (
    <div className="flex justify-end space-x-2 mt-6">
      <Button
        type="button"
        variant="secondary"
        onClick={onCancel}
        disabled={isSubmitting || draftStatus === 'saving'}
      >
        취소
      </Button>

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? (isCreateMode ? '게시 중...' : '저장 중...')
          : (isCreateMode ? '게시하기' : '저장하기')}
      </Button>
    </div>
  );
}
