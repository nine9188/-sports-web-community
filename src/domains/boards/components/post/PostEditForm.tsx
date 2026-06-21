'use client';

import { findCurrentTableEnd, findPollBlock, isEntityCardSelected, isPollBlockSelected } from './post-edit-form/utils/editorNodeHelpers';
import type { Editor } from '@tiptap/react';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Extension, type Content } from '@tiptap/core';
import { NodeSelection, Plugin, PluginKey, type EditorState } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { toast } from 'sonner';
import {
  deletePostDraft,
  type PostDraft,
} from '@/domains/boards/actions/posts/index';
import { Board } from '@/domains/boards/types/board';
import { Container, ContainerHeader, ContainerTitle, ContainerContent, Button } from '@/shared/components/ui';
import { useEditorHandlers } from './post-edit-form/hooks';
import { usePostSubmit } from './post-edit-form/hooks/usePostSubmit';
import { useDraftManager } from './post-edit-form/hooks/useDraftManager';
import { useMediaUpload } from './post-edit-form/hooks/useMediaUpload';
import { useToolbarPopoverPosition } from './post-edit-form/hooks/useToolbarPopoverPosition';
import { useSelectionPosition } from './post-edit-form/hooks/useSelectionPosition';
import { usePollEditor } from './post-edit-form/hooks/usePollEditor';
import { useAdditionalEditorExtensions } from './post-edit-form/hooks/useAdditionalEditorExtensions';
import { useEntitySelectionEditor } from './post-edit-form/hooks/useEntitySelectionEditor';
import { useTableEditorCommands } from './post-edit-form/hooks/useTableEditorCommands';
import { usePostEditor } from './post-edit-form/hooks/usePostEditor';
import { usePostFormState } from './post-edit-form/hooks/usePostFormState';
import { useEditorPopoverManager } from './post-edit-form/hooks/useEditorPopoverManager';
import { useEditorSelectionEffects } from './post-edit-form/hooks/useEditorSelectionEffects';
import { usePostNavigationActions } from './post-edit-form/hooks/usePostNavigationActions';
import { DraftControls } from './post-edit-form/components/DraftControls';
import { RelatedConnectionsPanel } from './post-edit-form/components/RelatedConnectionsPanel';
import { PostFormActions } from './post-edit-form/components/PostFormActions';
import { PostEditorSection } from './post-edit-form/components/PostEditorSection';
import { PostBasicFields } from './post-edit-form/components/PostBasicFields';
import { POPULAR_STORES, SHIPPING_OPTIONS, DealInfo } from '../../types/hotdeal';
import { extractAutoTagsFromContent } from '../../utils/post/extractAutoTagsFromContent';
import { extractRelatedCtasFromContent } from '../../utils/post/extractRelatedCtasFromContent';
import type { RelatedPostCta } from '../../utils/post/extractRelatedCtasFromContent';
import type { PostPollDraft } from '@/domains/boards/types/poll';
import { PollBlockExtension } from '@/shared/components/editor/tiptap/PollBlockExtension';

// Hotdeal options
const STORE_OPTIONS = POPULAR_STORES.map(storeName => ({ value: storeName, label: storeName }));
const SHIPPING_SELECT_OPTIONS = SHIPPING_OPTIONS.map(option => ({ value: option, label: option }));
const persistentSelectionHighlightKey = new PluginKey('persistentSelectionHighlight');
const SELECTION_MENU_WIDTH = 200;
const SELECTION_MENU_HEIGHT = 42;
const LINK_POPOVER_WIDTH = 300;
const LINK_POPOVER_HEIGHT = 96;
const YOUTUBE_POPOVER_WIDTH = 320;
const SOCIAL_POPOVER_WIDTH = 360;
const MATCH_POPOVER_WIDTH = 430;
const TEAM_POPOVER_WIDTH = 360;
const PLAYER_POPOVER_WIDTH = 390;
const TABLE_POPOVER_WIDTH = 202;
const POLL_POPOVER_WIDTH = 360;
const TABLE_MENU_WIDTH = 274;
const TABLE_MENU_HEIGHT = 42;
const EDITOR_EMPTY_PLACEHOLDER = '자유롭게 팬들과 소통하세요!\n이미지, 링크, 경기, 팀/선수를 본문에 추가할 수 있습니다.\n도박, 불법 홍보 관련 내용은 작성할 수 없습니다.\n욕설, 도배, 허위 정보는 삭제될 수 있습니다.';
type SelectionPositionAnchor = {
  from: number;
  to: number;
  popoverContentTop?: number;
  popoverLeft?: number;
};
type LocalPopoverPosition = {
  top: number;
  left: number;
  width: number;
};
type PollBlockMatch = {
  pos: number;
  nodeSize: number;
  draft: PostPollDraft;
};




