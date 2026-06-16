'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import { Extension, type Content } from '@tiptap/core';
import { NodeSelection, Plugin, PluginKey, type EditorState } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import BoardSelector from '@/domains/boards/components/createnavigation/BoardSelector';
import EditorToolbar from '@/domains/boards/components/createnavigation/EditorToolbar';
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
import { HotdealFields } from './post-edit-form/components/HotdealFields';
import { DraftControls } from './post-edit-form/components/DraftControls';
import { RelatedConnectionsPanel } from './post-edit-form/components/RelatedConnectionsPanel';
import { PostFormActions } from './post-edit-form/components/PostFormActions';
import { EditorToolbarPopovers } from './post-edit-form/components/EditorToolbarPopovers';
import { SelectionFloatingTools } from './post-edit-form/components/SelectionFloatingTools';
import { TableFloatingMenu } from './post-edit-form/components/TableFloatingMenu';
import { EditorBubbleMenus } from './post-edit-form/components/EditorBubbleMenus';
import { POPULAR_STORES, SHIPPING_OPTIONS, DealInfo } from '../../types/hotdeal';
import { detectStoreFromUrl, isHotdealBoard, formatPrice } from '../../utils/hotdeal';
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

function findPollBlock(editor: Editor): PollBlockMatch | null {
  let match: PollBlockMatch | null = null;

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== 'pollBlock') return true;

    match = {
      pos,
      nodeSize: node.nodeSize,
      draft: {
        question: String(node.attrs.question || ''),
        options: Array.isArray(node.attrs.options) ? node.attrs.options.filter((option): option is string => typeof option === 'string') : [],
      },
    };
    return false;
  });

  return match;
}

function isPollBlockSelected(editor: Editor) {
  const { selection } = editor.state;
  return selection instanceof NodeSelection && selection.node.type.name === 'pollBlock';
}

function isEntityCardSelected(editor: Editor) {
  const { selection } = editor.state;
  if (!(selection instanceof NodeSelection)) return false;

  return selection.node.type.name === 'teamCard' ||
    selection.node.type.name === 'playerCard';
}

function getSelectedEntityPickerMode(editor: Editor): 'team' | 'player' {
  const { selection } = editor.state;
  if (!(selection instanceof NodeSelection)) return 'team';

  if (selection.node.type.name === 'playerCard') return 'player';
  if (selection.node.type.name === 'entityCardGroup') {
    const items = selection.node.attrs.items;
    const firstItem = Array.isArray(items) ? items[0] : null;
    return firstItem?.type === 'player' ? 'player' : 'team';
  }

  return 'team';
}

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


function findCurrentTableEnd(editor: Editor) {
  const { $from } = editor.state.selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === 'table') {
      return $from.after(depth);
    }
  }

  return null;
}

function findNearestTableCellTextPosition(editor: Editor, nearPosition: number) {
  let nearestPosition: number | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== 'tableCell' && node.type.name !== 'tableHeader') return true;

    const textPosition = Math.min(pos + 2, pos + node.nodeSize - 1);
    const distance = Math.abs(pos - nearPosition);

    if (distance < nearestDistance) {
      nearestPosition = textPosition;
      nearestDistance = distance;
    }

    return false;
  });

  return nearestPosition;
}

