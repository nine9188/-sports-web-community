import React from 'react';
import { createClient } from '@/app/lib/supabase.server';
import { notFound } from 'next/navigation';
import { ScrollArea } from '@/app/ui/scroll-area';
import BoardBreadcrumbs from '@/app/boards/components/BoardBreadcrumbs';
import PostList from '@/app/components/post/PostList';
import BoardTeamInfo from '@/app/boards/components/BoardTeamInfo';
import LeagueInfo from '@/app/boards/components/LeagueInfo';
import BoardPagination from '@/app/boards/components/BoardPagination';
import { PenLine } from 'lucide-react';
import Link from 'next/link';
import ServerHoverMenu from '@/app/boards/components/ServerHoverMenu';

// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic';

export const revalidate = 0;

// 인터페이스 정의
interface Board {
  id: string;
  name: string;
  slug?: string;
  parent_id?: string;
  team_id?: number | null;
  league_id?: number | null;
  display_order?: number;
}

interface BoardMap {
  [key: string]: Board;
}

interface ChildBoardsMap {
  [key: string]: Board[];
}

interface BoardNameMap {
  [key: string]: string;
}

interface BoardDataMap {
  [key: string]: {
    team_id: number | null;
    league_id: number | null;
    slug: string;
  };
}

interface Team {
  id: number;
  name: string;
  country?: string;
  founded?: number;
  logo?: string;
  venue_name?: string;
  venue_city?: string;
  venue_capacity?: number;
}

interface League {
  id: number;
  name: string;
  country?: string;
  logo?: string;
  type?: string;
}

interface PostProfile {
  id: string;
  nickname: string;
}

// 브레드크럼 생성 함수
function generateBoardBreadcrumbs(currentBoard: Board, boardsMap: BoardMap) {
  const boardPath: Array<{id: string; name: string; slug: string}> = [];
  
  // 현재 게시판 추가
  boardPath.push({
    id: currentBoard.id,
    name: currentBoard.name,
    slug: currentBoard.slug || currentBoard.id
  });
  
  // 상위 게시판들 추적
  let parentId = currentBoard.parent_id;
  while (parentId) {
    const parentBoard = boardsMap[parentId];
    if (parentBoard) {
      boardPath.unshift({
        id: parentBoard.id,
        name: parentBoard.name,
        slug: parentBoard.slug || parentBoard.id
      });
      parentId = parentBoard.parent_id;
    } else {
      break;
    }
  }
  
  return boardPath;
}

// 최상위 게시판 찾기 함수 추가
function findRootBoard(boardId: string, boardsMap: BoardMap) {
  let currentId = boardId;
  while (boardsMap[currentId]?.parent_id) {
    currentId = boardsMap[currentId].parent_id || '';
  }
  return currentId;
}

// 게시판 레벨 결정 함수 추가
function getBoardLevel(boardId: string, boardsMap: BoardMap, childBoardsMap: ChildBoardsMap) {
  // 부모가 없으면 최상위 게시판
  if (!boardsMap[boardId]?.parent_id) {
    return 'top';
  }
  
  // 부모가 있고 자식이 있으면 상위 게시판
  if (boardsMap[boardId]?.parent_id && childBoardsMap[boardId]?.length > 0) {
    return 'mid';
  }
  
  // 부모가 있고 자식이 없으면 하위 게시판
  return 'bottom';
}

// 게시판 계층에 따른 필터링할 게시판 ID 목록 가져오기
function getFilteredBoardIds(boardId: string, boardLevel: string, boardsMap: BoardMap, childBoardsMap: ChildBoardsMap) {
  const result = new Set<string>();
  
  // 최상위 게시판: 모든 하위 게시판 포함
  if (boardLevel === 'top') {
    // 자신 추가
    result.add(boardId);
    
    // 직접 하위 게시판 추가
    if (childBoardsMap[boardId]) {
      for (const child of childBoardsMap[boardId]) {
        result.add(child.id);
        
        // 하위 게시판의 하위 게시판 추가 (손자)
        if (childBoardsMap[child.id]) {
          for (const grandChild of childBoardsMap[child.id]) {
            result.add(grandChild.id);
          }
        }
      }
    }
  } 
  // 상위 게시판: 자신과 직접 하위 게시판
  else if (boardLevel === 'mid') {
    // 자신 추가
    result.add(boardId);
    
    // 직접 하위 게시판 추가
    if (childBoardsMap[boardId]) {
      for (const child of childBoardsMap[boardId]) {
        result.add(child.id);
      }
    }
  } 
  // 하위 게시판: 자신만 포함
  else {
    result.add(boardId);
  }
  
  return Array.from(result);
}

