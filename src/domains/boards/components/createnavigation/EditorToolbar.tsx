'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  CalendarCheck,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Redo,
  Share2,
  Shield,
  Undo,
  User,
  Video as VideoIcon,
  Youtube as YoutubeIcon,
} from 'lucide-react';
import { Button } from '@/shared/components/ui';

type DropdownType = 'link' | 'youtube' | 'match' | 'social' | 'team' | 'player';

interface EditorToolbarProps {
  editor: Editor | null;
  extensionsLoaded: boolean;
  isImageUploading?: boolean;
  isVideoUploading?: boolean;
  showLinkModal: boolean;
  showYoutubeModal: boolean;
  showMatchModal: boolean;
  showSocialModal: boolean;
  showTeamModal: boolean;
  showPlayerModal: boolean;
  handleToggleDropdown: (dropdown: DropdownType) => void;
  onImageClick: () => void;
  onVideoClick: () => void;
  onToolbarLinkButtonRect?: (rect: DOMRect) => void;
  onToolbarYoutubeButtonRect?: (rect: DOMRect) => void;
  onToolbarSocialButtonRect?: (rect: DOMRect) => void;
  onToolbarMatchButtonRect?: (rect: DOMRect) => void;
  onToolbarTeamButtonRect?: (rect: DOMRect) => void;
  onToolbarPlayerButtonRect?: (rect: DOMRect) => void;
}

const toolButtonClass = 'h-7 w-7 shrink-0 p-0 text-gray-900 dark:text-[#F0F0F0] md:h-8 md:w-8';
const activeClass = 'bg-[#EAEAEA] dark:bg-[#333333]';
const disabledClass = 'opacity-50 cursor-not-allowed';
const iconSize = 16;

export default function EditorToolbar({
  editor,
  extensionsLoaded,
  isImageUploading = false,
  isVideoUploading = false,
  showLinkModal,
  showYoutubeModal,
  showMatchModal,
  showSocialModal,
  showTeamModal,
  showPlayerModal,
  handleToggleDropdown,
  onImageClick,
  onVideoClick,
  onToolbarLinkButtonRect,
  onToolbarYoutubeButtonRect,
  onToolbarSocialButtonRect,
  onToolbarMatchButtonRect,
  onToolbarTeamButtonRect,
  onToolbarPlayerButtonRect,
}: EditorToolbarProps) {
  if (!editor) {
    return <div className="h-11 rounded-t-md border border-black/7 bg-[#F5F5F5] p-2 dark:border-white/10 dark:bg-[#262626]" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 overflow-visible rounded-t-md border border-black/7 bg-[#F5F5F5] px-1.5 py-1.5 dark:border-white/10 dark:bg-[#262626] md:flex-nowrap">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${toolButtonClass} ${editor.isActive('bold') ? activeClass : ''}`}
        title="굵게"
      >
        <Bold size={iconSize} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${toolButtonClass} ${editor.isActive('italic') ? activeClass : ''}`}
        title="기울임"
      >
        <Italic size={iconSize} />
      </Button>

      <div className="mx-0.5 hidden h-5 w-px shrink-0 bg-black/7 dark:bg-white/10 md:block" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${toolButtonClass} ${editor.isActive('heading', { level: 2 }) ? activeClass : ''}`}
        title="제목 2"
      >
        <Heading2 size={iconSize} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`${toolButtonClass} ${editor.isActive('heading', { level: 3 }) ? activeClass : ''}`}
        title="제목 3"
      >
        <Heading3 size={iconSize} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={toolButtonClass}
        title="구분선"
      >
        <Minus size={iconSize} />
      </Button>

      <div className="mx-0.5 hidden h-5 w-px shrink-0 bg-black/7 dark:bg-white/10 md:block" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${toolButtonClass} ${editor.isActive('bulletList') ? activeClass : ''}`}
        title="글머리 목록"
      >
        <List size={iconSize} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${toolButtonClass} ${editor.isActive('orderedList') ? activeClass : ''}`}
        title="번호 목록"
      >
        <ListOrdered size={iconSize} />
      </Button>

      <div className="mx-0.5 hidden h-5 w-px shrink-0 bg-black/7 dark:bg-white/10 md:block" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToolbarLinkButtonRect?.(event.currentTarget.getBoundingClientRect());
          handleToggleDropdown('link');
        }}
        className={`${toolButtonClass} ${showLinkModal ? activeClass : ''}`}
        title="링크 추가"
      >
        <LinkIcon size={iconSize} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onImageClick}
        disabled={isImageUploading}
        className={`${toolButtonClass} ${isImageUploading ? `${activeClass} opacity-60` : ''}`}
        title="이미지 추가"
      >
        <ImageIcon size={iconSize} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToolbarYoutubeButtonRect?.(event.currentTarget.getBoundingClientRect());
          handleToggleDropdown('youtube');
        }}
        className={`${toolButtonClass} ${showYoutubeModal ? activeClass : ''} ${!extensionsLoaded ? disabledClass : ''}`}
        title="YouTube 추가"
      >
        <YoutubeIcon size={iconSize} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onVideoClick}
        disabled={isVideoUploading}
        className={`${toolButtonClass} ${isVideoUploading ? `${activeClass} opacity-60` : ''} ${!extensionsLoaded ? disabledClass : ''}`}
        title="동영상 파일 추가"
      >
        <VideoIcon size={iconSize} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(event) => {
          onToolbarSocialButtonRect?.(event.currentTarget.getBoundingClientRect());
          handleToggleDropdown('social');
        }}
        className={`${toolButtonClass} ${showSocialModal ? activeClass : ''} ${!extensionsLoaded ? disabledClass : ''}`}
        title="소셜 추가"
      >
        <Share2 size={iconSize} />
      </Button>

      <div className="mx-0.5 hidden h-5 w-px shrink-0 bg-black/7 dark:bg-white/10 md:block" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(event) => {
          onToolbarMatchButtonRect?.(event.currentTarget.getBoundingClientRect());
          handleToggleDropdown('match');
        }}
        className={`${toolButtonClass} ${showMatchModal ? activeClass : ''}`}
        title="경기 결과 추가"
      >
        <CalendarCheck size={iconSize} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(event) => {
          onToolbarTeamButtonRect?.(event.currentTarget.getBoundingClientRect());
          handleToggleDropdown('team');
        }}
        className={`${toolButtonClass} ${showTeamModal ? activeClass : ''} ${!extensionsLoaded ? disabledClass : ''}`}
        title="팀 추가"
      >
        <Shield size={iconSize} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(event) => {
          onToolbarPlayerButtonRect?.(event.currentTarget.getBoundingClientRect());
          handleToggleDropdown('player');
        }}
        className={`${toolButtonClass} ${showPlayerModal ? activeClass : ''} ${!extensionsLoaded ? disabledClass : ''}`}
        title="선수 추가"
      >
        <User size={iconSize} />
      </Button>

      <div className="mx-0.5 hidden h-5 w-px shrink-0 bg-black/7 dark:bg-white/10 md:block" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={toolButtonClass}
        title="실행 취소"
      >
        <Undo size={iconSize} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={toolButtonClass}
        title="다시 실행"
      >
        <Redo size={iconSize} />
      </Button>
    </div>
  );
}