function expandEntityCardGroupsInContent(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const expanded = expandEntityCardGroupsInContent(item);
      return Array.isArray(expanded) ? expanded : [expanded];
    });
  }

  const node = value as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] };

  if (node.type === 'entityCardGroup' && Array.isArray(node.attrs?.items)) {
    const items = node.attrs.items;

    return {
      type: 'entityCardGroup',
      attrs: {
        layout: 'grid',
        columns: 4,
      },
      content: items.flatMap((item) => {
        if (!item || typeof item !== 'object') return [];

        const card = item as { type?: string; id?: string | number; data?: unknown };
        if (!card.data) return [];
        return card.type === 'player'
          ? { type: 'playerCard', attrs: { playerId: card.id, playerData: card.data } }
          : { type: 'teamCard', attrs: { teamId: card.id, teamData: card.data } };
      }),
    };
  }

  if (Array.isArray(node.content)) {
    return {
      ...node,
      content: expandEntityCardGroupsInContent(node.content),
    };
  }

  return value;
}

function formatDraftTime(value: string | null) {
  if (!value) return '';

  try {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
}


function createPersistentSelectionDecorations(state: EditorState) {
  const { selection } = state;

  if (selection.empty) {
    return DecorationSet.empty;
  }

  return DecorationSet.create(state.doc, [
    Decoration.inline(selection.from, selection.to, {
      class: 'persistent-selection-highlight',
    }),
  ]);
}

const PersistentSelectionHighlight = Extension.create({
  name: 'persistentSelectionHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: persistentSelectionHighlightKey,
        state: {
          init: (_config, state) => createPersistentSelectionDecorations(state),
          apply: (transaction, oldDecorations, _oldState, newState) => {
            if (transaction.selectionSet || transaction.docChanged) {
              return createPersistentSelectionDecorations(newState);
            }

            return oldDecorations.map(transaction.mapping, transaction.doc);
          },
        },
        props: {
          decorations(state) {
            return persistentSelectionHighlightKey.getState(state);
          },
        },
      }),
    ];
  },
});

function createEditorPlaceholderDecorations(state: EditorState) {
  const firstChild = state.doc.firstChild;
  const isEmpty =
    state.doc.childCount === 1 &&
    firstChild?.type.name === 'paragraph' &&
    firstChild.content.size === 0;

  if (!isEmpty || !firstChild) {
    return DecorationSet.empty;
  }

  return DecorationSet.create(state.doc, [
    Decoration.node(0, firstChild.nodeSize, {
      class: 'editor-empty-placeholder',
      'data-placeholder': EDITOR_EMPTY_PLACEHOLDER,
    }),
  ]);
}

