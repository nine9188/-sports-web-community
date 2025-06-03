'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { HeaderUserData } from './types/header';
import { Board } from './types/board';

/**
 * 헤더 네비게이션에 표시할 게시판 데이터를 가져오는 서버 액션
 */
export async function getBoardsForNavigation(): Promise<{
  boardData: Board[];
  isAdmin: boolean;
  success: boolean;
}> {
  try {
    // 서버 컴포넌트에서 직접 데이터 가져오기
    const supabase = await createClient();
    
    // 사용자 정보 가져오기 (관리자 여부 확인용)
    const { data: { user } } = await supabase.auth.getUser();
    let isAdmin = false;
    
    if (user) {
      // 프로필에서 is_admin 필드 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      isAdmin = profile?.is_admin === true || 
                user.user_metadata?.role === 'admin' || 
                user.email === process.env.ADMIN_EMAIL;
    }
    
    // 최상위 게시판 가져오기
    let rootBoards: Board[] = [];
    
    // 모든 게시판 가져오기
    const { data: allBoards, error } = await supabase
      .from('boards')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) {
      console.error('게시판 데이터 가져오기 오류:', error);
      throw error;
    }
    
    if (allBoards && allBoards.length > 0) {
      // 최상위 게시판만 필터링
      const parentBoards = allBoards.filter(board => !board.parent_id);
      
      // 하위 게시판 찾아서 연결
      rootBoards = parentBoards.map(parent => {
        const children = allBoards.filter(board => board.parent_id === parent.id);
        
        return {
          id: parent.id,
          name: parent.name || '게시판',
          slug: parent.slug,
          display_order: parent.display_order || 0,
          parent_id: parent.parent_id,
          children: children.map(child => {
            // 2단계 하위 게시판 찾기
            const subChildren = allBoards.filter(board => board.parent_id === child.id);
            
            return {
              id: child.id,
              name: child.name || '게시판',
              slug: child.slug,
              display_order: child.display_order || 0,
              parent_id: child.parent_id,
              children: subChildren.length > 0 ? subChildren.map(subChild => ({
                id: subChild.id,
                name: subChild.name || '게시판',
                slug: subChild.slug,
                display_order: subChild.display_order || 0,
                parent_id: subChild.parent_id
              })) : undefined
            };
          })
        };
      });
    }
    
    return {
      boardData: rootBoards,
      isAdmin,
      success: true
    };
  } catch (error) {
    console.error('게시판 데이터 처리 오류:', error);
    // 오류가 발생해도 빈 배열 반환하여 UI가 깨지지 않도록 함
    return {
      boardData: [],
      isAdmin: false,
      success: false
    };
  }
}

/**
 * 헤더에 표시할 사용자 정보를 가져오는 서버 액션
 */
export async function getHeaderUserData(): Promise<HeaderUserData | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    // 아이콘 정보를 서버에서 빠르게 가져오기
    const iconInfo = {
      iconId: null as number | null,
      iconUrl: '',
      iconName: ''
    };
    
    // 프로필 정보 조회 (is_admin 필드 포함)
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname, icon_id, level, exp, is_admin')
      .eq('id', user.id)
      .single();
    
    if (profile?.icon_id) {
      iconInfo.iconId = profile.icon_id;
      
      // 아이콘 정보는 icon_purchases 테이블에서 조회하거나 기본값 사용
      try {
        const { data: iconPurchase } = await supabase
          .from('icon_purchases')
          .select('shop_items(name, image_url)')
          .eq('user_id', user.id)
          .eq('item_id', profile.icon_id)
          .single();
          
        if (iconPurchase?.shop_items) {
          const shopItem = iconPurchase.shop_items as { name?: string; image_url?: string };
          iconInfo.iconUrl = shopItem.image_url || '';
          iconInfo.iconName = shopItem.name || '기본 아이콘';
        }
      } catch (iconError) {
        console.log('아이콘 정보 조회 실패, 기본값 사용:', iconError);
        // 아이콘 정보를 가져올 수 없는 경우 기본값 유지
      }
    }
    
    // 기본 사용자 데이터 구성
    const userData: HeaderUserData = {
      id: user.id,
      email: user.email || '',
      nickname: profile?.nickname || user.user_metadata?.nickname || '사용자',
      isAdmin: profile?.is_admin === true || 
               user.user_metadata?.role === 'admin' || 
               user.email === process.env.ADMIN_EMAIL,
      level: profile?.level || user.user_metadata?.level || 1,
      iconInfo
    };
    
    return userData;
  } catch (error) {
    console.error('헤더 사용자 데이터 가져오기 오류:', error);
    return null;
  }
} 