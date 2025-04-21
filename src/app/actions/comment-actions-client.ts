'use client';

// 서버 액션을 클라이언트에서 사용하기 위한 래퍼 파일
// 간소화된 형태로 서버 액션을 그대로 내보냅니다

import { 
  getComments,
  addComment,
  updateComment,
  deleteComment,
  likeComment,
  dislikeComment
} from './comment-actions';

export {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  likeComment,
  dislikeComment
}; 