function createPersistentSelectionDecorations(state: EditorState) {
  const { selection } = state;

  if (selection.empty) {
    return DecorationSet.empty;
  }

  return DecorationSet.create(state.doc, [
    Decoration.inline(selection.from, selection.to, {
      class: 'editor-persistent-selection',
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

// 紐⑤뱢 ?덈꺼?먯꽌 ?뺤옣 preload ?쒖옉 (而댄룷?뚰듃 留덉슫???꾩뿉 濡쒕뵫 ?쒖옉)
// ?대젃寃??섎㈃ PostEditForm??dynamic import?????뺤옣?ㅻ룄 蹂묐젹濡?濡쒕뵫??
function loadAdditionalEditorExtensions() {
  return Promise.all([
  import('@/shared/components/editor/tiptap/YoutubeExtension').then(mod => mod.YoutubeExtension),
  import('@/shared/components/editor/tiptap/VideoExtension').then(mod => mod.Video),
  import('@/shared/components/editor/tiptap/MatchCardExtension').then(mod => mod.MatchCardExtension),
  import('@/shared/components/editor/tiptap/extensions/social-embeds'),
  import('@/shared/components/editor/tiptap/EntityCardGroupExtension').then(mod => mod.EntityCardGroupExtension),
  import('@/shared/components/editor/tiptap/TeamCardExtension').then(mod => mod.TeamCardExtension),
  import('@/shared/components/editor/tiptap/PlayerCardExtension').then(mod => mod.PlayerCardExtension),
  import('@tiptap/extension-table').then(mod => mod.default),
  import('@tiptap/extension-table-row').then(mod => mod.default),
  import('@tiptap/extension-table-cell').then(mod => mod.default),
  import('@tiptap/extension-table-header').then(mod => mod.default)
]).catch(error => {
  console.error('?뺤옣 preload ?ㅽ뙣:', error);
  return null;
});
}

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
  initialDealInfo = null
}: PostEditFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
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

  // 理쒖떊 ?곹깭瑜?ref濡?愿由?(useCallback ?섏〈??理쒖냼??
  const formStateRef = useRef({ title, content, categoryId: externalCategoryId || '' });
  const hotdealStateRef = useRef({ dealUrl: '', store: '', productName: '', price: '', originalPrice: '', shipping: '' });

  // initialContent瑜??뚯떛?섏뿬 editor 珥덇린?붿슜 媛앹껜濡?蹂??
  const parsedInitialContent = useMemo(() => {
    if (!initialContent) return '';
    try {
      // JSON string?대㈃ ?뚯떛
      const parsed = JSON.parse(initialContent);
      return expandEntityCardGroupsInContent(parsed);
    } catch {
      // ?뚯떛 ?ㅽ뙣?섎㈃ HTML string?쇰줈 媛꾩＜
      return initialContent;
    }
  }, [initialContent]);
  // ?대? ?곹깭濡?categoryId 愿由?
  const [categoryId, setCategoryIdInternal] = useState(externalCategoryId || '');

  // ?ル뵜 愿??state (?섏젙 紐⑤뱶??寃쎌슦 珥덇린媛??ㅼ젙)
  const [dealUrl, setDealUrl] = useState(initialDealInfo?.deal_url || '');
  const [store, setStore] = useState(initialDealInfo?.store || '');
  const [productName, setProductName] = useState(initialDealInfo?.product_name || '');
  const [price, setPrice] = useState(initialDealInfo?.price ? String(initialDealInfo.price) : '');
  const [originalPrice, setOriginalPrice] = useState(initialDealInfo?.original_price ? String(initialDealInfo.original_price) : '');
  const [shipping, setShipping] = useState(initialDealInfo?.shipping || '');

  // ref ?숆린??(??댄븨????useCallback???ъ깮?깅릺吏 ?딅룄濡?
  useEffect(() => {
    formStateRef.current = { title, content, categoryId };
  }, [title, content, categoryId]);

  useEffect(() => {
    hotdealStateRef.current = { dealUrl, store, productName, price, originalPrice, shipping };
  }, [dealUrl, store, productName, price, originalPrice, shipping]);

  useEffect(() => {
    pollDraftRef.current = pollDraft;
  }, [pollDraft]);

  // 湲곕낯 ?뺤옣 (蹂寃쎈릺吏 ?딆쓬)
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
      }
    }),
  ], []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [additionalExtensions, setAdditionalExtensions] = useState<any[]>([]);
  const [extensionsLoaded, setExtensionsLoaded] = useState(false);
  const loadingExtensionsRef = useRef<Promise<boolean> | null>(null);

  // ?꾩껜 ?뺤옣 紐⑸줉 (湲곕낯 + 異붽?)
  const loadedExtensions = useMemo(() => [
    ...baseExtensions,
    ...additionalExtensions
  ], [baseExtensions, additionalExtensions]);

  // 珥덇린 濡쒕뵫 ??異붽? ?뺤옣 濡쒕뱶 (紐⑤뱢 ?덈꺼?먯꽌 ?대? preload ?쒖옉??
  useEffect(() => {
    // ?대? 濡쒕뱶?섏뿀?쇰㈃ 以묐났 ?ㅽ뻾 諛⑹?
    if (extensionsLoaded) return;

    const loadAdditionalExtensions = async () => {
      try {
        // 紐⑤뱢 ?덈꺼?먯꽌 ?쒖옉??preload Promise ?ъ슜 (?뚰꽣??諛⑹?)
        const result = await loadAdditionalEditorExtensions();

        if (!result) {
          setExtensionsLoaded(true);
          return;
        }

        const [
          YoutubeExtension,
          VideoExtension,
          MatchCardExt,
          SocialEmbedsModule,
          EntityCardGroupExt,
          TeamCardExt,
          PlayerCardExt,
          TableExtension,
          TableRow,
          TableCell,
          TableHeader
        ] = result;

        // 異붽? ?뺤옣 ?ㅼ젙 (以묐났 諛⑹?瑜??꾪빐 prev ?ъ슜 ????
        setAdditionalExtensions([
          YoutubeExtension,
          VideoExtension,
          MatchCardExt,
          SocialEmbedsModule.SocialEmbedExtension,
          SocialEmbedsModule.AutoSocialEmbedExtension.configure({ enabled: true }),
          EntityCardGroupExt,
          TeamCardExt,
          PlayerCardExt,
          TableExtension.configure({
            resizable: false,
            allowTableNodeSelection: true,
          }),
          TableRow,
          TableHeader,
          TableCell
        ]);
        setExtensionsLoaded(true);
      } catch (error) {
        console.error('異붽? ?뺤옣 濡쒕뵫 ?ㅽ뙣:', error);
        setExtensionsLoaded(true);
      }
    };

    void loadAdditionalExtensions();
  }, [extensionsLoaded]);

  const ensureAdditionalExtensions = useCallback(async () => {
    if (extensionsLoaded) return true;
    if (loadingExtensionsRef.current) return loadingExtensionsRef.current;

    loadingExtensionsRef.current = loadAdditionalEditorExtensions()
      .then((result) => {
        if (!result) {
          setExtensionsLoaded(true);
          return false;
        }

        const [
          YoutubeExtension,
          VideoExtension,
          MatchCardExt,
          SocialEmbedsModule,
          EntityCardGroupExt,
          TeamCardExt,
          PlayerCardExt,
          TableExtension,
          TableRow,
          TableCell,
          TableHeader
        ] = result;

        setAdditionalExtensions([
          YoutubeExtension,
          VideoExtension,
          MatchCardExt,
          SocialEmbedsModule.SocialEmbedExtension,
          SocialEmbedsModule.AutoSocialEmbedExtension.configure({ enabled: true }),
          EntityCardGroupExt,
          TeamCardExt,
          PlayerCardExt,
          TableExtension.configure({
            resizable: false,
            allowTableNodeSelection: true,
          }),
          TableRow,
          TableHeader,
          TableCell
        ]);
        setExtensionsLoaded(true);
        return true;
      })
      .catch((error) => {
        console.error('異붽? ?먮뵒???뺤옣 濡쒕뱶 ?ㅽ뙣:', error);
        setExtensionsLoaded(true);
        return false;
      })
      .finally(() => {
        loadingExtensionsRef.current = null;
      });

    return loadingExtensionsRef.current;
  }, [extensionsLoaded]);

  // ?ル뵜 URL ?낅젰 ???쇳븨紐??먮룞 媛먯?
  useEffect(() => {
    if (dealUrl && dealUrl.trim()) {
      const detectedStore = detectStoreFromUrl(dealUrl);
      setStore(detectedStore);
    }
  }, [dealUrl]);

  // ?ル뵜 寃뚯떆??寃뚯떆湲 泥댄겕
  const selectedBoard = useMemo(() => {
    // ?섏젙 紐⑤뱶?먯꽌??boardId ?ъ슜
    const boardIdToFind = isCreateMode ? categoryId : (boardId || categoryId);
    return allBoardsFlat.find(b => b.id === boardIdToFind);
  }, [allBoardsFlat, categoryId, boardId, isCreateMode]);

  const isHotdeal = useMemo(() => {
    // ?섏젙 紐⑤뱶?먯꽌 initialDealInfo媛 ?덉쑝硫??ル뵜 寃뚯떆湲
    if (!isCreateMode && initialDealInfo) {
      return true;
    }
    // ?앹꽦 紐⑤뱶?먯꽌??寃뚯떆??slug濡??먮떒
    if (!selectedBoard?.slug) return false;
    return isHotdealBoard(selectedBoard.slug);
  }, [selectedBoard, isCreateMode, initialDealInfo]);

  // ?ル뵜 寃뚯떆??寃뚯떆湲?먯꽌 ?쒕ぉ ?먮룞 ?앹꽦 (?앹꽦/?섏젙 紐⑤몢)
  useEffect(() => {
    if (isHotdeal && productName && store && price && shipping) {
      const priceNum = parseFloat(price);
      if (!isNaN(priceNum)) {
        const formattedPrice = formatPrice(priceNum);
        const generatedTitle = `[${store}] ${productName} [${formattedPrice}][${shipping}]`;
        setTitle(generatedTitle);
      }
    }
  }, [isHotdeal, productName, store, price, shipping]);

  const router = useRouter();
  
  // ?먮뵒??珥덇린??- 湲곕낯 ?뺤옣?쇰줈 癒쇱? ?앹꽦 ??異붽? ?뺤옣 濡쒕뱶 ???ъ깮??
  const editor = useEditor({
    extensions: loadedExtensions,
    content: extensionsLoaded ? parsedInitialContent as Content : '',
    onUpdate: ({ editor }) => {
      const editorJson = editor.getJSON();
      const jsonContent = JSON.stringify(editorJson);
      setContent(jsonContent);
      setAutoTags(extractAutoTagsFromContent(editorJson));
      setRelatedConnections(extractRelatedCtasFromContent(editorJson));

      const pollBlock = findPollBlock(editor);
      const currentPoll = pollDraftRef.current;
      if (!pollBlock && currentPoll) {
        setPollDraft(null);
      } else if (pollBlock) {
        const nextPoll = pollBlock.draft;
        const changed = !currentPoll
          || currentPoll.question !== nextPoll.question
          || currentPoll.options.length !== nextPoll.options.length
          || currentPoll.options.some((option, index) => option !== nextPoll.options[index]);

        if (changed) {
          setPollDraft(nextPoll);
        }
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose dark:prose-invert focus:outline-none max-w-none w-full min-h-[460px] p-4 text-gray-900 dark:text-[#F0F0F0] text-base',
      },
    },
    immediatelyRender: false
  }, [extensionsLoaded, loadedExtensions, parsedInitialContent]);

  useEffect(() => {
    if (!editor || !extensionsLoaded || !parsedInitialContent || initialContentAppliedRef.current) return;

    if (!editor.isEmpty) {
      initialContentAppliedRef.current = true;
      return;
    }

    editor.commands.setContent(parsedInitialContent as Content, true);
    const editorJson = editor.getJSON();
    const jsonContent = JSON.stringify(editorJson);
    setContent(jsonContent);
    setAutoTags(extractAutoTagsFromContent(editorJson));
    setRelatedConnections(extractRelatedCtasFromContent(editorJson));
    initialContentAppliedRef.current = true;
  }, [editor, extensionsLoaded, parsedInitialContent]);

  // ?먮뵒???몃뱾????
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

  const handleEditorToolToggle = useCallback((dropdown: 'link' | 'youtube' | 'match' | 'social' | 'team' | 'player' | 'table' | 'poll') => {
    moveCursorAfterSelectedNode();

    if (dropdown === 'poll') {
      setLinkPopoverSource(null);
      setShowPollModal((value) => !value);
      return;
    }
    setShowPollModal(false);
    setToolbarPollPopoverPosition(null);
    if (dropdown === 'youtube' || dropdown === 'match' || dropdown === 'social' || dropdown === 'team' || dropdown === 'player' || dropdown === 'table') {
      if (dropdown === 'table' && editor) {
        const { from, to } = editor.state.selection;
        tableInsertionRangeRef.current = { from, to };
      }
      if (dropdown === 'table' && !extensionsLoaded) {
        setLinkPopoverSource(null);
        void ensureAdditionalExtensions().then(() => handleToggleDropdown('table'));
        return;
      }
      void ensureAdditionalExtensions();
    }
    if (dropdown === 'link') {
      if (editor?.isActive('link')) {
        editor.chain().focus().extendMarkRange('link').run();
      }
      setLinkPopoverSource('toolbar');
      setShowLinkModal(true);
      return;
    }
    setLinkPopoverSource(null);
    handleToggleDropdown(dropdown);
  }, [editor, ensureAdditionalExtensions, extensionsLoaded, handleToggleDropdown, moveCursorAfterSelectedNode, setShowLinkModal]);

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

  const closeLinkPopover = useCallback(() => {
    linkPopoverAnchorRef.current = null;
    setLinkPopoverSource(null);
    setToolbarLinkPopoverPosition(null);
    setSelectionLinkPopoverPosition(null);
    setShowLinkModal(false);
  }, [setShowLinkModal]);

  const closeYoutubePopover = useCallback(() => {
    setToolbarYoutubePopoverPosition(null);
    setShowYoutubeModal(false);
  }, [setShowYoutubeModal]);

  const closeSocialPopover = useCallback(() => {
    setToolbarSocialPopoverPosition(null);
    setShowSocialModal(false);
  }, [setShowSocialModal]);

  const closeMatchPopover = useCallback(() => {
    setToolbarMatchPopoverPosition(null);
    setShowMatchModal(false);
  }, [setShowMatchModal]);

  const closeTeamPopover = useCallback(() => {
    setToolbarTeamPopoverPosition(null);
    setShowTeamModal(false);
    entityReplacementRangeRef.current = null;
  }, [setShowTeamModal]);

  const closePlayerPopover = useCallback(() => {
    setToolbarPlayerPopoverPosition(null);
    setShowPlayerModal(false);
    entityReplacementRangeRef.current = null;
  }, [setShowPlayerModal]);

  const closeTablePopover = useCallback(() => {
    setToolbarTablePopoverPosition(null);
    setShowTableModal(false);
  }, [setShowTableModal]);

  const closePollPopover = useCallback(() => {
    setToolbarPollPopoverPosition(null);
    setShowPollModal(false);
  }, []);

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

  const handleOpenSelectedEntityEditor = useCallback(() => {
    if (!editor || !(editor.state.selection instanceof NodeSelection)) return;

    const { from, to } = editor.state.selection;
    const mode = getSelectedEntityPickerMode(editor);
    const shell = editorShellRef.current;
    const selectionRect = editor.view.coordsAtPos(from);
    const boundary = shell?.getBoundingClientRect();
    const padding = 8;
    const maxWidth = mode === 'player' ? PLAYER_POPOVER_WIDTH : TEAM_POPOVER_WIDTH;
    const width = Math.min(maxWidth, Math.max(120, (boundary?.width ?? maxWidth) - padding * 2));

    entityReplacementRangeRef.current = { from, to };
    setToolbarTeamPopoverPosition(null);
    setToolbarPlayerPopoverPosition(null);

    const position = {
      top: boundary ? selectionRect.bottom - boundary.top + 6 : 0,
      left: boundary
        ? Math.max(padding, Math.min(selectionRect.left - boundary.left, boundary.width - width - padding))
        : 12,
      width,
    };

    if (mode === 'player') {
      setToolbarPlayerPopoverPosition(position);
      setShowTeamModal(false);
      setShowPlayerModal(true);
    } else {
      setToolbarTeamPopoverPosition(position);
      setShowPlayerModal(false);
      setShowTeamModal(true);
    }
  }, [editor, setShowPlayerModal, setShowTeamModal]);

  const replaceSelectedEntityIfNeeded = useCallback(() => {
    if (!editor || !entityReplacementRangeRef.current) return;

    const { from, to } = entityReplacementRangeRef.current;
    editor.chain().focus().deleteRange({ from, to }).setTextSelection(from).run();
    entityReplacementRangeRef.current = null;
  }, [editor]);

  const handleSelectTeam = useCallback(async (...args: Parameters<typeof handleAddTeam>) => {
    replaceSelectedEntityIfNeeded();
    await handleAddTeam(...args);
  }, [handleAddTeam, replaceSelectedEntityIfNeeded]);

  const handleSelectPlayer = useCallback(async (...args: Parameters<typeof handleAddPlayer>) => {
    replaceSelectedEntityIfNeeded();
    await handleAddPlayer(...args);
  }, [handleAddPlayer, replaceSelectedEntityIfNeeded]);

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

  const updateTableMenuAfterCommand = useCallback((nearPosition: number, restoreSelection = false) => {
    window.requestAnimationFrame(() => {
      if (!editor) return;

      if (restoreSelection && !editor.isActive('table')) {
        const nextPosition = findNearestTableCellTextPosition(editor, nearPosition);
        if (nextPosition !== null) {
          editor.commands.setTextSelection(nextPosition);
        }
      }

      setTableMenuPosition(calculateTableMenuPosition());
    });
  }, [calculateTableMenuPosition, editor]);

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

  useEffect(() => {
    if (!showLinkModal) return;

    const handlePointerOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-editor-link-popover="true"]')) return;

      closeLinkPopover();
    };

    document.addEventListener('mousedown', handlePointerOutside);
    document.addEventListener('touchstart', handlePointerOutside);

    return () => {
      document.removeEventListener('mousedown', handlePointerOutside);
      document.removeEventListener('touchstart', handlePointerOutside);
    };
  }, [closeLinkPopover, showLinkModal]);

  useEffect(() => {
    if (!showYoutubeModal) return;

    const handlePointerOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-editor-youtube-popover="true"]')) return;

      closeYoutubePopover();
    };

    document.addEventListener('mousedown', handlePointerOutside);
    document.addEventListener('touchstart', handlePointerOutside);

    return () => {
      document.removeEventListener('mousedown', handlePointerOutside);
      document.removeEventListener('touchstart', handlePointerOutside);
    };
  }, [closeYoutubePopover, showYoutubeModal]);

  useEffect(() => {
    if (!showLinkModal || linkPopoverSource !== 'selection') return;

    const updatePosition = (keepHorizontalPosition = false) => {
      const position = calculateSelectionLinkPopoverPosition();
      if (position) {
        setSelectionLinkPopoverPosition((previousPosition) => {
          if (!keepHorizontalPosition || !previousPosition) {
            return position;
          }

          return {
            top: position.top,
            left: previousPosition.left,
          };
        });
      } else {
        closeLinkPopover();
      }
    };
    const updateVerticalPositionOnEditorScroll = () => updatePosition(true);
    const updateFullPositionOnResize = () => updatePosition(false);

    editorViewportElement?.addEventListener('scroll', updateVerticalPositionOnEditorScroll, { passive: true });
    window.addEventListener('resize', updateFullPositionOnResize);

    return () => {
      editorViewportElement?.removeEventListener('scroll', updateVerticalPositionOnEditorScroll);
      window.removeEventListener('resize', updateFullPositionOnResize);
    };
  }, [calculateSelectionLinkPopoverPosition, closeLinkPopover, editorViewportElement, linkPopoverSource, showLinkModal]);

  useEffect(() => {
    if (!editor || !editorViewportElement) return;

    const updateSelectionMenuPosition = () => {
      if (showLinkModal) {
        setSelectionMenuPosition(null);
        setTableMenuPosition(null);
        return;
      }

      if (editor.isActive('table')) {
        setSelectionMenuPosition(null);
        setTableMenuPosition(calculateTableMenuPosition());
        return;
      }

      setTableMenuPosition(null);

      if (isPollBlockSelected(editor)) {
        setSelectionMenuPosition(null);
        return;
      }

      if (editor.state.selection instanceof NodeSelection) {
        setSelectionMenuPosition(null);
        return;
      }

      if (editor.state.selection.empty && !editor.isActive('link')) {
        setSelectionMenuPosition(null);
        return;
      }

      setSelectionMenuPosition(calculateSelectionMenuPosition());
    };

    const hideOnPageScroll = () => {
      setSelectionMenuPosition(null);
      setTableMenuPosition(null);
      closeLinkPopover();
    };
    const hideSelectionMenu = () => {
      setSelectionMenuPosition(null);
      setTableMenuPosition(null);
    };

    editor.on('selectionUpdate', updateSelectionMenuPosition);
    editor.on('focus', updateSelectionMenuPosition);
    editor.on('blur', hideSelectionMenu);
    editorViewportElement.addEventListener('scroll', updateSelectionMenuPosition, { passive: true });
    window.addEventListener('resize', updateSelectionMenuPosition);
    window.addEventListener('scroll', hideOnPageScroll, { passive: true });

    updateSelectionMenuPosition();

    return () => {
      editor.off('selectionUpdate', updateSelectionMenuPosition);
      editor.off('focus', updateSelectionMenuPosition);
      editor.off('blur', hideSelectionMenu);
      editorViewportElement.removeEventListener('scroll', updateSelectionMenuPosition);
      window.removeEventListener('resize', updateSelectionMenuPosition);
      window.removeEventListener('scroll', hideOnPageScroll);
    };
  }, [calculateSelectionMenuPosition, calculateTableMenuPosition, closeLinkPopover, editor, editorViewportElement, showLinkModal]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!editor) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openLinkPopover();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, openLinkPopover]);

  
  // 移댄뀒怨좊━ 蹂寃??몃뱾??
  const handleCategoryChange = useCallback((id: string) => {
    setCategoryIdInternal(id);
    if (setCategoryId && typeof setCategoryId === 'function') {
      setCategoryId(id);
    }
  }, [setCategoryId]);

  // ?ル뵜 ?뺣낫 ?앹꽦 ?ы띁 (refs ?ъ슜?쇰줈 ?섏〈??理쒖냼??
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
    formStateRef,
    hotdealStateRef,
    setError,
    setIsSubmitting,
  });

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

  return (
    <Container className="mt-0">
      <ContainerHeader>
        <ContainerTitle>
          {isCreateMode ? '글쓰기' : '글 수정'} - {boardName}
        </ContainerTitle>
      </ContainerHeader>

      {/* 而⑦뀗痢?*/}
      <ContainerContent className="pt-4">
        <form id="post-edit-form" onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-[13px]">
              {error}
            </div>
          )}

          {isCreateMode && (
            <DraftControls
              categoryId={categoryId}
              draftStatus={draftStatus}
              draftSavedAt={draftSavedAt}
              drafts={drafts}
              showDraftList={showDraftList}
              formatDraftTime={formatDraftTime}
              onSaveDraft={() => void saveCurrentDraft()}
              onOpenDraftList={handleOpenDraftList}
              onRestoreDraft={restoreDraft}
              onDeleteDraft={handleDeleteDraft}
            />
          )}

          {/* 寃뚯떆???좏깮 ?꾨뱶 (?앹꽦 紐⑤뱶?먯꽌留??쒖떆) */}
          {isCreateMode && (
            <div className="space-y-2">
              <label htmlFor="categoryId" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                게시판 선택 <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <BoardSelector
                boards={allBoardsFlat}
                selectedId={categoryId}
                onSelect={handleCategoryChange}
                currentBoardId={boardId}
              />
            </div>
          )}

          {/* ?쒕ぉ ?꾨뱶 - ?ル뵜 寃뚯떆?먯씠 ?꾨땺 ?뚮쭔 ?쒖떆 (?ル뵜? ?쒕ぉ ?먮룞 ?앹꽦) */}
          {!isHotdeal && (
            <div className="space-y-2">
              <label htmlFor="title" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">제목</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none text-base"
                placeholder="제목을 입력하세요"
                maxLength={100}
                required
              />
            </div>
          )}

          {/* ?ル뵜 ?뺣낫 ?꾨뱶 - ?ル뵜 寃뚯떆湲?????쒖떆 (?앹꽦/?섏젙 紐⑤몢) */}
          {isHotdeal && (
            <HotdealFields
              dealUrl={dealUrl}
              store={store}
              productName={productName}
              price={price}
              originalPrice={originalPrice}
              shipping={shipping}
              storeOptions={STORE_OPTIONS}
              shippingOptions={SHIPPING_SELECT_OPTIONS}
              setDealUrl={setDealUrl}
              setStore={setStore}
              setProductName={setProductName}
              setPrice={setPrice}
              setOriginalPrice={setOriginalPrice}
              setShipping={setShipping}
            />
          )}

          <div ref={editorShellRef} className="relative space-y-2">
            <label htmlFor="content" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">내용</label>
            
            {/* ?먮뵒???대컮 而댄룷?뚰듃 (踰꾪듉留? */}
            <EditorToolbar
              editor={editor}
              extensionsLoaded={extensionsLoaded}
              isImageUploading={isImageUploading}
              isVideoUploading={isVideoUploading}
              showLinkModal={showLinkModal}
              showYoutubeModal={showYoutubeModal}
              showMatchModal={showMatchModal}
              showSocialModal={showSocialModal}
              showTeamModal={showTeamModal}
              showPlayerModal={showPlayerModal}
              showTableModal={showTableModal}
              showPollModal={showPollModal}
              handleToggleDropdown={handleEditorToolToggle}
              onImageClick={handleImageToolbarClick}
              onVideoClick={handleVideoToolbarClick}
              onToolbarLinkButtonRect={handleToolbarLinkButtonRect}
              onToolbarYoutubeButtonRect={handleToolbarYoutubeButtonRect}
              onToolbarSocialButtonRect={handleToolbarSocialButtonRect}
              onToolbarMatchButtonRect={handleToolbarMatchButtonRect}
              onToolbarTeamButtonRect={handleToolbarTeamButtonRect}
              onToolbarPlayerButtonRect={handleToolbarPlayerButtonRect}
              onToolbarTableButtonRect={handleToolbarTableButtonRect}
              onToolbarPollButtonRect={handleToolbarPollButtonRect}
            />
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />
            <input
              ref={videoFileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoFileChange}
            />
            <EditorToolbarPopovers
              linkPopoverSource={linkPopoverSource}
              showLinkModal={showLinkModal}
              showYoutubeModal={showYoutubeModal}
              showSocialModal={showSocialModal}
              showMatchModal={showMatchModal}
              showTableModal={showTableModal}
              showPollModal={showPollModal}
              showTeamModal={showTeamModal}
              showPlayerModal={showPlayerModal}
              toolbarLinkPopoverPosition={toolbarLinkPopoverPosition}
              toolbarYoutubePopoverPosition={toolbarYoutubePopoverPosition}
              toolbarSocialPopoverPosition={toolbarSocialPopoverPosition}
              toolbarMatchPopoverPosition={toolbarMatchPopoverPosition}
              toolbarTablePopoverPosition={toolbarTablePopoverPosition}
              toolbarPollPopoverPosition={toolbarPollPopoverPosition}
              toolbarTeamPopoverPosition={toolbarTeamPopoverPosition}
              toolbarPlayerPopoverPosition={toolbarPlayerPopoverPosition}
              linkState={linkState}
              pollDraft={pollDraft}
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
              handleAddTable={(rows, cols) => handleAddTable(rows, cols, tableInsertionRangeRef.current ?? undefined)}
              handleSavePollDraft={handleSavePollDraft}
              handleSelectTeam={handleSelectTeam}
              handleSelectPlayer={handleSelectPlayer}
            />
            <div
              ref={setEditorViewportElement}
              className="relative border border-black/7 dark:border-white/10 rounded-b-md h-[60vh] min-h-[420px] max-h-[680px] overflow-x-hidden overflow-y-auto overscroll-contain bg-white dark:bg-[#262626]"
            >
              {editor && (
                <EditorBubbleMenus
                  editor={editor}
                  editorViewportElement={editorViewportElement}
                  showPollModal={showPollModal}
                  showTeamModal={showTeamModal}
                  showPlayerModal={showPlayerModal}
                  isPollBlockSelected={isPollBlockSelected}
                  isEntityCardSelected={isEntityCardSelected}
                  onOpenSelectedPollEditor={handleOpenSelectedPollEditor}
                  onRemovePollDraft={handleRemovePollDraft}
                  onOpenSelectedEntityEditor={handleOpenSelectedEntityEditor}
                />
              )}

              <div className="sticky left-0 top-0 z-20 h-0 w-full overflow-visible">
                {editor && tableMenuPosition && !showTableModal && (
                  <TableFloatingMenu
                    editor={editor}
                    tableMenuPosition={tableMenuPosition}
                    onUpdateAfterCommand={updateTableMenuAfterCommand}
                    onDeleteTable={() => {
                      editor.chain().focus().deleteTable().run();
                      setTableMenuPosition(null);
                    }}
                  />
                )}
                {editor && (
                  <SelectionFloatingTools
                    editor={editor}
                    selectionMenuPosition={selectionMenuPosition}
                    selectionLinkPopoverPosition={selectionLinkPopoverPosition}
                    showLinkModal={showLinkModal}
                    linkPopoverSource={linkPopoverSource}
                    linkState={linkState}
                    openLinkPopover={openLinkPopover}
                    closeLinkPopover={closeLinkPopover}
                    handleAddLink={handleAddLink}
                    handleRemoveLink={handleRemoveLink}
                  />
                )}
              </div>
              <EditorContent editor={editor} />
            </div>

          </div>

          <RelatedConnectionsPanel
            relatedConnections={relatedConnections}
            autoTags={autoTags}
          />

          {/* 踰꾪듉 ?곸뿭 */}
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
