'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/shared/api/supabase';
import { Button } from '@/shared/ui/button';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import BoardSelector from '@/domains/boards/components/createnavigation/BoardSelector';
import EditorToolbar from '@/domains/boards/components/createnavigation/EditorToolbar';
import { rewardUserActivity, getActivityTypeValues } from '@/shared/actions/activity-actions';
import { MatchData } from '@/domains/livescore/actions/footballApi';
import { toast } from 'react-hot-toast';
import { createPost, updatePost } from '@/domains/boards/actions/posts/index';
import { Board } from '@/domains/boards/types/board';
import { generateMatchCardHTML } from '@/shared/utils/matchCardRenderer';

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
  
  // 드롭다운 상태들
  const [showImageModal, setShowImageModal] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  // Supabase 클라이언트 - 한 번만 생성하여 재사용 (성능 최적화)
  const supabase = useMemo(() => createClient(), []);
  
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
        const [YoutubeExtension, VideoExtension, MatchCardExt] = await Promise.all([
          import('@/shared/ui/tiptap/YoutubeExtension').then(mod => mod.YoutubeExtension),
          import('@/shared/ui/tiptap/VideoExtension').then(mod => mod.Video),
          loadMatchCardExtension()
        ]);

        // 기본 확장에 추가 확장 병합
        setLoadedExtensions(prev => [
          ...prev,
          YoutubeExtension,
          VideoExtension,
          MatchCardExt
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
        
        try {
          // FormData 객체 생성
          const formData = new FormData();
          formData.append('title', title);
          formData.append('content', content);
          formData.append('boardId', categoryId);
          
          // 서버 액션으로 게시글 생성 실행
          const result = await createPost(formData);
          
          if (!result) {
            throw new Error('서버에서 응답이 없습니다.');
          }
          
          if (result.success && result.post) {
            // 게시글 정보 추출
            const postId = result.post.id;
            const postNumber = result.post.post_number;
            const boardSlug = result.post.board?.slug || allBoardsFlat.find(b => b.id === categoryId)?.slug;
            
            if (!boardSlug) {
              throw new Error('게시판 정보를 찾을 수 없습니다.');
            }
            
            // 활동 보상 지급 시도 - 실패해도 게시글 이동은 처리
            try {
              const activityTypes = await getActivityTypeValues();
              await rewardUserActivity(userData.user.id, activityTypes.POST_CREATION, postId);
            } catch (rewardError) {
              console.error('보상 지급 오류:', rewardError);
              // 오류가 있어도 게시글 이동은 진행
            }
            
            // 게시글 생성 성공 메시지
            toast.success('게시글이 작성되었습니다.');
            
            // 페이지 이동 전 약간의 지연 추가 (토스트 메시지 표시 및 상태 업데이트 위함)
            setTimeout(() => {
              router.push(`/boards/${boardSlug}/${postNumber}`);
              router.refresh();
            }, 300);
            
            return; // 성공적으로 처리 완료
          } else if (result.error) {
            console.error('게시글 생성 실패:', result.error);
            // 서버에서 온 정확한 오류 메시지를 그대로 사용
            setError(result.error);
            toast.error(result.error);
            return; // 여기서 함수 종료
          } else {
            const errorMsg = '게시글 생성에 실패했습니다. 다시 시도해주세요.';
            setError(errorMsg);
            toast.error(errorMsg);
            return; // 여기서 함수 종료
          }
        } catch (createError) {
          console.error('게시글 생성 과정 중 오류:', createError);
          const errorMsg = createError instanceof Error ? createError.message : '게시글 작성 중 오류가 발생했습니다.';
          setError(errorMsg);
          toast.error(errorMsg);
          return; // 여기서 함수 종료
        }
      } 
      // 게시글 수정 모드
      else {
        if (!postId) {
          throw new Error('게시글 ID가 제공되지 않았습니다.');
        }
        
        
        try {
          // 서버 액션으로 게시글 수정
          const result = await updatePost(
            postId,
            title,
            content,
            userData.user.id
          );
          
          
          if (!result) {
            throw new Error('서버에서 응답이 없습니다.');
          }
          
          if (result.success && result.boardSlug && result.postNumber) {
            // 게시글 수정 성공 메시지
            toast.success('게시글이 수정되었습니다.');
            
            // 페이지 이동 전 약간의 지연 추가
            setTimeout(() => {
              router.push(`/boards/${result.boardSlug}/${result.postNumber}`);
              router.refresh();
            }, 300);
            
            return; // 성공적으로 처리 완료
          } else {
            console.error('게시글 수정 실패:', result.error || '알 수 없는 오류');
            // 서버에서 온 정확한 오류 메시지를 그대로 사용
            const errorMsg = result.error || '게시글 수정에 실패했습니다. 다시 시도해주세요.';
            setError(errorMsg);
            toast.error(errorMsg);
            return; // 여기서 함수 종료
          }
        } catch (updateError) {
          console.error('게시글 수정 과정 중 오류:', updateError);
          const errorMsg = updateError instanceof Error ? updateError.message : '게시글 수정 중 오류가 발생했습니다.';
          setError(errorMsg);
          toast.error(errorMsg);
          return; // 여기서 함수 종료
        }
      }
    } catch (error: unknown) {
      // 이 블록은 위에서 처리되지 않은 예외적인 경우에만 실행됨
      console.error('예상치 못한 오류:', error);
      const errorMessage = error instanceof Error ? error.message : `게시글 ${isCreateMode ? '작성' : '수정'} 중 예상치 못한 오류가 발생했습니다.`;
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
      // 파일명에서 특수문자 및 공백 제거하여, 고유한 파일명 생성
      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 8); // 추가 무작위 문자열
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `upload_${timestamp}_${randomString}_${safeFileName}`;
      
      // Supabase Storage에 업로드 (재사용된 클라이언트 사용)
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
      
      // 업로드된 파일의 공개 URL 가져오기 (재사용된 클라이언트 사용)
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
  
  // 유튜브 추가 함수 - TipTap 확장 명령어 사용
  const handleAddYoutube = async (url: string, caption?: string) => {
    if (!url || !editor) return;
    
    try {
      // 에디터에 YouTube 확장이 로드되어 있는지 확인
      if (!extensionsLoaded) {
        toast.error('에디터가 아직 로딩 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      // TipTap YouTube 확장의 setYoutubeVideo 명령어 사용
      let result = false;
      
              // YouTube 확장이 로드되었는지 확인하고 명령어 실행
        if (extensionsLoaded && 'setYoutubeVideo' in editor.commands) {
          const commands = editor.commands as Record<string, (...args: unknown[]) => boolean>;
          result = commands.setYoutubeVideo({
            src: url,
            caption: caption
          });
        }

      if (!result) {
        // 명령어 실행 실패 시 fallback으로 직접 HTML 삽입
        console.warn('YouTube 확장 명령어 실행 실패, HTML 직접 삽입으로 fallback');
        
        // 유튜브 URL을 embed URL로 변환
        let embedUrl = url;
        if (url.includes('youtube.com/watch?v=')) {
          const videoId = url.split('v=')[1]?.split('&')[0];
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (url.includes('youtu.be/')) {
          const videoId = url.split('youtu.be/')[1]?.split('?')[0];
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
        
        const youtubeHTML = `
          <div class="youtube-container">
            <iframe src="${embedUrl}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
            ${caption ? `<div class="youtube-caption" style="margin-top: 0.5rem; font-size: 0.875rem; color: #666;">${caption}</div>` : ''}
          </div>
        `;
        
        editor.commands.insertContent(youtubeHTML);
      }
      
      toast.success('YouTube 영상이 추가되었습니다.');
      
    } catch (error) {
      console.error('유튜브 추가 중 오류:', error);
      toast.error('유튜브 영상을 추가하는데 실패했습니다. 다시 시도해주세요.');
    }
    
    setShowYoutubeModal(false);
  };
  
  // 비디오 추가 함수 - TipTap 확장 명령어 사용
  const handleAddVideo = async (videoUrl: string, caption: string) => {
    if (!videoUrl || !editor) return;
    
    try {
      // 에디터에 Video 확장이 로드되어 있는지 확인
      if (!extensionsLoaded) {
        toast.error('에디터가 아직 로딩 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      // TipTap Video 확장의 setVideo 명령어 사용
      let result = false;
      
              // Video 확장이 로드되었는지 확인하고 명령어 실행
        if (extensionsLoaded && 'setVideo' in editor.commands) {
          const commands = editor.commands as Record<string, (...args: unknown[]) => boolean>;
          result = commands.setVideo({
            src: videoUrl,
            caption: caption,
            controls: true,
            width: '100%',
            height: 'auto'
          });
        }

      if (!result) {
        // 명령어 실행 실패 시 fallback으로 직접 HTML 삽입
        console.warn('Video 확장 명령어 실행 실패, HTML 직접 삽입으로 fallback');
        
        const videoHTML = `
          <div class="video-wrapper" style="margin: 1rem 0;">
            <video src="${videoUrl}" controls style="width: 100%; max-width: 640px; height: auto;" data-caption="${caption || ''}">
              브라우저가 비디오를 지원하지 않습니다.
            </video>
            ${caption ? `<div class="video-caption" style="margin-top: 0.5rem; font-size: 0.875rem; color: #666;">${caption}</div>` : ''}
          </div>
        `;
        
        editor.commands.insertContent(videoHTML);
      }
      
      toast.success('동영상이 추가되었습니다.');
      
    } catch (error) {
      console.error('비디오 추가 중 오류:', error);
      toast.error('비디오를 추가하는데 실패했습니다. 다시 시도해주세요.');
    }
    
    setShowVideoModal(false);
  };
  
  // 한 번에 하나의 드롭다운만 표시되도록 관리 (함수 수정)
  const handleToggleDropdown = async (dropdown: 'match' | 'link' | 'video' | 'image' | 'youtube') => {
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
    
    // 선택된 드롭다운만 열기 (확장 로딩 제거)
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
  
  // 경기 카드 추가 함수 수정 - HTML 직접 삽입 방식으로 변경
  const handleAddMatch = async (matchId: string, matchData: MatchData) => {
    if (!editor) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }
    
    try {
      
      // 경기 카드 HTML 생성
      const matchCardHTML = generateMatchCardHTML(matchData);
      
      // HTML 직접 삽입
      editor.commands.insertContent(matchCardHTML);
      
      // 모달 닫기
      setShowMatchModal(false);
      toast.success('경기 결과가 추가되었습니다.');
    } catch (error) {
      console.error('경기 추가 중 오류:', error);
      toast.error('경기 추가 중 오류가 발생했습니다.');
    }
  };
  
  // 링크 추가 핸들러 - 개선
  const handleAddLink = (url: string, text?: string) => {
    if (!editor || !url) return;
    
    try {
      
      // 현재 선택된 텍스트가 있는지 확인
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      
      if (selectedText) {
        // 선택된 텍스트가 있으면 링크로 변환
        editor.chain().focus().setLink({ href: url }).run();
      } else {
        // 선택된 텍스트가 없으면 링크 텍스트와 함께 삽입
        const linkText = text || url;
        editor.chain().focus().insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`).run();
      }
      
    } catch (error) {
      console.error('링크 추가 중 오류:', error);
      toast.error('링크를 추가하는데 실패했습니다.');
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
              extensionsLoaded={extensionsLoaded}
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
                
                /* 경기 카드 스타일 */
                .ProseMirror .match-card {
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 12px 0 !important;
                  border: 1px solid #e5e7eb !important;
                  border-radius: 8px !important;
                  overflow: hidden !important;
                  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
                  background: white !important;
                }
                
                .ProseMirror .match-card img {
                  max-width: unset !important;
                  display: inline-block !important;
                  object-fit: contain !important;
                }

                /* 경기 카드 내부 요소들 */
                .ProseMirror .match-card > div {
                  width: 100% !important;
                }

                /* 유튜브 임베드 스타일은 globals.css에서 관리 */

                /* 비디오 스타일 */
                .video-wrapper {
                  margin: 1rem 0;
                  width: 100%;
                }

                .video-wrapper video {
                  width: 100%;
                  max-width: 640px;
                  height: auto;
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