const EditorEmptyPlaceholder = Extension.create({
  name: 'editorEmptyPlaceholder',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('editorEmptyPlaceholder'),
        state: {
          init: (_config, state) => createEditorPlaceholderDecorations(state),
          apply: (transaction, oldDecorations, _oldState, newState) => {
            if (transaction.docChanged || transaction.selectionSet) {
              return createEditorPlaceholderDecorations(newState);
            }

            return oldDecorations.map(transaction.mapping, transaction.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

interface PostEditFormProps {
  postId?: string;
  boardId?: string;
  initialTitle?: string;
  initialContent?: string;
  boardName: string;
  categoryId?: string;
  setCategoryId?: ((id: string) => void) | null;
  allBoardsFlat?: Board[];
  isCreateMode?: boolean;
  initialDealInfo?: DealInfo | null;
  initialIsEvent?: boolean;
  isAdmin?: boolean;
}

export default function PostEditForm({
  postId,
  boardId,
  initialTitle = '',
  initialContent = '',
  boardName,
  categoryId: externalCategoryId,
  setCategoryId,
  allBoardsFlat = [],
  isCreateMode = false,
  initialDealInfo = null,
  initialIsEvent = false,
  isAdmin = false,
}: PostEditFormProps) {
  const {
    title,
    setTitle,
    content,
    setContent,
    categoryId,
    setCategoryIdInternal,
    dealUrl,
    setDealUrl,
    store,
    setStore,
    productName,
    setProductName,
    price,
    setPrice,
    originalPrice,
    setOriginalPrice,
    shipping,
    setShipping,
    isHotdeal,
    formStateRef,
    hotdealStateRef,
  } = usePostFormState({
    initialTitle,
    initialContent,
    externalCategoryId: externalCategoryId || '',
    boardId,
    allBoardsFlat,
    isCreateMode,
    initialDealInfo,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkPopoverSource, setLinkPopoverSource] = useState<'selection' | 'toolbar' | null>(null);
  const [toolbarLinkPopoverPosition, setToolbarLinkPopoverPosition] = useState<LocalPopoverPosition | null>(null);
  const [toolbarYoutubePopoverPosition, setToolbarYoutubePopoverPosition] = useState<LocalPopoverPosition | null>(null);
  const [toolbarSocialPopoverPosition, setToolbarSocialPopoverPosition] = useState<LocalPopoverPosition | null>(null);
  const [toolbarMatchPopoverPosition, setToolbarMatchPopoverPosition] = useState<LocalPopoverPosition | null>(null);
  const [toolbarTeamPopoverPosition, setToolbarTeamPopoverPosition] = useState<LocalPopoverPosition | null>(null);
  const [toolbarPlayerPopoverPosition, setToolbarPlayerPopoverPosition] = useState<LocalPopoverPosition | null>(null);
  const [toolbarTablePopoverPosition, setToolbarTablePopoverPosition] = useState<LocalPopoverPosition | null>(null);
  const [toolbarPollPopoverPosition, setToolbarPollPopoverPosition] = useState<LocalPopoverPosition | null>(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollDraft, setPollDraft] = useState<PostPollDraft | null>(null);
  const [isEvent, setIsEvent] = useState(initialIsEvent);
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const [relatedConnections, setRelatedConnections] = useState<RelatedPostCta[]>([]);
  const [selectionLinkPopoverPosition, setSelectionLinkPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectionMenuPosition, setSelectionMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [tableMenuPosition, setTableMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [editorViewportElement, setEditorViewportElement] = useState<HTMLDivElement | null>(null);
  const editorShellRef = useRef<HTMLDivElement>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [drafts, setDrafts] = useState<PostDraft[]>([]);
  const [showDraftList, setShowDraftList] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const imageInsertionPositionRef = useRef<number | null>(null);
  const videoInsertionPositionRef = useRef<number | null>(null);
  const initialContentAppliedRef = useRef(false);
  const lastAutoSavedDraftPayloadRef = useRef<string | null>(null);
  const pendingRestoreDraftRef = useRef<PostDraft | null>(null);
  const linkPopoverAnchorRef = useRef<SelectionPositionAnchor | null>(null);
  const tableInsertionRangeRef = useRef<{ from: number; to: number } | null>(null);
  const entityReplacementRangeRef = useRef<{ from: number; to: number } | null>(null);
  const pollDraftRef = useRef<PostPollDraft | null>(null);

  const parsedInitialContent = useMemo(() => {
    if (!initialContent) return '';
    try {
      const parsed = JSON.parse(initialContent);
      return expandEntityCardGroupsInContent(parsed);
    } catch {
      return initialContent;
    }
  }, [initialContent]);

  const baseExtensions = useMemo(() => [
    StarterKit,
    PersistentSelectionHighlight,
    EditorEmptyPlaceholder,
    PollBlockExtension,
    Image.configure({
      inline: false,
      allowBase64: false,
    }),
    Link.configure({
      openOnClick: false,
      autolink: false,
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
  ], []);

  const {
    loadedExtensions,
    extensionsLoaded,
    ensureAdditionalExtensions,
  } = useAdditionalEditorExtensions(baseExtensions);

  useEffect(() => {
    pollDraftRef.current = pollDraft;
  }, [pollDraft]);

  const router = useRouter();

  const editor = usePostEditor({
    loadedExtensions,
    extensionsLoaded,
    parsedInitialContent: parsedInitialContent as Content,
    initialContentAppliedRef,
    pollDraftRef,
    setContent,
    setAutoTags,
    setRelatedConnections,
    setPollDraft,
  });

  const {
    showYoutubeModal,
    showMatchModal,
    showLinkModal,
    showSocialModal,
    showTeamModal,
    showPlayerModal,
    showTableModal,
    setShowLinkModal,
    setShowYoutubeModal,
    setShowMatchModal,
    setShowSocialModal,
    setShowTeamModal,
    setShowPlayerModal,
    setShowTableModal,
    handleToggleDropdown,
    handleAddImage,
    handleAddYoutube,
    handleAddVideo,
    handleAddMatch,
    handleAddLink,
    handleAddSocialEmbed,
    handleAddTeam,
    handleAddPlayer,
    handleAddTable
  } = useEditorHandlers({
    editor,
    extensionsLoaded
  });

  const {
    restoreDraft,
    saveCurrentDraft,
    handleOpenDraftList,
    handleDeleteDraft,
  } = useDraftManager({
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
    hotdeal: {
      dealUrl,
      store,
      productName,
      price,
      originalPrice,
      shipping,
    },
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
  });

  useEffect(() => {
    if (!editor || pollDraftRef.current) return;

    const existingPoll = findPollBlock(editor);
    if (existingPoll) {
      setPollDraft(existingPoll.draft);
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const editorJson = editor.getJSON();
    setAutoTags(extractAutoTagsFromContent(editorJson));
    setRelatedConnections(extractRelatedCtasFromContent(editorJson));
  }, [editor]);

  const moveCursorAfterSelectedNode = useCallback(() => {
    if (!editor) return;

    const { selection } = editor.state;
    if (selection instanceof NodeSelection) {
      editor.chain().focus().setTextSelection(selection.to).run();
    }
  }, [editor]);

  const getCurrentInsertionPosition = useCallback(() => {
    if (!editor) return null;
    return editor.state.selection.to;
  }, [editor]);

  const {
    handleEditorToolToggle,
    closeLinkPopover,
    closeYoutubePopover,
    closeSocialPopover,
    closeMatchPopover,
    closeTeamPopover,
    closePlayerPopover,
    closeTablePopover,
    closePollPopover,
  } = useEditorPopoverManager({
    editor,
    extensionsLoaded,
    tableInsertionRangeRef,
    entityReplacementRangeRef,
    linkPopoverAnchorRef,
    moveCursorAfterSelectedNode,
    ensureAdditionalExtensions,
    handleToggleDropdown,
    setLinkPopoverSource,
    setSelectionLinkPopoverPosition,
    setToolbarLinkPopoverPosition,
    setToolbarYoutubePopoverPosition,
    setToolbarSocialPopoverPosition,
    setToolbarMatchPopoverPosition,
    setToolbarTeamPopoverPosition,
    setToolbarPlayerPopoverPosition,
    setToolbarTablePopoverPosition,
    setToolbarPollPopoverPosition,
    setShowLinkModal,
    setShowYoutubeModal,
    setShowMatchModal,
    setShowSocialModal,
    setShowTeamModal,
    setShowPlayerModal,
    setShowTableModal,
    setShowPollModal,
  });

  const linkState = useMemo(() => {
    if (!editor) {
      return { currentUrl: '', selectedText: '', isActive: false };
    }

    const { from, to } = editor.state.selection;
    return {
      currentUrl: String(editor.getAttributes('link').href || ''),
      selectedText: editor.state.doc.textBetween(from, to, ' '),
      isActive: editor.isActive('link'),
    };
  }, [editor, showLinkModal]);

  const handleRemoveLink = useCallback(() => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
  }, [editor]);

  const {
    handleSavePollDraft,
    handleRemovePollDraft,
    handleOpenSelectedPollEditor,
  } = usePollEditor({
    editor,
    pollDraft,
    editorShellRef,
    setPollDraft,
    setToolbarPollPopoverPosition,
    setShowPollModal,
  });

  const {
    handleOpenSelectedEntityEditor,
    handleSelectTeam,
    handleSelectPlayer,
  } = useEntitySelectionEditor({
    editor,
    editorShellRef,
    entityReplacementRangeRef,
    handleAddTeam,
    handleAddPlayer,
    setToolbarTeamPopoverPosition,
    setToolbarPlayerPopoverPosition,
    setShowTeamModal,
    setShowPlayerModal,
  });

  const {
    handleImageToolbarClick,
    handleImageFileChange,
    handleVideoToolbarClick,
    handleVideoFileChange,
  } = useMediaUpload({
    editor,
    isImageUploading,
    isVideoUploading,
    imageFileInputRef,
    videoFileInputRef,
    imageInsertionPositionRef,
    videoInsertionPositionRef,
    moveCursorAfterSelectedNode,
    getCurrentInsertionPosition,
    closeLinkPopover,
    closeYoutubePopover,
    closeSocialPopover,
    closeMatchPopover,
    closeTeamPopover,
    closePlayerPopover,
    closeTablePopover,
    closePollPopover,
    ensureAdditionalExtensions,
    handleAddImage,
    handleAddVideo,
    setIsImageUploading,
    setIsVideoUploading,
  });

  const {
    calculateSelectionPopoverPosition,
    calculateSelectionLinkPopoverPosition,
    calculateSelectionMenuPosition,
    calculateTableMenuPosition,
  } = useSelectionPosition({
    editor,
    editorViewportElement,
    linkPopoverAnchorRef,
  });

  const {
    updateTableMenuAfterCommand,
  } = useTableEditorCommands({
    editor,
    calculateTableMenuPosition,
    setTableMenuPosition,
  });

  const openLinkPopover = useCallback(() => {
    if (editor?.isActive('link')) {
      editor.chain().focus().extendMarkRange('link').run();
    }

    if (!editor || editor.state.selection.empty) return;

    const { from, to } = editor.state.selection;
    const position = calculateSelectionPopoverPosition(LINK_POPOVER_WIDTH, LINK_POPOVER_HEIGHT, {
      anchor: { from, to },
      useDomSelection: true,
      horizontalAlign: 'end',
    });
    if (!position) {
      linkPopoverAnchorRef.current = null;
      return;
    }

    linkPopoverAnchorRef.current = {
      from,
      to,
      popoverContentTop: position.top + (editorViewportElement?.scrollTop ?? 0),
      popoverLeft: position.left,
    };

    setLinkPopoverSource('selection');
    setToolbarLinkPopoverPosition(null);
    setSelectionMenuPosition(null);
    setSelectionLinkPopoverPosition(position);
    setShowLinkModal(true);
  }, [calculateSelectionPopoverPosition, editor, editorViewportElement, setShowLinkModal]);

  const {
    handleToolbarLinkButtonRect,
    handleToolbarYoutubeButtonRect,
    handleToolbarSocialButtonRect,
    handleToolbarMatchButtonRect,
    handleToolbarTeamButtonRect,
    handleToolbarPlayerButtonRect,
    handleToolbarTableButtonRect,
    handleToolbarPollButtonRect,
  } = useToolbarPopoverPosition({
    editorShellRef,
    setToolbarLinkPopoverPosition,
    setToolbarYoutubePopoverPosition,
    setToolbarSocialPopoverPosition,
    setToolbarMatchPopoverPosition,
    setToolbarTeamPopoverPosition,
    setToolbarPlayerPopoverPosition,
    setToolbarTablePopoverPosition,
    setToolbarPollPopoverPosition,
    onTableButtonRect: () => {
      if (editor) {
        const { from, to } = editor.state.selection;
        tableInsertionRangeRef.current = { from, to };
      }
    },
  });

  useEditorSelectionEffects({
    editor,
    editorViewportElement,
    showLinkModal,
    showYoutubeModal,
    linkPopoverSource,
    calculateSelectionLinkPopoverPosition,
    calculateSelectionMenuPosition,
    calculateTableMenuPosition,
    closeLinkPopover,
    closeYoutubePopover,
    openLinkPopover,
    isPollBlockSelected,
    setSelectionLinkPopoverPosition,
    setSelectionMenuPosition,
    setTableMenuPosition,
  });

  const { handleSubmit } = usePostSubmit({
    editor,
    router,
    postId,
    isCreateMode,
    isHotdeal,
    isSubmitting,
    currentDraftId,
    initialDealInfo,
    allBoardsFlat,
    autoTags,
    pollDraft,
    isEvent: isAdmin ? isEvent : undefined,
    formStateRef,
    hotdealStateRef,
    setError,
    setIsSubmitting,
  });

  const {
    handleCategoryChange,
    handleCancel,
  } = usePostNavigationActions({
    router,
    isCreateMode,
    setCategoryId,
    setCategoryIdInternal,
    saveCurrentDraft,
  });

  return (
    <Container className="mt-0">
      <ContainerHeader>
        <ContainerTitle>
          {isCreateMode ? '글쓰기' : '글 수정'} - {boardName}
        </ContainerTitle>
      </ContainerHeader>

      <ContainerContent className="pt-4">
        <form id="post-edit-form" onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-[13px]">
              {error}
            </div>
          )}

          <PostBasicFields
            isCreateMode={isCreateMode}
            isHotdeal={isHotdeal}
            allBoardsFlat={allBoardsFlat}
            categoryId={categoryId}
            boardId={boardId}
            title={title}
            dealUrl={dealUrl}
            store={store}
            productName={productName}
            price={price}
            originalPrice={originalPrice}
            shipping={shipping}
            storeOptions={STORE_OPTIONS}
            shippingOptions={SHIPPING_SELECT_OPTIONS}
            onCategoryChange={handleCategoryChange}
            setTitle={setTitle}
            setDealUrl={setDealUrl}
            setStore={setStore}
            setProductName={setProductName}
            setPrice={setPrice}
            setOriginalPrice={setOriginalPrice}
            setShipping={setShipping}
          />

          {isAdmin && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/70 dark:bg-amber-900/20">
              <input
                id="isEvent"
                type="checkbox"
                checked={isEvent}
                onChange={(event) => setIsEvent(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 bg-white text-amber-600 focus:ring-amber-500 dark:border-gray-600 dark:bg-[#333333]"
              />
              <label htmlFor="isEvent" className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                이벤트 라벨 표시
              </label>
            </div>
          )}

          <PostEditorSection
            editor={editor}
            editorShellRef={editorShellRef}
            setEditorViewportElement={setEditorViewportElement}
            editorViewportElement={editorViewportElement}
            extensionsLoaded={extensionsLoaded}
            isImageUploading={isImageUploading}
            isVideoUploading={isVideoUploading}
            imageFileInputRef={imageFileInputRef}
            videoFileInputRef={videoFileInputRef}
            showLinkModal={showLinkModal}
            showYoutubeModal={showYoutubeModal}
            showMatchModal={showMatchModal}
            showSocialModal={showSocialModal}
            showTeamModal={showTeamModal}
            showPlayerModal={showPlayerModal}
            showTableModal={showTableModal}
            showPollModal={showPollModal}
            linkPopoverSource={linkPopoverSource}
            toolbarLinkPopoverPosition={toolbarLinkPopoverPosition}
            toolbarYoutubePopoverPosition={toolbarYoutubePopoverPosition}
            toolbarSocialPopoverPosition={toolbarSocialPopoverPosition}
            toolbarMatchPopoverPosition={toolbarMatchPopoverPosition}
            toolbarTablePopoverPosition={toolbarTablePopoverPosition}
            toolbarPollPopoverPosition={toolbarPollPopoverPosition}
            toolbarTeamPopoverPosition={toolbarTeamPopoverPosition}
            toolbarPlayerPopoverPosition={toolbarPlayerPopoverPosition}
            selectionMenuPosition={selectionMenuPosition}
            selectionLinkPopoverPosition={selectionLinkPopoverPosition}
            tableMenuPosition={tableMenuPosition}
            linkState={linkState}
            pollDraft={pollDraft}
            tableInsertionRangeRef={tableInsertionRangeRef}
            handleEditorToolToggle={handleEditorToolToggle}
            handleImageToolbarClick={handleImageToolbarClick}
            handleVideoToolbarClick={handleVideoToolbarClick}
            handleImageFileChange={handleImageFileChange}
            handleVideoFileChange={handleVideoFileChange}
            handleToolbarLinkButtonRect={handleToolbarLinkButtonRect}
            handleToolbarYoutubeButtonRect={handleToolbarYoutubeButtonRect}
            handleToolbarSocialButtonRect={handleToolbarSocialButtonRect}
            handleToolbarMatchButtonRect={handleToolbarMatchButtonRect}
            handleToolbarTeamButtonRect={handleToolbarTeamButtonRect}
            handleToolbarPlayerButtonRect={handleToolbarPlayerButtonRect}
            handleToolbarTableButtonRect={handleToolbarTableButtonRect}
            handleToolbarPollButtonRect={handleToolbarPollButtonRect}
            closeLinkPopover={closeLinkPopover}
            closeYoutubePopover={closeYoutubePopover}
            closeSocialPopover={closeSocialPopover}
            closeMatchPopover={closeMatchPopover}
            closeTablePopover={closeTablePopover}
            closePollPopover={closePollPopover}
            closeTeamPopover={closeTeamPopover}
            closePlayerPopover={closePlayerPopover}
            handleAddLink={handleAddLink}
            handleRemoveLink={handleRemoveLink}
            handleAddYoutube={handleAddYoutube}
            handleAddSocialEmbed={handleAddSocialEmbed}
            handleAddMatch={handleAddMatch}
            handleAddTable={handleAddTable}
            handleSavePollDraft={handleSavePollDraft}
            handleSelectTeam={handleSelectTeam}
            handleSelectPlayer={handleSelectPlayer}
            isPollBlockSelected={isPollBlockSelected}
            isEntityCardSelected={isEntityCardSelected}
            handleOpenSelectedPollEditor={handleOpenSelectedPollEditor}
            handleRemovePollDraft={handleRemovePollDraft}
            handleOpenSelectedEntityEditor={handleOpenSelectedEntityEditor}
            updateTableMenuAfterCommand={updateTableMenuAfterCommand}
            setTableMenuPosition={setTableMenuPosition}
            openLinkPopover={openLinkPopover}
          />

          <RelatedConnectionsPanel
            relatedConnections={relatedConnections}
            autoTags={autoTags}
          />

          <PostFormActions
            isSubmitting={isSubmitting}
            isCreateMode={isCreateMode}
            draftStatus={draftStatus}
            onCancel={() => void handleCancel()}
          />

        </form>
      </ContainerContent>
    </Container>
  );
} 
