'use server';

/**
 * 서버 컴포넌트 전용 API 유틸리티
 * 클라이언트 컴포넌트에서 직접 호출하지 마세요.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/app/lib/database.types';

// 서버 컴포넌트에서 Supabase 클라이언트 생성
async function createServerComponentClient() {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set(name, value, options);
        },
        remove(name, options) {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
}

// 서버 컴포넌트에서 현재 인증된 사용자 가져오기
async function getAuthenticatedUser() {
  try {
    const supabase = await createServerComponentClient();
    
    // 세션 데이터 조회
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('사용자 인증 정보 확인 중 오류:', error);
    return null;
  }
}

/**
 * 사용자의 포인트 정보 및 포인트 내역을 가져오는 함수
 */
export async function getUserPointsData() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { points: 0, pointHistory: [], error: '로그인이 필요합니다.' };
    }

    const supabase = await createServerComponentClient();
    
    // 프로필에서 포인트 정보 가져오기
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      console.error('프로필 데이터 조회 오류 상세:', profileError.message, profileError.details);
      if (profileError.code === 'PGRST116') {
        // 프로필이 없는 경우 생성 시도
        try {
          await supabase.from('profiles').insert({
            id: user.id,
            exp: 0,
            level: 1,
            points: 0
          });
        } catch (insertError) {
          console.error('프로필 생성 실패:', insertError);
        }
      }
      
      // 기본값 설정
      return { points: 0, pointHistory: [], error: null };
    }
    
    const currentPoints = profileData?.points || 0;
    
    // 포인트 내역 조회
    let pointHistory = [];
    try {
      // 먼저 RPC 함수로 조회 시도
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_point_history', { 
          user_id: user.id 
        });
        
      if (!rpcError && rpcData) {
        pointHistory = rpcData;
      } else {
        // RPC 함수가 없으면 일반 쿼리로 시도
        const { data, error: historyError } = await supabase
          .from('point_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (historyError) {
          console.error('포인트 내역 조회 오류 상세:', historyError.message, historyError.details);
          return { points: currentPoints, pointHistory: [], error: '포인트 내역을 불러올 수 없습니다.' };
        }
        
        pointHistory = data || [];
      }
    } catch (historyQueryError) {
      console.error('포인트 내역 조회 중 예외 발생:', historyQueryError);
      return { points: currentPoints, pointHistory: [], error: '포인트 내역 조회 중 오류가 발생했습니다.' };
    }
    
    return { points: currentPoints, pointHistory, error: null };
  } catch (error) {
    console.error('포인트 데이터 로딩 오류 상세:', error);
    return { points: 0, pointHistory: [], error: '포인트 정보를 불러오는 중 오류가 발생했습니다.' };
  }
}

/**
 * 사용자의 경험치 정보 및 내역을 가져오는 함수
 */
