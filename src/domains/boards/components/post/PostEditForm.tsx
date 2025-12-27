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
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui/container';
import { useEditorHandlers } from './post-edit-form/hooks';
import { NoticeAdminSection } from './post-edit-form/components';

// MatchCard 확장 로딩 함수
const loadMatchCardExtension = async () => {
  const { MatchCardExtension } = await import('@/shared/ui/tiptap/MatchCardExtension');
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
  isCreateMode = false
}: PostEditFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 내부 상태로 categoryId 관리
  const [categoryId, setCategoryIdInternal] = useState(externalCategoryId || '');

  // 공지 관련 상태
  const [isNotice, setIsNotice] = useState(false);
  const [noticeType, setNoticeType] = useState<'global' | 'board'>('global');
  const [noticeBoards, setNoticeBoards] = useState<string[]>([]);
  const [noticeOrder, setNoticeOrder] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  

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
  
  // 관리자 권한 확인
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!supabase) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profile && profile.is_admin === true) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('관리자 권한 확인 오류:', error);
      }
    };

    checkAdminStatus();
  }, [supabase]);

  // 초기 로딩 시 추가 확장 로드
  useEffect(() => {
    const loadAdditionalExtensions = async () => {
      try {
        // 동적 확장 로드
        const [YoutubeExtension, VideoExtension, MatchCardExt, SocialEmbedExt, AutoSocialEmbedExt] = await Promise.all([
          import('@/shared/ui/tiptap/YoutubeExtension').then(mod => mod.YoutubeExtension),
          import('@/shared/ui/tiptap/VideoExtension').then(mod => mod.Video),
          loadMatchCardExtension(),
          import('@/shared/ui/tiptap/extensions/social-embeds').then(mod => mod.SocialEmbedExtension),
          import('@/shared/ui/tiptap/extensions/social-embeds').then(mod => mod.AutoSocialEmbedExtension)
        ]);

        // 기본 확장에 추가 확장 병합
        setLoadedExtensions(prev => [
          ...prev,
          YoutubeExtension,
          VideoExtension,
          MatchCardExt,
          SocialEmbedExt,
          AutoSocialEmbedExt.configure({ enabled: true }) // 자동 임베드 활성화
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
  
  // boardDropdownRef는 유지하되 사용하지 않는 showBoardDropdown 상태는 제거
  const boardDropdownRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  
  // 에디터 초기화 - 기본 확장으로 먼저 생성 후 추가 확장 로드 시 재생성
  const editor = useEditor({
    extensions: loadedExtensions,
    content,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      setContent(content);
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
    handleToggleDropdown,
    handleFileUpload,
    handleAddImage,
    handleAddYoutube,
    handleAddVideo,
    handleAddMatch,
    handleAddLink,
    handleAddSocialEmbed
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

    // 입력값 검증
    if (!title.trim()) {
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

    setIsSubmitting(true);
    setError(null);

    try {
      // TipTap JSON 형식으로 저장 (매치카드 등 구조화된 데이터 보존)
      const jsonContent = editor ? JSON.stringify(editor.getJSON()) : content;

      // 게시글 생성 모드
      if (isCreateMode) {
        // FormData 생성
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('content', jsonContent);
        formData.append('boardId', categoryId);

        // 공지 정보 추가 (관리자이고 공지로 설정한 경우)
        if (isAdmin && isNotice) {
          formData.append('isNotice', 'true');
          formData.append('noticeType', noticeType);
          if (noticeType === 'board' && noticeBoards.length > 0) {
            formData.append('noticeBoards', JSON.stringify(noticeBoards));
          }
          formData.append('noticeOrder', noticeOrder.toString());
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

      // 서버 액션 실행 (TipTap JSON 형식으로 저장)
      const result = await updatePost(postId, title.trim(), jsonContent, userData.user.id);

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

          {/* 공지 설정 (관리자 전용) */}
          {isCreateMode && isAdmin && (
            <NoticeAdminSection
              isNotice={isNotice}
              setIsNotice={setIsNotice}
              noticeType={noticeType}
              setNoticeType={setNoticeType}
              noticeBoards={noticeBoards}
              setNoticeBoards={setNoticeBoards}
              noticeOrder={noticeOrder}
              setNoticeOrder={setNoticeOrder}
              allBoardsFlat={allBoardsFlat}
            />
          )}

          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">제목</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-white/20"
              placeholder="제목을 입력하세요"
              maxLength={100}
              required
            />
          </div>
          
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
              handleToggleDropdown={handleToggleDropdown}
              handleFileUpload={handleFileUpload}
              handleAddImage={handleAddImage}
              handleAddLink={handleAddLink}
              handleAddYoutube={handleAddYoutube}
              handleAddVideo={handleAddVideo}
              handleAddMatch={handleAddMatch}
              handleAddSocialEmbed={handleAddSocialEmbed}
            />
            
            {/* 에디터 컨텐츠 영역 - 스타일은 globals.css에서 관리 */}
            <div className="border border-black/7 dark:border-white/10 rounded-b-md min-h-[500px] bg-white dark:bg-[#262626]">
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-800 dark:bg-[#3F3F3F] text-white hover:bg-slate-700 dark:hover:bg-[#4A4A4A] px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (isCreateMode ? '게시 중...' : '저장 중...') : (isCreateMode ? '게시하기' : '저장하기')}
            </button>
          </div>

        </form>
      </ContainerContent>
    </Container>
  );
} 