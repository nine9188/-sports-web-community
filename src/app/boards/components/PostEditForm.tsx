'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase-browser';
import { Button } from '@/app/ui/button';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { YoutubeExtension } from '@/app/lib/tiptap/YoutubeExtension';
import { Video } from '@/app/lib/tiptap/VideoExtension';
import BoardSelector from './createnavigation/BoardSelector';
import EditorToolbar from './createnavigation/EditorToolbar';
import { generateMatchCardHTML } from '@/app/utils/matchCardRenderer';
import { MatchCardExtension } from '@/app/lib/tiptap/MatchCardExtension';
import { rewardUserActivity, getActivityTypeValues } from '@/app/actions/activity-actions';

// MatchData 타입 직접 정의
interface MatchData {
  id?: number | string;
  fixture?: {
    id: string | number;
    date?: string;
  };
  league?: {
    id: number | string;
    name: string;
    logo: string;
  };
  teams: {
    home: {
      id: number | string;
      name: string;
      logo: string;
    };
    away: {
      id: number | string;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  status?: {
    code: string;
    elapsed?: number;
    name?: string;
  };
}

// 게시판(Board) 타입 정의 - BoardSelector와 호환되도록 수정
interface Board {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  children?: Board[];
  team_id?: string | number | null;
  league_id?: string | number | null;
}

interface PostEditFormProps {
  // 수정 모드일 때 필요한 props
  postId?: string;
  // 모든 경우에 필요한 props
  boardId?: string;
  boardSlug?: string;
  postNumber?: string;
  initialTitle?: string;
  initialContent?: string;
  boardName: string;
  // 새 props: 게시판 선택 옵션
  categoryId?: string;
  setCategoryId?: (id: string) => void;
  allBoardsFlat?: Board[];
  isCreateMode?: boolean;
}

export default function PostEditForm({ 
  postId,
  boardId, 
  boardSlug,
  postNumber,
  initialTitle = '', 
  initialContent = '',
  boardName,
  categoryId,
  setCategoryId,
  allBoardsFlat = [],
  isCreateMode = false
}: PostEditFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 드롭다운 상태들
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  
  // boardDropdownRef는 유지하되 사용하지 않는 showBoardDropdown 상태는 제거
  const boardDropdownRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const supabase = createClient();
  
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
    ],
    content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
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
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        router.push('/login');
        return;
      }
      
      // 게시글 생성 모드
      if (isCreateMode) {
        // 선택한 게시판의 정보 가져오기
        const { data: selectedBoard } = await supabase
          .from('boards')
          .select('slug')
          .eq('id', categoryId)
          .single();
        
        if (!selectedBoard) {
          throw new Error('선택한 게시판 정보를 찾을 수 없습니다.');
        }
        
        // 게시글 생성
        const { data, error: insertError } = await supabase
          .from('posts')
          .insert({
            title: title.trim(),
            content: content,
            user_id: userData.user.id,
            board_id: categoryId,
            category: boardName || null,
            views: 0,
            likes: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'published'
          })
          .select();
          
        if (insertError) throw insertError;
        
        // 방금 생성한 게시글의 post_number 가져오기
        const { data: createdPost } = await supabase
          .from('posts')
          .select('post_number')
          .eq('id', data[0].id)
          .single();
        
        // 게시글 작성 후 보상 지급
        if (data && data.length > 0) {
          // 활동 유형 가져오기
          const activityTypes = await getActivityTypeValues();
          await rewardUserActivity(userData.user.id, activityTypes.POST_CREATION, data[0].id);
        }
        
        // 게시글 작성 성공 후 게시판 페이지로 이동 (새 URL 형식으로)
        if (createdPost) {
          router.push(`/boards/${selectedBoard.slug}/${createdPost.post_number}`);
        } else {
          router.push(`/boards/${selectedBoard.slug}`);
        }
      } 
      // 게시글 수정 모드
      else {
        if (!postId) {
          throw new Error('게시글 ID가 제공되지 않았습니다.');
        }
        
        const { error } = await supabase
          .from('posts')
          .update({
            title: title.trim(),
            content: content,
            updated_at: new Date().toISOString()
          })
          .eq('id', postId)
          .eq('user_id', userData.user.id);
          
        if (error) {
          throw error;
        }
        
        // 성공적으로 수정 완료 - 새 URL 형식 사용
        if (boardSlug && postNumber) {
          router.push(`/boards/${boardSlug}/${postNumber}`);
        } else {
          // 이전 URL 형식 대체
          router.push(`/boards/${boardId}/posts/${postId}`);
        }
      }
      
