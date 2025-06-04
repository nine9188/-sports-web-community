'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { revalidatePath } from 'next/cache';
import { rewardUserActivity, getActivityTypeValues } from '@/shared/actions/activity-actions';
import { checkSuspensionGuard } from '@/shared/utils/suspension-guard';

/**
 * 게시글 생성 서버 액션 (매개변수 사용)
 */
export async function createPostWithParams(
  title: string,
  content: string,
  boardId: string,
  userId: string
) {
  if (!title || !content || !boardId || !userId) {
    return {
      success: false,
      error: '필수 입력값이 누락되었습니다.'
    };
  }
  
  try {
    // 계정 정지 상태 확인
    const suspensionCheck = await checkSuspensionGuard(userId);
    if (suspensionCheck.isSuspended) {
      return {
        success: false,
        error: suspensionCheck.message || '계정이 정지되어 게시글을 작성할 수 없습니다.'
      };
    }
    
    const supabase = await createClient();
    
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase 클라이언트 초기화 오류'
      };
    }
    
    // 게시판 정보 가져오기
    const { data: boardData, error: boardQueryError } = await supabase
      .from('boards')
      .select('name, slug')
      .eq('id', boardId)
      .single();
    
    if (boardQueryError) {
      return {
        success: false,
        error: `게시판 정보 조회 실패: ${boardQueryError.message}`
      };
    }
    
    if (!boardData) {
      return {
        success: false,
        error: '게시판 정보를 찾을 수 없습니다.'
      };
    }
    
    // 게시글 생성
    // 트리거 함수가 post_number를 할당 후에 전체 레코드를 반환하게 하여
    // 추가 쿼리 없이 post_number를 바로 얻을 수 있게 함
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title: title.trim(),
        content,
        user_id: userId,
        board_id: boardId,
        category: boardData.name || '',
        views: 0,
        likes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'published'
      })
      .select('id, post_number')
      .single();
    
    if (error) {
      return {
        success: false,
        error: `게시글 생성 실패: ${error.message}`
      };
    }
    
    if (!data) {
      return {
        success: false,
        error: '게시글 생성은 되었으나 데이터를 받아오지 못했습니다.'
      };
    }
    
    return {
      success: true,
      postId: data.id,
      postNumber: data.post_number,
      boardSlug: boardData.slug
    };
  } catch (error) {
    console.error('[서버] 게시글 생성 예외 발생:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시글 생성 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 게시글 수정 서버 액션
 */
export async function updatePost(
  postId: string, 
  title: string, 
  content: string, 
  userId: string
) {
  if (!postId || !title || !content || !userId) {
    return {
      success: false,
      error: '필수 입력값이 누락되었습니다.'
    };
  }
  
  try {
    // 계정 정지 상태 확인
    const suspensionCheck = await checkSuspensionGuard(userId);
    if (suspensionCheck.isSuspended) {
      return {
        success: false,
        error: suspensionCheck.message || '계정이 정지되어 게시글을 수정할 수 없습니다.'
      };
    }
    
    const supabase = await createClient();
    
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase 클라이언트 초기화 오류'
      };
    }
    
    // 게시글이 존재하는지 확인 & 작성자 일치 확인
    const { data: existingPost, error: existingPostError } = await supabase
      .from('posts')
      .select('user_id, board_id')
      .eq('id', postId)
      .single();
      
    if (existingPostError) {
      return {
        success: false,
        error: `게시글을 찾을 수 없습니다: ${existingPostError.message}`
      };
    }
    
    if (!existingPost) {
      return {
        success: false,
        error: '해당 게시글이 존재하지 않습니다.'
      };
    }
    
    if (existingPost.user_id !== userId) {
      return {
        success: false,
        error: '본인이 작성한 게시글만 수정할 수 있습니다.'
      };
    }
    
    // 경기 카드 데이터를 완전한 HTML로 변환
    const processedContent = processMatchCardsInContent(content);
    
    // 게시글 업데이트 쿼리
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        title: title.trim(),
        content: processedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);
    
    if (updateError) {
      return {
        success: false,
        error: `게시글 수정 실패: ${updateError.message}`
      };
    }
    
    // 수정된 게시글 정보 가져오기
    const { data: postData, error: postDataError } = await supabase
      .from('posts')
      .select('post_number, board_id, boards(slug)')
      .eq('id', postId)
      .single();
    
    if (postDataError) {
      return {
        success: false,
        error: `게시글 정보 가져오기 실패: ${postDataError.message}`
      };
    }
    
    const boardSlug = (postData.boards as { slug: string } | null)?.slug;
    
    return {
      success: true,
      postId,
      postNumber: postData.post_number,
      boardSlug
    };
  } catch (error) {
    console.error('[서버] 게시글 수정 예외 발생:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시글 수정 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 게시글 삭제 서버 액션
 */
export async function deletePost(
  postId: string,
  userId: string
) {
  if (!postId || !userId) {
    return {
      success: false,
      error: '필수 입력값이 누락되었습니다.'
    };
  }
  
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase 클라이언트 초기화 오류'
      };
    }
    
    // 게시글이 존재하는지 확인 & 작성자 일치 확인
    const { data: existingPost, error: existingPostError } = await supabase
      .from('posts')
      .select('user_id, board_id, boards(slug)')
      .eq('id', postId)
      .single();
      
    if (existingPostError) {
      return {
        success: false,
        error: `게시글을 찾을 수 없습니다: ${existingPostError.message}`
      };
    }
    
    if (!existingPost) {
      return {
        success: false,
        error: '해당 게시글이 존재하지 않습니다.'
      };
    }
    
    if (existingPost.user_id !== userId) {
      return {
        success: false,
        error: '본인이 작성한 게시글만 삭제할 수 있습니다.'
      };
    }
    
    // 게시판 정보 가져오기
    const { data: boardData, error: boardError } = await supabase
      .from('boards')
      .select('slug')
      .eq('id', existingPost.board_id || '')
      .single();
    
    if (boardError) {
      return {
        success: false,
        error: `게시판 정보 조회 실패: ${boardError.message}`
      };
    }
    
    // 관련 댓글 삭제
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .eq('post_id', postId);
    
    if (commentsError) {
      return {
        success: false,
        error: `댓글 삭제 실패: ${commentsError.message}`
      };
    }
    
    // 관련 좋아요/싫어요 삭제
    const { error: likesError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId);
    
    if (likesError) {
      return {
        success: false,
        error: `좋아요/싫어요 삭제 실패: ${likesError.message}`
      };
    }
    
    // 게시글 삭제
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
    
    if (deleteError) {
      return {
        success: false,
        error: `게시글 삭제 실패: ${deleteError.message}`
      };
    }
    
    return {
      success: true,
      boardSlug: boardData.slug
    };
  } catch (error) {
    console.error('[서버] 게시글 삭제 예외 발생:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시글 삭제 중 오류가 발생했습니다.'
    };
  }
}

