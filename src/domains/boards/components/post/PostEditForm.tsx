'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
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

// 핫딜 옵션
const STORE_OPTIONS = POPULAR_STORES.map(storeName => ({ value: storeName, label: storeName }));
const SHIPPING_SELECT_OPTIONS = SHIPPING_OPTIONS.map(option => ({ value: option, label: option }));

// MatchCard 확장 로딩 함수
const loadMatchCardExtension = async () => {
  const { MatchCardExtension } = await import('@/shared/components/editor/tiptap/MatchCardExtension');
  return MatchCardExtension;
};

// 특정 컴포넌트에서 사용하는 Board 인터페이스 (서로 다른 Board 타입 문제를 해결하기 위함)
interface BoardSelectorItem {
  id: string;
  name: string;
  parent_id: string | null;
  display_order: number;
  slug: string;
  children?: BoardSelectorItem[];
}

interface PostEditFormProps {
  // 수정 모드일 때 필요한 props
  postId?: string;
  // 모든 경우에 필요한 props
  boardId?: string;
  // 미사용 변수이지만 호환성을 위해 타입 정의에는 유지
  _boardSlug?: string;
  _postNumber?: string;
  initialTitle?: string;
  initialContent?: string;
  boardName: string;
  // 카테고리 관련 props
  categoryId?: string;
  setCategoryId?: ((id: string) => void) | null | undefined; // 옵션으로 변경
  allBoardsFlat?: Board[];
  isCreateMode?: boolean;
  // 핫딜 정보 (수정 모드)
  initialDealInfo?: DealInfo | null;
}

