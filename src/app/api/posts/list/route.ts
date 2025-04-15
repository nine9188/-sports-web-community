import { createClient } from '@/app/lib/supabase.server';
import { NextRequest, NextResponse } from 'next/server';

// 인터페이스 정의
interface Board {
  id: string;
  name: string;
  slug?: string;
  parent_id?: string;
  team_id?: number | null;
  league_id?: number | null;
}

interface Team {
  id: number;
  name: string;
  country?: string;
  logo?: string;
}

interface League {
  id: number;
  name: string;
  country?: string;
  logo?: string;
}

interface PostProfile {
  id: string;
  nickname: string;
  avatar_url?: string;
}

// 게시글 데이터 인터페이스 추가
interface Post {
  id: string;
  title: string;
  content?: string;
  views: number;
  likes: number;
  created_at: string;
  updated_at: string;
  post_number: number;
  user_id: string;
  board_id: string;
  profiles?: PostProfile;
}

export const revalidate = 60; // 1분마다 재검증

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    // 필수 파라미터 검증
    if (!body || !body.boardIds || !Array.isArray(body.boardIds)) {
      return NextResponse.json(
        { error: "유효하지 않은 요청 파라미터입니다." },
        { status: 400 }
      );
    }

    const { boardIds, currentBoardId, limit = 10, offset = 0, fromParam } = body;

    // 특별한 값 'all'이 들어올 경우 전체 게시판 대상으로 데이터 가져오기
    let boardIdCondition;
    
    // fromParam 처리 로직
    if (fromParam === 'boards' && currentBoardId) {
      // from=boards인 경우 현재 게시판만 표시
      boardIdCondition = supabase.from("posts").select("*, profiles:user_id(*)").eq("board_id", currentBoardId).order("created_at", { ascending: false });
    } else if (fromParam && fromParam !== 'boards') {
      // fromParam이 유효한 게시판 ID인 경우 해당 게시판 필터링
      // 먼저 해당 게시판이 존재하는지 확인
      const { data: fromBoardData } = await supabase
        .from("boards")
        .select("id")
        .eq("id", fromParam)
        .single();
      
      if (fromBoardData) {
        // 유효한 게시판 ID인 경우 해당 게시판 필터링
        boardIdCondition = supabase.from("posts").select("*, profiles:user_id(*)").eq("board_id", fromParam).order("created_at", { ascending: false });
      } else {
        // 기본 필터링 적용
        if (boardIds.length === 1 && boardIds[0] === 'all') {
          boardIdCondition = supabase.from("posts").select("*, profiles:user_id(*)").order("created_at", { ascending: false });
        } else {
          boardIdCondition = supabase.from("posts").select("*, profiles:user_id(*)").in("board_id", boardIds).order("created_at", { ascending: false });
        }
      }
    } else if (boardIds.length === 1 && boardIds[0] === 'all') {
      boardIdCondition = supabase.from("posts").select("*, profiles:user_id(*)").order("created_at", { ascending: false });
    } else {
      boardIdCondition = supabase.from("posts").select("*, profiles:user_id(*)").in("board_id", boardIds).order("created_at", { ascending: false });
    }

    // 게시물 및 관련 데이터 효율적으로 가져오기
    const [postsResult, boardsResult, teamsResult, leaguesResult] = await Promise.all([
      // 1. 게시물 데이터 가져오기
      boardIdCondition.range(offset, offset + limit - 1),
      
      // 2. 게시판 정보 가져오기
      supabase.from("boards").select("*"),
      
      // 3. 팀 정보 가져오기
      supabase.from("teams").select("*"),
      
      // 4. 리그 정보 가져오기
      supabase.from("leagues").select("*")
    ]);

    // 게시물 데이터 조회 오류 확인
    if (postsResult.error) {
      return NextResponse.json(
        { error: "게시물을 불러오는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const posts = postsResult.data || [];

    // 게시물이 없는 경우
    if (posts.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 게시물 ID 목록 추출
    const postIds = posts.map((post) => post.id);

    // 5. 댓글 수 가져오기
    let commentsCountData: { post_id: string; count: number }[] = [];

    try {
      // 각 게시물별로 댓글 수 가져오기
      const countPromises = postIds.map(async (postId) => {
        const { count, error } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);
          
        if (error) throw error;
        
        return {
          post_id: postId,
          count: count || 0
        };
      });
      
      commentsCountData = await Promise.all(countPromises);
    } catch {
      // 데이터 조회 오류 확인
      return NextResponse.json(
        { error: "관련 데이터를 불러오는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 맵 객체 생성 및 데이터 맵핑
    const boardsMap = (boardsResult.data || []).reduce((map, board) => {
      map[board.id] = board;
      return map;
    }, {} as Record<string, Board>);

    const teamsMap = (teamsResult.data || []).reduce((map, team) => {
      map[team.id] = team;
      return map;
    }, {} as Record<number, Team>);

    const leaguesMap = (leaguesResult.data || []).reduce((map, league) => {
      map[league.id] = league;
      return map;
    }, {} as Record<number, League>);

    interface CommentCount {
      post_id: string;
      count: number;
    }

    const commentsCountMap = (commentsCountData || []).reduce((map: Record<string, number>, item: CommentCount) => {
      map[item.post_id] = item.count;
      return map;
    }, {} as Record<string, number>);

    // 포맷된 게시물 데이터 생성
    const formattedPosts = posts.map((post: Post) => {
      const board = boardsMap[post.board_id];
      const profile = post.profiles as PostProfile;
      const teamId = board?.team_id;
      const leagueId = board?.league_id;

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        view_count: post.views || 0,
        like_count: post.likes || 0,
        comment_count: commentsCountMap[post.id] || 0,
        created_at: post.created_at,
        updated_at: post.updated_at,
        post_number: post.post_number && post.post_number > 0 ? post.post_number : 1,
        user_id: post.user_id,
        board_id: post.board_id,
        writer: profile
          ? {
              id: profile.id,
              nickname: profile.nickname,
              avatar_url: profile.avatar_url,
            }
          : null,
        board: board
          ? {
              id: board.id,
              name: board.name,
              slug: board.slug,
            }
          : null,
        team: teamId && teamsMap[teamId]
          ? {
              id: teamsMap[teamId].id,
              name: teamsMap[teamId].name,
              country: teamsMap[teamId].country,
              logo: teamsMap[teamId].logo,
            }
          : null,
        league: leagueId && leaguesMap[leagueId]
          ? {
              id: leaguesMap[leagueId].id,
              name: leaguesMap[leagueId].name,
              country: leaguesMap[leagueId].country,
              logo: leaguesMap[leagueId].logo,
            }
          : null,
        is_current_board: post.board_id === currentBoardId,
      };
    });

    return NextResponse.json({ data: formattedPosts });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 