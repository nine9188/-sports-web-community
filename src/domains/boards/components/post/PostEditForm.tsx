'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BubbleMenu, useEditor, EditorContent, type Editor } from '@tiptap/react';
import { Extension, type Content } from '@tiptap/core';
import { NodeSelection, Plugin, PluginKey, type EditorState } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import BoardSelector from '@/domains/boards/components/createnavigation/BoardSelector';
import EditorToolbar from '@/domains/boards/components/createnavigation/EditorToolbar';
import { toast } from 'sonner';
import { createPost, updatePost } from '@/domains/boards/actions/posts/index';
import { Board } from '@/domains/boards/types/board';
import { Container, ContainerHeader, ContainerTitle, ContainerContent, Button, NativeSelect } from '@/shared/components/ui';
import { useEditorHandlers } from './post-edit-form/hooks';
import { uploadPostImageFile } from './post-edit-form/utils/uploadPostImageFile';
import { uploadPostVideoFile } from './post-edit-form/utils/uploadPostVideoFile';
import { POPULAR_STORES, SHIPPING_OPTIONS, DealInfo } from '../../types/hotdeal';
import { detectStoreFromUrl, isHotdealBoard, formatPrice } from '../../utils/hotdeal';
import { extractAutoTagsFromContent } from '../../utils/post/extractAutoTagsFromContent';
import { extractRelatedCtasFromContent } from '../../utils/post/extractRelatedCtasFromContent';
import type { RelatedPostCta } from '../../utils/post/extractRelatedCtasFromContent';
import LinkForm from '@/domains/boards/components/form/LinkForm';
import YoutubeForm from '@/domains/boards/components/form/YoutubeForm';
import MatchResultForm from '@/domains/boards/components/form/MatchResultForm';
import SocialEmbedForm from '@/domains/boards/components/form/SocialEmbedForm';
import TablePickerForm from '@/domains/boards/components/form/TablePickerForm';
import PollForm from '@/domains/boards/components/form/PollForm';
import { EntityPickerForm } from '@/domains/boards/components/entity/EntityPickerForm';
import type { PostPollDraft } from '@/domains/boards/types/poll';
import { PollBlockExtension } from '@/shared/components/editor/tiptap/PollBlockExtension';
import { Bold, CalendarDays, Heading2, Heading3, Italic, Link as LinkIcon, Shield, Trash2, UserRound } from 'lucide-react';

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

function findEmptyEntityCardGroup(editor: Editor, nearPosition: number) {
  let match: { from: number; to: number } | null = null;

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== 'entityCardGroup') return true;

    const isNearGroup = nearPosition >= pos && nearPosition <= pos + node.nodeSize;
    if (isNearGroup && node.childCount === 0) {
      match = { from: pos, to: pos + node.nodeSize };
      return false;
    }

    return true;
  });

  return match;
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

