'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, type EditorState } from '@tiptap/pm/state';
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
import LinkForm from '@/domains/boards/components/form/LinkForm';
import YoutubeForm from '@/domains/boards/components/form/YoutubeForm';
import MatchResultForm from '@/domains/boards/components/form/MatchResultForm';
import SocialEmbedForm from '@/domains/boards/components/form/SocialEmbedForm';
import { EntityPickerForm } from '@/domains/boards/components/entity/EntityPickerForm';
import { Bold, Heading2, Heading3, Italic, Link as LinkIcon } from 'lucide-react';

// 핫딜 옵션
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

// 모듈 레벨에서 확장 preload 시작 (컴포넌트 마운트 전에 로딩 시작)
// 이렇게 하면 PostEditForm이 dynamic import될 때 확장들도 병렬로 로딩됨
function loadAdditionalEditorExtensions() {
  return Promise.all([
  import('@/shared/components/editor/tiptap/YoutubeExtension').then(mod => mod.YoutubeExtension),
  import('@/shared/components/editor/tiptap/VideoExtension').then(mod => mod.Video),
  import('@/shared/components/editor/tiptap/MatchCardExtension').then(mod => mod.MatchCardExtension),
  import('@/shared/components/editor/tiptap/extensions/social-embeds'),
  import('@/shared/components/editor/tiptap/TeamCardExtension').then(mod => mod.TeamCardExtension),
  import('@/shared/components/editor/tiptap/PlayerCardExtension').then(mod => mod.PlayerCardExtension)
]).catch(error => {
  console.error('확장 preload 실패:', error);
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
  const [selectionLinkPopoverPosition, setSelectionLinkPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectionMenuPosition, setSelectionMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [editorViewportElement, setEditorViewportElement] = useState<HTMLDivElement | null>(null);
  const editorShellRef = useRef<HTMLDivElement>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const linkPopoverAnchorRef = useRef<SelectionPositionAnchor | null>(null);

  // 최신 상태를 ref로 관리 (useCallback 의존성 최소화)
  const formStateRef = useRef({ title, content, categoryId: externalCategoryId || '' });
  const hotdealStateRef = useRef({ dealUrl: '', store: '', productName: '', price: '', originalPrice: '', shipping: '' });

  // initialContent를 파싱하여 editor 초기화용 객체로 변환
  const parsedInitialContent = useMemo(() => {
    if (!initialContent) return '';
    try {
      // JSON string이면 파싱
      const parsed = JSON.parse(initialContent);
      return parsed;
    } catch {
      // 파싱 실패하면 HTML string으로 간주
      return initialContent;
    }
  }, [initialContent]);
  // 내부 상태로 categoryId 관리
  const [categoryId, setCategoryIdInternal] = useState(externalCategoryId || '');

  // 핫딜 관련 state (수정 모드일 경우 초기값 설정)
  const [dealUrl, setDealUrl] = useState(initialDealInfo?.deal_url || '');
  const [store, setStore] = useState(initialDealInfo?.store || '');
  const [productName, setProductName] = useState(initialDealInfo?.product_name || '');
  const [price, setPrice] = useState(initialDealInfo?.price ? String(initialDealInfo.price) : '');
  const [originalPrice, setOriginalPrice] = useState(initialDealInfo?.original_price ? String(initialDealInfo.original_price) : '');
  const [shipping, setShipping] = useState(initialDealInfo?.shipping || '');

  // ref 동기화 (타이핑할 때 useCallback이 재생성되지 않도록)
  useEffect(() => {
    formStateRef.current = { title, content, categoryId };
  }, [title, content, categoryId]);

  useEffect(() => {
    hotdealStateRef.current = { dealUrl, store, productName, price, originalPrice, shipping };
  }, [dealUrl, store, productName, price, originalPrice, shipping]);

  // 기본 확장 (변경되지 않음)
  const baseExtensions = useMemo(() => [
    StarterKit,
    PersistentSelectionHighlight,
    EditorEmptyPlaceholder,
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

  // 전체 확장 목록 (기본 + 추가)
  const loadedExtensions = useMemo(() => [
    ...baseExtensions,
    ...additionalExtensions
  ], [baseExtensions, additionalExtensions]);

  // 초기 로딩 시 추가 확장 로드 (모듈 레벨에서 이미 preload 시작됨)
  useEffect(() => {
    // 이미 로드되었으면 중복 실행 방지
    if (extensionsLoaded) return;

    const loadAdditionalExtensions = async () => {
      try {
        // 모듈 레벨에서 시작된 preload Promise 사용 (워터폴 방지)
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
          TeamCardExt,
          PlayerCardExt
        ] = result;

        // 추가 확장 설정 (중복 방지를 위해 prev 사용 안 함)
        setAdditionalExtensions([
          YoutubeExtension,
          VideoExtension,
          MatchCardExt,
          SocialEmbedsModule.SocialEmbedExtension,
          SocialEmbedsModule.AutoSocialEmbedExtension.configure({ enabled: true }),
          TeamCardExt,
          PlayerCardExt
        ]);
        setExtensionsLoaded(true);
      } catch (error) {
        console.error('추가 확장 로딩 실패:', error);
        setExtensionsLoaded(true);
      }
    };

    // 고급 확장은 초기 진입에서 당겨오지 않고, 관련 도구를 처음 열 때만 로드한다.
    void loadAdditionalExtensions;
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
          TeamCardExt,
          PlayerCardExt
        ] = result;

        setAdditionalExtensions([
          YoutubeExtension,
          VideoExtension,
          MatchCardExt,
          SocialEmbedsModule.SocialEmbedExtension,
          SocialEmbedsModule.AutoSocialEmbedExtension.configure({ enabled: true }),
          TeamCardExt,
          PlayerCardExt
        ]);
        setExtensionsLoaded(true);
        return true;
      })
      .catch((error) => {
        console.error('추가 에디터 확장 로드 실패:', error);
        setExtensionsLoaded(true);
        return false;
      })
      .finally(() => {
        loadingExtensionsRef.current = null;
      });

    return loadingExtensionsRef.current;
  }, [extensionsLoaded]);

  // 핫딜 URL 입력 시 쇼핑몰 자동 감지
  useEffect(() => {
    if (dealUrl && dealUrl.trim()) {
      const detectedStore = detectStoreFromUrl(dealUrl);
      setStore(detectedStore);
    }
  }, [dealUrl]);

  // 핫딜 게시판/게시글 체크
  const selectedBoard = useMemo(() => {
    // 수정 모드에서는 boardId 사용
    const boardIdToFind = isCreateMode ? categoryId : (boardId || categoryId);
    return allBoardsFlat.find(b => b.id === boardIdToFind);
  }, [allBoardsFlat, categoryId, boardId, isCreateMode]);

  const isHotdeal = useMemo(() => {
    // 수정 모드에서 initialDealInfo가 있으면 핫딜 게시글
    if (!isCreateMode && initialDealInfo) {
      return true;
    }
    // 생성 모드에서는 게시판 slug로 판단
    if (!selectedBoard?.slug) return false;
    return isHotdealBoard(selectedBoard.slug);
  }, [selectedBoard, isCreateMode, initialDealInfo]);

  // 핫딜 게시판/게시글에서 제목 자동 생성 (생성/수정 모두)
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
  
  // 에디터 초기화 - 기본 확장으로 먼저 생성 후 추가 확장 로드 시 재생성
  const editor = useEditor({
    extensions: loadedExtensions,
    content: parsedInitialContent,
    onUpdate: ({ editor }) => {
      const jsonContent = JSON.stringify(editor.getJSON());
      setContent(jsonContent);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose dark:prose-invert focus:outline-none max-w-none w-full min-h-[460px] p-4 text-gray-900 dark:text-[#F0F0F0] text-base',
      },
    },
    immediatelyRender: false
  }, [loadedExtensions]); // loadedExtensions 변경 시 에디터 재생성

  // 에디터 핸들러 훅
  const {
    showYoutubeModal,
    showMatchModal,
    showLinkModal,
    showSocialModal,
    showTeamModal,
    showPlayerModal,
    setShowLinkModal,
    setShowYoutubeModal,
    setShowMatchModal,
    setShowSocialModal,
    setShowTeamModal,
    setShowPlayerModal,
    handleToggleDropdown,
    handleAddImage,
    handleAddYoutube,
    handleAddVideo,
    handleAddMatch,
    handleAddLink,
    handleAddSocialEmbed,
    handleAddTeam,
    handleAddPlayer
  } = useEditorHandlers({
    editor,
    extensionsLoaded
  });

  const handleEditorToolToggle = useCallback((dropdown: 'link' | 'youtube' | 'match' | 'social' | 'team' | 'player') => {
    if (dropdown === 'youtube' || dropdown === 'match' || dropdown === 'social' || dropdown === 'team' || dropdown === 'player') {
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
  }, [editor, ensureAdditionalExtensions, handleToggleDropdown, setShowLinkModal]);

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
  }, [setShowTeamModal]);

  const closePlayerPopover = useCallback(() => {
    setToolbarPlayerPopoverPosition(null);
    setShowPlayerModal(false);
  }, [setShowPlayerModal]);

  const handleImageToolbarClick = useCallback(() => {
    if (isImageUploading) return;

    closeLinkPopover();
    closeYoutubePopover();
    closeSocialPopover();
    closeMatchPopover();
    closeTeamPopover();
    closePlayerPopover();
    imageFileInputRef.current?.click();
  }, [
    closeLinkPopover,
    closeMatchPopover,
    closePlayerPopover,
    closeSocialPopover,
    closeTeamPopover,
    closeYoutubePopover,
    isImageUploading,
  ]);

  const handleImageFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';

    if (!file) return;
    if (!editor) {
      toast.error('?먮뵒?곌? 以鍮꾨릺吏 ?딆븯?듬땲??');
      return;
    }

    setIsImageUploading(true);

    try {
      const { publicUrl, altText } = await uploadPostImageFile(file);
      handleAddImage(publicUrl, altText);
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      toast.error(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setIsImageUploading(false);
    }
  }, [editor, handleAddImage]);

  const handleVideoToolbarClick = useCallback(() => {
    if (isVideoUploading) return;

    closeLinkPopover();
    closeYoutubePopover();
    closeSocialPopover();
    closeMatchPopover();
    closeTeamPopover();
    closePlayerPopover();
    void ensureAdditionalExtensions();
    videoFileInputRef.current?.click();
  }, [
    closeLinkPopover,
    closeMatchPopover,
    closePlayerPopover,
    closeSocialPopover,
    closeTeamPopover,
    closeYoutubePopover,
    ensureAdditionalExtensions,
    isVideoUploading,
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
      await handleAddVideo(publicUrl, caption);
    } catch (error) {
      console.error('동영상 업로드 오류:', error);
      toast.error(error instanceof Error ? error.message : '동영상 업로드에 실패했습니다.');
    } finally {
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
      closeLinkPopover();
    };
    const hideSelectionMenu = () => setSelectionMenuPosition(null);

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
  }, [calculateSelectionMenuPosition, closeLinkPopover, editor, editorViewportElement, showLinkModal]);

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

  
  // 카테고리 변경 핸들러
  const handleCategoryChange = useCallback((id: string) => {
    setCategoryIdInternal(id);
    if (setCategoryId && typeof setCategoryId === 'function') {
      setCategoryId(id);
    }
  }, [setCategoryId]);

  // 핫딜 정보 생성 헬퍼 (refs 사용으로 의존성 최소화)
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

  // 폼 유효성 검사 (refs 사용으로 의존성 최소화)
  const validateForm = useCallback((): boolean => {
    const { title, content, categoryId } = formStateRef.current;
    const { dealUrl, store, productName, price, shipping } = hotdealStateRef.current;

    // 제목 검증 (핫딜 게시판은 제목 자동 생성)
    if (!title.trim() && !(isCreateMode && isHotdeal)) {
      toast.error('제목을 입력해주세요.');
      return false;
    }

    if (!content || content === '<p></p>') {
      toast.error('내용을 입력해주세요.');
      return false;
    }

    // 생성 모드 전용 검증
    if (isCreateMode) {
      if (!categoryId) {
        toast.error('게시판을 선택해주세요.');
        return false;
      }

      // 최상위 게시판에 하위가 있으면 하위 선택 필수
      const board = allBoardsFlat.find(b => b.id === categoryId);
      if (board && board.parent_id === null) {
        const hasChildren = allBoardsFlat.some(b => b.parent_id === categoryId);
        if (hasChildren) {
          toast.error('하위 게시판을 선택해주세요.');
          return false;
        }
      }
    }

    // 핫딜 게시글 검증
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

  // 에러 응답 처리 헬퍼
  const handleErrorResponse = useCallback((errorMsg: string, defaultMessage: string) => {
    // 로그인 필요 에러인 경우 로그인 페이지로 이동
    if (errorMsg.includes('로그인') || errorMsg.includes('인증')) {
      toast.error('로그인이 필요합니다.');
      router.push('/signin');
      return;
    }
    setError(errorMsg || defaultMessage);
    toast.error(errorMsg || defaultMessage);
    setIsSubmitting(false);
  }, [router]);

  // 게시글 생성 처리 (refs 사용으로 의존성 최소화)
  const handleCreatePost = useCallback(async () => {
    const { title, content, categoryId } = formStateRef.current;

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('content', content);
    formData.append('boardId', categoryId);

    if (isHotdeal) {
      formData.append('deal_info', JSON.stringify(buildDealInfo(false)));
    }

    const result = await createPost(formData);

    if (!result.success) {
      handleErrorResponse(result.error || '', '게시글 작성에 실패했습니다.');
      return;
    }

    if (!result.post) {
      throw new Error('게시글 데이터를 받아오지 못했습니다.');
    }

    const { post } = result;
    const boardSlug = post.board?.slug || allBoardsFlat.find(b => b.id === categoryId)?.slug || categoryId;

    toast.success('게시글이 작성되었습니다.');
    router.push(`/boards/${boardSlug}/${post.post_number}`);
  }, [isHotdeal, buildDealInfo, handleErrorResponse, allBoardsFlat, router]);

  // 게시글 수정 처리 (refs 사용으로 의존성 최소화)
  const handleUpdatePost = useCallback(async () => {
    if (!postId) {
      throw new Error('게시글 ID가 제공되지 않았습니다.');
    }

    const { title, content } = formStateRef.current;
    const dealInfoToUpdate = isHotdeal ? buildDealInfo(true) : null;

    const result = await updatePost(postId, title.trim(), content, dealInfoToUpdate);

    if (!result.success) {
      handleErrorResponse(result.error || '', '게시글 수정에 실패했습니다.');
      return;
    }

    if (!result.boardSlug || !result.postNumber) {
      throw new Error('게시글 정보를 받아오지 못했습니다.');
    }

    toast.success('게시글이 수정되었습니다.');
    router.push(`/boards/${result.boardSlug}/${result.postNumber}`);
  }, [postId, isHotdeal, buildDealInfo, handleErrorResponse, router]);

  // 폼 제출 핸들러
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
      {/* 헤더 */}
      <ContainerHeader>
        <ContainerTitle>
          {isCreateMode ? '글쓰기' : '글 수정'} - {boardName}
        </ContainerTitle>
      </ContainerHeader>

      {/* 컨텐츠 */}
      <ContainerContent className="pt-4">
        <form id="post-edit-form" onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-[13px]">
              {error}
            </div>
          )}

          {/* 게시판 선택 필드 (생성 모드에서만 표시) */}
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


          {/* 제목 필드 - 핫딜 게시판이 아닐 때만 표시 (핫딜은 제목 자동 생성) */}
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

          {/* 핫딜 정보 필드 - 핫딜 게시글일 때 표시 (생성/수정 모두) */}
          {isHotdeal && (
            <div className="space-y-4 border-t border-black/7 dark:border-white/10 pt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-[#F0F0F0]">
                  핫딜 정보
                </h3>
              </div>

              {/* 상품 링크 */}
              <div className="space-y-2">
                <label htmlFor="deal_url" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                  상품 링크 <span className="text-red-500">*</span>
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

              {/* 쇼핑몰 */}
              <div className="space-y-2">
                <label htmlFor="store" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                  쇼핑몰 <span className="text-red-500">*</span>
                </label>
                <NativeSelect
                  value={store || ''}
                  onValueChange={setStore}
                  options={STORE_OPTIONS}
                  placeholder="선택하세요"
                />
              </div>

              {/* 상품명 */}
              <div className="space-y-2">
                <label htmlFor="product_name" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                  상품명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="product_name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none text-base"
                  placeholder="LG 통돌이 세탁기 19kg"
                />
              </div>

              {/* 가격 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="price" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                    판매가 <span className="text-red-500">*</span>
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
                      원
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="original_price" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                    정가 <span className="text-gray-400 text-xs">(선택)</span>
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
                      원
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">할인율 표시용</p>
                </div>
              </div>

              {/* 배송비 */}
              <div className="space-y-2">
                <label htmlFor="shipping" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                  배송비 <span className="text-red-500">*</span>
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
                  💡 <strong>팁:</strong> 상품 링크를 입력하면 쇼핑몰이 자동으로 선택됩니다.
                </p>
              </div>
            </div>
          )}

          <div ref={editorShellRef} className="relative space-y-2">
            <label htmlFor="content" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">내용</label>
            
            {/* 에디터 툴바 컴포넌트 (버튼만) */}
            <EditorToolbar
              editor={editor}
              extensionsLoaded={true}
              isImageUploading={isImageUploading}
              isVideoUploading={isVideoUploading}
              showLinkModal={showLinkModal}
              showYoutubeModal={showYoutubeModal}
              showMatchModal={showMatchModal}
              showSocialModal={showSocialModal}
              showTeamModal={showTeamModal}
              showPlayerModal={showPlayerModal}
              handleToggleDropdown={handleEditorToolToggle}
              onImageClick={handleImageToolbarClick}
              onVideoClick={handleVideoToolbarClick}
              onToolbarLinkButtonRect={handleToolbarLinkButtonRect}
              onToolbarYoutubeButtonRect={handleToolbarYoutubeButtonRect}
              onToolbarSocialButtonRect={handleToolbarSocialButtonRect}
              onToolbarMatchButtonRect={handleToolbarMatchButtonRect}
              onToolbarTeamButtonRect={handleToolbarTeamButtonRect}
              onToolbarPlayerButtonRect={handleToolbarPlayerButtonRect}
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
            {/* 인라인 패널 영역 - 툴바와 에디터 사이에 표시 */}
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
                  onSelectTeam={handleAddTeam}
                  onSelectPlayer={handleAddPlayer}
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
                  onSelectTeam={handleAddTeam}
                  onSelectPlayer={handleAddPlayer}
                />
              </div>
            )}

            {/* 에디터 컨텐츠 영역 - 스타일은 globals.css에서 관리 */}
            <div
              ref={setEditorViewportElement}
              className="relative border border-black/7 dark:border-white/10 rounded-b-md h-[60vh] min-h-[420px] max-h-[680px] overflow-x-hidden overflow-y-auto overscroll-contain bg-white dark:bg-[#262626]"
            >
              <div className="sticky left-0 top-0 z-20 h-0 w-full overflow-visible">
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

          {/* 버튼 영역 */}
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
