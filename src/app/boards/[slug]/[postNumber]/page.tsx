import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase.server';
import { getAPIURL } from '@/app/lib/utils';

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

// 서비스 함수 임포트 - 필요한 함수만 가져오기
import { getBoardBySlug, getRootBoardId, createBreadcrumbs } from '@/app/services/board.service';
import {
  getAdjacentPosts,
  getFilteredPostsByBoardHierarchy,
  getIconUrl,
  getCommentCounts,
  getTeamAndLeagueInfo,
  formatPosts
} from '@/app/services/post.service';
import { incrementViewCount } from '@/app/lib/api/posts';

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
    // 두 개의 비동기 값을 병렬로 처리
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
      return notFound();
    }
    
    const postNum = parseInt(postNumber, 10);
    if (isNaN(postNum) || postNum <= 0) {
      return notFound();
    }
    
    const supabase = await createClient();
    
    // 로그인 상태 확인
    const { data: { user } } = await supabase.auth.getUser();
    const isLoggedIn = !!user;
    
    // --- 병렬 데이터 페칭 최적화 ---
    
    // 1. 게시판 정보 가져오기
    const boardPromise = getBoardBySlug(slug).catch(() => {
      return null;
    });
    
    // 필요한 모든 데이터를 병렬로 가져오기
    const [board] = await Promise.all([boardPromise]);
    
    if (!board) {
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
    
    // 2. 여러 데이터를 병렬로 가져오기 최적화
    const [
      postDetailResponse,
      rootBoardId,
      boardStructure,
      adjacentPosts
    ] = await Promise.all([
      // 게시글 상세 정보 가져오기
      (async () => {
        try {
          // 절대 URL 생성
          const apiUrl = new URL('/api/posts', getAPIURL());
          // 경로 세그먼트 추가
          apiUrl.pathname += `/${slug}/${postNumber}`;
          
          const res = await fetch(apiUrl.toString(), {
            cache: 'no-store',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!res.ok) throw new Error('게시글을 가져오는데 실패했습니다');
          return res.json();
        } catch {
          return { post: null };
        }
      })(),
      
      // 루트 게시판 ID
      getRootBoardId(board).catch(() => board.id),
      
      // 게시판 구조 데이터
      supabase.from('boards').select('*').order('display_order').then(res => res.data || []),
      
      // 이전/다음 게시글
      getAdjacentPosts(board.id, postNum).catch(() => ({ prevPost: null, nextPost: null }))
    ]);
    
    // 게시글 데이터 검증
    if (!postDetailResponse || !postDetailResponse.post) {
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
    
    // post 데이터 설정
    const post = postDetailResponse.post;
    
    // 3. 댓글 가져오기 및 게시판 하위 구조 처리
    const [
      comments,
      filteredPostsResult
    ] = await Promise.all([
      // 댓글 데이터 가져오기
      (async () => {
        try {
          // 절대 URL로 구성 (origin 명시적 지정)
          const apiUrl = new URL(`/api/comments/${post.id}`, getAPIURL()).toString();
          
          console.log(`댓글 데이터 요청 URL: ${apiUrl}, 게시글 ID: ${post.id}`);
          
          const response = await fetch(apiUrl, {
            cache: 'no-store',
            next: { revalidate: 0 },
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (!response.ok) {
            console.error(`댓글 조회 응답 오류: ${response.status} ${response.statusText}`);
            throw new Error('댓글을 가져오는데 실패했습니다');
          }
          
          const data = await response.json();
          console.log(`댓글 데이터 받음: ${data ? data.length : 0}개, 게시글 ID: ${post.id}`);
          return Array.isArray(data) ? data : [];
        } catch (error) {
          console.error('댓글 조회 오류:', error);
          return [];
        }
      })(),
      
      // 게시글 필터링
      getFilteredPostsByBoardHierarchy(
        board.id, 
        normalizedFromBoardId,
        rootBoardId, 
        [rootBoardId],
        currentPage,
        async (boardId: string) => {
          return (boardStructure as BoardStructure[])
            .filter(b => b.parent_id === boardId)
            .map(b => b.id);
        }
      ).catch(() => ({ posts: [], totalCount: 0 }))
    ]);
    
    // 필터링된 게시글 및 총 개수
    const filteredPosts = filteredPostsResult.posts || [];
    const totalCount = filteredPostsResult.totalCount || 0;
    
    // 4. 하위 게시판 ID 찾기
    const allSubBoardIds: string[] = [];
    // 하위 게시판 ID를 직접 추출
    (boardStructure as BoardStructure[]).forEach(board => {
      if (board.parent_id === rootBoardId) {
        allSubBoardIds.push(board.id);
      }
    });
    
    const allBoardIds = [rootBoardId, ...allSubBoardIds];
    
    // 5. 게시판 데이터 맵 구성
    const boardsData = (boardStructure as BoardStructure[]).reduce((acc: Record<string, BoardData>, board: BoardStructure) => {
      acc[board.id] = {
        team_id: board.team_id || null,
        league_id: board.league_id || null,
        slug: board.slug || board.id
      };
      return acc;
    }, {});
    
    // 6. 게시판 이름 맵 구성
    const boardNameMap = (boardStructure as BoardStructure[]).reduce((acc: Record<string, string>, board: BoardStructure) => {
      acc[board.id] = board.name;
      return acc;
    }, {});
    
    // 7. 최상위 게시판의 직계 하위 게시판들 가져오기
    const topLevelBoards = (boardStructure as BoardStructure[])
      .filter((board: BoardStructure) => board.parent_id === rootBoardId)
      .sort((a: BoardStructure, b: BoardStructure) => 
        (a.display_order || 0) - (b.display_order || 0));
    
    // 8. HoverMenu 데이터 준비
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
    
    // 9. 총 페이지 수 계산
    const pageSize = 20;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // 10. 게시글 ID 목록 추출
    const postIds = filteredPosts.map(p => p.id);
    
    // 11. 나머지 데이터 병렬 처리
    const [
      commentCounts,
      teamAndLeagueInfo,
      iconUrl
    ] = await Promise.all([
      // 댓글 수 가져오기
      getCommentCounts(postIds).catch(() => ({})),
      
      // 팀 및 리그 정보 가져오기
      getTeamAndLeagueInfo(allBoardIds).catch(() => ({ teams: {}, leagues: {} })),
      
      // 작성자 아이콘 URL 가져오기
      getIconUrl(post.profiles?.icon_id || null).catch(() => null)
    ]);
    
    // 조회수 증가는 결과를 기다리지 않고 비동기로 처리
    incrementViewCount(post.id).catch(() => {
      // 조회수 증가 실패해도, 게시글 보기에는 영향 없음
    });
    
    // 12. 게시글 데이터 포맷팅
    const formattedPosts = formatPosts(
      filteredPosts, 
      commentCounts, 
      boardsData, 
      boardNameMap, 
      teamAndLeagueInfo.teams, 
      teamAndLeagueInfo.leagues
    );
    
    // 13. 사용자 세션 확인 (글 작성자인지 확인용)
    const isAuthor = user?.id === post.user_id;
    
    // 14. 브레드크럼 생성
    const breadcrumbs = createBreadcrumbs(board, post.title, postNumber);

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
            commentCount={comments?.length || 0}
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
            prevPost={adjacentPosts.prevPost} 
            nextPost={adjacentPosts.nextPost}
            boardSlug={slug}
          />
        </div>
        
        {/* 6. 댓글 섹션 */}
        <div className="mb-4">
          <CommentSection 
            postId={post.id} 
            initialComments={Array.isArray(comments) ? comments as CommentType[] : []} 
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