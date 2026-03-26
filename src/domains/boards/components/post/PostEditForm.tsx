'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import BoardSelector from '@/domains/boards/components/createnavigation/BoardSelector';
import EditorToolbar from '@/domains/boards/components/createnavigation/EditorToolbar';
import { toast } from 'react-toastify';
import { createPost, updatePost } from '@/domains/boards/actions/posts/index';
import { Board } from '@/domains/boards/types/board';
import { Container, ContainerHeader, ContainerTitle, ContainerContent, Button, NativeSelect } from '@/shared/components/ui';
import { useEditorHandlers } from './post-edit-form/hooks';
import { POPULAR_STORES, SHIPPING_OPTIONS, DealInfo } from '../../types/hotdeal';
import { detectStoreFromUrl, isHotdealBoard, formatPrice } from '../../utils/hotdeal';

// 폼 컴포넌트들 지연 로딩 (EditorToolbar에서 이동)
const ImageUploadForm = lazy(() => import('@/domains/boards/components/form/ImageUploadForm'));
const LinkForm = lazy(() => import('@/domains/boards/components/form/LinkForm'));
const YoutubeForm = lazy(() => import('@/domains/boards/components/form/YoutubeForm'));
const VideoForm = lazy(() => import('@/domains/boards/components/form/VideoForm'));
const MatchResultForm = lazy(() => import('@/domains/boards/components/form/MatchResultForm'));
const SocialEmbedForm = lazy(() => import('@/domains/boards/components/form/SocialEmbedForm'));
const EntityPickerForm = lazy(() => import('@/domains/boards/components/entity/EntityPickerForm').then(mod => ({ default: mod.EntityPickerForm })));

// 핫딜 옵션
const STORE_OPTIONS = POPULAR_STORES.map(storeName => ({ value: storeName, label: storeName }));
const SHIPPING_SELECT_OPTIONS = SHIPPING_OPTIONS.map(option => ({ value: option, label: option }));

// 모듈 레벨에서 확장 preload 시작 (컴포넌트 마운트 전에 로딩 시작)
// 이렇게 하면 PostEditForm이 dynamic import될 때 확장들도 병렬로 로딩됨
const extensionsPreloadPromise = Promise.all([
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
    Image.configure({
      inline: false,
      allowBase64: false,
    }),
    Link.configure({
      openOnClick: true,
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer',
      }
    }),
  ], []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [additionalExtensions, setAdditionalExtensions] = useState<any[]>([]);
  const [extensionsLoaded, setExtensionsLoaded] = useState(false);

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
        const result = await extensionsPreloadPromise;

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

    loadAdditionalExtensions();
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
    showImageModal,
    showYoutubeModal,
    showVideoModal,
    showMatchModal,
    showLinkModal,
    showSocialModal,
    showEntityModal,
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
    setTimeout(() => {
      router.push(`/boards/${boardSlug}/${post.post_number}`);
    }, 500);
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
    setTimeout(() => {
      router.push(`/boards/${result.boardSlug}/${result.postNumber}`);
    }, 500);
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

          <div className="space-y-2">
            <label htmlFor="content" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">내용</label>
            
            {/* 에디터 툴바 컴포넌트 (버튼만) */}
            <EditorToolbar
              editor={editor}
              extensionsLoaded={extensionsLoaded}
              showImageModal={showImageModal}
              showLinkModal={showLinkModal}
              showYoutubeModal={showYoutubeModal}
              showVideoModal={showVideoModal}
              showMatchModal={showMatchModal}
              showSocialModal={showSocialModal}
              showEntityModal={showEntityModal}
              handleToggleDropdown={handleToggleDropdown}
            />

            {/* 인라인 패널 영역 - 툴바와 에디터 사이에 표시 */}
            {showImageModal && (
              <Suspense fallback={null}>
                <ImageUploadForm
                  onCancel={() => handleToggleDropdown('image')}
                  onImageUrlAdd={handleAddImage}
                  isOpen={showImageModal}
                />
              </Suspense>
            )}
            {showLinkModal && (
              <Suspense fallback={null}>
                <LinkForm
                  onCancel={() => handleToggleDropdown('link')}
                  onLinkAdd={handleAddLink}
                  isOpen={showLinkModal}
                />
              </Suspense>
            )}
            {showYoutubeModal && (
              <Suspense fallback={null}>
                <YoutubeForm
                  onCancel={() => handleToggleDropdown('youtube')}
                  onYoutubeAdd={handleAddYoutube}
                  isOpen={showYoutubeModal}
                />
              </Suspense>
            )}
            {showVideoModal && (
              <Suspense fallback={null}>
                <VideoForm
                  onCancel={() => handleToggleDropdown('video')}
                  onVideoAdd={handleAddVideo}
                  isOpen={showVideoModal}
                />
              </Suspense>
            )}
            {showSocialModal && (
              <Suspense fallback={null}>
                <SocialEmbedForm
                  isOpen={showSocialModal}
                  onCancel={() => handleToggleDropdown('social')}
                  onSocialEmbedAdd={handleAddSocialEmbed}
                />
              </Suspense>
            )}
            {showMatchModal && (
              <Suspense fallback={null}>
                <MatchResultForm
                  isOpen={showMatchModal}
                  onCancel={() => handleToggleDropdown('match')}
                  onMatchAdd={handleAddMatch}
                />
              </Suspense>
            )}
            {showEntityModal && (
              <Suspense fallback={null}>
                <EntityPickerForm
                  isOpen={showEntityModal}
                  onClose={() => handleToggleDropdown('entity')}
                  onSelectTeam={handleAddTeam}
                  onSelectPlayer={handleAddPlayer}
                />
              </Suspense>
            )}

            {/* 에디터 컨텐츠 영역 - 스타일은 globals.css에서 관리 */}
            <div className="border border-black/7 dark:border-white/10 rounded-b-md min-h-[500px] bg-white dark:bg-[#262626]">
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