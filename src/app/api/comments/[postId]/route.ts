import { createClient } from "@/app/lib/supabase.server";
import { NextResponse } from "next/server";

export const revalidate = 0; // 캐시 비활성화
export const dynamic = 'force-dynamic'; // 동적 라우팅 강제

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // 동적 라우트 파라미터 가져오기
    const { postId } = await params;
    
    if (!postId) {
      return NextResponse.json({ error: '게시글 ID가 필요합니다' }, { status: 400 });
    }
    
    // 요청 헤더 확인 (디버깅 목적)
    
    // Supabase 클라이언트 생성
    const supabase = await createClient();
    
    // 현재 로그인한 사용자 정보 가져오기 (없어도 됨)
    let userId = null;
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        // 로그 제거됨
      } else if (user) {
        userId = user.id;
        // 로그 제거됨
      }
    } catch {
      // 인증 오류가 발생해도 계속 진행 (비로그인 사용자도 댓글 조회 가능)
    }
    
    // 댓글 데이터 가져오기 (프로필 정보 포함)
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          id,
          icon_id,
          nickname
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    if (error) {
      return NextResponse.json({ error: '댓글을 가져오는데 실패했습니다', details: error }, { status: 500 });
    }
    
    // 로그인 상태라면 사용자 액션(좋아요/싫어요) 정보 가져오기
    if (userId && comments && comments.length > 0) {
      const commentIds = comments.map(comment => comment.id);
      
      const { data: userActions, error: actionError } = await supabase
        .from('comment_likes')
        .select('comment_id, type')
        .eq('user_id', userId)
        .in('comment_id', commentIds);
        
      if (actionError) {
        // 로그 제거됨
      } else {
        // 로그 제거됨
        
        // 각 댓글에 사용자 액션 정보 추가
        if (userActions && userActions.length > 0) {
          const actionMap = userActions.reduce((map, action) => {
            map[action.comment_id] = action.type;
            return map;
          }, {} as Record<string, string>);
          
          comments.forEach(comment => {
            comment.userAction = actionMap[comment.id] || null;
          });
        }
      }
    }
    
    // 응답 헤더 설정 (캐싱 방지)
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    };
    
    return NextResponse.json(comments || [], { headers });
  } catch {
    return NextResponse.json(
      { error: '댓글 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    
    const supabase = await createClient();
    
    // 요청 본문에서 데이터 추출
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json({ error: '내용을 입력해주세요' }, { status: 400 });
    }
    
    // 현재 사용자 정보 가져오기
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다' }, { status: 401 });
    }
    
    // 게시글 존재 여부 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();
      
    if (postError || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 });
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
      return NextResponse.json({ error: '댓글 작성에 실패했습니다' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: '댓글 작성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 