// 기본 응답 인터페이스
interface LikeActionResponse {
  success: boolean;
  likes?: number;
  dislikes?: number;
  userAction?: 'like' | 'dislike' | null;
  error?: string;
}

/**
 * 게시글 좋아요 액션
 * @param postId 게시글 ID
 * @returns 업데이트된 좋아요/싫어요 정보
 */
export async function likePost(postId: string): Promise<LikeActionResponse> {
  try {
    const supabase = await createClient();
    
    // 인증된 사용자 정보 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { 
        success: false, 
        error: '로그인이 필요합니다.' 
      };
    }
    
    const userId = user.id;
    
    // 계정 정지 상태 확인
    const suspensionCheck = await checkSuspensionGuard(userId);
    if (suspensionCheck.isSuspended) {
      return { 
        success: false, 
        error: suspensionCheck.message || '계정이 정지되어 좋아요를 누를 수 없습니다.' 
      };
    }
    
    // 게시글 최신 정보 조회
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('likes, dislikes, user_id')
      .eq('id', postId)
      .single();
      
    if (fetchError) {
      return { 
        success: false, 
        error: '게시글 정보를 조회할 수 없습니다.' 
      };
    }
    
    // 이미 좋아요를 눌렀는지 확인
    const { data: likeRecord, error: likeError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'like');
    
    if (likeError) {
      return { 
        success: false, 
        error: '좋아요 기록을 확인할 수 없습니다.' 
      };
    }
    
    const alreadyLiked = likeRecord && likeRecord.length > 0;
    let newLikes = currentPost.likes;
    let newDislikes = currentPost.dislikes;
    let newUserAction: 'like' | 'dislike' | null = null;
    
    if (alreadyLiked) {
      // 좋아요 취소
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', 'like');
      
      if (deleteError) {
        return { 
          success: false, 
          error: '좋아요 취소 중 오류가 발생했습니다.' 
        };
      }
      
      // 게시글 좋아요 수 감소
      newLikes = Math.max(0, (currentPost.likes || 0) - 1);
      
      const { error: updateError } = await supabase
        .from('posts')
        .update({ likes: newLikes })
        .eq('id', postId);
      
      if (updateError) {
        return { 
          success: false, 
          error: '좋아요 수 갱신 중 오류가 발생했습니다.' 
        };
      }
    } else {
      // 기존 싫어요가 있으면 제거
      const { data: dislikeRecord, error: dislikeCheckError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', 'dislike');
      
      if (!dislikeCheckError && dislikeRecord && dislikeRecord.length > 0) {
        // 싫어요 제거
        const { error: deleteDislikeError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('type', 'dislike');
        
        if (!deleteDislikeError) {
          // 게시글 싫어요 수 감소
          newDislikes = Math.max(0, currentPost.dislikes - 1);
        }
      }
      
      // 새로운 좋아요 추가
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert([{
          post_id: postId,
          user_id: userId,
          type: 'like'
        }]);
      
      if (insertError) {
        return { 
          success: false, 
          error: '좋아요 추가 중 오류가 발생했습니다.' 
        };
      }
      
      // 게시글 좋아요 수 증가
      newLikes = (currentPost.likes || 0) + 1;
      
      const { error: updateError } = await supabase
        .from('posts')
        .update({ 
          likes: newLikes,
          dislikes: newDislikes
        })
        .eq('id', postId);
      
      if (updateError) {
        return { 
          success: false, 
          error: '좋아요 수 갱신 중 오류가 발생했습니다.' 
        };
      }
      
      newUserAction = 'like';
      
      // 좋아요가 새로 추가된 경우 게시글 작성자에게 보상 지급
      if (currentPost.user_id && currentPost.user_id !== userId) {
        try {
          const activityTypes = await getActivityTypeValues();
          await rewardUserActivity(currentPost.user_id, activityTypes.RECEIVED_LIKE, postId);
        } catch (rewardError) {
          console.error('게시글 추천 받기 보상 지급 오류:', rewardError);
          // 보상 지급 실패해도 좋아요는 성공으로 처리
        }
      }
    }
    
    return {
      success: true,
      likes: newLikes || 0,
      dislikes: newDislikes || 0,
      userAction: newUserAction
    };
    
  } catch (error) {
    console.error('좋아요 처리 중 오류:', error);
    
    return { 
      success: false, 
      error: '좋아요 처리 중 오류가 발생했습니다.' 
    };
  }
}

