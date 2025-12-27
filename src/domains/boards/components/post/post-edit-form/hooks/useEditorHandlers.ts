'use client';

import { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { toast } from 'react-toastify';
import { MatchData } from '@/domains/livescore/actions/footballApi';
import { generateMatchCardHTML } from '@/shared/utils/matchCardRenderer';
import { SupabaseClient } from '@supabase/supabase-js';

interface UseEditorHandlersProps {
  editor: Editor | null;
  extensionsLoaded: boolean;
  supabase: SupabaseClient | null;
}

interface UseEditorHandlersReturn {
  // 모달 상태
  showImageModal: boolean;
  showYoutubeModal: boolean;
  showVideoModal: boolean;
  showMatchModal: boolean;
  showLinkModal: boolean;
  showSocialModal: boolean;
  // 모달 상태 설정
  setShowImageModal: (show: boolean) => void;
  setShowYoutubeModal: (show: boolean) => void;
  setShowVideoModal: (show: boolean) => void;
  setShowMatchModal: (show: boolean) => void;
  setShowLinkModal: (show: boolean) => void;
  setShowSocialModal: (show: boolean) => void;
  // 핸들러
  handleToggleDropdown: (dropdown: 'match' | 'link' | 'video' | 'image' | 'youtube' | 'social') => void;
  handleFileUpload: (file: File, caption: string) => Promise<void>;
  handleAddImage: (url: string, caption?: string) => void;
  handleAddYoutube: (url: string, caption?: string) => Promise<void>;
  handleAddVideo: (videoUrl: string, caption: string) => Promise<void>;
  handleAddMatch: (matchId: string, matchData: MatchData) => Promise<void>;
  handleAddLink: (url: string, text?: string) => void;
  handleAddSocialEmbed: (platform: string, url: string) => void;
}

export function useEditorHandlers({
  editor,
  extensionsLoaded,
  supabase
}: UseEditorHandlersProps): UseEditorHandlersReturn {
  // 모달 상태
  const [showImageModal, setShowImageModal] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);

  // 모든 모달 닫기
  const closeAllModals = useCallback(() => {
    setShowImageModal(false);
    setShowYoutubeModal(false);
    setShowVideoModal(false);
    setShowMatchModal(false);
    setShowLinkModal(false);
    setShowSocialModal(false);
  }, []);

  // 모달 토글 핸들러
  const handleToggleDropdown = useCallback((dropdown: 'match' | 'link' | 'video' | 'image' | 'youtube' | 'social') => {
    const currentState: Record<typeof dropdown, boolean> = {
      image: showImageModal,
      youtube: showYoutubeModal,
      video: showVideoModal,
      match: showMatchModal,
      link: showLinkModal,
      social: showSocialModal
    };

    // 이미 열려있는 모달이면 닫기
    if (currentState[dropdown]) {
      closeAllModals();
      return;
    }

    // 모든 모달 닫고 선택된 것만 열기
    closeAllModals();

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
      case 'social':
        setShowSocialModal(true);
        break;
    }
  }, [showImageModal, showYoutubeModal, showVideoModal, showMatchModal, showLinkModal, showSocialModal, closeAllModals]);

  // 파일 업로드 처리
  const handleFileUpload = useCallback(async (file: File, caption: string) => {
    if (!file || !editor || !supabase) return;

    try {
      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 8);
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `upload_${timestamp}_${randomString}_${safeFileName}`;

      const { error } = await supabase
        .storage
        .from('post-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        throw new Error(`파일 업로드 실패: ${error.message}`);
      }

      const { data: urlData } = supabase
        .storage
        .from('post-images')
        .getPublicUrl(fileName);

      if (!urlData.publicUrl) {
        throw new Error('파일 URL을 가져올 수 없습니다.');
      }

      editor.chain().focus().setImage({
        src: urlData.publicUrl,
        alt: caption || file.name
      }).run();

      setShowImageModal(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`이미지 업로드 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }, [editor, supabase]);

  // URL 이미지 추가
  const handleAddImage = useCallback((url: string, caption?: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url, alt: caption || "" }).run();
      setShowImageModal(false);
    }
  }, [editor]);

  // 유튜브 추가
  const handleAddYoutube = useCallback(async (url: string, caption?: string) => {
    if (!url || !editor) return;

    try {
      if (!extensionsLoaded) {
        toast.error('에디터가 아직 로딩 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      let result = false;

      if (extensionsLoaded && 'setYoutubeVideo' in editor.commands) {
        const commands = editor.commands as Record<string, (...args: unknown[]) => boolean>;
        result = commands.setYoutubeVideo({
          src: url,
          caption: caption
        });
      }

      if (!result) {
        console.warn('YouTube 확장 명령어 실행 실패, HTML 직접 삽입으로 fallback');

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
  }, [editor, extensionsLoaded]);

  // 비디오 추가
  const handleAddVideo = useCallback(async (videoUrl: string, caption: string) => {
    if (!videoUrl || !editor) return;

    try {
      if (!extensionsLoaded) {
        toast.error('에디터가 아직 로딩 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      let result = false;

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
  }, [editor, extensionsLoaded]);

  // 경기 카드 추가
  const handleAddMatch = useCallback(async (matchId: string, matchData: MatchData) => {
    if (!editor) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    try {
      const matchCardHTML = generateMatchCardHTML(matchData);
      editor.commands.insertContent(matchCardHTML);
      setShowMatchModal(false);
      toast.success('경기 결과가 추가되었습니다.');
    } catch (error) {
      console.error('경기 추가 중 오류:', error);
      toast.error('경기 추가 중 오류가 발생했습니다.');
    }
  }, [editor]);

  // 링크 추가
  const handleAddLink = useCallback((url: string, text?: string) => {
    if (!editor || !url) return;

    try {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);

      if (selectedText) {
        editor.chain().focus().setLink({ href: url }).run();
      } else {
        const linkText = text || url;
        editor.chain().focus().insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`).run();
      }
    } catch (error) {
      console.error('링크 추가 중 오류:', error);
      toast.error('링크를 추가하는데 실패했습니다.');
    }
  }, [editor]);

  // 소셜 미디어 임베드 추가
  const handleAddSocialEmbed = useCallback((platform: string, url: string) => {
    if (!editor || !extensionsLoaded) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    try {
      const commands = editor.commands as Record<string, (...args: unknown[]) => boolean>;
      if ('setSocialEmbed' in commands) {
        const success = commands.setSocialEmbed({ platform, url });
        if (success) {
          toast.success('소셜 미디어 임베드가 추가되었습니다.');
          setShowSocialModal(false);
        } else {
          toast.error('임베드 추가에 실패했습니다.');
        }
      } else {
        toast.error('소셜 임베드 기능이 로드되지 않았습니다.');
      }
    } catch (error) {
      console.error('소셜 임베드 추가 중 오류:', error);
      toast.error('소셜 미디어 임베드를 추가하는데 실패했습니다.');
    }
  }, [editor, extensionsLoaded]);

  return {
    showImageModal,
    showYoutubeModal,
    showVideoModal,
    showMatchModal,
    showLinkModal,
    showSocialModal,
    setShowImageModal,
    setShowYoutubeModal,
    setShowVideoModal,
    setShowMatchModal,
    setShowLinkModal,
    setShowSocialModal,
    handleToggleDropdown,
    handleFileUpload,
    handleAddImage,
    handleAddYoutube,
    handleAddVideo,
    handleAddMatch,
    handleAddLink,
    handleAddSocialEmbed
  };
}
