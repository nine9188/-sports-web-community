'use server'

import { searchTeams } from './searchTeams'
import { searchPlayers } from './searchPlayers'
import { getPlayerPhotoUrls, PLACEHOLDER_URLS } from '@/domains/livescore/actions/images'
import type { TeamCardData } from '@/shared/types/teamCard'
import type { PlayerCardData } from '@/shared/types/playerCard'

export type EntityType = 'team' | 'player'

// 자동완성 드롭다운에 표시될 검색 결과
export interface EntitySearchResult {
  type: EntityType
  id: string | number
  name: string
  koreanName?: string
  imageUrl?: string
  subtitle: string // "프리미어리그" or "토트넘 | FW"
  // 카드 생성에 필요한 전체 데이터
  cardData: TeamCardData | PlayerCardData
}

export interface SearchEntitiesOptions {
  limit?: number
  types?: EntityType[]
}

/**
 * 팀/선수 통합 검색 (에디터 멘션용)
 */
export async function searchEntities(
  query: string,
  options: SearchEntitiesOptions = {}
): Promise<EntitySearchResult[]> {
  const { limit = 8, types = ['team', 'player'] } = options

  if (!query.trim() || query.trim().length < 1) {
    return []
  }

  try {
    const results: EntitySearchResult[] = []
    const halfLimit = Math.ceil(limit / 2)

    // 병렬로 검색 실행
    const promises: Promise<void>[] = []

    // 팀 검색
    if (types.includes('team')) {
      promises.push(
        searchTeams({ query, limit: halfLimit }).then(({ teams }) => {
          teams.forEach(team => {
            results.push({
              type: 'team',
              id: team.team_id,
              name: team.name,
              koreanName: team.name_ko || team.display_name,
              imageUrl: team.logo_url || `https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/teams/${team.team_id}.png`,
              subtitle: team.league_name_ko || team.league_name,
              cardData: {
                id: team.team_id,
                name: team.name,
                koreanName: team.name_ko || team.display_name,
                logo: team.logo_url || `https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/teams/${team.team_id}.png`,
                league: {
                  id: team.league_id,
                  name: team.league_name,
                  koreanName: team.league_name_ko
                },
                country: team.country,
                venue: team.venue_name || undefined,
                currentPosition: team.current_position
              } as TeamCardData
            })
          })
        })
      )
    }

    // 선수 검색 (4590 표준: Storage URL 사용)
    if (types.includes('player')) {
      promises.push(
        searchPlayers({ query, limit: halfLimit }).then(async ({ players }) => {
          // 배치로 Storage URL 조회
          const playerIds = players.map(p => p.player_id).filter(Boolean)
          const playerPhotos = await getPlayerPhotoUrls(playerIds)

          players.forEach(player => {
            const positionText = player.position ? player.position : ''
            const teamText = player.team_name_ko || player.team_name
            const subtitle = positionText ? `${teamText} | ${positionText}` : teamText
            const photoUrl = playerPhotos[player.player_id] || PLACEHOLDER_URLS.player_photo

            results.push({
              type: 'player',
              id: player.player_id,
              name: player.name,
              koreanName: player.korean_name || player.display_name,
              imageUrl: photoUrl,
              subtitle,
              cardData: {
                id: player.player_id,
                name: player.name,
                koreanName: player.korean_name || player.display_name,
                photo: photoUrl,
                team: {
                  id: player.team_id,
                  name: player.team_name,
                  koreanName: player.team_name_ko,
                  logo: player.team_logo_url || `https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/teams/${player.team_id}.png`
                },
                position: player.position,
                number: player.number,
                age: player.age
              } as PlayerCardData
            })
          })
        })
      )
    }

    await Promise.all(promises)

    // 정렬: 검색어와 정확히 일치하는 것 우선, 한국어 이름이 있는 것 우선
    const searchLower = query.toLowerCase()
    results.sort((a, b) => {
      // 정확히 일치하는 경우 우선
      const aExact = (a.koreanName?.toLowerCase() === searchLower) || (a.name?.toLowerCase() === searchLower)
      const bExact = (b.koreanName?.toLowerCase() === searchLower) || (b.name?.toLowerCase() === searchLower)
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1

      // 한국어 이름이 있는 경우 우선
      if (a.koreanName && !b.koreanName) return -1
      if (!a.koreanName && b.koreanName) return 1

      // 팀보다 선수 우선 (@ 멘션은 보통 선수를 검색)
      if (a.type === 'player' && b.type === 'team') return -1
      if (a.type === 'team' && b.type === 'player') return 1

      return 0
    })

    return results.slice(0, limit)

  } catch (error) {
    console.error('통합 검색 실패:', error)
    return []
  }
}

/**
 * 인기 엔티티 목록 (검색 전 표시용)
 * - 4590 표준: Storage URL 사용
 */
export async function getPopularEntities(limit: number = 8): Promise<EntitySearchResult[]> {
  // 인기 선수 ID 목록
  const popularPlayerIds = [306, 1485] // 손흥민, 김민재

  // 배치로 Storage URL 조회
  const playerPhotos = await getPlayerPhotoUrls(popularPlayerIds)

  // 인기 팀/선수 하드코딩 (빠른 응답용)
  const popularEntities: EntitySearchResult[] = [
    {
      type: 'player',
      id: 306,
      name: 'Son Heung-Min',
      koreanName: '손흥민',
      imageUrl: playerPhotos[306] || PLACEHOLDER_URLS.player_photo,
      subtitle: '토트넘 | FW',
      cardData: {
        id: 306,
        name: 'Son Heung-Min',
        koreanName: '손흥민',
        photo: playerPhotos[306] || PLACEHOLDER_URLS.player_photo,
        team: { id: 47, name: 'Tottenham', koreanName: '토트넘', logo: 'https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/teams/47.png' },
        position: 'Attacker',
        number: 7
      } as PlayerCardData
    },
    {
      type: 'player',
      id: 1485,
      name: 'Kim Min-Jae',
      koreanName: '김민재',
      imageUrl: playerPhotos[1485] || PLACEHOLDER_URLS.player_photo,
      subtitle: '바이에른 뮌헨 | DF',
      cardData: {
        id: 1485,
        name: 'Kim Min-Jae',
        koreanName: '김민재',
        photo: playerPhotos[1485] || PLACEHOLDER_URLS.player_photo,
        team: { id: 157, name: 'Bayern Munich', koreanName: '바이에른 뮌헨', logo: 'https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/teams/157.png' },
        position: 'Defender',
        number: 3
      } as PlayerCardData
    },
    {
      type: 'team',
      id: 47,
      name: 'Tottenham',
      koreanName: '토트넘',
      imageUrl: 'https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/teams/47.png',
      subtitle: '프리미어리그',
      cardData: {
        id: 47,
        name: 'Tottenham',
        koreanName: '토트넘',
        logo: 'https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/teams/47.png',
        league: { id: 39, name: 'Premier League', koreanName: '프리미어리그' },
        country: 'England'
      } as TeamCardData
    },
    {
      type: 'team',
      id: 541,
      name: 'Real Madrid',
      koreanName: '레알 마드리드',
      imageUrl: 'https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/teams/541.png',
      subtitle: '라리가',
      cardData: {
        id: 541,
        name: 'Real Madrid',
        koreanName: '레알 마드리드',
        logo: 'https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/teams/541.png',
        league: { id: 140, name: 'La Liga', koreanName: '라리가' },
        country: 'Spain'
      } as TeamCardData
    }
  ]

  return popularEntities.slice(0, limit)
}
