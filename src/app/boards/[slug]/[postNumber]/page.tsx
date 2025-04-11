import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase.server';
import { incrementViewCount } from '@/app/lib/api/posts';
// 캐싱 기능 임포트
import { getCachedPostDetail, getCachedComments, getCachedBoardStructure } from '@/app/lib/caching';

// 재사용 가능한 컴포넌트 임포트
import CommentSection from '@/app/boards/components/CommentSection';
import PostNavigation from '@/app/boards/components/PostNavigation';
import BoardBreadcrumbs from '@/app/boards/components/BoardBreadcrumbs';
import PostHeader from '@/app/boards/components/PostHeader';
import PostContent from '@/app/boards/components/PostContent';
import PostActions from '@/app/boards/components/PostActions';
import HoverMenu from '@/app/boards/components/HoverMenu';
import PostList from '@/app/components/post/PostList';
import Pagination from '@/app/boards/components/Pagination';
import PostFooter from '@/app/boards/components/PostFooter';

// 타입 정의 임포트
import { Breadcrumb, BoardData } from '@/app/types/board';
import { CommentType } from '@/app/types/comment';

// 서비스 함수 임포트 - 사용하지 않는 함수는 제거
import { 
  getBoardBySlug, 
  getRootBoardId, 
  createBreadcrumbs
} from '@/app/services/board.service';

import {
  getAdjacentPosts,
  getFilteredPostsByBoardHierarchy,
  getCommentIconUrls,
  getIconUrl,
  getCommentCounts,
  getTeamAndLeagueInfo,
  formatPosts
} from '@/app/services/post.service';

// 게시판 관련 타입 정의
interface BoardStructure {
  id: string;
  name: string;
  slug?: string;
  parent_id?: string;
  display_order: number;
  team_id?: number | null;
  league_id?: number | null;
}

// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    if (isNaN(postNum) || postNum <= 0) {
      console.error('유효하지 않은 게시글 번호:', postNumber);
      return notFound();
    }
    
    const supabase = await createClient();
    
    // 로그인 상태 확인
    const { data: { user } } = await supabase.auth.getUser();
    const isLoggedIn = !!user;
    
    // 1. 게시판 정보 가져오기 (캐싱 없이 기본 로직 유지)
    let board;
    try {
      board = await getBoardBySlug(slug);
      if (!board) {
        console.error('게시판 정보가 없습니다:', slug);
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg border shadow-md p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">게시판을 찾을 수 없습니다</h2>
              <p className="text-gray-600 mb-6">요청하신 &apos;{slug}&apos; 게시판이 존재하지 않습니다.</p>
              <Link href="/boards" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                게시판 목록으로 돌아가기
              </Link>
            </div>
          </div>
        );
      }
    } catch (error) {
      console.error('게시판을 찾을 수 없습니다:', slug, error);
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border shadow-md p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">게시판을 찾을 수 없습니다</h2>
            <p className="text-gray-600 mb-6">요청하신 &apos;{slug}&apos; 게시판이 존재하지 않습니다.</p>
            <Link href="/boards" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              게시판 목록으로 돌아가기
            </Link>
          </div>
        </div>
      );
    }
    
    // 2. 게시글 상세 정보 가져오기 - 캐싱 적용
    let postDetail;
    try {
      // 캐싱된 게시글 정보 가져오기
      try {
        postDetail = await getCachedPostDetail(slug, postNum);
      } catch (cacheError) {
        console.error('캐싱 처리 오류:', cacheError);
        // 캐싱 에러 발생 시 직접 DB에서 게시글 정보를 가져오는 로직이 필요합니다
        // 여기에 fallback 로직을 구현할 수 있지만, 이번에는 에러 페이지를 보여줍니다
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg border shadow-md p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">데이터를 불러올 수 없습니다</h2>
              <p className="text-gray-600 mb-6">캐싱 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
              <Link href={`/boards/${slug}`} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                게시판으로 돌아가기
              </Link>
            </div>
          </div>
        );
      }
      
      if (!postDetail || !postDetail.post) {
        console.error('게시글 정보가 없습니다:', { boardId: board.id, postNumber: postNum });
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg border shadow-md p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">게시글을 찾을 수 없습니다</h2>
              <p className="text-gray-600 mb-6">
                요청하신 게시글(게시판: {board.name}, 번호: {postNum})이 존재하지 않습니다.
              </p>
              <div className="flex justify-center gap-4">
                <Link href={`/boards/${slug}`} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  {board.name} 게시판으로 이동
                </Link>
                <Link href="/boards" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  게시판 목록으로 이동
                </Link>
              </div>
            </div>
          </div>
        );
      }
    } catch (error) {
      console.error('게시글을 찾을 수 없습니다:', { boardId: board.id, postNumber: postNum }, error);
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border shadow-md p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">게시글을 찾을 수 없습니다</h2>
            <p className="text-gray-600 mb-6">
              요청하신 게시글(게시판: {board.name}, 번호: {postNum})이 존재하지 않습니다.
            </p>
            <div className="flex justify-center gap-4">
              <Link href={`/boards/${slug}`} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                {board.name} 게시판으로 이동
              </Link>
              <Link href="/boards" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                게시판 목록으로 이동
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // post 변수 설정 (postDetail에서 추출)
    const post = {
      ...postDetail.post,
      profiles: postDetail.author,
      board: postDetail.board,
      team: postDetail.team,
      league: postDetail.league
    };

    // 여기서부터 나머지 로직을 try-catch로 래핑하여 모든 에러를 처리합니다
    try {
      // 3. 여러 데이터를 병렬로 가져오기
      let adjacentPostsResult, commentsResult, rootBoardIdResult, boardStructure;
      
      try {
        [
          adjacentPostsResult, 
          commentsResult,
          rootBoardIdResult,
          // 게시판 구조 정보 캐싱 적용
          boardStructure
        ] = await Promise.all([
          // 이전/다음 게시글 (캐시 없이 실시간 데이터)
          getAdjacentPosts(board.id, postNum),
          // 댓글 데이터 (캐싱 적용)
          getCachedComments(post.id),
          // 루트 게시판 ID
          getRootBoardId(board),
          // 게시판 구조 데이터 (캐싱 적용)
          getCachedBoardStructure()
        ]);
      } catch (fetchError) {
        console.error('데이터 가져오기 오류:', fetchError);
        // 오류 발생 시 기본값 설정
        adjacentPostsResult = { prevPost: null, nextPost: null };
        commentsResult = [];
        rootBoardIdResult = board.id;
        boardStructure = [];
      }
      
      // 병렬 처리 결과 추출
      const { prevPost, nextPost } = adjacentPostsResult;
      const comments = commentsResult || [];
      const rootBoardId = rootBoardIdResult;
      
      // 4. 게시판 관련 데이터 구성
      // 하위 게시판 ID 찾기 - 직접 구현
      const allSubBoardIds: string[] = [];
      // 하위 게시판 ID를 직접 추출
      (boardStructure as BoardStructure[]).forEach(board => {
        if (board.parent_id === rootBoardId) {
          allSubBoardIds.push(board.id);
        }
      });
      
    const allBoardIds = [rootBoardId, ...allSubBoardIds];
    
      // 게시판 데이터 맵 구성 - BoardData 타입에 맞게 수정
      const boardsData = (boardStructure as BoardStructure[]).reduce((acc: Record<string, BoardData>, board: BoardStructure) => {
        acc[board.id] = {
          team_id: board.team_id || null,
          league_id: board.league_id || null,
          slug: board.slug || board.id
        };
        return acc;
      }, {});
      
      // 게시판 이름 맵 구성 - any 타입 제거
      const boardNameMap = (boardStructure as BoardStructure[]).reduce((acc: Record<string, string>, board: BoardStructure) => {
        acc[board.id] = board.name;
        return acc;
      }, {});
      
      // 5. 최상위 게시판의 직계 하위 게시판들 가져오기 - any 타입 제거
      const topLevelBoards = (boardStructure as BoardStructure[])
        .filter((board: BoardStructure) => board.parent_id === rootBoardId)
        .sort((a: BoardStructure, b: BoardStructure) => 
          (a.display_order || 0) - (b.display_order || 0));
      
      // 6. HoverMenu 데이터 준비 - any 타입 제거
      const childBoardsMap: Record<string, BoardStructure[]> = {};
      
      (boardStructure as BoardStructure[]).forEach((board: BoardStructure) => {
        if (board.parent_id) {
          if (!childBoardsMap[board.parent_id]) {
            childBoardsMap[board.parent_id] = [];
          }
          childBoardsMap[board.parent_id].push(board);
        }
      });
      
      const topLevelBoardsWithSlug = topLevelBoards.map((board: BoardStructure) => ({
        id: board.id,
        name: board.name,
        display_order: board.display_order || 0,
        slug: board.slug
      }));
      
      // 7. 게시글 필터링 - 함수 인자 수정
      let filteredPosts = [], totalCount = 0;
      try {
        const result = await getFilteredPostsByBoardHierarchy(
      board.id, 
      normalizedFromBoardId,
      rootBoardId, 
      allBoardIds,
      currentPage,
          // 하위 게시판 ID를 문자열 배열로 변환하는 함수 제공
          async (boardId: string) => {
            // boardId의 하위 게시판 ID들을 문자열 배열로 반환
            return (childBoardsMap[boardId] || []).map(b => b.id);
          }
        );
        filteredPosts = result.posts;
        totalCount = result.totalCount;
      } catch (filterError) {
        console.error('게시글 필터링 오류:', filterError);
      }
      
      // 8. 총 페이지 수 계산
    const pageSize = 20;
    const totalPages = Math.ceil(totalCount / pageSize);
    
      // 9. 게시글 ID 목록 추출
    const postIds = filteredPosts.map(p => p.id);
    
      // 10. 댓글 수 가져오기
      let commentCounts = {};
      try {
        commentCounts = await getCommentCounts(postIds);
      } catch (error) {
        console.error('댓글 수 가져오기 오류:', error);
      }
      
      // 11. 팀 및 리그 정보 가져오기
      let teams = {}, leagues = {};
      try {
        const result = await getTeamAndLeagueInfo(allBoardIds);
        teams = result.teams;
        leagues = result.leagues;
      } catch (error) {
        console.error('팀 및 리그 정보 가져오기 오류:', error);
      }
      
      // 12. 게시글 데이터 포맷팅
    const formattedPosts = formatPosts(
      filteredPosts, 
      commentCounts, 
      boardsData, 
      boardNameMap, 
      teams, 
      leagues
    );
    
      // 13. 사용자 세션 확인 (글 작성자인지 확인용)
    const isAuthor = user?.id === post.user_id;
    
      // 14. 댓글 데이터에 아이콘 URL 추가
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let commentsWithIconUrl: any[] = [];
      try {
        commentsWithIconUrl = await getCommentIconUrls(comments);
      } catch (error) {
        console.error('댓글 아이콘 URL 가져오기 오류:', error);
      }
      
      // 15. 작성자 아이콘 URL 가져오기
      let iconUrl = null;
      try {
        iconUrl = await getIconUrl(post.profiles?.icon_id || null);
      } catch (error) {
        console.error('작성자 아이콘 URL 가져오기 오류:', error);
      }
      
      // 16. 브레드크럼 생성
    const breadcrumbs = createBreadcrumbs(board, post.title, postNumber);
    
      // 17. 조회수 증가
    try {
      await incrementViewCount(post.id);
      } catch (error) {
        console.error('조회수 처리 오류:', error);
    }

    return (
        <div className="container mx-auto px-4">
          {/* 1. 게시판 경로 - BoardBreadcrumbs 컴포넌트 사용 */}
          <div className="overflow-x-auto">
        <BoardBreadcrumbs breadcrumbs={breadcrumbs as Breadcrumb[]} />
          </div>
        
        {/* 모바일 화면에서 우측 하단에 고정된 글쓰기 버튼 (로그인 시에만) */}
        {isLoggedIn && (
          <div className="sm:hidden fixed bottom-4 right-4 z-30">
            <Link href={`/boards/${slug}/create`}>
              <button className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-medium py-2 px-4 shadow-md border border-slate-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>글쓰기</span>
              </button>
            </Link>
          </div>
        )}
        
          {/* 2. 게시글 본문 (상세 정보) */}
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
            commentCount={commentsWithIconUrl?.length || 0}
          />
          
          {/* 게시글 본문 컴포넌트 */}
          <PostContent content={post.content || ''} />
          
            {/* 3. 추천/비추천 버튼 및 게시글 액션 */}
            <div className="px-4 sm:px-6 py-4 border-t">
            <div className="flex flex-col space-y-4">
              {/* 추천/비추천 버튼 */}
              <PostActions 
                postId={post.id} 
                boardId={board.id} 
                initialLikes={post.likes || 0} 
                initialDislikes={post.dislikes || 0}
              />
            </div>
          </div>
          
          {/* 첨부파일 섹션 (있는 경우) */}
          {post.files && post.files.length > 0 && (
              <div className="px-4 sm:px-6 py-4 border-t">
              <h3 className="text-sm font-medium mb-2">첨부파일</h3>
              <ul className="space-y-1">
                {post.files.map((file: { url: string; filename: string }, index: number) => (
                  <li key={index} className="text-sm">
                    <a 
                      href={file.url} 
                      className="text-blue-600 hover:underline flex items-center"
                      download
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                        <span className="truncate">{file.filename}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
          {/* 4. 게시글 하단 버튼 영역 */}
        <PostFooter 
          boardSlug={slug}
          postNumber={postNumber}
          isAuthor={isAuthor}
          isLoggedIn={isLoggedIn}
        />
        
          {/* 5. 포스트 네비게이션 */}
          <div className="mb-4">
            <PostNavigation 
              prevPost={prevPost} 
              nextPost={nextPost}
              boardSlug={slug}
            />
          </div>
          
          {/* 6. 댓글 섹션 */}
          <div className="mb-4">
        <CommentSection 
          postId={post.id} 
          boardId={board.id}
          initialComments={commentsWithIconUrl as CommentType[]} 
          boardSlug={slug}
          postNumber={postNumber}
              postOwnerId={post.user_id}
            />
          </div>
          
          {/* 7. 호버 메뉴 */}
          <div className="mb-4">
            <HoverMenu
              topBoards={topLevelBoardsWithSlug}
              childBoardsMap={childBoardsMap}
              currentBoardId={board.id}
              rootBoardId={rootBoardId}
              rootBoardSlug={boardsData[rootBoardId]?.slug}
              currentBoardSlug={slug}
            />
          </div>
          
          {/* 8. 같은 게시판의 다른 글 목록 */}
          <div className="mb-4">
          <PostList 
            posts={formattedPosts}
            showBoard={true}
            currentBoardId={board.id}
            currentPostId={post.id}
          />
          </div>
          
          {/* 9. 게시글 푸터 (중복) */}
          <div className="mb-4">
            <PostFooter 
              boardSlug={slug}
              postNumber={postNumber}
              isAuthor={isAuthor}
              isLoggedIn={isLoggedIn}
            />
          </div>
          
          {/* 10. 페이지네이션 */}
          <div className="mb-4">
            {totalPages > 1 && (
                <div className="px-4 sm:px-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            boardSlug={slug}
            fromBoardId={normalizedFromBoardId}
          />
                </div>
            )}
        </div>
      </div>
    );
    } catch (error) {
      console.error('게시글 하단 로직 오류:', error);
      return notFound();
    }
  } catch (error) {
    console.error('게시글 상세 페이지 렌더링 오류:', error);
    // 오류가 NEXT_NOT_FOUND 관련인지 확인
    if (error instanceof Error && error.message?.includes('NEXT_NOT_FOUND')) {
      return notFound();
    }
    // 그 외 일반 오류는 사용자 친화적인 에러 페이지 표시
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border shadow-md p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">
            페이지를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
          <Link href="/boards" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            게시판 목록으로 이동
          </Link>
        </div>
      </div>
    );
  }
} 