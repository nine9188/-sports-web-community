'use client';

import { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { toast } from 'react-toastify';
import { MatchData } from '@/domains/livescore/actions/footballApi';
import { generateMatchCardHTML } from '@/shared/utils/matchCardRenderer';
import { createPlayerCardData } from '@/domains/boards/actions/createPlayerCardData';
import { createTeamCardData } from '@/domains/boards/actions/createTeamCardData';
import { createMatchCardData } from '@/domains/boards/actions/createMatchCardData';
import type { TeamMapping } from '@/domains/livescore/constants/teams';
import type { Player } from '@/domains/livescore/actions/teams/squad';

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
  handleAddTeam: (team: TeamMapping, league: LeagueInfo) => Promise<void>;
  handleAddPlayer: (player: Player, team: TeamMapping, koreanName?: string) => void;
}

// 모달 타입 정의
type ModalType = 'image' | 'youtube' | 'video' | 'match' | 'link' | 'social' | 'entity';

export function useEditorHandlers({
  editor,
  extensionsLoaded
}: UseEditorHandlersProps): UseEditorHandlersReturn {
  // 단일 상태로 모든 모달 관리 (stale closure 문제 해결)
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);

  // 파생 상태: 개별 모달 열림 여부
  const showImageModal = activeModal === 'image';
  const showYoutubeModal = activeModal === 'youtube';
  const showVideoModal = activeModal === 'video';
  const showMatchModal = activeModal === 'match';
  const showLinkModal = activeModal === 'link';
  const showSocialModal = activeModal === 'social';
  const showEntityModal = activeModal === 'entity';

  // 개별 모달 setter (기존 API 호환성 유지)
  const setShowImageModal = useCallback((show: boolean) => setActiveModal(show ? 'image' : null), []);
  const setShowYoutubeModal = useCallback((show: boolean) => setActiveModal(show ? 'youtube' : null), []);
  const setShowVideoModal = useCallback((show: boolean) => setActiveModal(show ? 'video' : null), []);
  const setShowMatchModal = useCallback((show: boolean) => setActiveModal(show ? 'match' : null), []);
  const setShowLinkModal = useCallback((show: boolean) => setActiveModal(show ? 'link' : null), []);
  const setShowSocialModal = useCallback((show: boolean) => setActiveModal(show ? 'social' : null), []);
  const setShowEntityModal = useCallback((show: boolean) => setActiveModal(show ? 'entity' : null), []);

  // 모달 토글 핸들러 (의존성 없음 - stale closure 해결)
  const handleToggleDropdown = useCallback((dropdown: ModalType) => {
    setActiveModal(prev => prev === dropdown ? null : dropdown);
  }, []);

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
      const result = editor.chain().focus()
        .insertContent([
          { type: 'image', attrs: { src: url, alt: caption || "" } },
          { type: 'paragraph' },
        ])
        .focus()
        .run();

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
        result = editor.chain().focus().insertContent([
          { type: 'youtube', attrs: { src: url, caption } },
          { type: 'paragraph' },
        ]).focus().run();
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

        editor.commands.insertContent(youtubeHTML + '<p></p>');
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
        result = editor.chain().focus().insertContent([
          { type: 'video', attrs: { src: videoUrl, caption, controls: true, width: '100%', height: 'auto' } },
          { type: 'paragraph' },
        ]).focus().run();
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

        editor.commands.insertContent(videoHTML + '<p></p>');
      }

      toast.success('동영상이 추가되었습니다.');
    } catch (error) {
      console.error('비디오 추가 중 오류:', error);
      toast.error('비디오를 추가하는데 실패했습니다. 다시 시도해주세요.');
    }

    setShowVideoModal(false);
  }, [editor, extensionsLoaded]);

  // 경기 카드 추가 (4590 표준: 서버에서 Storage URL 확정)
  const handleAddMatch = useCallback(async (matchId: string, matchData: MatchData) => {
    if (!editor) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    try {
      // 4590 표준: 서버에서 Storage URL 확정
      const result = await createMatchCardData(matchData);

      if (!result.success || !result.data) {
        toast.error(result.error || '경기 카드 데이터 생성에 실패했습니다.');
        return;
      }

      const matchCardHTML = generateMatchCardHTML(result.data);
      editor.commands.insertContent(matchCardHTML + '<p></p>');
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
        editor.chain().focus().insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a><p></p>`).run();
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
      if ('setSocialEmbed' in editor.commands) {
        const success = editor.chain().focus().insertContent([
          { type: 'socialEmbed', attrs: { platform, url } },
          { type: 'paragraph' },
        ]).focus().run();
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

  // 팀 카드 추가 (4590 표준: 서버에서 Storage URL 확정)
  const handleAddTeam = useCallback(async (team: TeamMapping, league: LeagueInfo) => {
    if (!editor || !extensionsLoaded) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    try {
      // 4590 표준: 서버에서 Storage URL 확정
      const result = await createTeamCardData(
        { id: team.id, name_en: team.name_en, name_ko: team.name_ko, logo: team.logo },
        league
      );

      if (!result.success || !result.data) {
        toast.error(result.error || '팀 카드 데이터 생성에 실패했습니다.');
        return;
      }

      if ('setTeamCard' in editor.commands) {
        const success = editor.chain().focus().insertContent([
          { type: 'teamCard', attrs: { teamId: team.id, teamData: result.data } },
          { type: 'paragraph' },
        ]).focus().run();
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

  // 선수 카드 추가 (4590 표준: 서버에서 Storage URL 확정)
  const handleAddPlayer = useCallback(async (player: Player, team: TeamMapping, koreanName?: string) => {
    if (!editor || !extensionsLoaded) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    try {
      if ('setPlayerCard' in editor.commands) {
        // 서버에서 Storage URL이 포함된 데이터 생성
        const result = await createPlayerCardData(
          {
            id: player.id,
            name: player.name,
            photo: player.photo,
            position: player.position,
            number: player.number,
          },
          {
            id: team.id,
            name_en: team.name_en,
            name_ko: team.name_ko,
            logo: team.logo,
          },
          koreanName
        );

        if (!result.success || !result.data) {
          toast.error(result.error || '선수 카드 데이터 생성에 실패했습니다.');
          return;
        }

        const success = editor.chain().focus().insertContent([
          { type: 'playerCard', attrs: { playerId: player.id, playerData: result.data } },
          { type: 'paragraph' },
        ]).focus().run();
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
