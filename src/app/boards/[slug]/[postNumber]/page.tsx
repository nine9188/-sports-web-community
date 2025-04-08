import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/app/lib/supabase-server';
import { Button } from '@/app/ui/button';
import CommentSection from '@/app/boards/components/CommentSection';
import PostActions from '@/app/boards/components/PostActions';
import PostNavigation from '@/app/boards/components/PostNavigation';
import PostFooter from '@/app/boards/components/PostFooter';
import HoverMenu from '@/app/boards/components/HoverMenu';
import PostList from '@/app/components/post/PostList';
import BoardBreadcrumbs from '@/app/boards/components/BoardBreadcrumbs';
import PostHeader from '@/app/boards/components/PostHeader';
import PostContent from '@/app/boards/components/PostContent';
import { incrementViewCount } from '@/app/lib/api/posts';

// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic';

export const revalidate = 0;

// 타입 정의 추가
interface Board {
  id: string;
  name: string;
  slug?: string;
  parent_id?: string | null;
  team_id?: number | null;
  league_id?: number | null;
  parent?: Board;
  display_order?: number;
}

// HoverMenu 컴포넌트의 요구사항에 맞는 인터페이스 정의
interface ChildBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

interface TopBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

interface TeamInfo {
  name: string;
  logo: string;
}

interface LeagueInfo {
  name: string;
  logo: string;
}

interface FileData {
  url: string;
  filename: string;
}

interface IconData {
  id: number;
  image_url: string;
}

interface BoardData {
  team_id: number | null;
  league_id: number | null;
  slug: string;
}

