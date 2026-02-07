'use server';

import { getPlayerPhotoUrl, getTeamLogoUrl } from '@/domains/livescore/actions/images';

interface PlayerInfo {
  id: number;
  name: string;
  photo?: string;
  position?: string;
  number?: number;
}

interface TeamInfo {
  id: number;
  name_en: string;
  name_ko?: string;
  logo?: string;
}

export interface PlayerCardDataResult {
  success: boolean;
  data?: {
    id: number;
    name: string;
    koreanName: string;
    photo: string;
    position?: string;
    number?: number;
    team: {
      id: number;
      name: string;
      koreanName?: string;
      logo: string;
    };
  };
  error?: string;
}

/**
 * 에디터 선수 카드 데이터 생성 (4590 표준)
 *
 * - 서버에서 Storage URL 확정
 * - 클라이언트에서 API-Sports URL 사용 방지
 *
 * @param player - 선수 정보
 * @param team - 팀 정보
 * @param koreanName - 한글 이름 (선택)
 */
export async function createPlayerCardData(
  player: PlayerInfo,
  team: TeamInfo,
  koreanName?: string
): Promise<PlayerCardDataResult> {
  try {
    if (!player?.id) {
      return { success: false, error: '선수 ID가 필요합니다' };
    }

    // Storage URL 조회 (4590 표준)
    const [photoUrl, teamLogoUrl] = await Promise.all([
      getPlayerPhotoUrl(player.id),
      getTeamLogoUrl(team.id),
    ]);

    return {
      success: true,
      data: {
        id: player.id,
        name: player.name,
        koreanName: koreanName || player.name,
        photo: photoUrl,
        position: player.position,
        number: player.number,
        team: {
          id: team.id,
          name: team.name_en,
          koreanName: team.name_ko,
          logo: teamLogoUrl,
        },
      },
    };
  } catch (error) {
    console.error('[createPlayerCardData] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}
