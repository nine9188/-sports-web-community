import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase.server';
import { incrementViewCount } from '@/app/lib/api/posts';

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
import { Breadcrumb } from '@/app/types/board';
import { CommentType } from '@/app/types/comment';

// 서비스 함수 임포트
import { 
  getAllSubBoardIds, 
  getBoardBySlug, 
  getRootBoardId, 
  getTopLevelBoards,
  getBoardsDataMap,
  prepareHoverMenuData,
  createBreadcrumbs
} from '@/app/services/board.service';

import {
  getPostByNumber,
  getAdjacentPosts,
  getFilteredPostsByBoardHierarchy,
  getCommentsForPost,
  getCommentIconUrls,
  getIconUrl,
  getCommentCounts,
  getTeamAndLeagueInfo,
  formatPosts
} from '@/app/services/post.service';

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
    
    // 1. 게시판 정보 가져오기
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
    
    // 2. 게시글 정보 가져오기
    let post;
    try {
      post = await getPostByNumber(board.id, postNum);
      if (!post) {
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

    // 여기서부터 나머지 로직을 try-catch로 래핑하여 모든 에러를 처리합니다
    try {
      // 3. 이전/다음 게시글 가져오기
      const { prevPost, nextPost } = await getAdjacentPosts(board.id, postNum);
      
      // 4. 루트 게시판 ID 찾기
      const rootBoardId = await getRootBoardId(board);
      
      // 5. 모든 하위 게시판 ID 가져오기
      const allSubBoardIds = await getAllSubBoardIds(rootBoardId);
      const allBoardIds = [rootBoardId, ...allSubBoardIds];
      
      // 6. 게시판 데이터 맵 가져오기
      const { boardNameMap, boardsData } = await getBoardsDataMap(allBoardIds);
      
      // 7. 최상위 게시판의 직계 하위 게시판들 가져오기
      const topLevelBoards = await getTopLevelBoards(rootBoardId);
      
      // 8. HoverMenu 데이터 준비
      const { topLevelBoardsWithSlug, childBoardsMapWithSlug } = await prepareHoverMenuData(topLevelBoards, rootBoardId, boardsData);
      
      // 10. 게시글 필터링
      const { posts: filteredPosts, totalCount } = await getFilteredPostsByBoardHierarchy(
        board.id, 
        normalizedFromBoardId,
        rootBoardId, 
        allBoardIds,
        currentPage,
        getAllSubBoardIds
      );
      
      // 11. 총 페이지 수 계산
      const pageSize = 20;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      // 12. 게시글 ID 목록 추출
      const postIds = filteredPosts.map(p => p.id);
      
      // 13. 댓글 수 가져오기
      const commentCounts = await getCommentCounts(postIds);
      
      // 14. 팀 및 리그 정보 가져오기
      const { teamsData, leaguesData } = await getTeamAndLeagueInfo(allBoardIds);
      
      // 15. 게시글 데이터 포맷팅
      const formattedPosts = formatPosts(
        filteredPosts, 
        commentCounts, 
        boardsData, 
        boardNameMap, 
        teamsData, 
        leaguesData
      );
      
      // 16. 사용자 세션 확인 (글 작성자인지 확인용)
      const isAuthor = user?.id === post.user_id;
      
      // 17. 댓글 가져오기
      const comments = await getCommentsForPost(post.id);
      
      // 18. 댓글 데이터에 아이콘 URL 추가
      const commentsWithIconUrl = await getCommentIconUrls(comments);
      
      // 19. 작성자 아이콘 URL 가져오기
      const iconUrl = await getIconUrl(post.profiles?.icon_id || null);
      
      // 20. 브레드크럼 생성
      const breadcrumbs = createBreadcrumbs(board, post.title, postNumber);
      
      // 21. 조회수 증가
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
              childBoardsMap={childBoardsMapWithSlug}
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
    return notFound();
  }
} 