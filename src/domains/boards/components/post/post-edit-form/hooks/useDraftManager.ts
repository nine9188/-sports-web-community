import { useCallback, useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Content } from '@tiptap/core';
import type { Editor } from '@tiptap/react';
import { toast } from 'sonner';

import {
  deletePostDraft,
  listPostDrafts,
  savePostDraft,
  type PostDraft,
  type PostDraftDealInfo,
} from '@/domains/boards/actions/posts/index';
import type { PostPollDraft } from '@/domains/boards/types/poll';
import { extractAutoTagsFromContent } from '@/domains/boards/utils/post/extractAutoTagsFromContent';
import { extractRelatedCtasFromContent, type RelatedPostCta } from '@/domains/boards/utils/post/extractRelatedCtasFromContent';

type HotdealDraftState = {
  dealUrl: string;
  store: string;
  productName: string;
  price: string;
  originalPrice: string;
  shipping: string;
};

type UseDraftManagerParams = {
  editor: Editor | null;
  categoryId: string;
  title: string;
  content: string;
  isCreateMode: boolean;
  isHotdeal: boolean;
  isSubmitting: boolean;
  extensionsLoaded: boolean;
  currentDraftId: string | null;
  pollDraft: PostPollDraft | null;
  hotdeal: HotdealDraftState;
  pendingRestoreDraftRef: MutableRefObject<PostDraft | null>;
  lastAutoSavedDraftPayloadRef: MutableRefObject<string | null>;
  ensureAdditionalExtensions: () => Promise<boolean>;
  setTitle: Dispatch<SetStateAction<string>>;
  setContent: Dispatch<SetStateAction<string>>;
  setDealUrl: Dispatch<SetStateAction<string>>;
  setStore: Dispatch<SetStateAction<string>>;
  setProductName: Dispatch<SetStateAction<string>>;
  setPrice: Dispatch<SetStateAction<string>>;
  setOriginalPrice: Dispatch<SetStateAction<string>>;
  setShipping: Dispatch<SetStateAction<string>>;
  setPollDraft: Dispatch<SetStateAction<PostPollDraft | null>>;
  setAutoTags: Dispatch<SetStateAction<string[]>>;
  setRelatedConnections: Dispatch<SetStateAction<RelatedPostCta[]>>;
  setDrafts: Dispatch<SetStateAction<PostDraft[]>>;
  setShowDraftList: Dispatch<SetStateAction<boolean>>;
  setCurrentDraftId: Dispatch<SetStateAction<string | null>>;
  setDraftStatus: Dispatch<SetStateAction<'idle' | 'saving' | 'saved' | 'error'>>;
  setDraftSavedAt: Dispatch<SetStateAction<string | null>>;
};

function sanitizeDraftContent(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value
      .map(sanitizeDraftContent)
      .filter((item) => item !== null);
  }

  const node = value as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] };

  if (node.type === 'teamCard' && !node.attrs?.teamData) return null;
  if (node.type === 'playerCard' && !node.attrs?.playerData) return null;

  if (Array.isArray(node.content)) {
    const content = sanitizeDraftContent(node.content) as unknown[];

    if (node.type === 'entityCardGroup' && content.length === 0) {
      return null;
    }

    return {
      ...node,
      content,
    };
  }

  return value;
}

function toPlainJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

function hasDraftBody(title: string, editor: Editor | null, isHotdeal: boolean, hotdeal: HotdealDraftState) {
  return Boolean(
    title.trim() ||
    (editor && !editor.isEmpty) ||
    (isHotdeal && (
      hotdeal.dealUrl.trim() ||
      hotdeal.store ||
      hotdeal.productName.trim() ||
      hotdeal.price ||
      hotdeal.originalPrice ||
      hotdeal.shipping
    ))
  );
}

