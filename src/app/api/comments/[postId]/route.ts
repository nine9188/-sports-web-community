import { createClient } from "@/app/lib/supabase.server";
import { NextResponse } from "next/server";

export const revalidate = 0; // 캐시 비활성화
export const dynamic = 'force-dynamic'; // 동적 라우팅 강제

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    console.log(`댓글 조회 요청 - 게시글 ID: ${postId}, 요청 URL: ${request.url}`);
    
    const supabase = await createClient();
    
    // 현재 사용자 정보 가져오기 (로그인 안 되어 있을 수도 있음)
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    console.log(`댓글 조회 - 현재 사용자 ID: ${userId || '로그인 안됨'}`);
    
    // 먼저 댓글 정보 가져오기
    const { data: comments, error } = await supabase
      .from('comments')
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
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('댓글 조회 오류:', error);
      return NextResponse.json({ error: '댓글을 가져오는데 실패했습니다' }, { status: 500 });
    }
    
    console.log(`댓글 ${comments?.length || 0}개 조회 결과 (DB에서 직접 가져옴), 게시글 ID: ${postId}`);
    
    // 로그인 상태라면 사용자 액션(좋아요/싫어요) 정보 가져오기
    if (userId && comments && comments.length > 0) {
      const commentIds = comments.map(comment => comment.id);
      
      const { data: userActions, error: actionError } = await supabase
        .from('comment_likes')
        .select('comment_id, type')
        .eq('user_id', userId)
        .in('comment_id', commentIds);
        
      if (!actionError && userActions) {
        // 사용자 액션을 맵으로 변환
        const userActionMap: Record<string, string> = userActions.reduce((acc: Record<string, string>, action) => {
          acc[action.comment_id] = action.type;
          return acc;
        }, {});
        
        // 댓글 데이터에 사용자 액션 정보 추가
        const commentsWithUserAction = comments.map(comment => ({
          ...comment,
          userAction: userActionMap[comment.id] || null
        }));
        
        console.log(`댓글 ${commentsWithUserAction.length}개 조회 성공 (사용자 액션 포함)`);
        
        return new NextResponse(JSON.stringify(commentsWithUserAction), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
          }
        });
      }
    }
    
    console.log(`댓글 ${comments?.length || 0}개 조회 성공 (사용자 액션 없음)`);
    
    return new NextResponse(JSON.stringify(comments || []), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('댓글 조회 중 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    console.log(`댓글 작성 요청 - 게시글 ID: ${postId}`);
    
    const supabase = await createClient();
    
    // 요청 본문에서 데이터 추출
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json({ error: '댓글 내용이 누락되었습니다' }, { status: 400 });
    }
    
    // 현재 사용자 정보 가져오기
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다' }, { status: 401 });
    }
    
    // 댓글 작성
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content,
        likes: 0,
        dislikes: 0
      })
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
      
    if (error) {
      console.error('댓글 작성 오류:', error);
      return NextResponse.json({ error: '댓글 작성에 실패했습니다' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('댓글 작성 중 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
} 