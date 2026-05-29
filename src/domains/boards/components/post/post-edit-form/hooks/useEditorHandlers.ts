'use client';

import { useCallback, useState } from 'react';
import { Editor } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NodeSelection } from '@tiptap/pm/state';
import { toast } from 'sonner';
import { MatchData } from '@/domains/livescore/actions/footballApi';
import { generateMatchCardHTML } from '@/shared/utils/matchCardRenderer';
import { createPlayerCardData } from '@/domains/boards/actions/createPlayerCardData';
import { createTeamCardData } from '@/domains/boards/actions/createTeamCardData';
import { createMatchCardData } from '@/domains/boards/actions/createMatchCardData';
import type { TeamMapping } from '@/domains/boards/hooks/useEntityQueries';
import type { Player } from '@/domains/livescore/actions/teams/squad';
import type { EntityCardGroupItem } from '@/shared/types/entityCardGroup';

interface LeagueInfo {
  id: number;
  name: string;
  koreanName: string;
}

interface UseEditorHandlersProps {
  editor: Editor | null;
  extensionsLoaded: boolean;
}

type ModalType = 'youtube' | 'match' | 'link' | 'social' | 'team' | 'player' | 'table';

interface UseEditorHandlersReturn {
  showYoutubeModal: boolean;
  showMatchModal: boolean;
  showLinkModal: boolean;
  showSocialModal: boolean;
  showTeamModal: boolean;
  showPlayerModal: boolean;
  showTableModal: boolean;
  setShowYoutubeModal: (show: boolean) => void;
  setShowMatchModal: (show: boolean) => void;
  setShowLinkModal: (show: boolean) => void;
  setShowSocialModal: (show: boolean) => void;
  setShowTeamModal: (show: boolean) => void;
  setShowPlayerModal: (show: boolean) => void;
  setShowTableModal: (show: boolean) => void;
  handleToggleDropdown: (dropdown: ModalType) => void;
  handleAddImage: (url: string, caption?: string, insertAt?: number | null) => void;
  handleAddYoutube: (url: string, caption?: string) => Promise<void>;
  handleAddVideo: (videoUrl: string, caption: string, insertAt?: number | null) => Promise<void>;
  handleAddMatch: (matchId: string, matchData: MatchData) => Promise<void>;
  handleAddLink: (url: string, text?: string) => void;
  handleAddSocialEmbed: (platform: string, url: string) => void;
  handleAddTeam: (team: TeamMapping, league: LeagueInfo) => Promise<void>;
  handleAddPlayer: (player: Player, team: TeamMapping, koreanName?: string) => Promise<void>;
  handleAddTable: (rows: number, cols: number, selectionRange?: { from: number; to: number }) => void;
}

function getSelectionInsertPosition(editor: Editor): number | null {
  return editor.state.selection.to;
}

function findAppendableEntityCardGroup(
  editor: Editor,
  insertAt: number | null
): { pos: number; node: ProseMirrorNode } | null {
  if (insertAt === null || !editor.schema.nodes.entityCardGroup) return null;

  const matches: Array<{ pos: number; node: ProseMirrorNode; distance: number }> = [];
  let closestDistance = Number.POSITIVE_INFINITY;

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== 'entityCardGroup') return true;

    const end = pos + node.nodeSize;
    const containsInsertPosition = insertAt >= pos && insertAt <= end;
    const distanceFromEnd = insertAt - end;
    const isImmediatelyAfter = distanceFromEnd >= 0 && distanceFromEnd <= 4;

    if (containsInsertPosition || isImmediatelyAfter) {
      const distance = Math.abs(distanceFromEnd);
      if (distance < closestDistance) {
        closestDistance = distance;
        matches.unshift({ pos, node, distance });
      }
    }

    return true;
  });

  const closest = matches.sort((left, right) => left.distance - right.distance)[0];
  return closest ? { pos: closest.pos, node: closest.node } : null;
}

function getLegacyEntityCardItem(node: ProseMirrorNode): EntityCardGroupItem | null {
  if (node.type.name === 'teamCard') {
    return {
      type: 'team',
      id: node.attrs.teamId,
      data: node.attrs.teamData,
    };
  }

  if (node.type.name === 'playerCard') {
    return {
      type: 'player',
      id: node.attrs.playerId,
      data: node.attrs.playerData,
    };
  }

  return null;
}

