'use client';

import React, { Suspense, lazy } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, List, ListOrdered, Image as ImageIcon, Link as LinkIcon, 
  Undo, Redo, Youtube as YoutubeIcon, Video as VideoIcon, Activity
} from 'lucide-react';
import type { MatchData } from '@/domains/livescore/actions/footballApi';

// 폼 컴포넌트들을 지연 로딩으로 변경
const ImageUploadForm = lazy(() => import('../form/ImageUploadForm'));
const LinkForm = lazy(() => import('../form/LinkForm'));
const YoutubeForm = lazy(() => import('../form/YoutubeForm'));
const VideoForm = lazy(() => import('../form/VideoForm'));
const MatchResultForm = lazy(() => import('../form/MatchResultForm'));

interface EditorToolbarProps {
  editor: Editor | null;
  extensionsLoaded: boolean;
  showImageModal: boolean;
  showLinkModal: boolean;
  showYoutubeModal: boolean;
  showVideoModal: boolean;
  showMatchModal: boolean;
  handleToggleDropdown: (dropdown: 'image' | 'link' | 'youtube' | 'video' | 'match') => void;
  handleFileUpload: (file: File, caption: string) => Promise<void>;
  handleAddImage: (url: string, caption?: string) => void;
  handleAddLink: (url: string, text?: string) => void;
  handleAddYoutube: (url: string, caption?: string) => void;
  handleAddVideo: (videoUrl: string, caption: string) => void;
  handleAddMatch: (matchId: string, matchData: MatchData) => void;
}

// 로딩 스피너 컴포넌트
const FormLoadingSpinner = () => (
  <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg p-4 z-50">
    <div className="flex items-center space-x-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      <span className="text-sm text-gray-600">로딩 중...</span>
    </div>
  </div>
);

export default function EditorToolbar({
  editor,
  extensionsLoaded,
  showImageModal,
  showLinkModal,
  showYoutubeModal,
  showVideoModal,
  showMatchModal,
  handleToggleDropdown,
  handleFileUpload,
  handleAddImage,
  handleAddLink,
  handleAddYoutube,
  handleAddVideo,
  handleAddMatch
}: EditorToolbarProps) {
  if (!editor) {
    return <div className="border rounded-t-md p-2 bg-gray-50 h-11"></div>;
  }

  // 명시적인 모달 닫기 핸들러 추가
  const closeModal = (type: string) => {
    if (type === 'youtube') {
      handleToggleDropdown('youtube');
    } else if (type === 'video') {
      handleToggleDropdown('video');
    } else if (type === 'link') {
      handleToggleDropdown('link');
    } else if (type === 'match') {
      handleToggleDropdown('match');
    }
  };

  return (
    <div className="border rounded-t-md flex flex-wrap items-center p-2 gap-1 bg-gray-50">
      {/* 텍스트 스타일 버튼 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        title="굵게"
      >
        <Bold size={18} />
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        title="기울임꼴"
      >
        <Italic size={18} />
      </button>
      
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      
      {/* 목록 버튼 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        title="글머리 기호 목록"
      >
        <List size={18} />
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
        title="번호 매기기 목록"
      >
        <ListOrdered size={18} />
      </button>
      
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      
      {/* 이미지 버튼과 드롭다운 - 지연 로딩 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleToggleDropdown('image')}
          className={`p-2 rounded hover:bg-gray-200 ${showImageModal ? 'bg-gray-200' : ''}`}
          title="이미지 추가"
        >
          <ImageIcon size={18} />
        </button>
        
        {showImageModal && (
          <Suspense fallback={<FormLoadingSpinner />}>
            <ImageUploadForm 
              onCancel={() => closeModal('image')}
              onFileUpload={handleFileUpload}
              onImageUrlAdd={handleAddImage}
              isOpen={showImageModal}
            />
          </Suspense>
        )}
      </div>
      
      {/* 링크 버튼과 드롭다운 - 지연 로딩 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleToggleDropdown('link')}
          className={`p-2 rounded hover:bg-gray-200 ${showLinkModal ? 'bg-gray-200' : ''}`}
          title="링크 추가"
        >
          <LinkIcon size={18} />
        </button>
        
        {showLinkModal && (
          <Suspense fallback={<FormLoadingSpinner />}>
            <LinkForm 
              onCancel={() => closeModal('link')}
              onLinkAdd={handleAddLink}
              isOpen={showLinkModal}
            />
          </Suspense>
        )}
      </div>
      
      {/* 유튜브 버튼과 드롭다운 - 지연 로딩 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleToggleDropdown('youtube')}
          className={`p-2 rounded hover:bg-gray-200 ${showYoutubeModal ? 'bg-gray-200' : ''} ${!extensionsLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={extensionsLoaded ? "YouTube 동영상 추가" : "에디터 로딩 중..."}
          disabled={!extensionsLoaded}
        >
          <YoutubeIcon size={18} />
        </button>
        
        {showYoutubeModal && (
          <Suspense fallback={<FormLoadingSpinner />}>
            <YoutubeForm 
              onCancel={() => closeModal('youtube')}
              onYoutubeAdd={handleAddYoutube}
              isOpen={showYoutubeModal}
            />
          </Suspense>
        )}
      </div>
      
      {/* 비디오 버튼과 드롭다운 - 지연 로딩 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleToggleDropdown('video')}
          className={`p-2 rounded hover:bg-gray-200 ${showVideoModal ? 'bg-gray-200' : ''} ${!extensionsLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={extensionsLoaded ? "동영상 파일 추가" : "에디터 로딩 중..."}
          disabled={!extensionsLoaded}
        >
          <VideoIcon size={18} />
        </button>
        
        {showVideoModal && (
          <Suspense fallback={<FormLoadingSpinner />}>
            <VideoForm 
              onCancel={() => closeModal('video')}
              onVideoAdd={handleAddVideo}
              isOpen={showVideoModal}
            />
          </Suspense>
        )}
      </div>
      
      {/* 경기 결과 버튼과 드롭다운 - 지연 로딩 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleToggleDropdown('match')}
          className={`p-2 rounded hover:bg-gray-200 ${showMatchModal ? 'bg-gray-200' : ''}`}
          title="경기 결과 추가"
        >
          <Activity size={18} />
        </button>
        
        {showMatchModal && (
          <Suspense fallback={<FormLoadingSpinner />}>
            <MatchResultForm
              isOpen={showMatchModal}
              onCancel={() => {
                closeModal('match');
              }}
              onMatchAdd={(matchId, matchData) => {
                handleAddMatch(matchId, matchData);
              }}
            />
          </Suspense>
        )}
      </div>
      
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      
      {/* 실행 취소/다시 실행 버튼 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
        title="실행 취소"
      >
        <Undo size={18} />
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
        title="다시 실행"
      >
        <Redo size={18} />
      </button>
    </div>
  );
} 