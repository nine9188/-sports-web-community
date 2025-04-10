import { createClient } from "@/app/lib/supabase.server";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 60; // 1분마다 재검증

interface CommentProfile {
  id: string;
  nickname: string;
  avatar_url?: string;
}

interface CommentData {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  post_id: string;
  profiles: CommentProfile | null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    // 필수 파라미터 검증
    if (!body || !body.boardSlug || !body.postNumber) {
      return NextResponse.json(
        { error: "유효하지 않은 요청 파라미터입니다." },
        { status: 400 }
      );
    }

    const { boardSlug, postNumber } = body;
    
    // 게시글 번호 검증
    const postNum = parseInt(postNumber, 10);
    if (isNaN(postNum) || postNum <= 0) {
      return NextResponse.json(
        { error: "유효하지 않은 게시글 번호입니다." },
        { status: 400 }
      );
    }

    // 1. 게시판 정보 가져오기
    const { data: boardData, error: boardError } = await supabase
      .from("boards")
      .select("*")
      .eq("slug", boardSlug)
      .single();

    if (boardError || !boardData) {
      console.error("게시판 정보 조회 오류:", boardError);
      return NextResponse.json(
        { error: "게시판을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 2. 게시글 정보 가져오기
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("*, profiles:user_id(*)")
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

    // 3. 팀 및 리그 정보 가져오기 (필요한 경우)
    const [teamResult, leagueResult, commentsResult] = await Promise.all([
      boardData.team_id 
        ? supabase.from("teams").select("*").eq("id", boardData.team_id).single()
        : Promise.resolve({ data: null, error: null }),
      
      boardData.league_id
        ? supabase.from("leagues").select("*").eq("id", boardData.league_id).single()
        : Promise.resolve({ data: null, error: null }),
      
      // 4. 댓글 정보 가져오기
      supabase
        .from("comments")
        .select("*, profiles:user_id(*)")
        .eq("post_id", postData.id)
        .order("created_at", { ascending: true })
    ]);

    // 5. 조회수 업데이트 (비동기로 처리)
    supabase
      .from("posts")
      .update({ view_count: (postData.view_count || 0) + 1 })
      .eq("id", postData.id)
      .then(({ error }) => {
        if (error) console.error("조회수 업데이트 오류:", error);
      });

    // 응답 데이터 구성
    const responseData = {
      post: {
        id: postData.id,
        title: postData.title,
        content: postData.content,
        created_at: postData.created_at,
        updated_at: postData.updated_at,
        view_count: (postData.view_count || 0) + 1, // 즉시 표시용 증가값
        like_count: postData.like_count || 0,
        post_number: postData.post_number && postData.post_number > 0 ? postData.post_number : 1, // 값이 없거나 0 이하인 경우 1로 설정
        user_id: postData.user_id,
        board_id: postData.board_id,
        writer: postData.profiles ? {
          id: postData.profiles.id,
          nickname: postData.profiles.nickname,
          avatar_url: postData.profiles.avatar_url,
        } : null,
      },
      board: {
        id: boardData.id,
        name: boardData.name,
        slug: boardData.slug,
      },
      team: teamResult.data ? {
        id: teamResult.data.id,
        name: teamResult.data.name,
        country: teamResult.data.country,
        logo: teamResult.data.logo,
      } : null,
      league: leagueResult.data ? {
        id: leagueResult.data.id,
        name: leagueResult.data.name,
        country: leagueResult.data.country,
        logo: leagueResult.data.logo,
      } : null,
      comments: commentsResult.data ? commentsResult.data.map((comment: CommentData) => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user_id: comment.user_id,
        post_id: comment.post_id,
        writer: comment.profiles ? {
          id: comment.profiles.id,
          nickname: comment.profiles.nickname,
          avatar_url: comment.profiles.avatar_url,
        } : null,
      })) : [],
    };

    return NextResponse.json({ data: responseData });
  } catch (error: unknown) {
    console.error("게시글 상세 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 