import { useCallback } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { toast } from 'sonner';

type UsePostNavigationActionsParams = {
  router: AppRouterInstance;
  isCreateMode: boolean;
  setCategoryId?: ((id: string) => void) | null;
  setCategoryIdInternal: (id: string) => void;
  saveCurrentDraft: (options?: { silent?: boolean }) => Promise<boolean>;
};

export function usePostNavigationActions({
  router,
  isCreateMode,
  setCategoryId,
  setCategoryIdInternal,
  saveCurrentDraft,
}: UsePostNavigationActionsParams) {
  const handleCategoryChange = useCallback((id: string) => {
    setCategoryIdInternal(id);
    if (setCategoryId && typeof setCategoryId === 'function') {
      setCategoryId(id);
    }
  }, [setCategoryId, setCategoryIdInternal]);

  const handleCancel = useCallback(async () => {
    if (!isCreateMode) {
      router.back();
      return;
    }

    const saved = await saveCurrentDraft({ silent: true });
    if (saved) {
      toast.success('작성 중인 글을 임시저장했습니다.');
    }
    router.back();
  }, [isCreateMode, router, saveCurrentDraft]);

  return {
    handleCategoryChange,
    handleCancel,
  };
}