export default async function PostDetailPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string, postNumber: string }>,
  searchParams: Promise<{ from?: string, page?: string }>
}) {
  try {
    // 두 개의 비동기 값을 병렬로 처리하기
    const [{ slug, postNumber }, resolvedSearchParams] = await Promise.all([
      params,
      searchParams
    ]);
    
    // 이제 resolvedSearchParams에서 from 값과 page 값을 안전하게 추출
    const fromBoardId = resolvedSearchParams?.from;
    const page = resolvedSearchParams?.page ? parseInt(resolvedSearchParams.page, 10) : 1;
    
    // 페이지 값이 유효하지 않으면 기본값 1로 설정
    const currentPage = isNaN(page) || page < 1 ? 1 : page;
    
    // 특수 케이스 처리: 'undefined'가 문자열로 전달된 경우
    const normalizedFromBoardId = fromBoardId === 'undefined' ? undefined : fromBoardId;
    
    if (!slug || !postNumber) {
      console.error('유효하지 않은 파라미터:', { slug, postNumber });
      return notFound();
    }
    
    const postNum = parseInt(postNumber, 10);
    if (isNaN(postNum)) {
      console.error('유효하지 않은 게시글 번호:', postNumber);
      return notFound();
    }
    
    const supabase = await createClient();
    
    // slug로 게시판 정보 가져오기
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*, parent:parent_id(*)')
      .eq('slug', slug)
      .single();
      
    if (boardError || !board) {
      console.error('게시판을 찾을 수 없음:', boardError?.message || '게시판 데이터 없음');
      return notFound();
    }

    // 게시판 ID와 게시물 번호로 게시물 정보 가져오기
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (
          id,
          nickname,
          icon_id
        ),
        board:board_id(name, id, parent_id)
      `)
      .eq('board_id', board.id)
      .eq('post_number', postNum)
      .single();
      
    if (postError || !post) {
      console.error('게시글을 찾을 수 없음:', postError?.message || '게시글 데이터 없음', 
        { board_id: board.id, post_number: postNum });
      return notFound();
    }

    // 이전글, 다음글 정보 가져오기 - post_number 기준으로 수정
    let prevPost = null;
    try {
      const { data } = await supabase
        .from('posts')
        .select('id, title, post_number')
        .eq('board_id', board.id)
        .lt('post_number', postNum)
        .order('post_number', { ascending: false })
        .limit(1);
      
      prevPost = data && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.log('이전글 가져오기 오류:', err);
    }
      
    let nextPost = null;
    try {
      const { data } = await supabase
        .from('posts')
        .select('id, title, post_number')
        .eq('board_id', board.id)
        .gt('post_number', postNum)
        .order('post_number', { ascending: true })
        .limit(1);
      
      nextPost = data && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.log('다음글 가져오기 오류:', err);
    }
    
    // 댓글 가져오기
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (
          nickname,
          icon_id
        )
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
      
    if (commentsError) {
      console.error('댓글을 가져오는 중 오류가 발생했습니다:', commentsError);
    }
    
    // 사용자 세션 확인 (글 작성자인지 확인용)
    const { data: userData } = await supabase.auth.getUser();
    const isAuthor = userData?.user?.id === post.user_id;
    
    // 게시판 경로 표시를 위한 정보 - 브레드크럼 형식으로 수정
    // 최상위 게시판(게시판 목록)부터 시작
    const breadcrumbs = [
      {
        id: 'boards',
        name: '해외축구',
        slug: 'soccer'
      }
    ];
    
    // 부모 게시판 추가
    if (board.parent) {
      breadcrumbs.push({
        id: board.parent.id,
        name: board.parent.name,
        slug: board.parent.slug || board.parent.id
      });
    }
    
    // 현재 게시판 추가
    breadcrumbs.push({
      id: board.id,
      name: board.name,
      slug: board.slug || board.id
    });
    
    // 현재 게시글 추가 - 브레드크럼의 마지막 항목으로
    breadcrumbs.push({
      id: post.id,
      name: post.title,
      slug: `${board.slug || board.id}/${postNumber}`
    });
    
    // 최상위 게시판 정보 가져오기 (탭 메뉴용)
    let rootBoardId = board.id;
    let currentBoard = board;
    
    // 현재 게시판이 하위 게시판인 경우 최상위까지 올라가기
    while (currentBoard.parent_id) {
      rootBoardId = currentBoard.parent_id;
      const { data: parentBoard } = await supabase
        .from('boards')
        .select('*, parent:parent_id(*)')
        .eq('id', currentBoard.parent_id)
        .single();
      
      if (!parentBoard) break;
      currentBoard = parentBoard;
    }
    
    // 최상위 게시판의 직계 하위 게시판들 가져오기 (탭 메뉴용)
    const { data: topLevelBoards } = await supabase
      .from('boards')
      .select('*')
      .eq('parent_id', rootBoardId)
      .order('name', { ascending: true });
    
    // 최상위 게시판에 속한 모든 게시판의 mapping 가져오기
    const allBoardsUnderRoot: Record<string, Board[]> = {};
    
    if (topLevelBoards && topLevelBoards.length > 0) {
      for (const topBoard of topLevelBoards) {
        const { data: childBoards } = await supabase
          .from('boards')
          .select('*')
          .eq('parent_id', topBoard.id)
          .order('name', { ascending: true });
        
        allBoardsUnderRoot[topBoard.id] = childBoards || [];
      }
    }
    
    // 현재 선택된 탭 식별
    let activeTabId = rootBoardId; // 기본값은 루트
    
    if (board.parent_id) {
      // 현재 게시판이 최하위 게시판인 경우
      if (topLevelBoards && topLevelBoards.some(tb => tb.id === board.parent_id)) {
        activeTabId = board.parent_id;
      } 
      // 현재 게시판이 중간 레벨 게시판인 경우
      else {
        for (const topBoardId in allBoardsUnderRoot) {
          if (allBoardsUnderRoot[topBoardId].some(b => b.id === board.id)) {
            activeTabId = topBoardId;
            break;
          }
        }
      }
    }
    
    // 모든 하위 게시판 ID 가져오기 (재귀적으로 모든 계층)
    async function getAllSubBoardIds(parentId: string): Promise<string[]> {
      const { data: directSubBoards, error } = await supabase
        .from('boards')
        .select('id')
        .eq('parent_id', parentId);
        
      if (error || !directSubBoards || directSubBoards.length === 0) {
        return [];
      }
      
      const allIds = directSubBoards.map(b => b.id);
      
      // 각 하위 게시판에 대해 재귀적으로 더 깊은 레벨의 하위 게시판 ID 가져오기
      const deeperLevelPromises = directSubBoards.map(subBoard => 
        getAllSubBoardIds(subBoard.id)
      );
      
      const deeperLevelIds = await Promise.all(deeperLevelPromises);
      
      // 모든 레벨의 ID를 합치기
      return [...allIds, ...deeperLevelIds.flat()];
    }
    
    // 현재 게시판과 모든 계층의 하위 게시판 ID 가져오기
    const allSubBoardIds = await getAllSubBoardIds(rootBoardId);
    const allBoardIds = [rootBoardId, ...allSubBoardIds];
    
    // 모든 게시판 가져오기 (게시글의 게시판 이름 표시용)
    const { data: allBoards } = await supabase
      .from('boards')
      .select('id, name, parent_id, slug, team_id, league_id')
      .in('id', allBoardIds);
      
    const boardNameMap = (allBoards || []).reduce((map, board) => {
      map[board.id] = board.name;
      return map;
    }, {} as Record<string, string>);
    
    // 게시판 데이터 맵 만들기 (slug 포함)
    const boardsData = (allBoards || []).reduce((map, board) => {
      map[board.id] = { 
        team_id: board.team_id || null, 
        league_id: board.league_id || null,
        slug: board.slug || board.id
      };
      return map;
    }, {} as Record<string, BoardData>);
    
    // 게시글 필터링 함수 
    async function getFilteredPostsByBoardHierarchy(
      currentBoardId: string,
      fromBoardId: string | undefined,
      rootBoardId: string,
      allBoardIds: string[],
      page: number = 1
    ) {
      // 'undefined'를 문자열로 전달받는 경우 처리
      if (fromBoardId === 'undefined') {
        fromBoardId = undefined;
      }
      
      // 출발 게시판 ID가 없거나 'boards'인 경우 모든 게시글 표시
      if (!fromBoardId || fromBoardId === 'boards' || fromBoardId === 'all') {
        const posts = await getPostsForAllBoards(allBoardIds, page);
        const totalCount = await getTotalPostCount(allBoardIds);
        return { posts, totalCount };
      }
      
      // 출발 게시판 ID가 rootBoardId인 경우 모든 게시글 표시
      if (fromBoardId === rootBoardId) {
        const posts = await getPostsForAllBoards(allBoardIds, page);
        const totalCount = await getTotalPostCount(allBoardIds);
        return { posts, totalCount };
      }
      
      // 출발 게시판 정보 확인
      const { data: fromBoard } = !fromBoardId ? { data: null } : await supabase
        .from('boards')
        .select('parent_id')
        .eq('id', fromBoardId)
        .single();
      
      if (fromBoardId && !fromBoard) {
        const posts = await getPostsForCurrentBoard(currentBoardId, rootBoardId, page);
        const totalCount = await getTotalPostCount([currentBoardId]);
        return { posts, totalCount };
      }
      
      // 출발 게시판이 최상위 게시판의 직계 자식인 경우 (상위 게시판)
      if (fromBoard && fromBoard.parent_id === rootBoardId) {
        const childBoardIds = await getAllSubBoardIds(fromBoardId);
        const boardIds = [fromBoardId, ...childBoardIds];
        const posts = await getPostsForBoardIds(boardIds, page);
        const totalCount = await getTotalPostCount(boardIds);
        return { posts, totalCount };
      }
      
      // 출발 게시판이 하위 게시판인 경우
      if (fromBoard && fromBoard.parent_id && fromBoard.parent_id !== rootBoardId) {
        const posts = await getPostsForBoardIds([fromBoardId], page);
        const totalCount = await getTotalPostCount([fromBoardId]);
        return { posts, totalCount };
      }
      
      // 기본적으로 현재 게시판 기준으로 필터링
      const posts = await getPostsForCurrentBoard(currentBoardId, rootBoardId, page);
      const targetBoardIds = [currentBoardId]; // 현재 게시판에 맞는 ID 배열 구성
      const totalCount = await getTotalPostCount(targetBoardIds);
      return { posts, totalCount };
    }
    
    // 특정 게시판 ID들에 대한 게시글 가져오기
    async function getPostsForBoardIds(boardIds: string[], page: number = 1) {
      const pageSize = 20; // 한 페이지당 20개 게시글
      const from = (page - 1) * pageSize;
      
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *, 
          profiles(nickname, id), 
          board:board_id(name, slug, id),
          content
        `)
        .in('board_id', boardIds)
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
        
      if (error) {
        console.error('게시글 목록을 가져오는 중 오류가 발생했습니다:', error);
        return [];
      }
      
      return posts || [];
    }
    
    // 모든 게시판의 게시글 가져오기
    async function getPostsForAllBoards(boardIds: string[], page: number = 1) {
      return getPostsForBoardIds(boardIds, page);
    }
    
    // 현재 게시판 기준으로 게시글 가져오기
    async function getPostsForCurrentBoard(currentBoardId: string, rootBoardId: string, page: number = 1) {
      // 현재 게시판 정보 확인
      const { data: currentBoard } = await supabase
        .from('boards')
        .select('parent_id')
        .eq('id', currentBoardId)
        .single();
      
      if (!currentBoard) {
        console.error('현재 게시판 정보를 찾을 수 없습니다:', currentBoardId);
        return [];
      }
      
      // 현재 게시판이 최상위인 경우 모든 게시글 표시
      if (!currentBoard.parent_id) {
        return getPostsForAllBoards(allBoardIds, page);
      }
      
      // 현재 게시판이 상위 게시판인 경우 (최상위의 직계 자식)
      if (currentBoard.parent_id === rootBoardId) {
        const childBoardIds = await getAllSubBoardIds(currentBoardId);
        return getPostsForBoardIds([currentBoardId, ...childBoardIds], page);
      }
      
      // 현재 게시판이 하위 게시판인 경우
      return getPostsForBoardIds([currentBoardId], page);
    }
    
    // 게시글 필터링 로직 변경 - 페이지 정보 추가
    const { posts: filteredPosts, totalCount } = await getFilteredPostsByBoardHierarchy(
      board.id, 
      normalizedFromBoardId,
      rootBoardId, 
      allBoardIds,
      currentPage
    );
    
    // 총 페이지 수 계산
    const pageSize = 20;
    const totalPages = Math.ceil(totalCount / pageSize);

    // 게시글 ID 목록 추출
    const postIds = filteredPosts.map(p => p.id);

    // 댓글 수 가져오기
    const commentCounts: Record<string, number> = {};

    // 댓글 수 병렬로 가져오기
    if (postIds.length > 0) {
      await Promise.all(
        postIds.map(async (postId) => {
          const { count, error: countError } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);
            
          if (!countError) {
            commentCounts[postId] = count || 0;
          }
        })
      );
    }

    // 게시글에 댓글 수 추가
    const postsWithComments = filteredPosts.map(p => ({
      ...p,
      comment_count: commentCounts[p.id] || 0
    }));

    // 게시판 정보 가져오기 (팀/리그 정보 포함)
    const { data: boardsWithTeamInfo } = await supabase
      .from('boards')
      .select('id, team_id, league_id, slug')
      .in('id', allBoardIds);

    // 모든 팀 ID와 리그 ID 목록 생성
    const teamIds = Array.from(
      new Set(
        boardsWithTeamInfo?.filter(board => board.team_id).map(board => board.team_id) || []
      )
    );
      
    const leagueIds = Array.from(
      new Set(
        boardsWithTeamInfo?.filter(board => board.league_id).map(board => board.league_id) || []
      )
    );

    // 팀 정보 가져오기 (존재하는 경우에만)
    const teamsData: Record<number, TeamInfo> = {};
    if (teamIds.length > 0) {
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name, logo')
        .in('id', teamIds);
        
      if (teams) {
        teams.forEach(team => {
          teamsData[team.id] = { name: team.name, logo: team.logo };
        });
      }
    }

    // 리그 정보 가져오기 (존재하는 경우에만)
    const leaguesData: Record<number, LeagueInfo> = {};
    if (leagueIds.length > 0) {
      const { data: leagues } = await supabase
        .from('leagues')
        .select('id, name, logo')
        .in('id', leagueIds);
        
      if (leagues) {
        leagues.forEach(league => {
          leaguesData[league.id] = { name: league.name, logo: league.logo };
        });
      }
    }

    // 아이콘 정보 조회 (추가)
    let iconUrl = null;
    if (post.profiles?.icon_id) {
      const { data: iconData } = await supabase
        .from('shop_items')
        .select('image_url')
        .eq('id', post.profiles.icon_id)
        .single();
        
      if (iconData) {
        iconUrl = iconData.image_url;
      }
    }
    
    // 댓글의 아이콘 ID 수집 및 이미지 URL 조회
    const commentIconIds = comments
      ?.filter(comment => comment.profiles?.icon_id)
      .map(comment => comment.profiles.icon_id) || [];
      
    let commentIconsMap: Record<number, string> = {};
    if (commentIconIds.length > 0) {
      const { data: iconData } = await supabase
        .from('shop_items')
        .select('id, image_url')
        .in('id', commentIconIds);
        
      if (iconData) {
        commentIconsMap = iconData.reduce((acc: Record<number, string>, icon: IconData) => {
          acc[icon.id] = icon.image_url;
          return acc;
        }, {});
      }
    }
    
    // 댓글 데이터에 아이콘 URL 추가
    const commentsWithIconUrl = comments?.map(comment => ({
      ...comment,
      profiles: {
        ...comment.profiles,
        icon_url: comment.profiles?.icon_id ? commentIconsMap[comment.profiles.icon_id] : null
      }
    })) || [];
    
    // ⚠️ PostListSection에서 가져온 게시글 데이터 변환 로직 ⚠️
    const formattedPosts = postsWithComments.map(post => {
      const boardId = post.board_id;
      const boardData = boardsData[boardId] || {};
      const teamId = post.board?.team_id || boardData.team_id;
      const leagueId = post.board?.league_id || boardData.league_id;
      
      return {
        id: post.id,
        title: post.title,
        board_id: boardId,
        board_name: post.board?.name || boardNameMap[boardId] || '게시판',
        board_slug: post.board?.slug || boardData.slug || boardId,
        post_number: post.post_number,
        created_at: post.created_at,
        views: post.views || 0,
        likes: post.likes || 0,
        author_nickname: post.profiles?.nickname || '익명',
        author_id: post.profiles?.id,
        comment_count: post.comment_count || 0,
        content: post.content,
        team_id: teamId,
        league_id: leagueId,
        team_logo: teamId && teamsData[teamId] ? teamsData[teamId].logo : null,
        league_logo: leagueId && leaguesData[leagueId] ? leaguesData[leagueId].logo : null
      };
    });

    // HoverMenu 탭 관련 로직
    const getBoardSlug = (boardId: string) => boardsData[boardId]?.slug || boardId;
    
    const topLevelBoardsWithSlug = topLevelBoards?.map(board => ({
      ...board,
      slug: board.slug || getBoardSlug(board.id) || board.id,
      display_order: board.display_order || 0
    })) as TopBoard[] || [];
    
    const childBoardsMapWithSlug = Object.keys(allBoardsUnderRoot).reduce((acc, topBoardId) => {
      acc[topBoardId] = allBoardsUnderRoot[topBoardId].map(childBoard => ({
        ...childBoard,
        slug: childBoard.slug || getBoardSlug(childBoard.id) || childBoard.id,
        display_order: childBoard.display_order || 0 // display_order가 없으면 기본값 0으로 설정
      }));
      return acc;
    }, {} as Record<string, ChildBoard[]>);

    // 페이지네이션 관련 함수 추가
    // 게시글 총 개수 가져오기 함수
    async function getTotalPostCount(boardIds: string[]) {
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .in('board_id', boardIds);
        
      if (error) {
        console.error('게시글 개수를 가져오는 중 오류가 발생했습니다:', error);
        return 0;
      }
      
      return count || 0;
    }

    // 직접 posts 테이블만 업데이트하는 방식으로 단순화
    try {
      await incrementViewCount(post.id);
    } catch (err) {
      console.error('조회수 처리 오류:', err);
    }

    return (
      <div className="container mx-auto">
        {/* 게시판 경로 - BoardBreadcrumbs 컴포넌트 사용 */}
        <BoardBreadcrumbs breadcrumbs={breadcrumbs} />
        
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden mb-6">
          {/* 게시글 헤더 컴포넌트 */}
          <PostHeader 
            title={post.title}
            author={{
              nickname: post.profiles?.nickname || null,
              id: post.user_id,
              icon_id: post.profiles?.icon_id || null,
              icon_url: iconUrl
            }}
            createdAt={post.created_at}
            views={post.views || 0}
            likes={post.likes || 0}
            boardName={post.board?.name || '게시판'}
          />
          
          {/* 게시글 본문 컴포넌트 */}
          <PostContent content={post.content || ''} />
          
          {/* 추천/비추천 버튼 및 게시글 액션 */}
          <div className="px-6 py-4 border-t">
            <PostActions 
              postId={post.id} 
              boardId={board.id} 
              initialLikes={post.likes || 0} 
              initialDislikes={post.dislikes || 0}
              isAuthor={isAuthor}
              boardSlug={slug}
              postNumber={postNumber}
            />
          </div>
          
          {/* 첨부파일 섹션 (있는 경우) */}
          {post.files && post.files.length > 0 && (
            <div className="px-6 py-4 border-t">
              <h3 className="text-sm font-medium mb-2">첨부파일</h3>
              <ul className="space-y-1">
                {post.files.map((file: FileData, index: number) => (
                  <li key={index} className="text-sm">
                    <a 
                      href={file.url} 
                      className="text-blue-600 hover:underline flex items-center"
                      download
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      {file.filename}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* 이전글/다음글 네비게이션 */}
        <PostNavigation 
          boardSlug={slug}
          prevPost={prevPost ? { ...prevPost, post_number: prevPost.post_number } : null}
          nextPost={nextPost ? { ...nextPost, post_number: nextPost.post_number } : null} 
        />
        
        {/* 댓글 섹션 */}
        <CommentSection 
          postId={post.id} 
          boardId={board.id} 
          initialComments={commentsWithIconUrl} 
          boardSlug={slug}
          postNumber={postNumber}
        />
        
        {/* 게시글 목록 섹션 */}
        <div className="mt-4">
          {/* HoverMenu 사용 */}
          <div className="mb-4 border rounded-md">
            <HoverMenu
              currentBoardId={board.id}
              topBoards={topLevelBoardsWithSlug}
              childBoardsMap={childBoardsMapWithSlug}
              rootBoardId={rootBoardId}
              activeTabId={activeTabId}
              currentBoardSlug={getBoardSlug(board.id)}
              rootBoardSlug={getBoardSlug(rootBoardId)}
            />
          </div>
          
          {/* PostList 컴포넌트로 대체 */}
          <PostList
            posts={formattedPosts}
            currentPostId={post.id}
            showBoard={true}
            emptyMessage="게시글이 없습니다."
            currentBoardId={board.id}
          />
          
          {/* 페이지네이션 추가 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 my-4">
              {/* 처음 페이지 버튼 */}
              {currentPage > 1 && (
                <Link href={`/boards/${slug}/${postNumber}?page=1${normalizedFromBoardId ? `&from=${normalizedFromBoardId}` : ''}`}>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    &lt;&lt;
                  </Button>
                </Link>
              )}
              
              {/* 이전 페이지 버튼 */}
              {currentPage > 1 && (
                <Link href={`/boards/${slug}/${postNumber}?page=${currentPage - 1}${normalizedFromBoardId ? `&from=${normalizedFromBoardId}` : ''}`}>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    &lt;
                  </Button>
                </Link>
              )}
              
              {/* 페이지 번호 동적 생성 */}
              {(() => {
                const pageNumbers = [];
                const maxPagesToShow = 5;
                
                let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
                const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
                
                // 페이지가 적은 경우 시작 페이지 조정
                if (endPage - startPage + 1 < maxPagesToShow) {
                  startPage = Math.max(1, endPage - maxPagesToShow + 1);
                }
                
                for (let i = startPage; i <= endPage; i++) {
                  pageNumbers.push(i);
                }
                
                return pageNumbers.map(pageNum => (
                  <Link 
                    key={`page-${pageNum}`}
                    href={`/boards/${slug}/${postNumber}?page=${pageNum}${normalizedFromBoardId ? `&from=${normalizedFromBoardId}` : ''}`}
                  >
                    <Button
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className={`h-8 w-8 p-0 ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : ""
                      }`}
                    >
                      {pageNum}
                    </Button>
                  </Link>
                ));
              })()}
              
              {/* 다음 페이지 버튼 */}
              {currentPage < totalPages && (
                <Link href={`/boards/${slug}/${postNumber}?page=${currentPage + 1}${normalizedFromBoardId ? `&from=${normalizedFromBoardId}` : ''}`}>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    &gt;
                  </Button>
                </Link>
              )}
              
              {/* 마지막 페이지 버튼 */}
              {currentPage < totalPages && (
                <Link href={`/boards/${slug}/${postNumber}?page=${totalPages}${normalizedFromBoardId ? `&from=${normalizedFromBoardId}` : ''}`}>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    &gt;&gt;
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
        
        {/* 하단 버튼 영역 */}
        <div>
          <PostFooter 
            _boardId={board.id} 
            postId={post.id} 
            isAuthor={isAuthor} 
            boardSlug={slug}
            postNumber={postNumber}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Post detail error:", error);
    return <div>게시글을 불러오는 중 오류가 발생했습니다.</div>;
  }
} 