export function useDraftManager({
  editor,
  categoryId,
  title,
  content,
  isCreateMode,
  isHotdeal,
  isSubmitting,
  extensionsLoaded,
  currentDraftId,
  pollDraft,
  hotdeal,
  pendingRestoreDraftRef,
  lastAutoSavedDraftPayloadRef,
  ensureAdditionalExtensions,
  setTitle,
  setContent,
  setDealUrl,
  setStore,
  setProductName,
  setPrice,
  setOriginalPrice,
  setShipping,
  setPollDraft,
  setAutoTags,
  setRelatedConnections,
  setDrafts,
  setShowDraftList,
  setCurrentDraftId,
  setDraftStatus,
  setDraftSavedAt,
}: UseDraftManagerParams) {
  const applyDraftToEditor = useCallback((draft: PostDraft) => {
    if (!editor) return;

    const sanitizedContent = sanitizeDraftContent(draft.content);
    setTitle(draft.title);
    editor.commands.setContent(sanitizedContent as Content, true);

    const draftDealInfo = draft.dealInfo;
    if (draftDealInfo) {
      setDealUrl(typeof draftDealInfo.deal_url === 'string' ? draftDealInfo.deal_url : '');
      setStore(typeof draftDealInfo.store === 'string' ? draftDealInfo.store : '');
      setProductName(typeof draftDealInfo.product_name === 'string' ? draftDealInfo.product_name : '');
      setPrice(draftDealInfo.price !== undefined && draftDealInfo.price !== null ? String(draftDealInfo.price) : '');
      setOriginalPrice(
        draftDealInfo.original_price !== undefined && draftDealInfo.original_price !== null
          ? String(draftDealInfo.original_price)
          : ''
      );
      setShipping(typeof draftDealInfo.shipping === 'string' ? draftDealInfo.shipping : '');
    }

    setPollDraft(draft.poll);

    const editorJson = editor.getJSON();
    const jsonContent = JSON.stringify(editorJson);
    setContent(jsonContent);
    setAutoTags(extractAutoTagsFromContent(editorJson));
    setRelatedConnections(extractRelatedCtasFromContent(editorJson));
    setCurrentDraftId(draft.id);
    setShowDraftList(false);
    setDraftSavedAt(draft.updatedAt);
    setDraftStatus('saved');

    lastAutoSavedDraftPayloadRef.current = JSON.stringify({
      draftId: draft.id,
      boardId: draft.boardId,
      title: draft.title,
      content: sanitizedContent,
      dealInfo: draft.dealInfo,
      poll: draft.poll,
    });

    toast.success('임시저장을 불러왔습니다.');
  }, [
    editor,
    lastAutoSavedDraftPayloadRef,
    setAutoTags,
    setContent,
    setCurrentDraftId,
    setDealUrl,
    setDraftSavedAt,
    setDraftStatus,
    setOriginalPrice,
    setPollDraft,
    setPrice,
    setProductName,
    setRelatedConnections,
    setShipping,
    setShowDraftList,
    setStore,
    setTitle,
  ]);

  const restoreDraft = useCallback((draft: PostDraft) => {
    if (!editor) return;

    if (!extensionsLoaded) {
      pendingRestoreDraftRef.current = draft;
      void ensureAdditionalExtensions();
      return;
    }

    applyDraftToEditor(draft);
  }, [applyDraftToEditor, editor, ensureAdditionalExtensions, extensionsLoaded, pendingRestoreDraftRef]);

  useEffect(() => {
    if (!editor || !extensionsLoaded || !pendingRestoreDraftRef.current) return;

    const draft = pendingRestoreDraftRef.current;
    pendingRestoreDraftRef.current = null;
    applyDraftToEditor(draft);
  }, [applyDraftToEditor, editor, extensionsLoaded, pendingRestoreDraftRef]);

  const refreshDrafts = useCallback(async () => {
    if (!categoryId) return;

    const result = await listPostDrafts(categoryId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setDrafts(result.drafts);
  }, [categoryId, setDrafts]);

  const buildCurrentDraftDealInfo = useCallback((): PostDraftDealInfo | null => {
    if (!isHotdeal) return null;

    return {
      deal_url: hotdeal.dealUrl.trim(),
      store: hotdeal.store,
      product_name: hotdeal.productName.trim(),
      price: hotdeal.price,
      original_price: hotdeal.originalPrice,
      shipping: hotdeal.shipping,
    };
  }, [hotdeal, isHotdeal]);

  const buildCurrentDraftPayload = useCallback(() => {
    if (!editor || !categoryId) return null;

    return {
      draftId: currentDraftId,
      boardId: categoryId,
      title: title.trim(),
      content: toPlainJson(editor.getJSON()),
      dealInfo: buildCurrentDraftDealInfo(),
      poll: pollDraft,
    };
  }, [buildCurrentDraftDealInfo, categoryId, currentDraftId, editor, pollDraft, title]);

  const saveCurrentDraft = useCallback(async (options?: { silent?: boolean }) => {
    if (!editor || !categoryId) return false;

    if (!hasDraftBody(title, editor, isHotdeal, hotdeal)) {
      if (!options?.silent) toast.error('저장할 내용이 없습니다.');
      return false;
    }

    setDraftStatus('saving');

    const payload = buildCurrentDraftPayload();
    if (!payload) return false;

    const result = await savePostDraft(payload);

    if (!result.success) {
      setDraftStatus('error');
      if (!options?.silent) toast.error(result.error);
      return false;
    }

    const savedAt = result.draft?.updatedAt || new Date().toISOString();

    if (result.draft?.id) setCurrentDraftId(result.draft.id);
    setDraftSavedAt(savedAt);
    setDraftStatus('saved');

    if (result.draft) {
      setDrafts((items) => [result.draft!, ...items.filter((item) => item.id !== result.draft!.id)]);
    }

    lastAutoSavedDraftPayloadRef.current = JSON.stringify({
      ...payload,
      draftId: result.draft?.id || payload.draftId,
    });

    if (!options?.silent) toast.success('임시저장했습니다.');
    return true;
  }, [
    buildCurrentDraftPayload,
    categoryId,
    editor,
    hotdeal,
    isHotdeal,
    lastAutoSavedDraftPayloadRef,
    setCurrentDraftId,
    setDraftSavedAt,
    setDraftStatus,
    setDrafts,
    title,
  ]);

  const handleOpenDraftList = useCallback(async () => {
    if (!isCreateMode) return;
    await refreshDrafts();
    setShowDraftList((value) => !value);
  }, [isCreateMode, refreshDrafts, setShowDraftList]);

  const handleDeleteDraft = useCallback(async (draftId: string) => {
    const result = await deletePostDraft(draftId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setDrafts((items) => items.filter((item) => item.id !== draftId));
    if (currentDraftId === draftId) {
      setCurrentDraftId(null);
      setDraftSavedAt(null);
      setDraftStatus('idle');
    }

    toast.success('임시저장을 삭제했습니다.');
  }, [currentDraftId, setCurrentDraftId, setDraftSavedAt, setDraftStatus, setDrafts]);

  useEffect(() => {
    if (!isCreateMode) return;

    setCurrentDraftId(null);
    setDraftSavedAt(null);
    setDraftStatus('idle');
    lastAutoSavedDraftPayloadRef.current = null;
    setShowDraftList(false);
    setDrafts([]);
  }, [
    categoryId,
    isCreateMode,
    lastAutoSavedDraftPayloadRef,
    setCurrentDraftId,
    setDraftSavedAt,
    setDraftStatus,
    setDrafts,
    setShowDraftList,
  ]);

  useEffect(() => {
    if (!isCreateMode || !editor || !categoryId || isSubmitting) return;
    if (!hasDraftBody(title, editor, isHotdeal, hotdeal)) return;

    const payload = buildCurrentDraftPayload();
    if (!payload) return;

    const serializedPayload = JSON.stringify(payload);
    if (serializedPayload === lastAutoSavedDraftPayloadRef.current) return;

    const timeoutId = window.setTimeout(() => {
      void saveCurrentDraft({ silent: true });
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [
    buildCurrentDraftPayload,
    categoryId,
    content,
    editor,
    hotdeal,
    isCreateMode,
    isHotdeal,
    isSubmitting,
    lastAutoSavedDraftPayloadRef,
    saveCurrentDraft,
    title,
  ]);

  useEffect(() => {
    if (!isCreateMode) return;

    const saveBeforeLeaving = () => {
      void saveCurrentDraft({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveBeforeLeaving();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', saveBeforeLeaving);
    window.addEventListener('beforeunload', saveBeforeLeaving);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', saveBeforeLeaving);
      window.removeEventListener('beforeunload', saveBeforeLeaving);
    };
  }, [isCreateMode, saveCurrentDraft]);

  return {
    restoreDraft,
    saveCurrentDraft,
    handleOpenDraftList,
    handleDeleteDraft,
  };
}
