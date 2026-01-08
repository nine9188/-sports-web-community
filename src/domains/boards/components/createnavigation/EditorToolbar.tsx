'use client';

import React, { Suspense, lazy } from 'react';
import Image from 'next/image';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, List, ListOrdered, Image as ImageIcon, Link as LinkIcon,
  Undo, Redo, Youtube as YoutubeIcon, Video as VideoIcon, Share2, Users
} from 'lucide-react';
import type { MatchData } from '@/domains/livescore/actions/footballApi';
import type { SocialPlatform } from '@/shared/ui/tiptap/extensions/social-embeds';
import type { TeamMapping } from '@/domains/livescore/constants/teams';
import type { Player } from '@/domains/livescore/actions/teams/squad';
import Spinner from '@/shared/components/Spinner';

// 리그 정보 인터페이스
interface LeagueInfo {
  id: number;
  name: string;
  koreanName: string;
}

// 폼 컴포넌트들을 지연 로딩으로 변경
const ImageUploadForm = lazy(() => import('../form/ImageUploadForm'));
const LinkForm = lazy(() => import('../form/LinkForm'));
const YoutubeForm = lazy(() => import('../form/YoutubeForm'));
const VideoForm = lazy(() => import('../form/VideoForm'));
const MatchResultForm = lazy(() => import('../form/MatchResultForm'));
const SocialEmbedForm = lazy(() => import('../form/SocialEmbedForm'));
const EntityPickerForm = lazy(() => import('../entity/EntityPickerForm').then(mod => ({ default: mod.EntityPickerForm })));

interface EditorToolbarProps {
  editor: Editor | null;
  extensionsLoaded: boolean;
  showImageModal: boolean;
  showLinkModal: boolean;
  showYoutubeModal: boolean;
  showVideoModal: boolean;
  showMatchModal: boolean;
  showSocialModal: boolean;
  showEntityModal: boolean;
  handleToggleDropdown: (dropdown: 'image' | 'link' | 'youtube' | 'video' | 'match' | 'social' | 'entity') => void;
  handleFileUpload: (file: File, caption: string) => Promise<void>;
  handleAddImage: (url: string, caption?: string) => void;
  handleAddLink: (url: string, text?: string) => void;
  handleAddYoutube: (url: string, caption?: string) => void;
  handleAddVideo: (videoUrl: string, caption: string) => void;
  handleAddMatch: (matchId: string, matchData: MatchData) => void;
  handleAddSocialEmbed: (platform: SocialPlatform, url: string) => void;
  handleAddTeam: (team: TeamMapping, league: LeagueInfo) => void;
  handleAddPlayer: (player: Player, team: TeamMapping) => void;
}

// 로딩 스피너 컴포넌트
const FormLoadingSpinner = () => (
  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-md shadow-lg p-4 z-50">
    <div className="flex items-center space-x-2">
      <Spinner size="xs" />
      <span className="text-sm text-gray-900 dark:text-[#F0F0F0]">로딩 중...</span>
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
  showSocialModal,
  showEntityModal,
  handleToggleDropdown,
  handleFileUpload,
  handleAddImage,
  handleAddLink,
  handleAddYoutube,
  handleAddVideo,
  handleAddMatch,
  handleAddSocialEmbed,
  handleAddTeam,
  handleAddPlayer
}: EditorToolbarProps) {
  if (!editor) {
    return <div className="border border-black/7 dark:border-white/10 rounded-t-md p-2 bg-[#F5F5F5] dark:bg-[#262626] h-11"></div>;
  }

  // 명시적인 모달 닫기 핸들러 추가
  const closeModal = (type: string) => {
    if (type === 'image') {
      handleToggleDropdown('image');
    } else if (type === 'youtube') {
      handleToggleDropdown('youtube');
    } else if (type === 'video') {
      handleToggleDropdown('video');
    } else if (type === 'link') {
      handleToggleDropdown('link');
    } else if (type === 'match') {
      handleToggleDropdown('match');
    } else if (type === 'social') {
      handleToggleDropdown('social');
    } else if (type === 'entity') {
      handleToggleDropdown('entity');
    }
  };

  return (
    <div className="border border-black/7 dark:border-white/10 rounded-t-md flex flex-wrap items-center p-2 gap-1 bg-[#F5F5F5] dark:bg-[#262626]">
      {/* 텍스트 스타일 버튼 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] ${editor.isActive('bold') ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
        title="굵게"
      >
        <Bold size={18} />
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] ${editor.isActive('italic') ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
        title="기울임꼴"
      >
        <Italic size={18} />
      </button>
      
      <div className="w-px h-6 bg-black/7 dark:bg-white/10 mx-1"></div>
      
      {/* 목록 버튼 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] ${editor.isActive('bulletList') ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
        title="글머리 기호 목록"
      >
        <List size={18} />
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] ${editor.isActive('orderedList') ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
        title="번호 매기기 목록"
      >
        <ListOrdered size={18} />
      </button>
      
      <div className="w-px h-6 bg-black/7 dark:bg-white/10 mx-1"></div>
      
      {/* 이미지 버튼과 드롭다운 - 지연 로딩 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleToggleDropdown('image')}
          className={`p-2 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] ${showImageModal ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
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
          className={`p-2 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] ${showLinkModal ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
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
          className={`p-2 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] ${showYoutubeModal ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''} ${!extensionsLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          className={`p-2 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] ${showVideoModal ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''} ${!extensionsLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
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
      
      {/* 소셜 미디어 임베드 버튼과 드롭다운 - 지연 로딩 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleToggleDropdown('social')}
          className={`p-2 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] ${showSocialModal ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''} ${!extensionsLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={extensionsLoaded ? "소셜 미디어 임베드" : "에디터 로딩 중..."}
          disabled={!extensionsLoaded}
        >
          <Share2 size={18} />
        </button>

        {showSocialModal && (
          <Suspense fallback={<FormLoadingSpinner />}>
            <SocialEmbedForm
              isOpen={showSocialModal}
              onCancel={() => closeModal('social')}
              onSocialEmbedAdd={handleAddSocialEmbed}
            />
          </Suspense>
        )}
      </div>

      {/* 소셜-경기/팀 구분선 */}
      <div className="w-px h-6 bg-black/7 dark:bg-white/10 mx-1"></div>

      {/* 경기 결과 버튼과 드롭다운 - 지연 로딩 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleToggleDropdown('match')}
          className={`p-2 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] ${showMatchModal ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
          title="경기 결과 추가"
        >
          <Image src="/icons/live.png" alt="경기 결과" width={18} height={18} className="dark:invert" />
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

      {/* 팀/선수 선택 버튼과 모달 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleToggleDropdown('entity')}
          className={`p-2 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] ${showEntityModal ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''} ${!extensionsLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={extensionsLoaded ? "팀/선수 추가" : "에디터 로딩 중..."}
          disabled={!extensionsLoaded}
        >
          <Users size={18} />
        </button>

        {showEntityModal && (
          <Suspense fallback={<FormLoadingSpinner />}>
            <EntityPickerForm
              isOpen={showEntityModal}
              onClose={() => closeModal('entity')}
              onSelectTeam={handleAddTeam}
              onSelectPlayer={handleAddPlayer}
            />
          </Suspense>
        )}
      </div>

      <div className="w-px h-6 bg-black/7 dark:bg-white/10 mx-1"></div>
      
      {/* 실행 취소/다시 실행 버튼 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-2 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] disabled:opacity-50"
        title="실행 취소"
      >
        <Undo size={18} />
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-2 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] disabled:opacity-50"
        title="다시 실행"
      >
        <Redo size={18} />
      </button>
    </div>
  );
} 