export default function PostEditForm({
  postId,
  boardId,
  // 미사용 변수 제거
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

  // Supabase 클라이언트 - 한 번만 생성하여 재사용 (성능 최적화, SSR 안전)
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return getSupabaseBrowser();
  }, []);
  
  // 확장 로딩 상태 관리 - any 타입으로 타입 충돌 해결
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [loadedExtensions, setLoadedExtensions] = useState<any[]>([
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
  ]);
  const [extensionsLoaded, setExtensionsLoaded] = useState(false);

  // 초기 로딩 시 추가 확장 로드
  useEffect(() => {
    const loadAdditionalExtensions = async () => {
      try {
        // 동적 확장 로드
        const [
          YoutubeExtension,
          VideoExtension,
          MatchCardExt,
          SocialEmbedExt,
          AutoSocialEmbedExt,
          TeamCardExt,
          PlayerCardExt
        ] = await Promise.all([
          import('@/shared/components/editor/tiptap/YoutubeExtension').then(mod => mod.YoutubeExtension),
          import('@/shared/components/editor/tiptap/VideoExtension').then(mod => mod.Video),
          loadMatchCardExtension(),
          import('@/shared/components/editor/tiptap/extensions/social-embeds').then(mod => mod.SocialEmbedExtension),
          import('@/shared/components/editor/tiptap/extensions/social-embeds').then(mod => mod.AutoSocialEmbedExtension),
          import('@/shared/components/editor/tiptap/TeamCardExtension').then(mod => mod.TeamCardExtension),
          import('@/shared/components/editor/tiptap/PlayerCardExtension').then(mod => mod.PlayerCardExtension)
        ]);

        // 기본 확장에 추가 확장 병합
        setLoadedExtensions(prev => [
          ...prev,
          YoutubeExtension,
          VideoExtension,
          MatchCardExt,
          SocialEmbedExt,
          AutoSocialEmbedExt.configure({ enabled: true }), // 자동 임베드 활성화
          TeamCardExt,
          PlayerCardExt
        ]);
        setExtensionsLoaded(true);
      } catch (error) {
        console.error('추가 확장 로딩 실패:', error);
        // 기본 확장만으로도 에디터는 작동하도록 설정
        setExtensionsLoaded(true);
      }
    };

    loadAdditionalExtensions();
  }, []);

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

  // boardDropdownRef는 유지하되 사용하지 않는 showBoardDropdown 상태는 제거
  const boardDropdownRef = useRef<HTMLDivElement>(null);
  
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
        class: 'prose prose-sm sm:prose focus:outline-none max-w-none w-full',
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
    handleFileUpload,
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
    extensionsLoaded,
    supabase
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (boardDropdownRef.current && !boardDropdownRef.current.contains(event.target as Node)) {
        // 명시적으로 다른 상태를 업데이트
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [boardDropdownRef]);
  
  // 카테고리 변경 핸들러
  const handleCategoryChange = (id: string) => {
    setCategoryIdInternal(id);
    // 외부에서 전달한 setCategoryId가 함수인 경우에만 호출
    if (setCategoryId && typeof setCategoryId === 'function') {
      setCategoryId(id);
    }
  };
  
  // 타입 변환 함수를 업데이트하여 children 속성 처리 오류 해결
  const convertToBoardSelectorItems = (boards: Board[]): BoardSelectorItem[] => {
    return boards.map(board => ({
      id: board.id,
      name: board.name,
      parent_id: board.parent_id,
      display_order: board.display_order !== null ? board.display_order : 0, // null인 경우 기본값 0 설정
      slug: board.slug,
      // children 속성이 없어서 타입 오류가 발생하므로 제거
    }));
  };
  
  // 변환된 게시판 목록
  const boardSelectorItems = useMemo(() => 
    convertToBoardSelectorItems(allBoardsFlat), 
    [allBoardsFlat]
  );
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 중복 제출 방지
    if (isSubmitting) {
      return;
    }

    // 입력값 검증 (핫딜 게시판은 제목이 자동 생성되므로 검증 스킵)
    if (!title.trim() && !(isCreateMode && isHotdeal)) {
      toast.error('제목을 입력해주세요.');
      return;
    }

    if (!content || content === '<p></p>') {
      toast.error('내용을 입력해주세요.');
      return;
    }

    if (isCreateMode && !categoryId) {
      toast.error('게시판을 선택해주세요.');
      return;
    }

    // 게시판 선택 유효성 검사: 최상위 게시판이 하위 게시판을 가지고 있는 경우 하위 선택 필수
    if (isCreateMode && categoryId) {
      const selectedBoard = allBoardsFlat.find(b => b.id === categoryId);
      if (selectedBoard && selectedBoard.parent_id === null) {
        // 최상위 게시판인 경우, 하위 게시판이 있는지 확인
        const hasChildren = allBoardsFlat.some(b => b.parent_id === categoryId);
        if (hasChildren) {
          toast.error('하위 게시판을 선택해주세요.');
          return;
        }
      }
    }

    // 핫딜 게시글 유효성 검사 (생성/수정 모두)
    if (isHotdeal) {
      if (!dealUrl.trim()) {
        toast.error('상품 링크를 입력해주세요.');
        return;
      }
      if (!store) {
        toast.error('쇼핑몰을 선택해주세요.');
        return;
      }
      if (!productName.trim()) {
        toast.error('상품명을 입력해주세요.');
        return;
      }
      if (!price || parseFloat(price) < 0) {
        toast.error('올바른 가격을 입력해주세요.');
        return;
      }
      if (!shipping) {
        toast.error('배송비를 선택해주세요.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // TipTap JSON 형식으로 저장 (매치카드 등 구조화된 데이터 보존)
      // content는 이미 onUpdate에서 JSON string으로 저장되어 있음
      const jsonContent = content;

      // 게시글 생성 모드
      if (isCreateMode) {
        // FormData 생성
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('content', jsonContent);
        formData.append('boardId', categoryId);

        // 핫딜 정보 추가
        if (isHotdeal) {
          const dealInfo = {
            store,
            product_name: productName.trim(),
            price: parseFloat(price),
            original_price: originalPrice ? parseFloat(originalPrice) : undefined,
            shipping,
            deal_url: dealUrl.trim(),
            is_ended: false,
          };
          formData.append('deal_info', JSON.stringify(dealInfo));
        }

        // 서버 액션 실행 (모든 비즈니스 로직 서버에서 처리)
        const result = await createPost(formData);

        // 실패 케이스
        if (!result.success) {
          const errorMsg = result.error || '게시글 작성에 실패했습니다.';

          // 로그인 필요 에러인 경우 로그인 페이지로 이동
          if (errorMsg.includes('로그인') || errorMsg.includes('인증')) {
            toast.error('로그인이 필요합니다.');
            router.push('/signin');
            return;
          }

          setError(errorMsg);
          toast.error(errorMsg);
          setIsSubmitting(false);
          return;
        }

        // 성공 케이스
        if (!result.post) {
          throw new Error('게시글 데이터를 받아오지 못했습니다.');
        }

        const { post } = result;

        // boardSlug 찾기
        const boardSlug = post.board?.slug || allBoardsFlat.find(b => b.id === categoryId)?.slug || categoryId;

        // 성공 메시지 표시
        toast.success('게시글이 작성되었습니다.');

        // 페이지 이동 (Toast가 보이도록 약간의 딜레이)
        setTimeout(() => {
          router.push(`/boards/${boardSlug}/${post.post_number}`);
        }, 500);

        return;
      } 


      // 게시글 수정 모드
      if (!postId) {
        throw new Error('게시글 ID가 제공되지 않았습니다.');
      }

      // 사용자 인증 확인
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        toast.error('로그인이 필요합니다.');
        router.push('/signin');
        return;
      }

      // 핫딜 정보 준비 (핫딜 게시글인 경우)
      let dealInfoToUpdate: DealInfo | null = null;
      if (isHotdeal) {
        dealInfoToUpdate = {
          store,
          product_name: productName.trim(),
          price: parseFloat(price),
          original_price: originalPrice ? parseFloat(originalPrice) : undefined,
          shipping,
          deal_url: dealUrl.trim(),
          is_ended: initialDealInfo?.is_ended || false,
          ended_reason: initialDealInfo?.ended_reason,
          ended_at: initialDealInfo?.ended_at,
        };
      }

      // 서버 액션 실행 (TipTap JSON 형식으로 저장)
      const result = await updatePost(
        postId,
        title.trim(),
        jsonContent,
        userData.user.id,
        dealInfoToUpdate
      );

      // 실패 케이스
      if (!result.success) {
        const errorMsg = result.error || '게시글 수정에 실패했습니다.';
        setError(errorMsg);
        toast.error(errorMsg);
        setIsSubmitting(false);
        return;
      }

      // 성공 케이스
      if (!result.boardSlug || !result.postNumber) {
        throw new Error('게시글 정보를 받아오지 못했습니다.');
      }

      toast.success('게시글이 수정되었습니다.');

      // 페이지 이동 (Toast가 보이도록 약간의 딜레이)
      setTimeout(() => {
        router.push(`/boards/${result.boardSlug}/${result.postNumber}`);
      }, 500);

    } catch (error) {
      const errorMsg = error instanceof Error
        ? error.message
        : `게시글 ${isCreateMode ? '작성' : '수정'} 중 오류가 발생했습니다.`;
      setError(errorMsg);
      toast.error(errorMsg);
      setIsSubmitting(false);
    }
  };

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
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* 게시판 선택 필드 (생성 모드에서만 표시) */}
          {isCreateMode && (
            <div className="space-y-2">
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
                게시판 선택 <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <BoardSelector
                boards={boardSelectorItems}
                selectedId={categoryId}
                onSelect={handleCategoryChange}
                currentBoardId={boardId}
              />
            </div>
          )}


          {/* 제목 필드 - 핫딜 게시판이 아닐 때만 표시 (핫딜은 제목 자동 생성) */}
          {!isHotdeal && (
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">제목</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none"
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
                <label htmlFor="deal_url" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
                  상품 링크 <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="deal_url"
                  value={dealUrl}
                  onChange={(e) => setDealUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none"
                  placeholder="https://www.coupang.com/..."
                />
              </div>

              {/* 쇼핑몰 */}
              <div className="space-y-2">
                <label htmlFor="store" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
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
                <label htmlFor="product_name" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
                  상품명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="product_name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none"
                  placeholder="LG 통돌이 세탁기 19kg"
                />
              </div>

              {/* 가격 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
                    판매가 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none"
                      placeholder="11160"
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      원
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="original_price" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
                    정가 <span className="text-gray-400 text-xs">(선택)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="original_price"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none"
                      placeholder="15000"
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      원
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">할인율 표시용</p>
                </div>
              </div>

              {/* 배송비 */}
              <div className="space-y-2">
                <label htmlFor="shipping" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
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
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  💡 <strong>팁:</strong> 상품 링크를 입력하면 쇼핑몰이 자동으로 선택됩니다.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="content" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">내용</label>
            
            {/* 에디터 툴바 컴포넌트 */}
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
              handleFileUpload={handleFileUpload}
              handleAddImage={handleAddImage}
              handleAddLink={handleAddLink}
              handleAddYoutube={handleAddYoutube}
              handleAddVideo={handleAddVideo}
              handleAddMatch={handleAddMatch}
              handleAddSocialEmbed={handleAddSocialEmbed}
              handleAddTeam={handleAddTeam}
              handleAddPlayer={handleAddPlayer}
            />
            
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