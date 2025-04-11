import { createClient } from "@/app/lib/supabase.server";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 60; // 1분마다 재검증
export const dynamic = 'force-dynamic'; // 동적 라우팅 강제

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const boardId = searchParams.get('boardId');
    const postNumberParam = searchParams.get('postNumber');
    
    // 필수 파라미터 검증
    if (!boardId || !postNumberParam) {
      return NextResponse.json(
        { error: "유효하지 않은 요청 파라미터입니다." },
        { status: 400 }
      );
    }
    
    const postNumber = parseInt(postNumberParam, 10);
    if (isNaN(postNumber) || postNumber <= 0) {
      return NextResponse.json(
        { error: "유효하지 않은 게시글 번호입니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // 이전글과 다음글을 병렬로 가져오기
    const [prevPostResult, nextPostResult] = await Promise.all([
      // 이전글 - 현재 게시글보다 post_number가 작은 것 중 가장 큰 것
      supabase
        .from('posts')
        .select('id, title, post_number')
        .eq('board_id', boardId)
        .lt('post_number', postNumber)
        .order('post_number', { ascending: false })
        .limit(1),
      
      // 다음글 - 현재 게시글보다 post_number가 큰 것 중 가장 작은 것
      supabase
        .from('posts')
        .select('id, title, post_number')
        .eq('board_id', boardId)
        .gt('post_number', postNumber)
        .order('post_number', { ascending: true })
        .limit(1)
    ]);
    
    // 결과 구성
    const prevPost = prevPostResult.error || !prevPostResult.data || prevPostResult.data.length === 0
      ? null
      : prevPostResult.data[0];
      
    const nextPost = nextPostResult.error || !nextPostResult.data || nextPostResult.data.length === 0
      ? null
      : nextPostResult.data[0];
    
    return NextResponse.json({ prevPost, nextPost });
  } catch (error: unknown) {
    console.error("인접 게시글 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 