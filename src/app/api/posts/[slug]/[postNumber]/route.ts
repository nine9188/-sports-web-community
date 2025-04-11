import { createClient } from "@/app/lib/supabase.server";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 60; // 1분마다 재검증
export const dynamic = 'force-dynamic'; // 동적 라우팅 강제

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; postNumber: string }> }
) {
  try {
    const { slug, postNumber } = await params;
    
    // 게시글 번호 검증
    const postNum = parseInt(postNumber, 10);
    if (isNaN(postNum) || postNum <= 0) {
      return NextResponse.json(
        { error: "유효하지 않은 게시글 번호입니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. 게시판 정보 가져오기
    const { data: boardData, error: boardError } = await supabase
      .from("boards")
      .select("*")
      .eq("slug", slug)
      .single();

    if (boardError || !boardData) {
      console.error("게시판 정보 조회 오류:", boardError);
      return NextResponse.json(
        { error: "게시판을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 2. 게시글 정보 가져오기 (인덱스 활용하도록 변경)
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select(`
        *,
        profiles:user_id(id, nickname, icon_id),
        board:board_id(id, name, slug, parent_id, team_id, league_id)
      `)
      .eq("board_id", boardData.id)
      .eq("post_number", postNum)
      .single();

    if (postError || !postData) {
      console.error("게시글 정보 조회 오류:", postError);
      return NextResponse.json(
        { error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 3. 병렬로 첨부파일, 팀, 리그 정보 가져오기
    const [filesResult, teamResult, leagueResult] = await Promise.all([
      // 첨부파일 가져오기
      supabase
        .from("post_files")
        .select("*")
        .eq("post_id", postData.id),
      
      // 팀 정보 가져오기 (필요한 경우)
      boardData.team_id 
        ? supabase.from("teams").select("*").eq("id", boardData.team_id).single()
        : Promise.resolve({ data: null, error: null }),
      
      // 리그 정보 가져오기 (필요한 경우)
      boardData.league_id
        ? supabase.from("leagues").select("*").eq("id", boardData.league_id).single()
        : Promise.resolve({ data: null, error: null }),
    ]);

    // 4. 조회수 업데이트 (비동기로 처리)
    supabase
      .from("posts")
      .update({ views: (postData.views || 0) + 1 })
      .eq("id", postData.id)
      .then(({ error }) => {
        if (error) console.error("조회수 업데이트 오류:", error);
      });

    // 첨부파일 정보 추출
    const files = filesResult.error ? [] : filesResult.data || [];

    // 응답 데이터 구성
    const responseData = {
      post: {
        ...postData,
        files,
        views: (postData.views || 0) + 1, // 즉시 표시용 증가값
        team: teamResult.data || null,
        league: leagueResult.data || null,
      }
    };

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error("게시글 상세 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 