'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, List, ListOrdered, Image as ImageIcon, Link as LinkIcon, 
  Undo, Redo, Youtube as YoutubeIcon, Video as VideoIcon, Activity
} from 'lucide-react';
import ImageUploadForm from '../form/ImageUploadForm';
import LinkForm from '../form/LinkForm';
import YoutubeForm from '../form/YoutubeForm';
import VideoForm from '../form/VideoForm';
import MatchResultForm from '../form/MatchResultForm';

// 경기 데이터를 위한 인터페이스 정의
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

interface EditorToolbarProps {
  editor: Editor | null;
  showImageModal: boolean;
  showLinkModal: boolean;
  showYoutubeModal: boolean;
  showVideoModal: boolean;
  showMatchModal: boolean;
  handleToggleDropdown: (dropdown: 'image' | 'link' | 'youtube' | 'video' | 'match') => void;
  handleFileUpload: (file: File, caption: string) => Promise<void>;
  handleAddImageUrl: (url: string, caption: string) => void;
  handleAddLink: (url: string, text: string) => void;
  handleAddYoutube: (url: string) => void;
  handleAddVideo: (videoUrl: string, caption: string) => void;
  handleAddMatch: (matchId: string, matchData: MatchData) => void;
}

export default function EditorToolbar({
  editor,
  showImageModal,
  showLinkModal,
  showYoutubeModal,
  showVideoModal,
  showMatchModal,
  handleToggleDropdown,
  handleFileUpload,
  handleAddImageUrl,
  handleAddLink,
  handleAddYoutube,
  handleAddVideo,
  handleAddMatch
}: EditorToolbarProps) {
  if (!editor) {
    return <div className="border rounded-t-md p-2 bg-gray-50 h-11"></div>;
  }

  // 명시적인 모달 닫기 핸들러 추가
  const handleCloseModal = (type: 'image' | 'link' | 'youtube' | 'video' | 'match') => {
    console.log(`${type} 모달 닫기 요청`);
    handleToggleDropdown(type); // 같은 타입으로 토글하여 닫기
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
      
      {/* 이미지 버튼과 드롭다운 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleToggleDropdown('image')}
          className={`p-2 rounded hover:bg-gray-200 ${showImageModal ? 'bg-gray-200' : ''}`}
          title="이미지 추가"
        >
          <ImageIcon size={18} />
        </button>
        
        <ImageUploadForm 
          onCancel={() => handleCloseModal('image')}
          onFileUpload={handleFileUpload}
          onImageUrlAdd={handleAddImageUrl}
          isOpen={showImageModal}
        />
      </div>
      
      {/* 링크 버튼과 드롭다운 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleToggleDropdown('link')}
          className={`p-2 rounded hover:bg-gray-200 ${showLinkModal ? 'bg-gray-200' : ''}`}
          title="링크 추가"
        >
          <LinkIcon size={18} />
        </button>
        
        <LinkForm 
          onCancel={() => handleCloseModal('link')}
          onLinkAdd={handleAddLink}
          isOpen={showLinkModal}
        />
      </div>
      
      {/* 유튜브 버튼과 드롭다운 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleToggleDropdown('youtube')}
          className={`p-2 rounded hover:bg-gray-200 ${showYoutubeModal ? 'bg-gray-200' : ''}`}
          title="YouTube 동영상 추가"
        >
          <YoutubeIcon size={18} />
        </button>
        
        <YoutubeForm 
          onCancel={() => handleCloseModal('youtube')}
          onYoutubeAdd={handleAddYoutube}
          isOpen={showYoutubeModal}
        />
      </div>
      
      {/* 비디오 버튼과 드롭다운 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleToggleDropdown('video')}
          className={`p-2 rounded hover:bg-gray-200 ${showVideoModal ? 'bg-gray-200' : ''}`}
          title="동영상 파일 추가"
        >
          <VideoIcon size={18} />
        </button>
        
        <VideoForm 
          onCancel={() => handleCloseModal('video')}
          onVideoAdd={handleAddVideo}
          isOpen={showVideoModal}
        />
      </div>
      
      {/* 경기 결과 버튼과 드롭다운 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleToggleDropdown('match')}
          className={`p-2 rounded hover:bg-gray-200 ${showMatchModal ? 'bg-gray-200' : ''}`}
          title="경기 결과 추가"
        >
          <Activity size={18} />
        </button>
        
        <MatchResultForm
          isOpen={showMatchModal}
          onCancel={() => {
            console.log("match 모달 닫기 요청");
            handleCloseModal('match');
          }}
          onMatchAdd={(matchId, matchData) => {
            handleAddMatch(matchId, matchData);
          }}
        />
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