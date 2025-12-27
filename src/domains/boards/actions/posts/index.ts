// 게시글 생성 관련
export { createPost, createPostWithParams } from './create';

// 게시글 수정 관련
export { updatePost } from './update';

// 게시글 삭제 관련
export { deletePost } from './delete';

// 좋아요/싫어요 관련
export { likePost, dislikePost, getUserPostAction } from './likes';

// 공지사항 조회 관련
export { getNotices, getGlobalNotices, getBoardNotices } from './notices';

// 공지사항 설정 관련 (관리자)
export { setPostAsNotice, removeNotice, updateNoticeOrder, updateNoticeType } from './setNotice';

// 유틸리티 타입
export type { PostActionResponse, LikeActionResponse } from './utils'; 