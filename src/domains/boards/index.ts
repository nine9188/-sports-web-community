// 게시판 도메인 메인 파일
// 필요한 타입, 유틸, 훅 등을 다시 내보냄

// 타입 내보내기
export * from './types';

// 유틸 함수 내보내기
export * from './utils/board/boardHierarchy';
// 유틸 함수와 서버 액션 간의 중복으로 인해 개별 내보내기
export {
  buildCommentTree,
  formatPosts
} from './utils/post/postUtils';

// 훅 내보내기
export * from './hooks/board/useBoardHierarchy';
export * from './hooks/post/usePostActions';
export * from './hooks/post/useComments';

// 서버 액션 내보내기 - Post 타입 제외하고 가져오기
export {
  getPostPageData,
  incrementViewCount,
  getComments,
  getBoardPageData,
  getPostEditData,
  getCreatePostData,
  getBoardBySlugOrId,
  getAllBoards,
  fetchPosts,
  revalidatePostsData,
  // Post와 관련된 타입은 명시적으로 내보내지 않음 (./types에서 이미 내보내기 때문)
} from './actions';

// Actions에서 타입 내보내기
export type { PostsResponse } from './actions';

// 공통 컴포넌트 내보내기
export { default as BoardBreadcrumbs } from './components/common/BoardBreadcrumbs';
// Deprecated: Pagination components are replaced by ShopPagination in shop domain
export { default as HoverMenu } from './components/common/HoverMenu';
export { default as ServerHoverMenu } from './components/common/ServerHoverMenu';
export { default as ClientHoverMenu } from './components/common/ClientHoverMenu';

// 게시판 컴포넌트 내보내기
export { default as BoardTeamInfo } from './components/board/BoardTeamInfo';
export { default as LeagueInfo } from './components/board/LeagueInfo';

// 게시글 컴포넌트 내보내기
export { default as PostHeader } from './components/post/PostHeader';
export { default as PostFooter } from './components/post/PostFooter';
export { default as PostContent } from './components/post/PostContent';
export { default as PostActions } from './components/post/PostActions';
export { default as ServerPostActions } from './components/post/ServerPostActions';
export { default as PostEditForm } from './components/post/PostEditForm';
export { default as PostNavigation } from './components/post/PostNavigation';
export { default as CommentSection } from './components/post/CommentSection';
export { default as Comment } from './components/post/Comment'; 