/**
 * 게시글 싫어요 액션
 * @param postId 게시글 ID
 * @returns 업데이트된 좋아요/싫어요 정보
 */
export async function dislikePost(postId: string): Promise<LikeActionResponse> {
  try {
    const supabase = await createClient();
    
    // 인증된 사용자 정보 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { 
        success: false, 
        error: '로그인이 필요합니다.' 
      };
    }
    
    const userId = user.id;
    
    // 계정 정지 상태 확인
    const suspensionCheck = await checkSuspensionGuard(userId);
    if (suspensionCheck.isSuspended) {
      return { 
        success: false, 
        error: suspensionCheck.message || '계정이 정지되어 싫어요를 누를 수 없습니다.' 
      };
    }
    
    // 게시글 최신 정보 조회
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('likes, dislikes, user_id')
      .eq('id', postId)
      .single();
      
    if (fetchError) {
      return { 
        success: false, 
        error: '게시글 정보를 조회할 수 없습니다.' 
      };
    }
    
    // 이미 싫어요를 눌렀는지 확인
    const { data: dislikeRecord, error: dislikeError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'dislike');
    
    if (dislikeError) {
      return { 
        success: false, 
        error: '싫어요 기록을 확인할 수 없습니다.' 
      };
    }
    
    const alreadyDisliked = dislikeRecord && dislikeRecord.length > 0;
    let newLikes = currentPost.likes;
    let newDislikes = currentPost.dislikes;
    let newUserAction: 'like' | 'dislike' | null = null;
    
    if (alreadyDisliked) {
      // 싫어요 취소
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', 'dislike');
      
      if (deleteError) {
        return { 
          success: false, 
          error: '싫어요 취소 중 오류가 발생했습니다.' 
        };
      }
      
      // 게시글 싫어요 수 감소
      newDislikes = Math.max(0, (currentPost.dislikes || 0) - 1);
      
      const { error: updateError } = await supabase
        .from('posts')
        .update({ dislikes: newDislikes })
        .eq('id', postId);
      
      if (updateError) {
        return { 
          success: false, 
          error: '싫어요 수 갱신 중 오류가 발생했습니다.' 
        };
      }
    } else {
      // 기존 좋아요가 있으면 제거
      const { data: likeRecord, error: likeCheckError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', 'like');
      
      if (!likeCheckError && likeRecord && likeRecord.length > 0) {
        // 좋아요 제거
        const { error: deleteLikeError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('type', 'like');
        
        if (!deleteLikeError) {
          // 게시글 좋아요 수 감소
          newLikes = Math.max(0, (currentPost.likes || 0) - 1);
        }
      }
      
      // 새로운 싫어요 추가
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert([{
          post_id: postId,
          user_id: userId,
          type: 'dislike'
        }]);
      
      if (insertError) {
        return { 
          success: false, 
          error: '싫어요 추가 중 오류가 발생했습니다.' 
        };
      }
      
      // 게시글 싫어요 수 증가
      newDislikes = (currentPost.dislikes || 0) + 1;
      
      const { error: updateError } = await supabase
        .from('posts')
        .update({ 
          likes: newLikes,
          dislikes: newDislikes
        })
        .eq('id', postId);
      
      if (updateError) {
        return { 
          success: false, 
          error: '싫어요 수 갱신 중 오류가 발생했습니다.' 
        };
      }
      
      newUserAction = 'dislike';
    }
    
    return {
      success: true,
      likes: newLikes || 0,
      dislikes: newDislikes || 0,
      userAction: newUserAction
    };
    
  } catch (error) {
    console.error('싫어요 처리 중 오류:', error);
    
    return { 
      success: false, 
      error: '싫어요 처리 중 오류가 발생했습니다.' 
    };
  }
}