function createEntityCardContent(item: EntityCardGroupItem) {
  if (item.type === 'player') {
    return {
      type: 'playerCard',
      attrs: {
        playerId: item.id,
        playerData: item.data,
      },
    };
  }

  return {
    type: 'teamCard',
    attrs: {
      teamId: item.id,
      teamData: item.data,
    },
  };
}

function findAppendableLegacyEntityCard(
  editor: Editor,
  insertAt: number | null
): { pos: number; node: ProseMirrorNode; item: EntityCardGroupItem } | null {
  if (insertAt === null) return null;

  const matches: Array<{ pos: number; node: ProseMirrorNode; item: EntityCardGroupItem; distance: number }> = [];

  editor.state.doc.descendants((node, pos) => {
    const item = getLegacyEntityCardItem(node);
    if (!item) return true;

    const end = pos + node.nodeSize;
    const containsInsertPosition = insertAt >= pos && insertAt <= end;
    const distanceFromEnd = insertAt - end;
    const isImmediatelyAfter = distanceFromEnd >= 0 && distanceFromEnd <= 4;

    if (containsInsertPosition || isImmediatelyAfter) {
      matches.push({ pos, node, item, distance: Math.abs(distanceFromEnd) });
    }

    return true;
  });

  const closest = matches.sort((left, right) => left.distance - right.distance)[0];
  return closest ? { pos: closest.pos, node: closest.node, item: closest.item } : null;
}

function insertEntityCardGroupItem(editor: Editor, item: EntityCardGroupItem, insertAt: number | null) {
  if (!editor.schema.nodes.entityCardGroup) {
    return false;
  }

  const cardContent = createEntityCardContent(item);
  const targetGroup = findAppendableEntityCardGroup(editor, insertAt);

  if (targetGroup) {
    const groupContentEnd = targetGroup.pos + targetGroup.node.nodeSize - 1;
    const insertionPosition =
      typeof insertAt === 'number' && insertAt > targetGroup.pos && insertAt < groupContentEnd
        ? insertAt
        : groupContentEnd;

    return editor.chain()
      .insertContentAt(insertionPosition, cardContent)
      .focus()
      .run();
  }

  const legacyCard = findAppendableLegacyEntityCard(editor, insertAt);
  if (legacyCard) {
    const groupNode = editor.schema.nodes.entityCardGroup.create({
      layout: 'grid',
      columns: 4,
    }, [
      editor.schema.nodes[legacyCard.item.type === 'player' ? 'playerCard' : 'teamCard'].create(
        legacyCard.item.type === 'player'
          ? { playerId: legacyCard.item.id, playerData: legacyCard.item.data }
          : { teamId: legacyCard.item.id, teamData: legacyCard.item.data }
      ),
      editor.schema.nodes[item.type === 'player' ? 'playerCard' : 'teamCard'].create(
        item.type === 'player'
          ? { playerId: item.id, playerData: item.data }
          : { teamId: item.id, teamData: item.data }
      ),
    ]);
    const transaction = editor.state.tr.replaceWith(
      legacyCard.pos,
      legacyCard.pos + legacyCard.node.nodeSize,
      groupNode
    );

    editor.view.dispatch(transaction);
    editor.chain().focus().setTextSelection(legacyCard.pos + groupNode.nodeSize).run();
    return true;
  }

  return insertContent(editor, [
    {
      type: 'entityCardGroup',
      attrs: {
        layout: 'grid',
        columns: 4,
      },
      content: [cardContent],
    },
    { type: 'paragraph' },
  ], insertAt);
}

