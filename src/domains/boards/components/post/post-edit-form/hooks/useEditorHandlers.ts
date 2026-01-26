'use client';

import { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { toast } from 'react-toastify';
import { MatchData } from '@/domains/livescore/actions/footballApi';
import { generateMatchCardHTML } from '@/shared/utils/matchCardRenderer';
import type { TeamMapping } from '@/domains/livescore/constants/teams';
import type { Player } from '@/domains/livescore/actions/teams/squad';
import { getPlayerKoreanName } from '@/domains/livescore/constants/players';

// 리그 정보 인터페이스
interface LeagueInfo {
  id: number;
  name: string;
  koreanName: string;
}

interface UseEditorHandlersProps {
  editor: Editor | null;
  extensionsLoaded: boolean;
}

interface UseEditorHandlersReturn {
  // 모달 상태
  showImageModal: boolean;
  showYoutubeModal: boolean;
  showVideoModal: boolean;
  showMatchModal: boolean;
  showLinkModal: boolean;
  showSocialModal: boolean;
  showEntityModal: boolean;
  // 모달 상태 설정
  setShowImageModal: (show: boolean) => void;
  setShowYoutubeModal: (show: boolean) => void;
  setShowVideoModal: (show: boolean) => void;
  setShowMatchModal: (show: boolean) => void;
  setShowLinkModal: (show: boolean) => void;
  setShowSocialModal: (show: boolean) => void;
  setShowEntityModal: (show: boolean) => void;
  // 핸들러
  handleToggleDropdown: (dropdown: 'match' | 'link' | 'video' | 'image' | 'youtube' | 'social' | 'entity') => void;
  handleAddImage: (url: string, caption?: string) => void;
  handleAddYoutube: (url: string, caption?: string) => Promise<void>;
  handleAddVideo: (videoUrl: string, caption: string) => Promise<void>;
  handleAddMatch: (matchId: string, matchData: MatchData) => Promise<void>;
  handleAddLink: (url: string, text?: string) => void;
  handleAddSocialEmbed: (platform: string, url: string) => void;
  handleAddTeam: (team: TeamMapping, league: LeagueInfo) => void;
  handleAddPlayer: (player: Player, team: TeamMapping) => void;
}

export function useEditorHandlers({
  editor,
  extensionsLoaded
}: UseEditorHandlersProps): UseEditorHandlersReturn {
  // 모달 상태
  const [showImageModal, setShowImageModal] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showEntityModal, setShowEntityModal] = useState(false);

  // 모든 모달 닫기
  const closeAllModals = useCallback(() => {
    setShowImageModal(false);
    setShowYoutubeModal(false);
    setShowVideoModal(false);
    setShowMatchModal(false);
    setShowLinkModal(false);
    setShowSocialModal(false);
    setShowEntityModal(false);
  }, []);

  // 모달 토글 핸들러
  const handleToggleDropdown = useCallback((dropdown: 'match' | 'link' | 'video' | 'image' | 'youtube' | 'social' | 'entity') => {
    const currentState: Record<typeof dropdown, boolean> = {
      image: showImageModal,
      youtube: showYoutubeModal,
      video: showVideoModal,
      match: showMatchModal,
      link: showLinkModal,
      social: showSocialModal,
      entity: showEntityModal
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
      case 'entity':
        setShowEntityModal(true);
        break;
    }
  }, [showImageModal, showYoutubeModal, showVideoModal, showMatchModal, showLinkModal, showSocialModal, showEntityModal, closeAllModals]);

  // URL 이미지 추가 (파일 업로드는 ImageUploadForm에서 직접 처리)
  const handleAddImage = useCallback((url: string, caption?: string) => {
    if (!editor) {
      toast.error('에디터가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    if (!url || !url.trim()) {
      toast.error('이미지 URL을 입력해주세요.');
      return;
    }

    try {
      const result = editor.chain().focus().setImage({ src: url, alt: caption || "" }).run();

      if (!result) {
        console.error('이미지 삽입 명령 실패: setImage 반환값 false');
        toast.error('이미지를 에디터에 삽입하지 못했습니다.');
        return;
      }

      setShowImageModal(false);
      toast.success('이미지가 추가되었습니다.');
    } catch (error) {
      console.error('이미지 URL 추가 오류:', error);
      toast.error('이미지를 추가하는데 실패했습니다.');
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

  // 팀 카드 추가
  const handleAddTeam = useCallback((team: TeamMapping, league: LeagueInfo) => {
    if (!editor || !extensionsLoaded) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    try {
      const commands = editor.commands as Record<string, (...args: unknown[]) => boolean>;
      if ('setTeamCard' in commands) {
        const teamData = {
          id: team.id,
          name: team.name_en,
          koreanName: team.name_ko,
          logo: team.logo || `https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/teams/${team.id}.png`,
          league: {
            id: league.id,
            name: league.name,
            koreanName: league.koreanName,
            logo: `https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/leagues/${league.id}.png`
          }
        };
        const success = commands.setTeamCard(team.id, teamData);
        if (success) {
          toast.success('팀 카드가 추가되었습니다.');
          setShowEntityModal(false);
        } else {
          toast.error('팀 카드 추가에 실패했습니다.');
        }
      } else {
        toast.error('팀 카드 기능이 로드되지 않았습니다.');
      }
    } catch (error) {
      console.error('팀 카드 추가 중 오류:', error);
      toast.error('팀 카드를 추가하는데 실패했습니다.');
    }
  }, [editor, extensionsLoaded]);

  // 선수 카드 추가
  const handleAddPlayer = useCallback((player: Player, team: TeamMapping) => {
    if (!editor || !extensionsLoaded) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    try {
      const koreanName = getPlayerKoreanName(player.id);
      const commands = editor.commands as Record<string, (...args: unknown[]) => boolean>;
      if ('setPlayerCard' in commands) {
        const playerData = {
          id: player.id,
          name: player.name,
          koreanName: koreanName || player.name,
          photo: player.photo || `https://media.api-sports.io/football/players/${player.id}.png`,
          position: player.position,
          number: player.number,
          team: {
            id: team.id,
            name: team.name_en,
            koreanName: team.name_ko,
            logo: team.logo || `https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/teams/${team.id}.png`
          }
        };
        const success = commands.setPlayerCard(player.id, playerData);
        if (success) {
          toast.success('선수 카드가 추가되었습니다.');
          setShowEntityModal(false);
        } else {
          toast.error('선수 카드 추가에 실패했습니다.');
        }
      } else {
        toast.error('선수 카드 기능이 로드되지 않았습니다.');
      }
    } catch (error) {
      console.error('선수 카드 추가 중 오류:', error);
      toast.error('선수 카드를 추가하는데 실패했습니다.');
    }
  }, [editor, extensionsLoaded]);

  return {
    showImageModal,
    showYoutubeModal,
    showVideoModal,
    showMatchModal,
    showLinkModal,
    showSocialModal,
    showEntityModal,
    setShowImageModal,
    setShowYoutubeModal,
    setShowVideoModal,
    setShowMatchModal,
    setShowLinkModal,
    setShowSocialModal,
    setShowEntityModal,
    handleToggleDropdown,
    handleAddImage,
    handleAddYoutube,
    handleAddVideo,
    handleAddMatch,
    handleAddLink,
    handleAddSocialEmbed,
    handleAddTeam,
    handleAddPlayer
  };
}
