import { createClient } from "@/app/lib/supabase.server";
import { NextResponse } from "next/server";

export const revalidate = 0; // 캐시 비활성화
export const dynamic = 'force-dynamic'; // 동적 라우팅 강제

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const { postId, commentId } = await params;
    console.log(`댓글 삭제 API 요청 - 게시글 ID: ${postId}, 댓글 ID: ${commentId}`);
    
    const supabase = await createClient();
    
    // 현재 사용자 정보 가져오기
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('인증되지 않은 사용자의 댓글 삭제 시도');
      return NextResponse.json({ error: '인증되지 않은 사용자입니다' }, { status: 401 });
    }
    
    // 댓글 정보 조회 (소유자 확인)
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .eq('post_id', postId)
      .single();
    
    if (commentError) {
      console.error('댓글 정보 조회 오류:', commentError);
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다' }, { status: 404 });
    }
    
    // 관리자가 아니고 댓글 작성자가 아닌 경우 권한 오류
    if (comment.user_id !== user.id) {
      console.error('권한이 없는 사용자의 댓글 삭제 시도:', user.id);
      return NextResponse.json({ error: '댓글 삭제 권한이 없습니다' }, { status: 403 });
    }
    
    // 댓글 삭제
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.error('댓글 삭제 오류:', deleteError);
      return NextResponse.json({ error: '댓글 삭제에 실패했습니다' }, { status: 500 });
    }
    
    // 삭제 후 댓글이 실제로 삭제되었는지 확인
    const { data: checkAfterDelete, error: checkAfterError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId);
    
    if (!checkAfterError && (!checkAfterDelete || checkAfterDelete.length === 0)) {
      console.log(`댓글 성공적으로 삭제됨 - 댓글 ID: ${commentId}`);
    } else {
      console.error(`댓글 삭제 실패 또는 불완전한 삭제 - 댓글 ID: ${commentId}`, 
                   checkAfterDelete, checkAfterError);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('댓글 삭제 중 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const { postId, commentId } = await params;
    console.log(`댓글 수정 API 요청 - 게시글 ID: ${postId}, 댓글 ID: ${commentId}`);
    
    // 요청 본문에서 데이터 추출
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json({ error: '댓글 내용이 누락되었습니다' }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // 현재 사용자 정보 가져오기
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('인증되지 않은 사용자의 댓글 수정 시도');
      return NextResponse.json({ error: '인증되지 않은 사용자입니다' }, { status: 401 });
    }
    
    // 댓글 정보 조회 (소유자 확인)
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .eq('post_id', postId)
      .single();
    
    if (commentError) {
      console.error('댓글 정보 조회 오류:', commentError);
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다' }, { status: 404 });
    }
    
    // 관리자가 아니고 댓글 작성자가 아닌 경우 권한 오류
    if (comment.user_id !== user.id) {
      console.error('권한이 없는 사용자의 댓글 수정 시도:', user.id);
      return NextResponse.json({ error: '댓글 수정 권한이 없습니다' }, { status: 403 });
    }
    
    // 댓글 수정
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({ content })
      .eq('id', commentId)
      .eq('user_id', user.id)
      .select(`
        id,
        content,
        created_at,
        user_id,
        post_id,
        likes,
        dislikes,
        profiles (
          id,
          nickname,
          icon_id
        )
      `)
      .single();
    
    if (updateError) {
      console.error('댓글 수정 오류:', updateError);
      return NextResponse.json({ error: '댓글 수정에 실패했습니다' }, { status: 500 });
    }
    
    console.log(`댓글 수정 성공 - 댓글 ID: ${commentId}`);
    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error('댓글 수정 중 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
} 