'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { revalidatePath } from 'next/cache';

/**
 * 게시글 생성 서버 액션 (매개변수 사용)
 */
export async function createPostWithParams(
  title: string,
  content: string,
  boardId: string,
  userId: string
) {
  console.log('[서버] createPost 호출됨:', { title, boardId, userId });
  
  if (!title || !content || !boardId || !userId) {
    console.log('[서버] 필수 인자 누락:', { title: !!title, content: !!content, boardId: !!boardId, userId: !!userId });
    return {
      success: false,
      error: '필수 입력값이 누락되었습니다.'
    };
  }
  
  try {
    const supabase = await createClient();
    console.log('[서버] Supabase 클라이언트 생성됨');
    
    if (!supabase) {
      console.log('[서버] Supabase 클라이언트 생성 실패');
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
    
    console.log('[서버] 게시판 정보 조회:', { boardData, error: boardQueryError });
    
    if (boardQueryError) {
      return {
        success: false,
        error: `게시판 정보 조회 실패: ${boardQueryError.message}`
      };
    }
    
    if (!boardData) {
      console.log('[서버] 게시판 정보 없음');
      return {
        success: false,
        error: '게시판 정보를 찾을 수 없습니다.'
      };
    }
    
    // 게시글 생성
    console.log('[서버] 게시글 생성 시도...');
    
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
    
    console.log('[서버] 게시글 생성 결과:', { data, error });
    
    if (error) {
      console.log('[서버] 게시글 생성 오류:', error);
      return {
        success: false,
        error: `게시글 생성 실패: ${error.message}`
      };
    }
    
    if (!data) {
      console.log('[서버] 게시글 생성 후 데이터 없음');
      return {
        success: false,
        error: '게시글 생성은 되었으나 데이터를 받아오지 못했습니다.'
      };
    }
    
    console.log('[서버] 게시글 생성 완료:', { 
      postId: data.id,
      postNumber: data.post_number,
      boardSlug: boardData.slug
    });
    
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
  console.log('[서버] updatePost 호출됨:', { postId, userId });
  
  if (!postId || !title || !content || !userId) {
    console.log('[서버] 필수 인자 누락:', { postId: !!postId, title: !!title, content: !!content, userId: !!userId });
    return {
      success: false,
      error: '필수 입력값이 누락되었습니다.'
    };
  }
  
  try {
    const supabase = await createClient();
    console.log('[서버] Supabase 클라이언트 생성됨');
    
    if (!supabase) {
      console.log('[서버] Supabase 클라이언트 생성 실패');
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
      console.log('[서버] 게시글 확인 오류:', existingPostError);
      return {
        success: false,
        error: `게시글을 찾을 수 없습니다: ${existingPostError.message}`
      };
    }
    
    if (!existingPost) {
      console.log('[서버] 게시글이 존재하지 않음');
      return {
        success: false,
        error: '해당 게시글이 존재하지 않습니다.'
      };
    }
    
    if (existingPost.user_id !== userId) {
      console.log('[서버] 게시글 작성자가 아님:', { postUserId: existingPost.user_id, requestUserId: userId });
      return {
        success: false,
        error: '본인이 작성한 게시글만 수정할 수 있습니다.'
      };
    }
    
    // 게시글 업데이트 쿼리
    console.log('[서버] 게시글 수정 시도...');
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        title: title.trim(),
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);
    
    if (updateError) {
      console.log('[서버] 게시글 수정 오류:', updateError);
      return {
        success: false,
        error: `게시글 수정 실패: ${updateError.message}`
      };
    }
    
    // 게시글 번호와 게시판 슬러그 가져오기
    const { data: postData, error: postDataError } = await supabase
      .from('posts')
      .select('post_number, boards:board_id(slug)')
      .eq('id', postId)
      .single();
      
    if (postDataError || !postData) {
      console.log('[서버] 게시글 정보 가져오기 오류:', postDataError);
      return {
        success: false,
        error: '게시글은 수정되었으나, 게시글 정보를 가져오는데 실패했습니다.'
      };
    }
    
    // 타입 안전하게 접근
    const boardSlug = postData.boards && typeof postData.boards === 'object' && 'slug' in postData.boards
      ? postData.boards.slug
      : undefined;
    
    console.log('[서버] 게시글 수정 완료:', { 
      postNumber: postData.post_number,
      boardSlug
    });
    
    return {
      success: true,
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
  console.log('[서버] deletePost 호출됨:', { postId, userId });
  
  if (!postId || !userId) {
    console.log('[서버] 필수 인자 누락:', { postId: !!postId, userId: !!userId });
    return {
      success: false,
      error: '필수 입력값이 누락되었습니다.'
    };
  }
  
  try {
    const supabase = await createClient();
    console.log('[서버] Supabase 클라이언트 생성됨');
    
    if (!supabase) {
      console.log('[서버] Supabase 클라이언트 생성 실패');
      return {
        success: false,
        error: 'Supabase 클라이언트 초기화 오류'
      };
    }
    
    // 게시글이 존재하는지 확인 & 작성자 일치 확인
    const { data: existingPost, error: existingPostError } = await supabase
      .from('posts')
      .select('user_id, board_id, post_number')
      .eq('id', postId)
      .single();
      
    if (existingPostError) {
      console.log('[서버] 게시글 확인 오류:', existingPostError);
      return {
        success: false,
        error: `게시글을 찾을 수 없습니다: ${existingPostError.message}`
      };
    }
    
    if (!existingPost) {
      console.log('[서버] 게시글이 존재하지 않음');
      return {
        success: false,
        error: '해당 게시글이 존재하지 않습니다.'
      };
    }
    
    if (existingPost.user_id !== userId) {
      console.log('[서버] 게시글 작성자가 아님:', { postUserId: existingPost.user_id, requestUserId: userId });
      return {
        success: false,
        error: '본인이 작성한 게시글만 삭제할 수 있습니다.'
      };
    }
    
    // 게시판 슬러그 가져오기
    const { data: boardData, error: boardError } = await supabase
      .from('boards')
      .select('slug')
      .eq('id', existingPost.board_id || '')
      .single();
      
    if (boardError || !boardData) {
      console.log('[서버] 게시판 정보 조회 오류:', boardError);
      return {
        success: false,
        error: '게시판 정보를 찾을 수 없습니다.'
      };
    }
    
    // 트랜잭션 처리 - 연관된 데이터부터 삭제
    // 1. 댓글 삭제
    console.log('[서버] 댓글 삭제 시도...');
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .eq('post_id', postId);
      
    if (commentsError) {
      console.log('[서버] 댓글 삭제 오류:', commentsError);
      return {
        success: false,
        error: `댓글 삭제 실패: ${commentsError.message}`
      };
    }
    
    // 2. 좋아요/싫어요 삭제
    console.log('[서버] 좋아요/싫어요 삭제 시도...');
    const { error: likesError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId);
      
    if (likesError) {
      console.log('[서버] 좋아요/싫어요 삭제 오류:', likesError);
      return {
        success: false,
        error: `좋아요/싫어요 삭제 실패: ${likesError.message}`
      };
    }
    
    // 3. 게시글 삭제
    console.log('[서버] 게시글 삭제 시도...');
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);
      
    if (deleteError) {
      console.log('[서버] 게시글 삭제 오류:', deleteError);
      return {
        success: false,
        error: `게시글 삭제 실패: ${deleteError.message}`
      };
    }
    
    console.log('[서버] 게시글 삭제 완료:', { 
      boardSlug: boardData.slug
    });
    
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
    
    // 게시글 최신 정보 조회
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('likes, dislikes')
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
    }
    
    // 페이지 재검증
    revalidatePath(`/boards/[slug]/[postNumber]`);
    
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
    
    // 게시글 최신 정보 조회
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('likes, dislikes')
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
    
    // 페이지 재검증
    revalidatePath(`/boards/[slug]/[postNumber]`);
    
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
      console.error('좋아요 확인 오류:', likeError);
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
      console.error('싫어요 확인 오류:', dislikeError);
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
 * 게시글 생성
 */
export async function createPost(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // 폼 데이터에서 값 추출
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const boardId = formData.get('boardId') as string
    
    if (!title || !content || !boardId) {
      return { error: '필수 입력값이 누락되었습니다' }
    }
    
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: '로그인이 필요합니다' }
    }
    
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
      console.error('게시글 작성 오류:', error)
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