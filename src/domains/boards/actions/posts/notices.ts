'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getLevelIconUrl } from '@/shared/utils/level-icons-server';
import { formatDate } from '@/shared/utils/date';
import type { Post, NoticeType } from '@/domains/boards/types/post';

/**
 * 공지사항 조회 (전체 공지 + 게시판별 공지)
 * @param boardId - 게시판 ID (없으면 모든 공지 반환)
 * @returns 공지사항 목록
 */
export async function getNotices(boardId?: string): Promise<Post[]> {
  try {
    const supabase = await getSupabaseServer();

    if (!supabase) {
      console.error('Supabase 클라이언트 생성 실패');
      return [];
    }

    // 공지사항 쿼리 시작
    let query = supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        user_id,
        created_at,
        updated_at,
        board_id,
        post_number,
        views,
        likes,
        dislikes,
        is_notice,
        is_must_read,
        notice_type,
        notice_boards,
        notice_order,
        notice_created_at,
        is_hidden,
        is_deleted,
        profiles (
          id,
          nickname,
          level,
          icon_id
        ),
        boards (
          name,
          slug,
          team_id,
          league_id
        ),
        comments!post_id(count)
      `)
      .eq('is_notice', true);

    // 게시판 필터링
    if (boardId) {
      // 특정 게시판: 전체 공지 + 해당 게시판 공지
      // notice_boards 배열에 boardId가 포함되어 있는지 확인
      query = query.or(`notice_type.eq.global,and(notice_type.eq.board,notice_boards.cs.{${boardId}})`);
    }
    // boardId가 없으면 모든 공지 조회 (공지 게시판용)

    // 정렬: is_must_read 내림차순 (필독 우선) → created_at 내림차순 (최신순)
    const { data: noticesData, error } = await query
      .order('is_must_read', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('공지사항 조회 오류:', error);
      return [];
    }

    if (!noticesData || noticesData.length === 0) {
      return [];
    }

    // 타입 안전성을 위한 변환
    const typedNoticesData = noticesData as Array<{
      id: string;
      title?: string;
      content?: any;
      user_id?: string;
      created_at?: string;
      updated_at?: string;
      board_id?: string;
      post_number?: number;
      views?: number;
      likes?: number;
      dislikes?: number;
      is_notice?: boolean;
      is_must_read?: boolean;
      notice_type?: NoticeType;
      notice_boards?: string[] | null;
      notice_order?: number;
      notice_created_at?: string;
      is_hidden?: boolean;
      is_deleted?: boolean;
      profiles?: {
        id?: string;
        nickname?: string;
        level?: number;
        icon_id?: number | null;
      };
      boards?: {
        name?: string;
        slug?: string;
        team_id?: number | null;
        league_id?: number | null;
      };
      comments?: Array<{ count: number }>;
    }>;

    // 사용자 아이콘 정보 가져오기
    const userIconMap: Record<number, string> = {};
    const userIds = typedNoticesData
      .map(post => post.user_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    const userProfileMap: Record<string, { level: number; icon_id: number | null }> = {};

    if (userIds.length > 0) {
      try {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, level, icon_id')
          .in('id', userIds);

        if (profilesData) {
          profilesData.forEach(profile => {
            if (profile.id) {
              userProfileMap[profile.id] = {
                level: profile.level || 1,
                icon_id: profile.icon_id
              };
            }
          });
        }

        const iconIds = profilesData
          ?.map(profile => profile.icon_id)
          .filter(Boolean) as number[] || [];

        if (iconIds.length > 0) {
          const { data: iconsData } = await supabase
            .from('shop_items')
            .select('id, image_url')
            .in('id', iconIds);

          if (iconsData) {
            iconsData.forEach(icon => {
              if (icon.id && icon.image_url) {
                userIconMap[icon.id] = icon.image_url;
              }
            });
          }
        }
      } catch (error) {
        console.error('아이콘 정보 가져오기 오류:', error);
      }
    }

    // Post 타입으로 변환
    const formattedNotices: Post[] = typedNoticesData.map(notice => {
      const profile = notice.profiles;
      const board = notice.boards;
      const userId = notice.user_id;
      const userLevel = profile?.level || 1;

      // 아이콘 URL 결정
      let iconUrl: string | null = null;
      if (userId && userProfileMap[userId]) {
        const userProfile = userProfileMap[userId];
        if (userProfile.icon_id && userIconMap[userProfile.icon_id]) {
          iconUrl = userIconMap[userProfile.icon_id];
        } else {
          iconUrl = getLevelIconUrl(userProfile.level);
        }
      } else if (profile?.icon_id && userIconMap[profile.icon_id]) {
        iconUrl = userIconMap[profile.icon_id];
      } else {
        iconUrl = getLevelIconUrl(userLevel);
      }

      // 제목 처리
      let displayTitle = notice.title || '';
      if (notice.is_deleted) {
        displayTitle = '[삭제된 게시글]';
      } else if (notice.is_hidden) {
        displayTitle = '[숨김 처리된 게시글]';
      }

      return {
        id: notice.id,
        title: displayTitle,
        content: notice.content,
        user_id: userId || '',
        created_at: notice.created_at || null,
        board_id: notice.board_id || null,
        post_number: notice.post_number || 0,
        views: notice.views || 0,
        likes: notice.likes || 0,
        dislikes: notice.dislikes || 0,
        is_notice: notice.is_notice || false,
        is_must_read: notice.is_must_read || false,
        notice_type: notice.notice_type || null,
        notice_boards: notice.notice_boards || null,
        notice_order: notice.notice_order || null,
        notice_created_at: notice.notice_created_at || null,
        is_hidden: notice.is_hidden,
        is_deleted: notice.is_deleted,
        updated_at: notice.updated_at,
        // 공지사항 표시용 추가 필드
        formattedDate: notice.created_at ? formatDate(notice.created_at) : '-',
        board_slug: board?.slug || '',
        board_name: board?.name || '알 수 없는 게시판',
        team_id: board?.team_id || null,
        league_id: board?.league_id || null,
        author_nickname: profile?.nickname || '익명',
        author_icon_url: iconUrl,
        author_level: userLevel,
        comment_count: notice.comments?.[0]?.count || 0,
        profiles: profile ? {
          id: profile.id,
          nickname: profile.nickname || '익명',
          icon_id: profile.icon_id,
          level: userLevel
        } : null,
        board: board ? {
          name: board.name || '알 수 없는 게시판'
        } : null
      } as any; // Post 타입에 없는 필드들이 있으므로 any로 타입 단언
    });

    return formattedNotices;
  } catch (error) {
    console.error('공지사항 조회 중 오류:', error);
    return [];
  }
}

/**
 * 전체 공지만 조회
 */
export async function getGlobalNotices(): Promise<Post[]> {
  try {
    const supabase = await getSupabaseServer();

    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        user_id,
        created_at,
        updated_at,
        board_id,
        post_number,
        views,
        likes,
        dislikes,
        is_notice,
        is_must_read,
        notice_type,
        notice_boards,
        notice_order,
        notice_created_at,
        is_hidden,
        is_deleted,
        profiles (
          id,
          nickname,
          level,
          icon_id
        ),
        boards (
          name,
          slug,
          team_id,
          league_id
        ),
        comments!post_id(count)
      `)
      .eq('is_notice', true)
      .eq('notice_type', 'global')
      .order('is_must_read', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('전체 공지 조회 오류:', error);
      return [];
    }

    // 동일한 포맷팅 로직 적용
    return data as Post[];
  } catch (error) {
    console.error('전체 공지 조회 중 오류:', error);
    return [];
  }
}

/**
 * 특정 게시판 공지만 조회
 * @param boardId - 게시판 ID
 * @returns 해당 게시판 공지 목록 (notice_boards 배열에 boardId가 포함된 공지)
 */
export async function getBoardNotices(boardId: string): Promise<Post[]> {
  try {
    const supabase = await getSupabaseServer();

    if (!supabase) {
      return [];
    }

    // notice_boards 배열에 boardId가 포함되어 있는지 확인 (PostgreSQL contains operator)
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        user_id,
        created_at,
        updated_at,
        board_id,
        post_number,
        views,
        likes,
        dislikes,
        is_notice,
        is_must_read,
        notice_type,
        notice_boards,
        notice_order,
        notice_created_at,
        is_hidden,
        is_deleted,
        profiles (
          id,
          nickname,
          level,
          icon_id
        ),
        boards (
          name,
          slug,
          team_id,
          league_id
        ),
        comments!post_id(count)
      `)
      .eq('is_notice', true)
      .eq('notice_type', 'board')
      .contains('notice_boards', [boardId])
      .order('is_must_read', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('게시판 공지 조회 오류:', error);
      return [];
    }

    return data as Post[];
  } catch (error) {
    console.error('게시판 공지 조회 중 오류:', error);
    return [];
  }
}