      router.refresh();
    } catch (error: unknown) {
      console.error(`게시글 ${isCreateMode ? '작성' : '수정'} 중 오류:`, error);
      const errorMessage = error instanceof Error ? error.message : `게시글 ${isCreateMode ? '작성' : '수정'} 중 오류가 발생했습니다.`;
      setError(errorMessage);
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
      console.error('이미지 업로드 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`이미지 업로드 중 오류가 발생했습니다: ${errorMessage}`);
    }
  };
  
  // URL 이미지 추가
  const handleAddImageUrl = (url: string, caption: string) => {
    if (!url || !editor) return;
    
    editor.chain().focus().setImage({ src: url, alt: caption }).run();
    
    // 드롭다운 닫기
    setShowImageModal(false);
  };
  
  // 링크 추가 함수
  const handleAddLink = (url: string, text: string) => {
    if (!url || !editor) return;
    
    if (text) {
      // 선택된 텍스트가 없고 텍스트가 제공된 경우, 텍스트와 함께 링크 삽입
      editor.chain().focus().insertContent(`<a href="${url}" target="_blank">${text}</a>`).run();
    } else {
      // 이미 선택된 텍스트나 제공된 텍스트가 없는 경우
      editor.chain().focus().setLink({ href: url }).run();
    }
    
    setShowLinkModal(false);
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
      
      console.log('유튜브 영상 삽입 성공!');
    } catch (error) {
      console.error('유튜브 삽입 실패:', error);
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
  const handleToggleDropdown = (dropdown: 'image' | 'link' | 'youtube' | 'video' | 'match') => {
    console.log(`드롭다운 토글: ${dropdown}`);
    
    // 현재 상태 확인
    const currentState = {
      image: showImageModal,
      link: showLinkModal,
      youtube: showYoutubeModal,
      video: showVideoModal,
      match: showMatchModal
    };
    
    // 이미 열려있는 모달이면 닫기
    if (currentState[dropdown]) {
      // 모든 모달 닫기
      setShowImageModal(false);
      setShowLinkModal(false);
      setShowYoutubeModal(false);
      setShowVideoModal(false);
      setShowMatchModal(false);
      return;
    }
    
    // 모든 모달 닫기
    setShowImageModal(false);
    setShowLinkModal(false);
    setShowYoutubeModal(false);
    setShowVideoModal(false);
    setShowMatchModal(false);
    
    // 선택된 드롭다운만 열기
    switch (dropdown) {
      case 'image':
        setShowImageModal(true);
        break;
      case 'link':
        setShowLinkModal(true);
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
    }
  };
  
  // 경기 카드 추가 함수 수정
  const handleAddMatch = (matchId: string, matchData: MatchData) => {
    try {
      if (!editor) {
        console.error("에디터가 초기화되지 않았습니다.");
        return;
      }
      
      // 안전한 데이터 구성 (기본값 제공)
      const safeMatchData = {
        id: matchData.id,
        fixture: {
          id: matchData.fixture?.id || 0,
          date: matchData.fixture?.date
        },
        league: {
          id: matchData.league?.id || 0,
          name: matchData.league?.name || "리그 정보 없음",
          logo: matchData.league?.logo || "/placeholder.png"
        },
        teams: {
          home: {
            id: matchData.teams.home.id || 0,
            name: matchData.teams.home.name || "홈팀",
            logo: matchData.teams.home.logo || "/placeholder.png"
          },
          away: {
            id: matchData.teams.away.id || 0,
            name: matchData.teams.away.name || "원정팀",
            logo: matchData.teams.away.logo || "/placeholder.png"
          }
        },
        goals: {
          home: matchData.goals.home,
          away: matchData.goals.away
        },
        status: matchData.status || { code: "FT", elapsed: 90 }
      };
      
      // 공통 유틸리티 함수 사용
      const matchIdToUse = matchId || safeMatchData.fixture.id.toString();
      // safeMatchData를 matchCardRenderer가 기대하는 형식으로 변환
      const cardData = {
        id: matchIdToUse,
        teams: {
          home: {
            name: safeMatchData.teams.home.name,
            logo: safeMatchData.teams.home.logo,
          },
          away: {
            name: safeMatchData.teams.away.name,
            logo: safeMatchData.teams.away.logo,
          }
        },
        goals: {
          home: safeMatchData.goals.home !== null ? safeMatchData.goals.home : undefined,
          away: safeMatchData.goals.away !== null ? safeMatchData.goals.away : undefined,
        },
        league: {
          name: safeMatchData.league?.name || "",
          logo: safeMatchData.league?.logo || "",
        },
        status: {
          code: safeMatchData.status?.code,
          elapsed: safeMatchData.status?.elapsed,
        }
      };
      const matchCardHTML = generateMatchCardHTML(cardData, matchIdToUse);
      
      // 에디터에 삽입
      editor.commands.insertContent(matchCardHTML);
      console.log("경기 카드 추가 성공!");
      
      // 모달 닫기
      setShowMatchModal(false);
    } catch (error) {
      console.error("경기 카드 추가 실패:", error);
      alert("경기 데이터를 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.");
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
          {isCreateMode && setCategoryId && (
            <div className="space-y-2">
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                게시판 선택 <span className="text-red-500">*</span>
              </label>
              <BoardSelector 
                boards={allBoardsFlat}
                selectedId={categoryId}
                onSelect={(id) => setCategoryId(id)}
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
              handleAddImageUrl={handleAddImageUrl}
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