export default async function BoardDetailPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ page?: string }>
}) {
  try {
    // params와 searchParams를 병렬로 처리
    const [{ slug }, resolvedParams] = await Promise.all([
      params, 
      searchParams
    ]);
    
    // 페이지 파라미터 처리
    const page = resolvedParams?.page ? parseInt(resolvedParams.page, 10) : 1;
    
    // 페이지 값이 유효하지 않으면 기본값 1로 설정
    const currentPage = isNaN(page) || page < 1 ? 1 : page;
    
    const supabase = await createClient();
    
    // 사용자 인증 확인 (로그인 상태)
    const { data: userData } = await supabase.auth.getUser();
    const isLoggedIn = !!userData?.user;
    
    // 1. 현재 slug로 게시판 정보 조회
    const { data: boardData, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (boardError) {
      throw new Error('게시판을 찾을 수 없습니다');
    }
    
    // 2. 모든 게시판 조회 (계층 구조 파악을 위해)
    const { data: allBoardsData } = await supabase
      .from('boards')
      .select('*');
    
    // 3. 게시판 계층 구조 설정
    const boardsMap: BoardMap = {};
    const childBoardsMap: ChildBoardsMap = {};
    const boardNameMap: BoardNameMap = {};
    
    // 모든 게시판 정보 맵핑
    if (allBoardsData) {
      allBoardsData.forEach(board => {
        boardsMap[board.id] = board;
        boardNameMap[board.id] = board.name;
        
        // 부모 ID 기준으로 자식 게시판 맵핑
        if (board.parent_id) {
          if (!childBoardsMap[board.parent_id]) {
            childBoardsMap[board.parent_id] = [];
          }
          childBoardsMap[board.parent_id].push(board);
        }
      });
    }
    
    // 4. 브레드크럼 생성 - 중요!
    const breadcrumbs = generateBoardBreadcrumbs(boardData, boardsMap);
    
    // 현재 게시판의 레벨 결정 (최상위, 상위, 하위)
    const boardLevel = getBoardLevel(boardData.id, boardsMap, childBoardsMap);
    
    // 레벨에 따라 필터링할 게시판 ID 결정
    const filteredBoardIds = getFilteredBoardIds(boardData.id, boardLevel, boardsMap, childBoardsMap);
    
    // 총 게시글 수 가져오기
    const { count: totalCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .in('board_id', filteredBoardIds);
    
    // 페이지당 게시글 수와 총 페이지 수 계산
    const pageSize = 20;
    const totalPages = Math.ceil((totalCount || 0) / pageSize);
    const from = (currentPage - 1) * pageSize;
    
    // 5. 게시글 목록 조회 (필터링된 게시판 ID로 조회, 페이지네이션 적용)
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        id, 
        title, 
        created_at, 
        board_id,
        views,
        likes, 
        post_number,
        profiles (
          id,
          nickname
        ),
        content
      `)
      .in('board_id', filteredBoardIds)
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1); // 페이지네이션 적용
    
    if (postsError) {
      throw new Error('게시글 목록을 가져오는 중 오류가 발생했습니다');
    }
    
    // 6. 댓글 수 조회
    const postIds = postsData.map(post => post.id);
    const commentCounts: Record<string, number> = {};
    
    if (postIds.length > 0) {
      await Promise.all(
        postIds.map(async (postId) => {
          const { count, error } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);
            
          if (!error) {
            commentCounts[postId] = count || 0;
          }
        })
      );
    }
    
    // 7. 팀/리그 데이터 처리
    const { data: teamsData } = await supabase
      .from('teams')
      .select('*');
      
    const { data: leaguesData } = await supabase
      .from('leagues')
      .select('*');
    
    // 데이터 가공
    const teamsMap: Record<number, Team> = {};
    teamsData?.forEach(team => { teamsMap[team.id] = team; });
    
    const leaguesMap: Record<number, League> = {};
    leaguesData?.forEach(league => { leaguesMap[league.id] = league; });

    // 게시판 정보 가져오기
    const { data: boardsWithTeamInfo } = await supabase
      .from('boards')
      .select('id, team_id, league_id, slug')
      .in('id', allBoardsData?.map(b => b.id) || []);

    // 게시판 데이터 맵 만들기
    const boardsData: BoardDataMap = (boardsWithTeamInfo || []).reduce((map: BoardDataMap, board) => {
      map[board.id] = { 
        team_id: board.team_id || null, 
        league_id: board.league_id || null,
        slug: board.slug || board.id
      };
      return map;
    }, {});

    // 팀/리그 데이터 가져오기
    let teamData = null;
    let leagueData = null;
    
    if (boardData.team_id) {
      const { data: team } = await supabase
        .from('teams')
        .select('*')
        .eq('id', boardData.team_id)
        .single();
      
      if (team) {
        teamData = {
          team: {
            id: team.id,
            name: team.name,
            country: team.country || '',
            founded: team.founded || 0,
            logo: team.logo || 'https://via.placeholder.com/80'
          },
          venue: {
            name: team.venue_name || 'Unknown',
            city: team.venue_city || '',
            capacity: team.venue_capacity || 0
          }
        };
      }
    }

    if (boardData.league_id) {
      const { data: league } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', boardData.league_id)
        .single();
      
      if (league) {
        leagueData = {
          id: league.id,
          name: league.name,
          country: league.country || '',
          logo: league.logo || 'https://via.placeholder.com/80',
          type: league.type || 'League'
        };
      }
    }
    
    // 최상위 게시판의 ID 및 slug 확인
    const rootBoardId = findRootBoard(boardData.id, boardsMap);
    const rootBoardSlug = boardsMap[rootBoardId]?.slug || rootBoardId;

    // 최종 게시글 데이터 형태로 가공
    const formattedPosts = postsData.map(post => {
      const boardInfo = boardsMap[post.board_id] || {};
      const boardTeamId = boardInfo.team_id;
      const boardLeagueId = boardInfo.league_id;
      const teamLogo = boardTeamId && typeof boardTeamId === 'number' ? teamsMap[boardTeamId]?.logo : null;
      const leagueLogo = boardLeagueId && typeof boardLeagueId === 'number' ? leaguesMap[boardLeagueId]?.logo : null;
      
      // post.profiles 처리
      const profile = post.profiles as unknown as PostProfile;

      return {
        id: post.id,
        title: post.title,
        created_at: post.created_at,
        board_id: post.board_id,
        board_name: boardNameMap[post.board_id] || '알 수 없음',
        board_slug: boardsData[post.board_id]?.slug || post.board_id,
        post_number: post.post_number,
        author_nickname: profile?.nickname || '익명',
        author_id: profile?.id,
        views: post.views || 0,
        likes: post.likes || 0,
        comment_count: commentCounts[post.id] || 0,
        content: post.content,
        team_id: boardTeamId,
        league_id: boardLeagueId,
        team_logo: teamLogo,
        league_logo: leagueLogo
      };
    });

    return (
      <div className="container mx-auto">
        <div className="mb-4">
          <BoardBreadcrumbs breadcrumbs={breadcrumbs} />
        </div>
        
        {teamData && (
          <div className="mb-4 hidden sm:block">
            <BoardTeamInfo 
              teamData={teamData}
              boardId={boardData.id}
              boardSlug={slug}
              isLoggedIn={isLoggedIn}
            />
          </div>
        )}

        {leagueData && (
          <div className="mb-4 hidden sm:block">
            <LeagueInfo 
              leagueData={leagueData}
              boardId={boardData.id}
              boardSlug={slug}
              isLoggedIn={isLoggedIn}
            />
          </div>
        )}
        
        <div className="mb-4 border rounded-md shadow-sm">
          <ServerHoverMenu
            currentBoardId={boardData.id}
            rootBoardId={rootBoardId}
            currentBoardSlug={slug}
            rootBoardSlug={rootBoardSlug}
          />
        </div>
        
        <div className="mb-4 relative">
          {/* 글쓰기 버튼 - 모바일에서 고정 위치 (로그인 시에만) */}
          {isLoggedIn && (
            <div className="sm:hidden fixed bottom-4 right-4 z-30">
              <Link href={`/boards/${slug}/create`}>
                <button className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-medium py-2 px-4 shadow-md border border-slate-700 transition-colors">
                  <PenLine className="h-4 w-4" />
                  <span>글쓰기</span>
                </button>
              </Link>
            </div>
          )}
          
          <ScrollArea className="h-full">
            <PostList 
              posts={formattedPosts}
              currentBoardId={boardData.id}
              showBoard={true}
            />
          </ScrollArea>
          
          <div className="flex items-center mt-4">
            <div className="flex-1"></div>
            
            <div className="flex-1 flex justify-center">
              <BoardPagination
                currentPage={currentPage}
                totalPages={totalPages}
                boardSlug={slug}
              />
            </div>
            
            <div className="flex-1 flex justify-end">
              {/* 데스크톱용 글쓰기 버튼 (로그인 시에만) */}
              {isLoggedIn && (
                <div className="hidden sm:block">
                  <Link href={`/boards/${slug}/create`}>
                    <button className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white py-2 px-3 rounded-md text-sm font-medium border border-slate-700 transition-colors">
                      <PenLine className="h-4 w-4" />
                      <span>글쓰기</span>
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('게시판 상세 페이지 로딩 중 오류:', error);
    return notFound();
  }
} 