function insertContent(
  editor: Editor,
  content: Parameters<Editor['commands']['insertContent']>[0],
  insertAt?: number | null
) {
  if (typeof insertAt === 'number') {
    return editor.chain()
      .insertContentAt(insertAt, content)
      .focus()
      .run();
  }

  const { selection } = editor.state;

  if (selection instanceof NodeSelection) {
    return editor.chain()
      .insertContentAt(selection.to, content)
      .focus()
      .run();
  }

  if (!selection.empty) {
    return editor.chain()
      .insertContentAt(selection.to, content)
      .focus()
      .run();
  }

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

  if (url.includes('youtube.com/shorts/')) {
    const videoId = url.split('youtube.com/shorts/')[1]?.split(/[?&/]/)[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  return url;
}

function isYoutubeShortsUrl(url: string) {
  return /youtube\.com\/shorts\//i.test(url);
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
  const showTableModal = activeModal === 'table';

  const setShowYoutubeModal = useCallback((show: boolean) => setActiveModal(show ? 'youtube' : null), []);
  const setShowMatchModal = useCallback((show: boolean) => setActiveModal(show ? 'match' : null), []);
  const setShowLinkModal = useCallback((show: boolean) => setActiveModal(show ? 'link' : null), []);
  const setShowSocialModal = useCallback((show: boolean) => setActiveModal(show ? 'social' : null), []);
  const setShowTeamModal = useCallback((show: boolean) => setActiveModal(show ? 'team' : null), []);
  const setShowPlayerModal = useCallback((show: boolean) => setActiveModal(show ? 'player' : null), []);
  const setShowTableModal = useCallback((show: boolean) => setActiveModal(show ? 'table' : null), []);

  const handleToggleDropdown = useCallback((dropdown: ModalType) => {
    setActiveModal((prev) => (prev === dropdown ? null : dropdown));
  }, []);

  const handleAddImage = useCallback((url: string, caption?: string, insertAt?: number | null) => {
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
      ], insertAt);

      if (!success) {
        toast.error('이미지를 에디터에 삽입하지 못했습니다.');
        return;
      }

      toast.success('이미지가 추가되었습니다.');
    } catch (error) {
      console.error('?대?吏 異붽? ?ㅻ쪟:', error);
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
        const containerClass = isYoutubeShortsUrl(url) ? 'youtube-container youtube-shorts' : 'youtube-container';
        editor.commands.insertContent(`
          <div class="${containerClass}">
            <iframe src="${embedUrl}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
          </div>
          <p></p>
        `);
      }

      toast.success('YouTube 영상이 추가되었습니다.');
      setShowYoutubeModal(false);
    } catch (error) {
      console.error('YouTube 異붽? ?ㅻ쪟:', error);
      toast.error('YouTube 영상을 추가하는 데 실패했습니다.');
    }
  }, [editor, extensionsLoaded, setShowYoutubeModal]);

  const handleAddVideo = useCallback(async (videoUrl: string, caption = '', insertAt?: number | null) => {
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
        ], insertAt);
      }

      if (!success) {
        const fallbackHtml = `
          <div class="video-wrapper" style="margin: 1rem 0;">
            <video src="${videoUrl}" controls preload="none" style="width: 100%; max-width: 640px; height: auto;" data-caption="${caption || ''}">
              釉뚮씪?곗?媛 鍮꾨뵒?ㅻ? 吏?먰븯吏 ?딆뒿?덈떎.
            </video>
          </div>
          <p></p>
        `;

        if (typeof insertAt === 'number') {
          editor.chain().insertContentAt(insertAt, fallbackHtml).focus().run();
        } else {
          editor.commands.insertContent(fallbackHtml);
        }
      }

      toast.success('동영상이 추가되었습니다.');
    } catch (error) {
      console.error('?숈쁺??異붽? ?ㅻ쪟:', error);
      toast.error('동영상을 추가하는 데 실패했습니다.');
    }
  }, [editor]);

  const handleAddMatch = useCallback(async (matchId: string, matchData: MatchData) => {
    if (!editor) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    const insertAt = getSelectionInsertPosition(editor);

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
        ], insertAt);
      }

      if (!success) {
        editor.commands.insertContent(generateMatchCardHTML(result.data) + '<p></p>');
      }

      setShowMatchModal(false);
      toast.success('경기 결과가 추가되었습니다.');
    } catch (error) {
      console.error('寃쎄린 異붽? ?ㅻ쪟:', error);
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
      console.error('留곹겕 異붽? ?ㅻ쪟:', error);
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
      console.error('?뚯뀥 ?꾨쿋??異붽? ?ㅻ쪟:', error);
      toast.error('소셜 임베드를 추가하는 데 실패했습니다.');
    }
  }, [editor, extensionsLoaded, setShowSocialModal]);

  const handleAddTeam = useCallback(async (team: TeamMapping, league: LeagueInfo) => {
    if (!editor || !extensionsLoaded) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    const insertAt = getSelectionInsertPosition(editor);

    try {
      const result = await createTeamCardData(
        { id: team.id, name_en: team.name_en, name_ko: team.name_ko, logo: team.logo },
        league
      );

      if (!result.success || !result.data) {
        toast.error(result.error || '팀 카드 데이터를 만들지 못했습니다.');
        return;
      }

      let success = insertEntityCardGroupItem(editor, {
        type: 'team',
        id: team.id,
        data: result.data,
      }, insertAt);

      if (!success) {
        success = insertContent(editor, [
          { type: 'teamCard', attrs: { teamId: team.id, teamData: result.data } },
        ], insertAt);
      }

      if (!success) {
        toast.error('팀 카드를 추가하지 못했습니다.');
        return;
      }

      setShowTeamModal(false);
      toast.success('팀 카드가 추가되었습니다.');
    } catch (error) {
      console.error('? 移대뱶 異붽? ?ㅻ쪟:', error);
      toast.error('팀 카드를 추가하는 데 실패했습니다.');
    }
  }, [editor, extensionsLoaded, setShowTeamModal]);

  const handleAddPlayer = useCallback(async (player: Player, team: TeamMapping, koreanName?: string) => {
    if (!editor || !extensionsLoaded) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    const insertAt = getSelectionInsertPosition(editor);

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

      let success = insertEntityCardGroupItem(editor, {
        type: 'player',
        id: player.id,
        data: result.data,
      }, insertAt);

      if (!success) {
        success = insertContent(editor, [
          { type: 'playerCard', attrs: { playerId: player.id, playerData: result.data } },
        ], insertAt);
      }

      if (!success) {
        toast.error('선수 카드를 추가하지 못했습니다.');
        return;
      }

      setShowPlayerModal(false);
      toast.success('선수 카드가 추가되었습니다.');
    } catch (error) {
      console.error('?좎닔 移대뱶 異붽? ?ㅻ쪟:', error);
      toast.error('선수 카드를 추가하는 데 실패했습니다.');
    }
  }, [editor, extensionsLoaded, setShowPlayerModal]);

  const handleAddTable = useCallback((rows: number, cols: number, selectionRange?: { from: number; to: number }) => {
    if (!editor || !extensionsLoaded) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    try {
      if (!editor.schema.nodes.table) {
        toast.error('표 기능이 로드되지 않았습니다.');
        return;
      }

      const tableContent = [
        {
          type: 'table',
          content: Array.from({ length: rows }, () => ({
            type: 'tableRow',
            content: Array.from({ length: cols }, () => ({
              type: 'tableCell',
              content: [{ type: 'paragraph' }],
            })),
          })),
        },
        { type: 'paragraph' },
      ];

      if (selectionRange) {
        const docSize = editor.state.doc.content.size;
        const from = Math.min(Math.max(selectionRange.from, 0), docSize);
        const to = Math.min(Math.max(selectionRange.to, from), docSize);
        editor.commands.setTextSelection({ from, to });
      }

      const { $from } = editor.state.selection;
      let currentTableEnd: number | null = null;

      for (let depth = $from.depth; depth > 0; depth -= 1) {
        if ($from.node(depth).type.name === 'table') {
          currentTableEnd = $from.after(depth);
          break;
        }
      }

      const success = currentTableEnd
        ? editor.chain().focus().insertContentAt(currentTableEnd, tableContent).focus().run()
        : insertContent(editor, tableContent);

      if (!success) {
        toast.error('표를 추가하지 못했습니다.');
        return;
      }

      setShowTableModal(false);
      toast.success(`${rows} x ${cols} 표가 추가되었습니다.`);
    } catch (error) {
      console.error('??異붽? ?ㅻ쪟:', error);
      toast.error('표를 추가하는 데 실패했습니다.');
    }
  }, [editor, extensionsLoaded, setShowTableModal]);

  return {
    showYoutubeModal,
    showMatchModal,
    showLinkModal,
    showSocialModal,
    showTeamModal,
    showPlayerModal,
    showTableModal,
    setShowYoutubeModal,
    setShowMatchModal,
    setShowLinkModal,
    setShowSocialModal,
    setShowTeamModal,
    setShowPlayerModal,
    setShowTableModal,
    handleToggleDropdown,
    handleAddImage,
    handleAddYoutube,
    handleAddVideo,
    handleAddMatch,
    handleAddLink,
    handleAddSocialEmbed,
    handleAddTeam,
    handleAddPlayer,
    handleAddTable,
  };
}