/**
 * 사용자가 게시글에 한 액션(좋아요/싫어요) 조회
 */
export async function getUserPostAction(postId: string): Promise<{ userAction: 'like' | 'dislike' | null, error?: string }> {
  try {
    const supabase = await createClient();
    
    // 인증된 사용자 정보 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { 
        userAction: null,
        error: '로그인이 필요합니다.' 
      };
    }
    
    const userId = user.id;
    
    // 좋아요 확인
    const { data: likeRecord, error: likeError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'like')
      .maybeSingle();
    
    if (likeError) {
      return { userAction: null };
    }
    
    if (likeRecord) {
      return { userAction: 'like' };
    }
    
    // 싫어요 확인
    const { data: dislikeRecord, error: dislikeError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'dislike')
      .maybeSingle();
    
    if (dislikeError) {
      return { userAction: null };
    }
    
    if (dislikeRecord) {
      return { userAction: 'dislike' };
    }
    
    // 액션 없음
    return { userAction: null };
    
  } catch (error) {
    console.error('사용자 액션 확인 중 오류:', error);
    return { userAction: null };
  }
}

/**
 * 경기 카드 데이터를 완전한 HTML로 변환하는 서버 함수
 */
function processMatchCardsInContent(content: string): string {
  try {
    // 더 유연한 정규식 - 내용이 있는 div 태그 처리
    const matchCardRegex = /<div[^>]*data-type="match-card"[^>]*data-match="([^"]*)"[^>]*>([\s\S]*?)<\/div>/g;
    
    const result = content.replace(matchCardRegex, (match, encodedData) => {
      try {
        // URL 디코딩 후 JSON 파싱
        const decodedData = decodeURIComponent(encodedData);
        const matchData = JSON.parse(decodedData);
        
        // 경기 카드 내용 생성
        const { teams, goals, league, status } = matchData;
        const homeTeam = teams?.home || { name: '홈팀', logo: '/placeholder.png' };
        const awayTeam = teams?.away || { name: '원정팀', logo: '/placeholder.png' };
        const leagueData = league || { name: '알 수 없는 리그', logo: '/placeholder.png' };
        const homeScore = typeof goals?.home === 'number' ? goals.home : '-';
        const awayScore = typeof goals?.away === 'number' ? goals.away : '-';
        const actualMatchId = matchData.id || 'unknown';
        
        // 경기 상태 텍스트 설정
        let statusText = '경기 결과';
        let statusClass = '';
        
        if (status) {
          const statusCode = status.code || '';
          
          if (statusCode === 'FT') {
            statusText = '경기 종료';
          } else if (statusCode === 'NS') {
            statusText = '경기 예정';
          } else if (['1H', '2H', 'HT', 'LIVE'].includes(statusCode)) {
            if (statusCode === '1H') {
              statusText = `전반전 진행 중 ${status.elapsed ? `(${status.elapsed}분)` : ''}`;
            } else if (statusCode === '2H') {
              statusText = `후반전 진행 중 ${status.elapsed ? `(${status.elapsed}분)` : ''}`;
            } else if (statusCode === 'HT') {
              statusText = '하프타임';
            } else {
              statusText = `진행 중 ${status.elapsed ? `(${status.elapsed}분)` : ''}`;
            }
            statusClass = 'color: #059669; font-weight: 500;';
          }
        }
        
        const processedHTML = `
          <div class="match-card processed-match-card" data-processed="true">
            <a href="/livescore/football/match/${actualMatchId}">
              <!-- 리그 헤더 -->
              <div class="league-header">
                <div style="display: flex; align-items: center;">
                  <img 
                    src="${leagueData.logo}" 
                    alt="${leagueData.name}" 
                    class="league-logo"
                    onerror="this.onerror=null;this.src='/placeholder.png';"
                  />
                  <span class="league-name">${leagueData.name}</span>
                </div>
              </div>
              
              <!-- 경기 카드 메인 -->
              <div class="match-main">
                <!-- 홈팀 -->
                <div class="team-info">
                  <img 
                    src="${homeTeam.logo}" 
                    alt="${homeTeam.name}" 
                    class="team-logo"
                    onerror="this.onerror=null;this.src='/placeholder.png';"
                  />
                  <span class="team-name${homeTeam.winner ? ' winner' : ''}">
                    ${homeTeam.name}
                  </span>
                </div>
                
                <!-- 스코어 -->
                <div class="score-area">
                  <div class="score">
                    <span class="score-number">${homeScore}</span>
                    <span class="score-separator">-</span>
                    <span class="score-number">${awayScore}</span>
                  </div>
                  <div class="match-status${statusClass.includes('color: #059669') ? ' live' : ''}">
                    ${statusText}
                  </div>
                </div>
                
                <!-- 원정팀 -->
                <div class="team-info">
                  <img 
                    src="${awayTeam.logo}" 
                    alt="${awayTeam.name}" 
                    class="team-logo"
                    onerror="this.onerror=null;this.src='/placeholder.png';"
                  />
                  <span class="team-name${awayTeam.winner ? ' winner' : ''}">
                    ${awayTeam.name}
                  </span>
                </div>
              </div>
              
              <!-- 푸터 -->
              <div class="match-footer">
                <span class="footer-link">
                  매치 상세 정보
                </span>
              </div>
            </a>
          </div>
        `;
        
        return processedHTML;
      } catch {
        // 파싱 실패 시 기본 경기 카드 반환
        return `
          <div class="match-card processed-match-card" data-processed="true" style="
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            margin: 12px 0;
            background: white;
            width: 100%;
            max-width: 100%;
            padding: 12px;
            text-align: center;
          ">
            <div style="color: #ef4444; font-weight: 500;">
              ⚠️ 경기 카드 오류
            </div>
            <div style="margin-top: 8px; font-size: 14px; color: #666;">
              경기 정보를 불러올 수 없습니다.
            </div>
          </div>
        `;
      }
    });
    
    return result;
  } catch (error) {
    console.error('[서버] 경기 카드 처리 중 오류:', error);
    return content; // 오류 시 원본 content 반환
  }
}

