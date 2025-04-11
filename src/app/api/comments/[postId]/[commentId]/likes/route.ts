import { createClient } from "@/app/lib/supabase.server";
import { NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// 좋아요/싫어요 액션 처리 API
export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const { postId, commentId } = await params;
    
    // 요청 본문에서 액션 타입 추출 ('like' 또는 'dislike')
    const { actionType } = await request.json();
    
    if (actionType !== 'like' && actionType !== 'dislike') {
      return NextResponse.json(
        { error: "액션 타입은 'like' 또는 'dislike'여야 합니다" }, 
        { status: 400 }
      );
    }
    
    console.log(`댓글 ${actionType} 요청 - 게시글 ID: ${postId}, 댓글 ID: ${commentId}`);
    
    const supabase = await createClient();
    
    // 사용자 정보 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('인증되지 않은 사용자의 좋아요/싫어요 시도');
      return NextResponse.json({ error: '인증되지 않은 사용자입니다' }, { status: 401 });
    }
    
    // 댓글 존재 여부 확인
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, likes, dislikes')
      .eq('id', commentId)
      .eq('post_id', postId)
      .single();
    
    if (commentError) {
      console.error('댓글 조회 오류:', commentError);
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다' }, { status: 404 });
    }
    
    // 반대 액션 타입 결정
    const oppositeType = actionType === 'like' ? 'dislike' : 'like';
    
    // 1. 사용자의 기존 액션 확인
    const { data: existingAction } = await supabase
      .from('comment_likes')
      .select('id, type')
      .eq('comment_id', commentId)
      .eq('user_id', user.id);
    
    // 트랜잭션에 사용할 변수 초기화
    let currentLikes = comment.likes || 0;
    let currentDislikes = comment.dislikes || 0;
    let newAction = null;
    
    // 기존 액션이 없는 경우
    if (!existingAction || existingAction.length === 0) {
      console.log(`새 ${actionType} 추가`);
      
      // 새 액션 추가
      const { error: insertError } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          type: actionType
        });
      
      if (insertError) {
        console.error(`${actionType} 추가 오류:`, insertError);
        return NextResponse.json({ error: '액션 추가 실패' }, { status: 500 });
      }
      
      // 카운트 업데이트
      if (actionType === 'like') {
        currentLikes += 1;
      } else {
        currentDislikes += 1;
      }
      
      newAction = actionType;
    } 
    // 이미 같은 타입의 액션이 있는 경우 (취소)
    else if (existingAction.length > 0 && existingAction[0].type === actionType) {
      console.log(`기존 ${actionType} 취소`);
      
      // 기존 액션 삭제
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('id', existingAction[0].id);
      
      if (deleteError) {
        console.error(`${actionType} 취소 오류:`, deleteError);
        return NextResponse.json({ error: '액션 취소 실패' }, { status: 500 });
      }
      
      // 카운트 업데이트
      if (actionType === 'like') {
        currentLikes = Math.max(0, currentLikes - 1);
      } else {
        currentDislikes = Math.max(0, currentDislikes - 1);
      }
      
      newAction = null;
    } 
    // 반대 타입의 액션이 있는 경우 (전환)
    else if (existingAction.length > 0 && existingAction[0].type === oppositeType) {
      console.log(`${oppositeType}에서 ${actionType}으로 전환`);
      
      // 액션 타입 업데이트
      const { error: updateError } = await supabase
        .from('comment_likes')
        .update({ type: actionType })
        .eq('id', existingAction[0].id);
      
      if (updateError) {
        console.error('액션 전환 오류:', updateError);
        return NextResponse.json({ error: '액션 전환 실패' }, { status: 500 });
      }
      
      // 카운트 업데이트
      if (actionType === 'like') {
        currentLikes += 1;
        currentDislikes = Math.max(0, currentDislikes - 1);
      } else {
        currentDislikes += 1;
        currentLikes = Math.max(0, currentLikes - 1);
      }
      
      newAction = actionType;
    }
    
    // 댓글 카운트 업데이트
    console.log(`댓글 ID: ${commentId} - 카운트 업데이트 시도, likes: ${currentLikes}, dislikes: ${currentDislikes}`);
    
    try {
      // 먼저 최신 댓글 정보 다시 가져오기
      const { data: latestComment, error: fetchError } = await supabase
        .from('comments')
        .select('id, likes, dislikes')
        .eq('id', commentId)
        .single();
        
      if (fetchError) {
        console.error('최신 댓글 정보 조회 실패:', fetchError);
        return NextResponse.json({ error: '댓글 업데이트 실패' }, { status: 500 });
      }
      
      console.log(`현재 DB의 댓글 상태 - likes: ${latestComment.likes}, dislikes: ${latestComment.dislikes}`);
      
      // 댓글 카운트 업데이트
      const { data: updatedComment, error: updateCountError } = await supabase
        .from('comments')
        .update({
          likes: currentLikes,
          dislikes: currentDislikes
        })
        .eq('id', commentId)
        .select('id, likes, dislikes')
        .single();
      
      if (updateCountError) {
        console.error('카운트 업데이트 오류:', updateCountError);
        return NextResponse.json({ error: '카운트 업데이트 실패' }, { status: 500 });
      }
      
      console.log(`카운트 업데이트 완료 - 업데이트 후 DB 상태: likes: ${updatedComment.likes}, dislikes: ${updatedComment.dislikes}`);
      
      return NextResponse.json({
        success: true,
        likes: updatedComment.likes,
        dislikes: updatedComment.dislikes,
        userAction: newAction
      });
    } catch (updateError) {
      console.error('댓글 카운트 업데이트 중 예외 발생:', updateError);
      return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
    }
  } catch (error) {
    console.error('좋아요/싫어요 처리 중 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
} 