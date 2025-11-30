'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { cache } from 'react';
import { HeaderUserData } from './types/header';
import { Board } from './types/board';

/**
 * 헤더에 표시할 사용자 데이터를 서버에서 미리 로드
 * 캐싱을 적용하여 성능 최적화
 */
export const getHeaderUserData = cache(async (): Promise<HeaderUserData | null> => {
  try {
    const supabase = await getSupabaseServer();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }
    
    // 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nickname, email, level, exp, points, icon_id, is_admin')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      console.error('프로필 정보 조회 오류:', profileError);
      return null;
    }
    
    // 아이콘 정보 가져오기 (icon_id가 있는 경우만)
    let iconInfo: { iconUrl: string; iconName: string } | null = null;
    
    if (profile.icon_id) {
      try {
        const { data: iconData } = await supabase
          .from('shop_items')
          .select('image_url, name')
          .eq('id', profile.icon_id)
          .single();
        
        if (iconData && iconData.image_url) {
          iconInfo = {
            iconUrl: iconData.image_url,
            iconName: iconData.name || ''
          };
        }
      } catch {
        // 아이콘 정보를 가져올 수 없어도 계속 진행
      }
    }
    
    return {
      id: profile.id,
      nickname: profile.nickname || '사용자',
      email: profile.email || user.email || null,
      level: profile.level || 1,
      exp: profile.exp || 0,
      points: profile.points || 0,
      iconInfo,
      isAdmin: profile.is_admin || false
    };
    
  } catch (error) {
    console.error('헤더 사용자 데이터 로드 오류:', error);
    return null;
  }
});

/**
 * 헤더 네비게이션용 게시판 데이터를 서버에서 미리 로드
 * 캐싱을 적용하여 성능 최적화
 */
export const getBoardsForNavigation = cache(async (): Promise<{
  boardData: Board[];
  isAdmin: boolean;
}> => {
  try {
    const supabase = await getSupabaseServer();
    
    // 현재 사용자의 관리자 권한 확인
    let isAdmin = false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        isAdmin = profile?.is_admin || false;
      }
    } catch {
      // 관리자 권한 확인 실패해도 계속 진행
    }
    
    // 게시판 데이터 가져오기
    const { data: boards, error } = await supabase
      .from('boards')
      .select('id, name, parent_id, display_order, slug, team_id, league_id')
      .order('display_order', { ascending: true })
      .order('name');
    
    if (error) {
      console.error('게시판 데이터 조회 오류:', error);
      return { boardData: [], isAdmin };
    }
    
    // 계층 구조로 변환
    const boardMap = new Map<string, Board>();
    const rootBoards: Board[] = [];
    
    // 1단계: 모든 게시판을 맵에 저장
    boards.forEach(board => {
      boardMap.set(board.id, {
        ...board,
        display_order: board.display_order || 0,
        children: []
      });
    });
    
    // 2단계: 부모-자식 관계 설정
    boards.forEach(board => {
      const boardWithChildren = boardMap.get(board.id)!;
      
      if (board.parent_id) {
        const parent = boardMap.get(board.parent_id);
        if (parent && parent.children) {
          parent.children.push(boardWithChildren);
        }
      } else {
        rootBoards.push(boardWithChildren);
      }
    });
    
    // 3단계: 각 레벨에서 정렬
    const sortBoards = (boards: Board[]) => {
      boards.sort((a, b) => a.display_order - b.display_order);
      boards.forEach(board => {
        if (board.children && board.children.length > 0) {
          sortBoards(board.children);
        }
      });
    };
    
    sortBoards(rootBoards);
    
    return { boardData: rootBoards, isAdmin };
    
  } catch (error) {
    console.error('게시판 데이터 로드 오류:', error);
    return { boardData: [], isAdmin: false };
  }
}); 