export async function getUserExpData() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { exp: 0, level: 1, expPercentage: 0, nextLevelExp: 100, expHistory: [], error: '로그인이 필요합니다.' };
    }

    const supabase = await createServerComponentClient();
    
    // 프로필에서 경험치와 레벨 정보 가져오기
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('exp, level')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      console.error('프로필 데이터 조회 오류:', profileError);
      if (profileError.code === 'PGRST116') {
        // 프로필이 없는 경우 생성 시도
        try {
          await supabase.from('profiles').insert({
            id: user.id,
            exp: 0,
            level: 1,
            points: 0
          });
        } catch (insertError) {
          console.error('프로필 생성 실패:', insertError);
        }
      }
      
      // 기본값 설정
      return {
        exp: 0,
        level: 1,
        expPercentage: 0,
        nextLevelExp: 100,
        expHistory: [],
        error: null
      };
    }
    
    // 상태 계산
    const currentExp = profileData?.exp || 0;
    const currentLevel = profileData?.level || 1;
    
    // 다음 레벨에 필요한 경험치 계산 (간단한 공식 예시)
    const requiredExp = currentLevel * 100;
    
    // 현재 레벨에서의 최소 경험치
    const currentLevelMinExp = (currentLevel - 1) * 100;
    
    // 경험치 퍼센트 계산
    const expInCurrentLevel = currentExp - currentLevelMinExp;
    const expNeededForNextLevel = requiredExp - currentLevelMinExp;
    const percentage = Math.min(Math.round((expInCurrentLevel / expNeededForNextLevel) * 100), 100);
    
    // exp_history 테이블이 없는 경우를 대비한 조회
    let historyData = [];
    try {
      const { data, error: historyError } = await supabase
        .from('exp_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (!historyError && data) {
        historyData = data;
      } else if (historyError && historyError.code !== 'PGRST116') {
        console.error('경험치 내역 조회 오류:', historyError);
      }
    } catch (historyQueryError) {
      console.error('경험치 내역 조회 중 오류:', historyQueryError);
    }
    
    return {
      exp: currentExp,
      level: currentLevel,
      expPercentage: percentage,
      nextLevelExp: requiredExp,
      expHistory: historyData,
      error: null
    };
  } catch (error) {
    console.error('경험치 데이터 로딩 오류:', error);
    return {
      exp: 0,
      level: 1,
      expPercentage: 0,
      nextLevelExp: 100,
      expHistory: [],
      error: '경험치 정보를 불러오는 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 사용자가 작성한 게시글 목록을 가져오는 함수
 */
export async function getUserPosts(page = 1, postsPerPage = 10) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { posts: [], totalPosts: 0, totalPages: 0, error: '로그인이 필요합니다.' };
    }

    const supabase = await createServerComponentClient();
    
    // 총 게시글 수 가져오기
    const { count, error: countError } = await supabase
      .from('posts')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);
      
    if (countError) {
      return { posts: [], totalPosts: 0, totalPages: 0, error: '게시글 수를 조회할 수 없습니다.' };
    }
    
    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / postsPerPage));
    
    // 페이지네이션된 게시글 가져오기
    const from = (page - 1) * postsPerPage;
    const to = from + postsPerPage - 1;
    
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        id, 
        title,
        created_at,
        board_id
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (postsError) {
      return { posts: [], totalPosts: total, totalPages, error: '게시글을 불러올 수 없습니다.' };
    }
    
    if (!postsData || postsData.length === 0) {
      return { posts: [], totalPosts: total, totalPages, error: null };
    }
    
    // 게시판 정보 가져오기
    const boardIds = [...new Set(postsData.map(post => post.board_id))];
    const { data: boardsData, error: boardsError } = await supabase
      .from('boards')
      .select('id, name, slug')
      .in('id', boardIds);
      
    if (boardsError) {
      return { posts: [], totalPosts: total, totalPages, error: '게시판 정보를 불러올 수 없습니다.' };
    }
    
    // 게시판 정보 매핑
    const boardsMap = new Map();
    if (boardsData) {
      boardsData.forEach(board => {
        boardsMap.set(board.id, { name: board.name, slug: board.slug });
      });
    }
    
    // 게시글 ID 목록
    const postIds = postsData.map(post => post.id);
    
    // 각 게시글의 댓글 수 가져오기
    const commentCountPromises = postIds.map(postId => 
      supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('post_id', postId)
    );
    
    const commentCountResults = await Promise.all(commentCountPromises);
    
    // 댓글 수 매핑
    const commentCountsMap = new Map();
    commentCountResults.forEach((result, index) => {
      commentCountsMap.set(postIds[index], result.count || 0);
    });
    
    // 게시글에 게시판 정보와 댓글 수 추가
    const transformedPosts = postsData.map(post => {
      const boardInfo = boardsMap.get(post.board_id) || {};
      return {
        ...post,
        board_name: boardInfo.name || '알 수 없는 게시판',
        board_slug: boardInfo.slug || '',
        comment_count: commentCountsMap.get(post.id) || 0
      };
    });
    
    return { posts: transformedPosts, totalPosts: total, totalPages, error: null };
  } catch (error) {
    console.error('게시글 데이터 로딩 오류:', error);
    return { posts: [], totalPosts: 0, totalPages: 0, error: '게시글을 불러오는 중 오류가 발생했습니다.' };
  }
}

/**
 * 사용자가 작성한 댓글 목록을 가져오는 함수
 */
