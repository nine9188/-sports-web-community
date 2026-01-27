/**
 * 게시글 content JSON에서 카드 노드를 추출하여
 * post_card_links 테이블에 저장할 데이터 배열을 반환
 */

interface CardLink {
  card_type: 'match' | 'team' | 'player';
  match_id?: string;
  team_id?: number;
  player_id?: number;
}

interface TiptapNode {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
}

/**
 * Tiptap JSON content에서 매치/팀/선수 카드 링크를 추출
 */
export function extractCardLinks(content: unknown): CardLink[] {
  if (!content || typeof content !== 'object') return [];

  const doc = content as TiptapNode;
  const links: CardLink[] = [];
  const seen = new Set<string>();

  function addLink(link: CardLink) {
    // 중복 방지 키 생성
    const key = `${link.card_type}-${link.match_id ?? ''}-${link.team_id ?? ''}-${link.player_id ?? ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    links.push(link);
  }

  function traverse(node: TiptapNode) {
    if (!node) return;

    if (node.type === 'matchCard' && node.attrs) {
      const matchData = node.attrs.matchData as {
        id?: number | string;
        teams?: {
          home?: { id?: number };
          away?: { id?: number };
        };
      } | null;
      // matchId가 null일 수 있으므로 matchData.id를 fallback으로 사용
      const matchId = String(node.attrs.matchId ?? matchData?.id ?? '');

      if (matchId) {
        // 매치 자체 링크
        addLink({ card_type: 'match', match_id: matchId });

        // 홈팀 링크
        const homeId = matchData?.teams?.home?.id;
        if (homeId) {
          addLink({ card_type: 'team', match_id: matchId, team_id: homeId });
        }

        // 원정팀 링크
        const awayId = matchData?.teams?.away?.id;
        if (awayId) {
          addLink({ card_type: 'team', match_id: matchId, team_id: awayId });
        }
      }
    }

    if (node.type === 'teamCard' && node.attrs) {
      const teamId = Number(node.attrs.teamId);
      if (teamId) {
        addLink({ card_type: 'team', team_id: teamId });
      }
    }

    if (node.type === 'playerCard' && node.attrs) {
      const playerId = Number(node.attrs.playerId);
      const playerData = node.attrs.playerData as {
        team?: { id?: number };
      } | null;
      const teamId = playerData?.team?.id;

      if (playerId) {
        addLink({
          card_type: 'player',
          team_id: teamId || undefined,
          player_id: playerId,
        });
      }
    }

    // 재귀 탐색
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        traverse(child);
      }
    }
  }

  traverse(doc);
  return links;
}
