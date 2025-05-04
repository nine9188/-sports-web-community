'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/shared/api/supabase';
import { Button } from '@/shared/ui/button';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { YoutubeExtension } from '@/shared/ui/tiptap/YoutubeExtension';
import { Video } from '@/shared/ui/tiptap/VideoExtension';
import BoardSelector from '@/domains/boards/components/createnavigation/BoardSelector';
import EditorToolbar from '@/domains/boards/components/createnavigation/EditorToolbar';
import { MatchCardExtension } from '@/shared/ui/tiptap/MatchCardExtension';
import { rewardUserActivity, getActivityTypeValues } from '@/shared/actions/activity-actions';
import { MatchData } from '@/domains/livescore/actions/footballApi';
import { toast } from 'react-hot-toast';
import { SocialEmbed } from '@/shared/ui/tiptap/SocialEmbed';
import { AutoEmbedExtension } from '@/shared/ui/tiptap/AutoEmbedExtension';
import { createPost, updatePost } from '@/domains/boards/actions/posts';
import { Board } from '@/domains/boards/types/board';

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
  
  // 드롭다운 상태들
  const [showImageModal, setShowImageModal] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  // boardDropdownRef는 유지하되 사용하지 않는 showBoardDropdown 상태는 제거
  const boardDropdownRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  
  const editor = useEditor({
    extensions: [
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
      YoutubeExtension.configure({
        controls: true,
        nocookie: false,
        width: 640,
        height: 360,
        responsive: true,
        HTMLAttributes: {
          class: 'youtube-container',
        },
        allowFullscreen: true
      }),
      Video,
      MatchCardExtension,
      SocialEmbed,
      AutoEmbedExtension,
    ],
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
    
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    
    if (!content || content === '<p></p>') {
      setError('내용을 입력해주세요.');
      return;
    }
    
    if (isCreateMode && !categoryId) {
      setError('게시판을 선택해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 사용자 인증 정보 확인
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        toast.error('로그인이 필요합니다.');
        router.push('/login');
        return;
      }
      
      // 게시글 생성 모드
      if (isCreateMode) {
        if (!categoryId) {
          throw new Error('게시판 ID가 필요합니다.');
        }
        
        console.log('게시글 생성 시도:', { title, categoryId });
        
        try {
          // 서버 액션으로 게시글 생성 실행
          const result = await createPost(
            title, 
            content, 
            categoryId, 
            userData.user.id
          );
          
          console.log('게시글 생성 결과:', result);
          
          if (!result) {
            throw new Error('서버에서 응답이 없습니다.');
          }
          
          if (result.success && result.postId && result.postNumber && result.boardSlug) {
            // 활동 보상 지급 시도 - 실패해도 게시글 이동은 처리
            try {
              console.log('게시글 생성 성공, 활동 보상 지급 시도');
              const activityTypes = await getActivityTypeValues();
              await rewardUserActivity(userData.user.id, activityTypes.POST_CREATION, result.postId);
              console.log('활동 보상 지급 완료');
            } catch (rewardError) {
              console.error('보상 지급 오류:', rewardError);
              // 오류가 있어도 게시글 이동은 진행
            }
            
            // 게시글 생성 성공 메시지
            toast.success('게시글이 작성되었습니다.');
            console.log('게시글로 이동:', `/boards/${result.boardSlug}/${result.postNumber}`);
            
            // 페이지 이동 전 약간의 지연 추가 (토스트 메시지 표시 및 상태 업데이트 위함)
            setTimeout(() => {
              router.push(`/boards/${result.boardSlug}/${result.postNumber}`);
              router.refresh();
            }, 300);
            
            return; // 성공적으로 처리 완료
          } else {
            console.error('게시글 생성 실패:', result.error || '알 수 없는 오류');
            throw new Error(result.error || '게시글 생성에 실패했습니다. 다시 시도해주세요.');
          }
        } catch (createError) {
          console.error('게시글 생성 과정 중 오류:', createError);
          throw createError;
        }
      } 
      // 게시글 수정 모드
      else {
        if (!postId) {
          throw new Error('게시글 ID가 제공되지 않았습니다.');
        }
        
        console.log('게시글 수정 시도:', { postId });
        
        try {
          // 서버 액션으로 게시글 수정
          const result = await updatePost(
            postId,
            title,
            content,
            userData.user.id
          );
          
          console.log('게시글 수정 결과:', result);
          
          if (!result) {
            throw new Error('서버에서 응답이 없습니다.');
          }
          
          if (result.success && result.boardSlug && result.postNumber) {
            // 게시글 수정 성공 메시지
            toast.success('게시글이 수정되었습니다.');
            console.log('게시글로 이동:', `/boards/${result.boardSlug}/${result.postNumber}`);
            
            // 페이지 이동 전 약간의 지연 추가
            setTimeout(() => {
              router.push(`/boards/${result.boardSlug}/${result.postNumber}`);
              router.refresh();
            }, 300);
            
            return; // 성공적으로 처리 완료
          } else {
            console.error('게시글 수정 실패:', result.error || '알 수 없는 오류');
            throw new Error(result.error || '게시글 수정에 실패했습니다. 다시 시도해주세요.');
          }
        } catch (updateError) {
          console.error('게시글 수정 과정 중 오류:', updateError);
          throw updateError;
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `게시글 ${isCreateMode ? '작성' : '수정'} 중 오류가 발생했습니다.`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 파일 업로드 처리
  const handleFileUpload = async (file: File, caption: string) => {
    if (!file || !editor) return;
    
    try {
      // Supabase 클라이언트 생성
      const supabase = createClient();
      
      // 파일명에서 특수문자 및 공백 제거하여, 고유한 파일명 생성
      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 8); // 추가 무작위 문자열
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `upload_${timestamp}_${randomString}_${safeFileName}`;
      
      // Supabase Storage에 업로드
      const { error } = await supabase
        .storage
        .from('post-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // 중복 파일 덮어쓰기 허용
        });
        
      if (error) {
        throw new Error(`파일 업로드 실패: ${error.message}`);
      }
      
      // 업로드된 파일의 공개 URL 가져오기
      const { data: urlData } = supabase
        .storage
        .from('post-images')
        .getPublicUrl(fileName);
        
      if (!urlData.publicUrl) {
        throw new Error('파일 URL을 가져올 수 없습니다.');
      }
      
      // 에디터에 이미지 삽입 (alt 텍스트에 caption 사용)
      editor.chain().focus().setImage({ 
        src: urlData.publicUrl,
        alt: caption || file.name 
      }).run();
      
      // 드롭다운 닫기
      setShowImageModal(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`이미지 업로드 중 오류가 발생했습니다: ${errorMessage}`);
    }
  };
  
  // URL 이미지 추가
  const handleAddImage = (url: string, caption?: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url, alt: caption || "" }).run();
    }
  };
  
  // 유튜브 추가 함수
  const handleAddYoutube = (url: string, caption?: string) => {
    if (!url || !editor) return;
    
    try {
      editor.commands.setYoutubeVideo({
        src: url,
        caption: caption || undefined,
        width: 640,
        height: 360
      });
    } catch {
      alert('유튜브 영상을 추가하는데 실패했습니다. 다시 시도해주세요.');
    }
    
    setShowYoutubeModal(false);
  };
  
  // 비디오 추가 함수
  const handleAddVideo = (videoUrl: string, caption: string) => {
    if (!videoUrl || !editor) return;
    
    // Video Extension 사용 - TipTap의 타입 문제로 인해 commands 직접 사용
    editor.commands.insertContent(
      `<div data-type="video" class="video-wrapper">
        <video src="${videoUrl}" controls data-caption="${caption || ''}"></video>
        ${caption ? `<div class="video-caption">${caption}</div>` : ''}
      </div>`
    );
    
    setShowVideoModal(false);
  };
  
  // 한 번에 하나의 드롭다운만 표시되도록 관리 (함수 수정)
  const handleToggleDropdown = (dropdown: 'match' | 'link' | 'video' | 'image' | 'youtube') => {
    // 현재 상태 확인
    const currentState: Record<'image' | 'youtube' | 'video' | 'match' | 'link', boolean> = {
      image: showImageModal,
      youtube: showYoutubeModal,
      video: showVideoModal,
      match: showMatchModal,
      link: showLinkModal
    };
    
    // 이미 열려있는 모달이면 닫기
    if (currentState[dropdown]) {
      // 모든 모달 닫기
      setShowImageModal(false);
      setShowYoutubeModal(false);
      setShowVideoModal(false);
      setShowMatchModal(false);
      setShowLinkModal(false);
      return;
    }
    
    // 모든 모달 닫기
    setShowImageModal(false);
    setShowYoutubeModal(false);
    setShowVideoModal(false);
    setShowMatchModal(false);
    setShowLinkModal(false);
    
    // 선택된 드롭다운만 열기
    switch (dropdown) {
      case 'image':
        setShowImageModal(true);
        break;
      case 'youtube':
        setShowYoutubeModal(true);
        break;
      case 'video':
        setShowVideoModal(true);
        break;
      case 'match':
        setShowMatchModal(true);
        break;
      case 'link':
        setShowLinkModal(true);
        break;
    }
  };
  
  // 경기 카드 추가 함수 수정
  const handleAddMatch = async (matchId: string, matchData: MatchData) => {
    if (!editor) return;
    
    try {
      // 경기 데이터를 에디터에 삽입
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'matchCard',
          attrs: {
            matchId,
            matchData
          }
        })
        .run();
      
      // 모달 닫기
      setShowMatchModal(false);
    } catch {
      toast.error('경기 추가 중 오류가 발생했습니다.');
    }
  };
  
  // 링크 추가 핸들러
  const handleAddLink = (url: string) => {
    if (editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };
  
  return (
    <div className="bg-white rounded-md border overflow-hidden">
      <div className="p-6">
        <div className="mb-4">
          <span className="inline-block px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 mb-2">
            {boardName}
          </span>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">제목</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="제목을 입력하세요"
              maxLength={100}
              required
            />
          </div>
          
          {/* 게시판 선택 필드 (생성 모드에서만 표시) */}
          {isCreateMode && (
            <div className="space-y-2">
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                게시판 선택 <span className="text-red-500">*</span>
              </label>
              <BoardSelector 
                boards={boardSelectorItems}
                selectedId={categoryId}
                onSelect={handleCategoryChange}
                currentBoardId={boardId}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">내용</label>
            
            {/* 에디터 툴바 컴포넌트 */}
            <EditorToolbar
              editor={editor}
              showImageModal={showImageModal}
              showLinkModal={showLinkModal}
              showYoutubeModal={showYoutubeModal}
              showVideoModal={showVideoModal}
              showMatchModal={showMatchModal}
              handleToggleDropdown={handleToggleDropdown}
              handleFileUpload={handleFileUpload}
              handleAddImage={handleAddImage}
              handleAddLink={handleAddLink}
              handleAddYoutube={handleAddYoutube}
              handleAddVideo={handleAddVideo}
              handleAddMatch={handleAddMatch}
            />
            
            {/* 에디터 컨텐츠 영역 - 패딩 추가 */}
            <div className="border rounded-b-md min-h-[500px]">
              <style jsx global>{`
                .ProseMirror {
                  padding: 1rem;
                  min-height: 500px;
                }
                
                .match-card {
                  width: 100% !important;
                  max-width: 100% !important;
                }
                
                .ProseMirror .match-card img {
                  max-width: unset !important;
                  display: inline-block !important;
                }

                /* 임베드 스타일 */
                .youtube-embed {
                  margin: 1rem 0;
                  width: 100%;
                  max-width: 100%;
                }

                .youtube-embed iframe {
                  width: 100%;
                  height: 400px;
                  border-radius: 8px;
                }
              `}</style>
              <EditorContent editor={editor} />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (isCreateMode ? '게시 중...' : '저장 중...') : (isCreateMode ? '게시하기' : '저장하기')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 