export async function getUserComments(page = 1, commentsPerPage = 10) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { comments: [], totalComments: 0, totalPages: 0, error: '로그인이 필요합니다.' };
    }

    const supabase = await createServerComponentClient();
    
    // 총 댓글 수 가져오기
    const { count, error: countError } = await supabase
      .from('comments')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);
      
    if (countError) {
      return { comments: [], totalComments: 0, totalPages: 0, error: '댓글 수를 조회할 수 없습니다.' };
    }
    
    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / commentsPerPage));
    
    // 페이지네이션된 댓글 가져오기
    const from = (page - 1) * commentsPerPage;
    const to = from + commentsPerPage - 1;
    
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select(`
        id, 
        content,
        created_at,
        post_id
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (commentsError) {
      return { comments: [], totalComments: total, totalPages, error: '댓글을 불러올 수 없습니다.' };
    }
    
    if (!commentsData || commentsData.length === 0) {
      return { comments: [], totalComments: total, totalPages, error: null };
    }
    
    // 게시글 ID 목록
    const postIds = [...new Set(commentsData.map(comment => comment.post_id))];
    
    // 게시글 정보 가져오기
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('id, title, board_id')
      .in('id', postIds);
      
    if (postsError) {
      return { comments: [], totalComments: total, totalPages, error: '게시글 정보를 불러올 수 없습니다.' };
    }
    
    // 게시글 정보 매핑
    const postsMap = new Map();
    if (postsData) {
      postsData.forEach(post => {
        postsMap.set(post.id, { title: post.title, board_id: post.board_id });
      });
      
      // 게시판 ID 목록
      const boardIds = [...new Set(postsData.map(post => post.board_id))];
      
      // 게시판 정보 가져오기
      const { data: boardsData, error: boardsError } = await supabase
        .from('boards')
        .select('id, name, slug')
        .in('id', boardIds);
        
      if (boardsError) {
        return { comments: [], totalComments: total, totalPages, error: '게시판 정보를 불러올 수 없습니다.' };
      }
      
      // 게시판 정보 매핑
      const boardsMap = new Map();
      if (boardsData) {
        boardsData.forEach(board => {
          boardsMap.set(board.id, { name: board.name, slug: board.slug });
        });
      }
      
      // 댓글에 게시글 제목과 게시판 정보 추가
      const transformedComments = commentsData.map(comment => {
        const postInfo = postsMap.get(comment.post_id) || {};
        const boardInfo = boardsMap.get(postInfo.board_id) || {};
        
        return {
          ...comment,
          post_title: postInfo.title || '삭제된 게시글',
          board_id: postInfo.board_id,
          board_name: boardInfo.name || '알 수 없는 게시판',
          board_slug: boardInfo.slug || ''
        };
      });
      
      return { comments: transformedComments, totalComments: total, totalPages, error: null };
    } else {
      // 게시글 정보를 가져오지 못한 경우
      const transformedComments = commentsData.map(comment => ({
        ...comment,
        post_title: '삭제된 게시글',
        board_name: '알 수 없는 게시판'
      }));
      
      return { comments: transformedComments, totalComments: total, totalPages, error: null };
    }
  } catch (error) {
    console.error('댓글 데이터 로딩 오류:', error);
    return { comments: [], totalComments: 0, totalPages: 0, error: '댓글을 불러오는 중 오류가 발생했습니다.' };
  }
}

/**
 * 사용자의 프로필 아이콘 목록을 가져오는 함수
 */
export async function getUserIcons() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { icons: [], error: '로그인이 필요합니다.' };
    }

    const supabase = await createServerComponentClient();
    
    // 사용자 아이콘 목록 가져오기
    const { data, error } = await supabase
      .from('user_icons')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('아이콘 목록 조회 오류:', error);
      return { icons: [], error: '아이콘 목록을 불러올 수 없습니다.' };
    }
    
    return { icons: data || [], error: null };
  } catch (error) {
    console.error('아이콘 데이터 로딩 오류:', error);
    return { icons: [], error: '아이콘 정보를 불러오는 중 오류가 발생했습니다.' };
  }
} 