function RelatedConnectionIcon({ type }: { type: RelatedPostCta['type'] }) {
  if (type === 'match') return <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />;
  if (type === 'player') return <UserRound className="h-3.5 w-3.5" aria-hidden="true" />;
  return <Shield className="h-3.5 w-3.5" aria-hidden="true" />;
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
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const imageInsertionPositionRef = useRef<number | null>(null);
  const videoInsertionPositionRef = useRef<number | null>(null);
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
          PlayerCardExt
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
          PlayerCardExt
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

  const handleSavePollDraft = useCallback((nextPoll: PostPollDraft) => {
    if (!editor) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    const existingPoll = findPollBlock(editor);
    const attrs = {
      question: nextPoll.question,
      options: nextPoll.options,
    };

    if (existingPoll) {
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.setNodeMarkup(existingPoll.pos, undefined, attrs);
          return true;
        })
        .run();
    } else {
      const pollContent = [
        { type: 'pollBlock', attrs },
        { type: 'paragraph' },
      ];
      const tableEnd = findCurrentTableEnd(editor);

      if (tableEnd !== null) {
        editor.chain().focus().insertContentAt(tableEnd, pollContent).run();
      } else {
        editor.chain().focus().insertContent(pollContent).run();
      }
    }

    setPollDraft(nextPoll);
    toast.success(existingPoll || pollDraft ? '투표가 수정되었습니다.' : '투표가 추가되었습니다.');
  }, [editor, pollDraft]);

  const handleRemovePollDraft = useCallback(() => {
    if (editor) {
      const existingPoll = findPollBlock(editor);
      if (existingPoll) {
        editor
          .chain()
          .focus()
          .deleteRange({ from: existingPoll.pos, to: existingPoll.pos + existingPoll.nodeSize })
          .run();
      }
    }

    setPollDraft(null);
    toast.success('투표가 삭제되었습니다.');
  }, [editor]);

  const handleOpenSelectedPollEditor = useCallback(() => {
    if (!editor) return;

    const existingPoll = findPollBlock(editor);
    if (existingPoll) {
      setPollDraft(existingPoll.draft);
    }

    const shell = editorShellRef.current;
    const selectionRect = editor.view.coordsAtPos(editor.state.selection.from);
    const boundary = shell?.getBoundingClientRect();
    const padding = 8;
    const width = Math.min(POLL_POPOVER_WIDTH, Math.max(120, (boundary?.width ?? POLL_POPOVER_WIDTH) - padding * 2));

    setToolbarPollPopoverPosition({
      top: boundary ? selectionRect.bottom - boundary.top + 6 : 0,
      left: boundary
        ? Math.min(Math.max(selectionRect.left - boundary.left, padding), Math.max(padding, boundary.width - width - padding))
        : 12,
      width,
    });
    setShowPollModal(true);
  }, [editor]);

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

  const handleRemoveSelectedEntityCard = useCallback(() => {
    if (!editor || !isEntityCardSelected(editor)) return;

    const deleteTo = editor.state.selection.to;
    editor.chain().focus().deleteSelection().run();

    const emptyGroup = findEmptyEntityCardGroup(editor, deleteTo);
    if (emptyGroup) {
      editor.chain().focus().deleteRange(emptyGroup).run();
    }

    entityReplacementRangeRef.current = null;
    toast.success('카드가 삭제되었습니다.');
  }, [editor]);

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

  const handleImageToolbarClick = useCallback(() => {
    if (isImageUploading) return;

    moveCursorAfterSelectedNode();
    imageInsertionPositionRef.current = getCurrentInsertionPosition();
    closeLinkPopover();
    closeYoutubePopover();
    closeSocialPopover();
    closeMatchPopover();
    closeTeamPopover();
    closePlayerPopover();
    closeTablePopover();
    closePollPopover();
    imageFileInputRef.current?.click();
  }, [
    closeLinkPopover,
    closeMatchPopover,
    closePlayerPopover,
    closePollPopover,
    closeSocialPopover,
    closeTablePopover,
    closeTeamPopover,
    closeYoutubePopover,
    getCurrentInsertionPosition,
    isImageUploading,
    moveCursorAfterSelectedNode,
  ]);

  const handleImageFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';

    if (!file) return;
    if (!editor) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    setIsImageUploading(true);

    try {
      const { publicUrl, altText } = await uploadPostImageFile(file);
      handleAddImage(publicUrl, altText, imageInsertionPositionRef.current);
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      toast.error(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.');
    } finally {
      imageInsertionPositionRef.current = null;
      setIsImageUploading(false);
    }
  }, [editor, handleAddImage]);

  const handleVideoToolbarClick = useCallback(() => {
    if (isVideoUploading) return;

    moveCursorAfterSelectedNode();
    videoInsertionPositionRef.current = getCurrentInsertionPosition();
    closeLinkPopover();
    closeYoutubePopover();
    closeSocialPopover();
    closeMatchPopover();
    closeTeamPopover();
    closePlayerPopover();
    closeTablePopover();
    closePollPopover();
    void ensureAdditionalExtensions();
    videoFileInputRef.current?.click();
  }, [
    closeLinkPopover,
    closeMatchPopover,
    closePlayerPopover,
    closePollPopover,
    closeSocialPopover,
    closeTablePopover,
    closeTeamPopover,
    closeYoutubePopover,
    ensureAdditionalExtensions,
    getCurrentInsertionPosition,
    isVideoUploading,
    moveCursorAfterSelectedNode,
  ]);

  const handleVideoFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';

    if (!file) return;
    if (!editor) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    setIsVideoUploading(true);

    try {
      const [{ publicUrl, caption }] = await Promise.all([
        uploadPostVideoFile(file),
        ensureAdditionalExtensions(),
      ]);
      await handleAddVideo(publicUrl, caption, videoInsertionPositionRef.current);
    } catch (error) {
      console.error('동영상 업로드 오류:', error);
      toast.error(error instanceof Error ? error.message : '동영상 업로드에 실패했습니다.');
    } finally {
      videoInsertionPositionRef.current = null;
      setIsVideoUploading(false);
    }
  }, [editor, ensureAdditionalExtensions, handleAddVideo]);

  const calculateSelectionPopoverPosition = useCallback((
    preferredWidth: number,
    estimatedHeight: number,
    options: { anchor?: SelectionPositionAnchor | null; useDomSelection?: boolean; horizontalAlign?: 'center' | 'end' } = {}
  ) => {
    if (!editor || !editorViewportElement) return null;

    const docSize = editor.state.doc.content.size;
    const anchor = options.anchor ?? editor.state.selection;
    const from = Math.min(Math.max(anchor.from, 0), docSize);
    const to = Math.min(Math.max(anchor.to, from), docSize);
    const boundary = editorViewportElement.getBoundingClientRect();
    const padding = 8;
    const scrollbarWidth = Math.max(0, editorViewportElement.offsetWidth - editorViewportElement.clientWidth);
    const contentRight = boundary.right - scrollbarWidth;
    const contentBottom = boundary.bottom;
    const contentWidth = editorViewportElement.clientWidth;
    const width = Math.min(preferredWidth, Math.max(120, contentWidth - padding * 2));
    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(to);
    const domSelection = options.useDomSelection === false ? null : window.getSelection();
    const rects = domSelection && domSelection.rangeCount > 0
      ? Array.from(domSelection.getRangeAt(0).getClientRects()).filter((rect) => {
          return rect.width > 0
            && rect.height > 0
            && rect.bottom >= boundary.top
            && rect.top <= boundary.bottom
            && rect.right >= boundary.left
            && rect.left <= contentRight;
        })
      : [];
    const anchorRect = rects.length > 0
      ? rects[rects.length - 1]
      : {
          left: Math.min(start.left, end.left),
          right: Math.max(start.right, end.right),
          top: Math.min(start.top, end.top),
          bottom: Math.max(start.bottom, end.bottom),
        };
    const selectionRect = {
      left: Math.max(anchorRect.left, boundary.left + padding),
      right: Math.min(anchorRect.right, contentRight - padding),
      top: anchorRect.top,
      bottom: anchorRect.bottom,
    };

    if (selectionRect.bottom < boundary.top || selectionRect.top > contentBottom) {
      return null;
    }

    const selectionCenterX = selectionRect.left + (selectionRect.right - selectionRect.left) / 2;
    const preferredLeft = options.horizontalAlign === 'end'
      ? selectionRect.right - boundary.left - width
      : selectionCenterX - boundary.left - width / 2;
    const minLeft = padding;
    const maxLeft = contentWidth - width - padding;
    const left = Math.min(Math.max(preferredLeft, minLeft), Math.max(minLeft, maxLeft));
    const aboveTop = selectionRect.top - boundary.top - estimatedHeight - padding;
    const belowTop = selectionRect.bottom - boundary.top + padding;
    const minTop = padding;
    const maxTop = editorViewportElement.clientHeight - estimatedHeight - padding;
    const top = aboveTop >= minTop
      ? aboveTop
      : Math.min(Math.max(belowTop, minTop), Math.max(minTop, maxTop));

    return { top, left };
  }, [editor, editorViewportElement]);

  const calculateSelectionLinkPopoverPosition = useCallback(() => {
    const anchor = linkPopoverAnchorRef.current;
    if (anchor?.popoverContentTop !== undefined && anchor.popoverLeft !== undefined && editorViewportElement) {
      const padding = 8;
      const contentWidth = editorViewportElement.clientWidth;
      const width = Math.min(LINK_POPOVER_WIDTH, Math.max(120, contentWidth - padding * 2));
      const maxLeft = contentWidth - width - padding;
      const top = anchor.popoverContentTop - editorViewportElement.scrollTop;

      if (top + LINK_POPOVER_HEIGHT < 0 || top > editorViewportElement.clientHeight) {
        return null;
      }

      return {
        top,
        left: Math.min(Math.max(anchor.popoverLeft, padding), Math.max(padding, maxLeft)),
      };
    }

    return calculateSelectionPopoverPosition(LINK_POPOVER_WIDTH, LINK_POPOVER_HEIGHT, {
      anchor,
      useDomSelection: false,
      horizontalAlign: 'end',
    });
  }, [calculateSelectionPopoverPosition, editorViewportElement]);

  const calculateSelectionMenuPosition = useCallback(() => {
    return calculateSelectionPopoverPosition(SELECTION_MENU_WIDTH, SELECTION_MENU_HEIGHT, {
      useDomSelection: true,
      horizontalAlign: 'end',
    });
  }, [calculateSelectionPopoverPosition]);

  const calculateTableMenuPosition = useCallback(() => {
    if (!editor || !editorViewportElement || !editor.isActive('table')) return null;

    const boundary = editorViewportElement.getBoundingClientRect();
    const padding = 8;
    const width = Math.min(TABLE_MENU_WIDTH, Math.max(160, editorViewportElement.clientWidth - padding * 2));
    const domAtPos = editor.view.domAtPos(editor.state.selection.from);
    const sourceNode = domAtPos.node.nodeType === Node.ELEMENT_NODE
      ? domAtPos.node as Element
      : domAtPos.node.parentElement;
    const tableElement = sourceNode?.closest('table');

    if (!tableElement) return null;

    const rect = tableElement.getBoundingClientRect();
    const contentWidth = editorViewportElement.clientWidth;
    const preferredLeft = rect.left - boundary.left;
    const maxLeft = contentWidth - width - padding;
    const left = Math.min(Math.max(preferredLeft, padding), Math.max(padding, maxLeft));
    const aboveTop = rect.top - boundary.top - TABLE_MENU_HEIGHT - padding;
    const belowTop = rect.bottom - boundary.top + padding;
    const maxTop = editorViewportElement.clientHeight - TABLE_MENU_HEIGHT - padding;
    const top = aboveTop >= padding
      ? aboveTop
      : Math.min(Math.max(belowTop, padding), Math.max(padding, maxTop));

    return { top, left };
  }, [editor, editorViewportElement]);

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

  const calculateToolbarPopoverPosition = useCallback((rect: DOMRect, preferredWidth: number) => {
    const shell = editorShellRef.current;
    if (!shell) return null;

    const boundary = shell.getBoundingClientRect();
    const padding = 8;
    const width = Math.min(preferredWidth, Math.max(120, boundary.width - padding * 2));
    const left = Math.min(
      Math.max(rect.left - boundary.left, padding),
      Math.max(padding, boundary.width - width - padding)
    );
    const top = rect.bottom - boundary.top + 6;

    return { top, left, width };
  }, []);

  const handleToolbarLinkButtonRect = useCallback((rect: DOMRect) => {
    setToolbarLinkPopoverPosition(calculateToolbarPopoverPosition(rect, LINK_POPOVER_WIDTH));
  }, [calculateToolbarPopoverPosition]);

  const handleToolbarYoutubeButtonRect = useCallback((rect: DOMRect) => {
    setToolbarYoutubePopoverPosition(calculateToolbarPopoverPosition(rect, YOUTUBE_POPOVER_WIDTH));
  }, [calculateToolbarPopoverPosition]);

  const handleToolbarSocialButtonRect = useCallback((rect: DOMRect) => {
    setToolbarSocialPopoverPosition(calculateToolbarPopoverPosition(rect, SOCIAL_POPOVER_WIDTH));
  }, [calculateToolbarPopoverPosition]);

  const handleToolbarMatchButtonRect = useCallback((rect: DOMRect) => {
    setToolbarMatchPopoverPosition(calculateToolbarPopoverPosition(rect, MATCH_POPOVER_WIDTH));
  }, [calculateToolbarPopoverPosition]);

  const handleToolbarTeamButtonRect = useCallback((rect: DOMRect) => {
    setToolbarTeamPopoverPosition(calculateToolbarPopoverPosition(rect, TEAM_POPOVER_WIDTH));
  }, [calculateToolbarPopoverPosition]);

  const handleToolbarPlayerButtonRect = useCallback((rect: DOMRect) => {
    setToolbarPlayerPopoverPosition(calculateToolbarPopoverPosition(rect, PLAYER_POPOVER_WIDTH));
  }, [calculateToolbarPopoverPosition]);

  const handleToolbarTableButtonRect = useCallback((rect: DOMRect) => {
    if (editor) {
      const { from, to } = editor.state.selection;
      tableInsertionRangeRef.current = { from, to };
    }
    setToolbarTablePopoverPosition(calculateToolbarPopoverPosition(rect, TABLE_POPOVER_WIDTH));
  }, [calculateToolbarPopoverPosition, editor]);

  const handleToolbarPollButtonRect = useCallback((rect: DOMRect) => {
    setToolbarPollPopoverPosition(calculateToolbarPopoverPosition(rect, POLL_POPOVER_WIDTH));
  }, [calculateToolbarPopoverPosition]);

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
  const buildDealInfo = useCallback((forUpdate = false): DealInfo => {
    const { store, productName, price, originalPrice, shipping, dealUrl } = hotdealStateRef.current;
    return {
      store,
      product_name: productName.trim(),
      price: parseFloat(price),
      original_price: originalPrice ? parseFloat(originalPrice) : undefined,
      shipping,
      deal_url: dealUrl.trim(),
      is_ended: forUpdate ? (initialDealInfo?.is_ended || false) : false,
      ...(forUpdate && initialDealInfo?.ended_reason && { ended_reason: initialDealInfo.ended_reason }),
      ...(forUpdate && initialDealInfo?.ended_at && { ended_at: initialDealInfo.ended_at }),
    };
  }, [initialDealInfo]);

  // ???좏슚??寃??(refs ?ъ슜?쇰줈 ?섏〈??理쒖냼??
  const validateForm = useCallback((): boolean => {
    const { title, content, categoryId } = formStateRef.current;
    const { dealUrl, store, productName, price, shipping } = hotdealStateRef.current;

    // ?쒕ぉ 寃利?(?ル뵜 寃뚯떆?먯? ?쒕ぉ ?먮룞 ?앹꽦)
    if (!title.trim() && !(isCreateMode && isHotdeal)) {
      toast.error('제목을 입력해주세요.');
      return false;
    }

    if (!content || content === '<p></p>') {
      toast.error('내용을 입력해주세요.');
      return false;
    }

    // ?앹꽦 紐⑤뱶 ?꾩슜 寃利?
    if (isCreateMode) {
      if (!categoryId) {
        toast.error('게시판을 선택해주세요.');
        return false;
      }

      // 理쒖긽??寃뚯떆?먯뿉 ?섏쐞媛 ?덉쑝硫??섏쐞 ?좏깮 ?꾩닔
      const board = allBoardsFlat.find(b => b.id === categoryId);
      if (board && board.parent_id === null) {
        const hasChildren = allBoardsFlat.some(b => b.parent_id === categoryId);
        if (hasChildren) {
          toast.error('하위 게시판을 선택해주세요.');
          return false;
        }
      }
    }

    // ?ル뵜 寃뚯떆湲 寃利?
    if (isHotdeal) {
      if (!dealUrl.trim()) {
        toast.error('상품 링크를 입력해주세요.');
        return false;
      }
      if (!store) {
        toast.error('쇼핑몰을 선택해주세요.');
        return false;
      }
      if (!productName.trim()) {
        toast.error('상품명을 입력해주세요.');
        return false;
      }
      if (!price || parseFloat(price) < 0) {
        toast.error('올바른 가격을 입력해주세요.');
        return false;
      }
      if (!shipping) {
        toast.error('배송비를 선택해주세요.');
        return false;
      }
    }

    return true;
  }, [isCreateMode, isHotdeal, allBoardsFlat]);

  // ?먮윭 ?묐떟 泥섎━ ?ы띁
  const handleErrorResponse = useCallback((errorMsg: string, defaultMessage: string) => {
    // 濡쒓렇???꾩슂 ?먮윭??寃쎌슦 濡쒓렇???섏씠吏濡??대룞
    if (errorMsg.includes('로그인') || errorMsg.includes('인증')) {
      toast.error('로그인이 필요합니다.');
      router.push('/signin');
      return;
    }
    setError(errorMsg || defaultMessage);
    toast.error(errorMsg || defaultMessage);
    setIsSubmitting(false);
  }, [router]);

  // 寃뚯떆湲 ?앹꽦 泥섎━ (refs ?ъ슜?쇰줈 ?섏〈??理쒖냼??
  const handleCreatePost = useCallback(async () => {
    const { title, content, categoryId } = formStateRef.current;
    const currentContent = editor ? JSON.stringify(editor.getJSON()) : content;

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('content', currentContent);
    formData.append('boardId', categoryId);

    if (isHotdeal) {
      formData.append('deal_info', JSON.stringify(buildDealInfo(false)));
    }

    if (pollDraft) {
      formData.append('poll', JSON.stringify(pollDraft));
    }

    if (autoTags.length > 0) {
      formData.append('tags', JSON.stringify(autoTags));
    }

    const result = await createPost(formData);

    if (!result.success) {
      handleErrorResponse(result.error || '', '寃뚯떆湲 ?묒꽦???ㅽ뙣?덉뒿?덈떎.');
      return;
    }

    if (!result.post) {
      throw new Error('寃뚯떆湲 ?곗씠?곕? 諛쏆븘?ㅼ? 紐삵뻽?듬땲??');
    }

    const { post } = result;
    const boardSlug = post.board?.slug || allBoardsFlat.find(b => b.id === categoryId)?.slug || categoryId;

    toast.success('게시글이 작성되었습니다.');
    router.push(`/boards/${boardSlug}/${post.post_number}`);
  }, [autoTags, editor, isHotdeal, pollDraft, buildDealInfo, handleErrorResponse, allBoardsFlat, router]);

  // 寃뚯떆湲 ?섏젙 泥섎━ (refs ?ъ슜?쇰줈 ?섏〈??理쒖냼??
  const handleUpdatePost = useCallback(async () => {
    if (!postId) {
      throw new Error('寃뚯떆湲 ID媛 ?쒓났?섏? ?딆븯?듬땲??');
    }

    const { title, content } = formStateRef.current;
    const currentContent = editor ? JSON.stringify(editor.getJSON()) : content;
    const dealInfoToUpdate = isHotdeal ? buildDealInfo(true) : null;

    const result = await updatePost(postId, title.trim(), currentContent, dealInfoToUpdate, autoTags);

    if (!result.success) {
      handleErrorResponse(result.error || '', '寃뚯떆湲 ?섏젙???ㅽ뙣?덉뒿?덈떎.');
      return;
    }

    if (!result.boardSlug || !result.postNumber) {
      throw new Error('寃뚯떆湲 ?뺣낫瑜?諛쏆븘?ㅼ? 紐삵뻽?듬땲??');
    }

    toast.success('게시글이 수정되었습니다.');
    router.push(`/boards/${result.boardSlug}/${result.postNumber}`);
  }, [autoTags, editor, postId, isHotdeal, buildDealInfo, handleErrorResponse, router]);

  // ???쒖텧 ?몃뱾??
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (isCreateMode) {
        await handleCreatePost();
      } else {
        await handleUpdatePost();
      }
    } catch (err) {
      const errorMsg = err instanceof Error
        ? err.message
        : `게시글 ${isCreateMode ? '작성' : '수정'} 중 오류가 발생했습니다.`;
      setError(errorMsg);
      toast.error(errorMsg);
      setIsSubmitting(false);
    }
  }, [isSubmitting, validateForm, isCreateMode, handleCreatePost, handleUpdatePost]);

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
            <div className="space-y-4 border-t border-black/7 dark:border-white/10 pt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-[#F0F0F0]">
                  ?ル뵜 ?뺣낫
                </h3>
              </div>

              {/* ?곹뭹 留곹겕 */}
              <div className="space-y-2">
                <label htmlFor="deal_url" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                  ?곹뭹 留곹겕 <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="deal_url"
                  value={dealUrl}
                  onChange={(e) => setDealUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none text-base"
                  placeholder="https://www.coupang.com/..."
                />
              </div>

              {/* ?쇳븨紐?*/}
              <div className="space-y-2">
                <label htmlFor="store" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                  ?쇳븨紐?<span className="text-red-500">*</span>
                </label>
                <NativeSelect
                  value={store || ''}
                  onValueChange={setStore}
                  options={STORE_OPTIONS}
                  placeholder="선택하세요"
                />
              </div>

              {/* ?곹뭹紐?*/}
              <div className="space-y-2">
                <label htmlFor="product_name" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                  ?곹뭹紐?<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="product_name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none text-base"
                  placeholder="LG ?듬룎???명긽湲?19kg"
                />
              </div>

              {/* 媛寃?*/}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="price" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                    ?먮ℓ媛 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none text-base"
                      placeholder="11160"
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-500">
                      ??
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="original_price" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                    ?뺢? <span className="text-gray-400 text-xs">(?좏깮)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="original_price"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none text-base"
                      placeholder="15000"
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-500">
                      ??
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">할인율 표시용</p>
                </div>
              </div>

              {/* 諛곗넚鍮?*/}
              <div className="space-y-2">
                <label htmlFor="shipping" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                  諛곗넚鍮?<span className="text-red-500">*</span>
                </label>
                <NativeSelect
                  value={shipping || ''}
                  onValueChange={setShipping}
                  options={SHIPPING_SELECT_OPTIONS}
                  placeholder="선택하세요"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-[13px] text-blue-800 dark:text-blue-300">
                  ?뮕 <strong>??</strong> ?곹뭹 留곹겕瑜??낅젰?섎㈃ ?쇳븨紐곗씠 ?먮룞?쇰줈 ?좏깮?⑸땲??
                </p>
              </div>
            </div>
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
            {showLinkModal && linkPopoverSource === 'toolbar' && (
              <div
                className="absolute z-[10000]"
                style={{
                  top: toolbarLinkPopoverPosition?.top ?? 0,
                  left: toolbarLinkPopoverPosition?.left ?? 12,
                  width: toolbarLinkPopoverPosition?.width,
                }}
              >
                <LinkForm
                  onCancel={closeLinkPopover}
                  onLinkAdd={handleAddLink}
                  onLinkRemove={handleRemoveLink}
                  isOpen={showLinkModal}
                  currentUrl={linkState.currentUrl}
                  selectedText={linkState.selectedText}
                  canRemove={linkState.isActive}
                />
              </div>
            )}
            {/* ?몃씪???⑤꼸 ?곸뿭 - ?대컮? ?먮뵒???ъ씠???쒖떆 */}
            {showYoutubeModal && (
              <div
                className="absolute z-[10000]"
                style={{
                  top: toolbarYoutubePopoverPosition?.top ?? 0,
                  left: toolbarYoutubePopoverPosition?.left ?? 12,
                  width: toolbarYoutubePopoverPosition?.width,
                }}
              >
                <YoutubeForm
                  onCancel={closeYoutubePopover}
                  onYoutubeAdd={handleAddYoutube}
                  isOpen={showYoutubeModal}
                />
              </div>
            )}
            {showSocialModal && (
              <div
                className="absolute z-[10000]"
                style={{
                  top: toolbarSocialPopoverPosition?.top ?? 0,
                  left: toolbarSocialPopoverPosition?.left ?? 12,
                  width: toolbarSocialPopoverPosition?.width,
                }}
              >
                <SocialEmbedForm
                  isOpen={showSocialModal}
                  onCancel={closeSocialPopover}
                  onSocialEmbedAdd={handleAddSocialEmbed}
                />
              </div>
            )}
            {showMatchModal && (
              <div
                className="absolute z-[10000]"
                style={{
                  top: toolbarMatchPopoverPosition?.top ?? 0,
                  left: toolbarMatchPopoverPosition?.left ?? 12,
                  width: toolbarMatchPopoverPosition?.width,
                }}
              >
                <MatchResultForm
                  isOpen={showMatchModal}
                  onCancel={closeMatchPopover}
                  onMatchAdd={handleAddMatch}
                />
              </div>
            )}
            {showTableModal && (
              <div
                className="absolute z-[10000]"
                style={{
                  top: toolbarTablePopoverPosition?.top ?? 0,
                  left: toolbarTablePopoverPosition?.left ?? 12,
                  width: toolbarTablePopoverPosition?.width,
                }}
              >
                <TablePickerForm
                  isOpen={showTableModal}
                  onCancel={closeTablePopover}
                  onTableAdd={(rows, cols) => handleAddTable(rows, cols, tableInsertionRangeRef.current ?? undefined)}
                />
              </div>
            )}
            {showPollModal && (
              <div
                className="absolute z-[10000]"
                style={{
                  top: toolbarPollPopoverPosition?.top ?? 0,
                  left: toolbarPollPopoverPosition?.left ?? 12,
                  width: toolbarPollPopoverPosition?.width,
                }}
              >
                <PollForm
                  isOpen={showPollModal}
                  initialPoll={pollDraft}
                  onCancel={closePollPopover}
                  onSave={handleSavePollDraft}
                />
              </div>
            )}
            {showTeamModal && (
              <div
                className="absolute z-[10000]"
                style={{
                  top: toolbarTeamPopoverPosition?.top ?? 0,
                  left: toolbarTeamPopoverPosition?.left ?? 12,
                  width: toolbarTeamPopoverPosition?.width,
                }}
              >
                <EntityPickerForm
                  isOpen={showTeamModal}
                  mode="team"
                  onClose={closeTeamPopover}
                  onSelectTeam={handleSelectTeam}
                  onSelectPlayer={handleSelectPlayer}
                />
              </div>
            )}
            {showPlayerModal && (
              <div
                className="absolute z-[10000]"
                style={{
                  top: toolbarPlayerPopoverPosition?.top ?? 0,
                  left: toolbarPlayerPopoverPosition?.left ?? 12,
                  width: toolbarPlayerPopoverPosition?.width,
                }}
              >
                <EntityPickerForm
                  isOpen={showPlayerModal}
                  mode="player"
                  onClose={closePlayerPopover}
                  onSelectTeam={handleSelectTeam}
                  onSelectPlayer={handleSelectPlayer}
                />
              </div>
            )}

            {/* ?먮뵒??而⑦뀗痢??곸뿭 - ?ㅽ??쇱? globals.css?먯꽌 愿由?*/}
            <div
              ref={setEditorViewportElement}
              className="relative border border-black/7 dark:border-white/10 rounded-b-md h-[60vh] min-h-[420px] max-h-[680px] overflow-x-hidden overflow-y-auto overscroll-contain bg-white dark:bg-[#262626]"
            >
              {editor && (
                <BubbleMenu
                  editor={editor}
                  pluginKey="pollBubbleMenu"
                  updateDelay={0}
                  shouldShow={({ editor }) => isPollBlockSelected(editor) && !showPollModal}
                  tippyOptions={{
                    appendTo: () => editorViewportElement ?? document.body,
                    duration: 0,
                    maxWidth: 'none',
                    zIndex: 30,
                    popperOptions: {
                      modifiers: [
                        {
                          name: 'preventOverflow',
                          options: {
                            boundary: editorViewportElement ?? 'clippingParents',
                            padding: 8,
                          },
                        },
                        {
                          name: 'flip',
                          options: {
                            boundary: editorViewportElement ?? 'clippingParents',
                            padding: 8,
                          },
                        },
                      ],
                    },
                  }}
                >
                  <div
                    className="flex items-center gap-1 rounded-md border border-black/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#1D1D1D]"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    <button
                      type="button"
                      className="h-8 rounded px-2 text-[12px] font-semibold text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333]"
                      onClick={handleOpenSelectedPollEditor}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                      title="투표 삭제"
                      onClick={handleRemovePollDraft}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </BubbleMenu>
              )}
              {editor && (
                <BubbleMenu
                  editor={editor}
                  pluginKey="entityCardBubbleMenu"
                  updateDelay={0}
                  shouldShow={({ editor }) => isEntityCardSelected(editor) && !showTeamModal && !showPlayerModal}
                  tippyOptions={{
                    appendTo: () => editorViewportElement ?? document.body,
                    duration: 0,
                    maxWidth: 'none',
                    zIndex: 30,
                    popperOptions: {
                      modifiers: [
                        {
                          name: 'preventOverflow',
                          options: {
                            boundary: editorViewportElement ?? 'clippingParents',
                            padding: 8,
                          },
                        },
                        {
                          name: 'flip',
                          options: {
                            boundary: editorViewportElement ?? 'clippingParents',
                            padding: 8,
                          },
                        },
                      ],
                    },
                  }}
                >
                  <div
                    className="flex items-center gap-1 rounded-md border border-black/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#1D1D1D]"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    <button
                      type="button"
                      className="h-8 rounded px-2 text-[12px] font-semibold text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333]"
                      onClick={handleOpenSelectedEntityEditor}
                    >
                      변경
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                      title="카드 삭제"
                      onClick={handleRemoveSelectedEntityCard}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </BubbleMenu>
              )}

              <div className="sticky left-0 top-0 z-20 h-0 w-full overflow-visible">
                {editor && tableMenuPosition && !showTableModal && (
                  <div
                    className="absolute z-20 flex items-center gap-1 rounded-md border border-black/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#1D1D1D]"
                    style={{
                      top: tableMenuPosition.top,
                      left: tableMenuPosition.left,
                    }}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="h-8 rounded px-2 text-[12px] font-semibold text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333]"
                      onClick={() => {
                        const nearPosition = editor.state.selection.from;
                        editor.chain().focus().addRowAfter().run();
                        updateTableMenuAfterCommand(nearPosition);
                      }}
                    >
                      행+
                    </button>
                    <button
                      type="button"
                      className="h-8 rounded px-2 text-[12px] font-semibold text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333]"
                      onClick={() => {
                        const nearPosition = editor.state.selection.from;
                        editor.chain().focus().addColumnAfter().run();
                        updateTableMenuAfterCommand(nearPosition);
                      }}
                    >
                      열+
                    </button>
                    <button
                      type="button"
                      className="h-8 rounded px-2 text-[12px] font-semibold text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333]"
                      onClick={() => {
                        const nearPosition = editor.state.selection.from;
                        editor.chain().focus().deleteRow().run();
                        updateTableMenuAfterCommand(nearPosition, true);
                      }}
                    >
                      행-
                    </button>
                    <button
                      type="button"
                      className="h-8 rounded px-2 text-[12px] font-semibold text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333]"
                      onClick={() => {
                        const nearPosition = editor.state.selection.from;
                        editor.chain().focus().deleteColumn().run();
                        updateTableMenuAfterCommand(nearPosition, true);
                      }}
                    >
                      열-
                    </button>
                    <button
                      type="button"
                      className="h-8 rounded px-2 text-[12px] font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                      title="표 삭제"
                      onClick={() => {
                        editor.chain().focus().deleteTable().run();
                        setTableMenuPosition(null);
                      }}
                    >
                      삭제
                    </button>
                  </div>
                )}
                {editor && selectionMenuPosition && !showLinkModal && (
                <div
                  className="absolute z-20 flex items-center gap-1 rounded-md border border-black/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#1D1D1D]"
                  style={{
                    top: selectionMenuPosition.top,
                    left: selectionMenuPosition.left,
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={(event) => event.stopPropagation()}
                >
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          editor.chain().focus().toggleHeading({ level: 2 }).run();
                        }}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333] ${editor.isActive('heading', { level: 2 }) ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
                        aria-label="제목 2"
                      >
                        <Heading2 size={16} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          editor.chain().focus().toggleHeading({ level: 3 }).run();
                        }}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333] ${editor.isActive('heading', { level: 3 }) ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
                        aria-label="제목 3"
                      >
                        <Heading3 size={16} />
                      </button>
                      <span className="mx-1 h-5 w-px bg-black/10 dark:bg-white/10" />
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          editor.chain().focus().toggleBold().run();
                        }}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333] ${editor.isActive('bold') ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
                        aria-label="굵게"
                      >
                        <Bold size={16} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          editor.chain().focus().toggleItalic().run();
                        }}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333] ${editor.isActive('italic') ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
                        aria-label="기울임"
                      >
                        <Italic size={16} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          openLinkPopover();
                        }}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333] ${editor.isActive('link') ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
                        aria-label="링크"
                      >
                        <LinkIcon size={16} />
                      </button>
                    </div>
                )}
                {showLinkModal && linkPopoverSource === 'selection' && selectionLinkPopoverPosition && (
                <div
                  className="absolute z-20"
                  style={{
                    top: selectionLinkPopoverPosition.top,
                    left: selectionLinkPopoverPosition.left,
                  }}
                >
                  <LinkForm
                    onCancel={closeLinkPopover}
                    onLinkAdd={handleAddLink}
                    onLinkRemove={handleRemoveLink}
                    isOpen={showLinkModal}
                    currentUrl={linkState.currentUrl}
                    selectedText={linkState.selectedText}
                    canRemove={linkState.isActive}
                  />
                </div>
                )}
              </div>
              <EditorContent editor={editor} />
            </div>

          </div>

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

          {/* 踰꾪듉 ?곸뿭 */}
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (isCreateMode ? '게시 중...' : '저장 중...') : (isCreateMode ? '게시하기' : '저장하기')}
            </Button>
          </div>

        </form>
      </ContainerContent>
    </Container>
  );
} 
