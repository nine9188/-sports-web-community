'use client';

import React from 'react';
import Image from 'next/image';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, List, ListOrdered, Image as ImageIcon, Link as LinkIcon,
  Undo, Redo, Youtube as YoutubeIcon, Video as VideoIcon, Share2, Users
} from 'lucide-react';
import { Button } from '@/shared/components/ui';

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
}


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
}: EditorToolbarProps) {
  if (!editor) {
    return <div className="border border-black/7 dark:border-white/10 rounded-t-md p-2 bg-[#F5F5F5] dark:bg-[#262626] h-11"></div>;
  }

  return (
    <div className="border border-black/7 dark:border-white/10 rounded-t-md flex flex-wrap items-center p-2 gap-1 bg-[#F5F5F5] dark:bg-[#262626]">
      {/* 텍스트 스타일 버튼 */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`h-auto w-auto p-2 text-gray-900 dark:text-[#F0F0F0] ${editor.isActive('bold') ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
        title="굵게"
      >
        <Bold size={18} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`h-auto w-auto p-2 text-gray-900 dark:text-[#F0F0F0] ${editor.isActive('italic') ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
        title="기울임꼴"
      >
        <Italic size={18} />
      </Button>

      <div className="w-px h-6 bg-black/7 dark:bg-white/10 mx-1"></div>

      {/* 목록 버튼 */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`h-auto w-auto p-2 text-gray-900 dark:text-[#F0F0F0] ${editor.isActive('bulletList') ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
        title="글머리 기호 목록"
      >
        <List size={18} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`h-auto w-auto p-2 text-gray-900 dark:text-[#F0F0F0] ${editor.isActive('orderedList') ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
        title="번호 매기기 목록"
      >
        <ListOrdered size={18} />
      </Button>

      <div className="w-px h-6 bg-black/7 dark:bg-white/10 mx-1"></div>

      {/* 이미지 버튼 */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => handleToggleDropdown('image')}
        className={`h-auto w-auto p-2 text-gray-900 dark:text-[#F0F0F0] ${showImageModal ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
        title="이미지 추가"
      >
        <ImageIcon size={18} />
      </Button>

      {/* 링크 버튼 */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => handleToggleDropdown('link')}
        className={`h-auto w-auto p-2 text-gray-900 dark:text-[#F0F0F0] ${showLinkModal ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
        title="링크 추가"
      >
        <LinkIcon size={18} />
      </Button>

      {/* 유튜브 버튼 */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => handleToggleDropdown('youtube')}
        className={`h-auto w-auto p-2 text-gray-900 dark:text-[#F0F0F0] ${showYoutubeModal ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''} ${!extensionsLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={extensionsLoaded ? "YouTube 동영상 추가" : "에디터 로딩 중..."}
        disabled={!extensionsLoaded}
      >
        <YoutubeIcon size={18} />
      </Button>

      {/* 비디오 버튼 */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => handleToggleDropdown('video')}
        className={`h-auto w-auto p-2 text-gray-900 dark:text-[#F0F0F0] ${showVideoModal ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''} ${!extensionsLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={extensionsLoaded ? "동영상 파일 추가" : "에디터 로딩 중..."}
        disabled={!extensionsLoaded}
      >
        <VideoIcon size={18} />
      </Button>

      {/* 소셜 미디어 임베드 버튼 */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => handleToggleDropdown('social')}
        className={`h-auto w-auto p-2 text-gray-900 dark:text-[#F0F0F0] ${showSocialModal ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''} ${!extensionsLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={extensionsLoaded ? "소셜 미디어 임베드" : "에디터 로딩 중..."}
        disabled={!extensionsLoaded}
      >
        <Share2 size={18} />
      </Button>

      {/* 소셜-경기/팀 구분선 */}
      <div className="w-px h-6 bg-black/7 dark:bg-white/10 mx-1"></div>

      {/* 경기 결과 버튼 */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => handleToggleDropdown('match')}
        className={`h-auto w-auto p-2 text-gray-900 dark:text-[#F0F0F0] ${showMatchModal ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
        title="경기 결과 추가"
      >
        <Image src="/icons/live.png" alt="경기 결과" width={18} height={18} className="dark:invert" />
      </Button>

      {/* 팀/선수 선택 버튼 */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => handleToggleDropdown('entity')}
        className={`h-auto w-auto p-2 text-gray-900 dark:text-[#F0F0F0] ${showEntityModal ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''} ${!extensionsLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={extensionsLoaded ? "팀/선수 추가" : "에디터 로딩 중..."}
        disabled={!extensionsLoaded}
      >
        <Users size={18} />
      </Button>

      <div className="w-px h-6 bg-black/7 dark:bg-white/10 mx-1"></div>

      {/* 실행 취소/다시 실행 버튼 */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="h-auto w-auto p-2 text-gray-900 dark:text-[#F0F0F0]"
        title="실행 취소"
      >
        <Undo size={18} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="h-auto w-auto p-2 text-gray-900 dark:text-[#F0F0F0]"
        title="다시 실행"
      >
        <Redo size={18} />
      </Button>
    </div>
  );
} 