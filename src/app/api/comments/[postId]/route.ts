import { createClient } from "@/app/lib/supabase.server";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 30; // 30초마다 재검증
export const dynamic = 'force-dynamic'; // 동적 라우팅 강제

// 명시적인 타입 정의 추가
interface CommentWithIcon {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  parent_id?: string | null;
  profiles?: {
    id?: string;
    nickname?: string;
    icon_id?: number | null;
    icon_url?: string | null;
  } | null;
  children: CommentWithIcon[];
  [key: string]: unknown; // any 대신 unknown 사용
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    
    // 파라미터 검증
    if (!postId) {
      return NextResponse.json(
        { error: "유효하지 않은 게시글 ID입니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // 댓글 및 작성자 정보 가져오기 
    // (인덱스 활용을 위해 post_id로 필터링)
    const { data: comments, error } = await supabase
      .from("comments")
      .select(`
        *,
        profiles:user_id(id, nickname, icon_id)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
      
    if (error) {
      console.error("댓글 조회 오류:", error);
      return NextResponse.json(
        { error: "댓글을 가져오는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }
    
    // 아이콘 정보 가져오기
    const commentPromises = comments.map(async (comment) => {
      if (comment.profiles?.icon_id) {
        // 아이콘 정보 가져오기
        const { data: icon } = await supabase
          .from("icons")
          .select("url")
          .eq("id", comment.profiles.icon_id)
          .single();
          
        return {
          ...comment,
          profiles: {
            ...comment.profiles,
            icon_url: icon?.url || null
          }
        };
      }
      return comment;
    });
    
    // 아이콘 정보 가져오기를 모두 병렬로 처리
    const commentsWithIcons = await Promise.all(commentPromises);
    
    // 댓글 계층 구조 만들기
    const commentMap: Record<string, CommentWithIcon> = {};
    const rootComments: CommentWithIcon[] = [];
    
    // 모든 댓글을 맵에 추가
    commentsWithIcons.forEach((comment) => {
      commentMap[comment.id] = {
        ...comment,
        children: []
      };
    });
    
    // 부모-자식 관계 설정
    commentsWithIcons.forEach((comment) => {
      if (comment.parent_id && commentMap[comment.parent_id]) {
        commentMap[comment.parent_id].children.push(commentMap[comment.id]);
      } else {
        rootComments.push(commentMap[comment.id]);
      }
    });
    
    return NextResponse.json(rootComments);
  } catch (error: unknown) {
    console.error("댓글 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 