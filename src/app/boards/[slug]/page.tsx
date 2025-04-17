import React from 'react';
import { createClient } from '@/app/lib/supabase.server';
import { notFound } from 'next/navigation';
import { ScrollArea } from '@/app/ui/scroll-area';
import BoardBreadcrumbs from '@/app/boards/components/BoardBreadcrumbs';
import ServerPostList from '@/app/components/post/ServerPostList';
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

// ErrorComponent 추가
function ErrorComponent({ message }: { message: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-md p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">오류가 발생했습니다</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
      </div>
    </div>
  );
}

export default async function BoardDetailPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ page?: string; from?: string }>
}) {
  try {
    // 파라미터 및 쿼리 매개변수 추출
    const { slug } = await params;
    const { page = '1', from: fromParam } = await searchParams;
    
    // 페이지 값이 유효하지 않으면 기본값 1로 설정
    const currentPage = isNaN(parseInt(page, 10)) || parseInt(page, 10) < 1 ? 1 : parseInt(page, 10);
    
    const supabase = await createClient();
    
    // 사용자 인증 확인 (로그인 상태)
    const { data: userData } = await supabase.auth.getUser();
    const isLoggedIn = !!userData?.user;
    
    // 병렬로 데이터 요청 처리
    const [boardResult, allBoardsResult] = await Promise.all([
      // 1. 현재 slug로 게시판 정보 조회
      supabase
        .from('boards')
        .select('*')
        .eq('slug', slug)
        .single(),
      
      // 2. 모든 게시판 조회 (계층 구조 파악을 위해)
      supabase
        .from('boards')
        .select('*')
    ]);
    
    // 게시판 검증
    if (boardResult.error) {
      return notFound();
    }
    
    const boardData = boardResult.data;
    const allBoardsData = allBoardsResult.data || [];
    
    // 3. 게시판 계층 구조 설정
    const boardsMap: BoardMap = {};
    const childBoardsMap: ChildBoardsMap = {};
    const boardNameMap: BoardNameMap = {};
    
    // 모든 게시판 정보 맵핑
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
    
    // 4. 브레드크럼 생성
    const breadcrumbs = generateBoardBreadcrumbs(boardData, boardsMap);
    
    // 현재 게시판의 레벨 결정 (최상위, 상위, 하위)
    const boardLevel = getBoardLevel(boardData.id, boardsMap, childBoardsMap);
    
    // fromParam 처리: 
    // - from=boards인 경우 현재 게시판만 표시
    // - fromParam이 유효한 게시판 ID인 경우 해당 게시판 필터링
    // - 그 외의 경우 기본 필터링 적용
    let filteredBoardIds: string[] = [];
    
    if (fromParam === 'boards') {
      // 현재 게시판만 표시
      filteredBoardIds = [boardData.id];
    } else if (fromParam && boardsMap[fromParam]) {
      // fromParam이 유효한 게시판 ID인 경우 해당 게시판 관련 게시글 표시
      const fromBoardLevel = getBoardLevel(fromParam, boardsMap, childBoardsMap);
      filteredBoardIds = getFilteredBoardIds(fromParam, fromBoardLevel, boardsMap, childBoardsMap);
    } else {
      // 기본 필터링 적용
      filteredBoardIds = getFilteredBoardIds(boardData.id, boardLevel, boardsMap, childBoardsMap);
    }
    
    // 최상위 게시판의 ID 및 slug 확인
    const rootBoardId = findRootBoard(boardData.id, boardsMap);
    const rootBoardSlug = boardsMap[rootBoardId]?.slug || rootBoardId;
    
    // 팀/리그 데이터 병렬 요청
    let teamData = null;
    let leagueData = null;
    
    if (boardData.team_id || boardData.league_id) {
      const [teamResult, leagueResult] = await Promise.all([
        boardData.team_id 
          ? supabase
              .from('teams')
              .select('*')
              .eq('id', boardData.team_id)
              .single()
          : Promise.resolve({ data: null }),
          
        boardData.league_id 
          ? supabase
              .from('leagues')
              .select('*')
              .eq('id', boardData.league_id)
              .single()
          : Promise.resolve({ data: null })
      ]);
      
      // 팀 데이터 처리
      if (teamResult.data) {
        const team = teamResult.data;
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
      
      // 리그 데이터 처리
      if (leagueResult.data) {
        const league = leagueResult.data;
        leagueData = {
          id: league.id,
          name: league.name,
          country: league.country || '',
          logo: league.logo || 'https://via.placeholder.com/80',
          type: league.type || 'League'
        };
      }
    }

    return (
      <div className="container mx-auto">
        <div className="mb-4 sm:mt-0 mt-4">
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
        
        <div className="mb-4">
          {/* 게시판 네비게이션 메뉴 
            - 최상위 게시판 (전체/해외축구): rootBoardId
            - 상위 게시판 (프리미어리그, 라리가 등): 드롭다운 메뉴를 가진 항목
            - 하위 게시판: 드롭다운 내부에 표시되는 항목들
          */}
          <ServerHoverMenu
            currentBoardId={boardData.id}
            rootBoardId={rootBoardId}
            currentBoardSlug={slug}
            rootBoardSlug={rootBoardSlug}
            fromParam={fromParam}
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
            <ServerPostList 
              boardIds={filteredBoardIds}
              currentBoardId={boardData.id}
              showBoard={true}
              fromParam={fromParam}
              className="overflow-hidden"
              initialPage={currentPage}
            />
          </ScrollArea>
          
          <div className="flex items-center mt-4">
            <div className="flex-1"></div>
            
            <div className="flex-1 flex justify-center">
              <BoardPagination
                currentPage={currentPage}
                totalPages={10} /* 무한 스크롤 사용으로 페이지네이션은 표시만 함 */
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
    console.error("BoardDetailPage Error:", error);
    return <ErrorComponent message="게시판 정보를 불러오는 중 오류가 발생했습니다." />;
  }
} 