/**
 * 게시글 생성
 */
export async function createPost(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // 폼 데이터에서 값 추출
    const title = formData.get('title') as string
    let content = formData.get('content') as string
    const boardId = formData.get('boardId') as string
    
    if (!title || !content || !boardId) {
      return { error: '필수 입력값이 누락되었습니다' }
    }
    
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: '로그인이 필요합니다' }
    }
    
    // 계정 정지 상태 확인
    const suspensionCheck = await checkSuspensionGuard(user.id);
    if (suspensionCheck.isSuspended) {
      return { error: suspensionCheck.message || '계정이 정지되어 게시글을 작성할 수 없습니다.' };
    }
    
    // 경기 카드 데이터를 완전한 HTML로 변환
    content = processMatchCardsInContent(content);
    
    // 게시글 작성
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title,
        content: typeof content === 'string' && content.startsWith('{') 
          ? JSON.parse(content) 
          : content,
        user_id: user.id,
        board_id: boardId
      })
      .select(`
        *,
        board:boards(
          id,
          name,
          slug
        )
      `)
      .single()
    
    if (error) {
      return { error: '게시글 작성 실패' }
    }
    
    // 캐시 갱신
    revalidatePath(`/boards/${boardId}`)
    
    return { success: true, post: data }
  } catch (error) {
    console.error('게시글 작성 오류:', error)
    return { error: '게시글 작성 중 오류가 발생했습니다' }
  }
}