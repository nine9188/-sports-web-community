'use client';

import { useCallback, useState } from 'react';
import { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { MatchData } from '@/domains/livescore/actions/footballApi';
import { generateMatchCardHTML } from '@/shared/utils/matchCardRenderer';
import { createPlayerCardData } from '@/domains/boards/actions/createPlayerCardData';
import { createTeamCardData } from '@/domains/boards/actions/createTeamCardData';
import { createMatchCardData } from '@/domains/boards/actions/createMatchCardData';
import type { TeamMapping } from '@/domains/boards/hooks/useEntityQueries';
import type { Player } from '@/domains/livescore/actions/teams/squad';

interface LeagueInfo {
  id: number;
  name: string;
  koreanName: string;
}

interface UseEditorHandlersProps {
  editor: Editor | null;
  extensionsLoaded: boolean;
}

type ModalType = 'youtube' | 'match' | 'link' | 'social' | 'team' | 'player';

interface UseEditorHandlersReturn {
  showYoutubeModal: boolean;
  showMatchModal: boolean;
  showLinkModal: boolean;
  showSocialModal: boolean;
  showTeamModal: boolean;
  showPlayerModal: boolean;
  setShowYoutubeModal: (show: boolean) => void;
  setShowMatchModal: (show: boolean) => void;
  setShowLinkModal: (show: boolean) => void;
  setShowSocialModal: (show: boolean) => void;
  setShowTeamModal: (show: boolean) => void;
  setShowPlayerModal: (show: boolean) => void;
  handleToggleDropdown: (dropdown: ModalType) => void;
  handleAddImage: (url: string, caption?: string) => void;
  handleAddYoutube: (url: string, caption?: string) => Promise<void>;
  handleAddVideo: (videoUrl: string, caption: string) => Promise<void>;
  handleAddMatch: (matchId: string, matchData: MatchData) => Promise<void>;
  handleAddLink: (url: string, text?: string) => void;
  handleAddSocialEmbed: (platform: string, url: string) => void;
  handleAddTeam: (team: TeamMapping, league: LeagueInfo) => Promise<void>;
  handleAddPlayer: (player: Player, team: TeamMapping, koreanName?: string) => Promise<void>;
}

function insertContent(editor: Editor, content: Parameters<Editor['commands']['insertContent']>[0]) {
  const { selection } = editor.state;
  const { $from } = selection;
  const shouldReplaceEmptyParagraph =
    selection.empty &&
    $from.depth > 0 &&
    $from.parent.type.name === 'paragraph' &&
    $from.parent.content.size === 0;

  return shouldReplaceEmptyParagraph
    ? editor.chain().focus()
        .deleteRange({ from: $from.before(), to: $from.after() })
        .insertContent(content)
        .focus()
        .run()
    : editor.chain().focus()
        .insertContent(content)
        .focus()
        .run();
}

function toYoutubeEmbedUrl(url: string) {
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  return url;
}

export function useEditorHandlers({
  editor,
  extensionsLoaded,
}: UseEditorHandlersProps): UseEditorHandlersReturn {
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);

  const showYoutubeModal = activeModal === 'youtube';
  const showMatchModal = activeModal === 'match';
  const showLinkModal = activeModal === 'link';
  const showSocialModal = activeModal === 'social';
  const showTeamModal = activeModal === 'team';
  const showPlayerModal = activeModal === 'player';

  const setShowYoutubeModal = useCallback((show: boolean) => setActiveModal(show ? 'youtube' : null), []);
  const setShowMatchModal = useCallback((show: boolean) => setActiveModal(show ? 'match' : null), []);
  const setShowLinkModal = useCallback((show: boolean) => setActiveModal(show ? 'link' : null), []);
  const setShowSocialModal = useCallback((show: boolean) => setActiveModal(show ? 'social' : null), []);
  const setShowTeamModal = useCallback((show: boolean) => setActiveModal(show ? 'team' : null), []);
  const setShowPlayerModal = useCallback((show: boolean) => setActiveModal(show ? 'player' : null), []);

  const handleToggleDropdown = useCallback((dropdown: ModalType) => {
    setActiveModal((prev) => (prev === dropdown ? null : dropdown));
  }, []);

  const handleAddImage = useCallback((url: string, caption?: string) => {
    if (!editor) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    if (!url.trim()) {
      toast.error('이미지 URL을 입력해주세요.');
      return;
    }

    try {
      const success = insertContent(editor, [
        { type: 'image', attrs: { src: url, alt: caption || '' } },
        { type: 'paragraph' },
      ]);

      if (!success) {
        toast.error('이미지를 에디터에 삽입하지 못했습니다.');
        return;
      }

      toast.success('이미지가 추가되었습니다.');
    } catch (error) {
      console.error('이미지 추가 오류:', error);
      toast.error('이미지를 추가하는 데 실패했습니다.');
    }
  }, [editor]);

  const handleAddYoutube = useCallback(async (url: string, caption?: string) => {
    if (!url || !editor) return;

    try {
      if (!extensionsLoaded) {
        toast.error('에디터 확장이 아직 로드되지 않았습니다.');
        return;
      }

      let success = false;
      if ('setYoutubeVideo' in editor.commands) {
        success = insertContent(editor, [
          { type: 'youtube', attrs: { src: url, caption } },
          { type: 'paragraph' },
        ]);
      }

      if (!success) {
        const embedUrl = toYoutubeEmbedUrl(url);
        editor.commands.insertContent(`
          <div class="youtube-container">
            <iframe src="${embedUrl}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
          </div>
          <p></p>
        `);
      }

      toast.success('YouTube 영상이 추가되었습니다.');
      setShowYoutubeModal(false);
    } catch (error) {
      console.error('YouTube 추가 오류:', error);
      toast.error('YouTube 영상을 추가하는 데 실패했습니다.');
    }
  }, [editor, extensionsLoaded, setShowYoutubeModal]);

  const handleAddVideo = useCallback(async (videoUrl: string, caption = '') => {
    if (!videoUrl || !editor) return;

    try {
      let success = false;

      if ('setVideo' in editor.commands) {
        success = insertContent(editor, [
          {
            type: 'video',
            attrs: {
              src: videoUrl,
              controls: true,
              width: '100%',
              height: 'auto',
              preload: 'none',
              ...(caption ? { caption } : {}),
            },
          },
          { type: 'paragraph' },
        ]);
      }

      if (!success) {
        editor.commands.insertContent(`
          <div class="video-wrapper" style="margin: 1rem 0;">
            <video src="${videoUrl}" controls preload="none" style="width: 100%; max-width: 640px; height: auto;" data-caption="${caption || ''}">
              브라우저가 비디오를 지원하지 않습니다.
            </video>
          </div>
          <p></p>
        `);
      }

      toast.success('동영상이 추가되었습니다.');
    } catch (error) {
      console.error('동영상 추가 오류:', error);
      toast.error('동영상을 추가하는 데 실패했습니다.');
    }
  }, [editor]);

  const handleAddMatch = useCallback(async (matchId: string, matchData: MatchData) => {
    if (!editor) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    try {
      const result = await createMatchCardData(matchData);

      if (!result.success || !result.data) {
        toast.error(result.error || '경기 카드 데이터를 만들지 못했습니다.');
        return;
      }

      let success = false;
      if ('setMatchCard' in editor.commands) {
        success = insertContent(editor, [
          { type: 'matchCard', attrs: { matchId, matchData: result.data } },
          { type: 'paragraph' },
        ]);
      }

      if (!success) {
        editor.commands.insertContent(generateMatchCardHTML(result.data) + '<p></p>');
      }

      setShowMatchModal(false);
      toast.success('경기 결과가 추가되었습니다.');
    } catch (error) {
      console.error('경기 추가 오류:', error);
      toast.error('경기 결과를 추가하는 데 실패했습니다.');
    }
  }, [editor, setShowMatchModal]);

  const handleAddLink = useCallback((url: string, text?: string) => {
    if (!editor || !url) return;

    try {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      const displayText = text?.trim();

      if (selectedText && displayText && displayText !== selectedText) {
        editor.chain().focus().insertContent({
          type: 'text',
          text: displayText,
          marks: [{ type: 'link', attrs: { href: url, target: '_blank', rel: 'noopener noreferrer' } }],
        }).run();
        return;
      }

      if (selectedText || editor.isActive('link')) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        return;
      }

      insertContent(editor, [
        {
          type: 'text',
          text: displayText || url,
          marks: [{ type: 'link', attrs: { href: url, target: '_blank', rel: 'noopener noreferrer' } }],
        },
        { type: 'paragraph' },
      ]);
    } catch (error) {
      console.error('링크 추가 오류:', error);
      toast.error('링크를 추가하는 데 실패했습니다.');
    }
  }, [editor]);

  const handleAddSocialEmbed = useCallback((platform: string, url: string) => {
    if (!editor || !extensionsLoaded) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    try {
      if (!('setSocialEmbed' in editor.commands)) {
        toast.error('소셜 임베드 기능이 로드되지 않았습니다.');
        return;
      }

      const success = insertContent(editor, [
        { type: 'socialEmbed', attrs: { platform, url } },
        { type: 'paragraph' },
      ]);

      if (!success) {
        toast.error('소셜 임베드를 추가하지 못했습니다.');
        return;
      }

      setShowSocialModal(false);
      toast.success('소셜 임베드가 추가되었습니다.');
    } catch (error) {
      console.error('소셜 임베드 추가 오류:', error);
      toast.error('소셜 임베드를 추가하는 데 실패했습니다.');
    }
  }, [editor, extensionsLoaded, setShowSocialModal]);

  const handleAddTeam = useCallback(async (team: TeamMapping, league: LeagueInfo) => {
    if (!editor || !extensionsLoaded) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    try {
      const result = await createTeamCardData(
        { id: team.id, name_en: team.name_en, name_ko: team.name_ko, logo: team.logo },
        league
      );

      if (!result.success || !result.data) {
        toast.error(result.error || '팀 카드 데이터를 만들지 못했습니다.');
        return;
      }

      if (!('setTeamCard' in editor.commands)) {
        toast.error('팀 카드 기능이 로드되지 않았습니다.');
        return;
      }

      const success = insertContent(editor, [
        { type: 'teamCard', attrs: { teamId: team.id, teamData: result.data } },
        { type: 'paragraph' },
      ]);

      if (!success) {
        toast.error('팀 카드를 추가하지 못했습니다.');
        return;
      }

      setShowTeamModal(false);
      toast.success('팀 카드가 추가되었습니다.');
    } catch (error) {
      console.error('팀 카드 추가 오류:', error);
      toast.error('팀 카드를 추가하는 데 실패했습니다.');
    }
  }, [editor, extensionsLoaded, setShowTeamModal]);

  const handleAddPlayer = useCallback(async (player: Player, team: TeamMapping, koreanName?: string) => {
    if (!editor || !extensionsLoaded) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    try {
      if (!('setPlayerCard' in editor.commands)) {
        toast.error('선수 카드 기능이 로드되지 않았습니다.');
        return;
      }

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
        toast.error(result.error || '선수 카드 데이터를 만들지 못했습니다.');
        return;
      }

      const success = insertContent(editor, [
        { type: 'playerCard', attrs: { playerId: player.id, playerData: result.data } },
        { type: 'paragraph' },
      ]);

      if (!success) {
        toast.error('선수 카드를 추가하지 못했습니다.');
        return;
      }

      setShowPlayerModal(false);
      toast.success('선수 카드가 추가되었습니다.');
    } catch (error) {
      console.error('선수 카드 추가 오류:', error);
      toast.error('선수 카드를 추가하는 데 실패했습니다.');
    }
  }, [editor, extensionsLoaded, setShowPlayerModal]);

  return {
    showYoutubeModal,
    showMatchModal,
    showLinkModal,
    showSocialModal,
    showTeamModal,
    showPlayerModal,
    setShowYoutubeModal,
    setShowMatchModal,
    setShowLinkModal,
    setShowSocialModal,
    setShowTeamModal,
    setShowPlayerModal,
    handleToggleDropdown,
    handleAddImage,
    handleAddYoutube,
    handleAddVideo,
    handleAddMatch,
    handleAddLink,
    handleAddSocialEmbed,
    handleAddTeam,
    handleAddPlayer,
  };
}
