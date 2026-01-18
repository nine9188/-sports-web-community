// 각 액션 파일에는 이미 'use server' 지시어가 포함되어 있습니다.
// index.ts에서는 'use server'를 사용하지 않고 함수들을 재내보냅니다.

// 각 액션 파일에서 함수들 재내보내기
export * from './getBoards';
export * from './getPosts';
export * from './getBoardPageAllData';
export * from './getHoverMenuData';

// getPostDetails에서 getComments를 제외한 모든 함수 내보내기
export { 
  getPostPageData, 
  incrementViewCount,
  getPost
} from './getPostDetails';

export * from './getPostForm';

// posts 액션 내보내기 - 이름 충돌 해결을 위해 명시적으로 내보내기
export { 
  createPostWithParams,
  updatePost,
  deletePost,
  likePost, 
  dislikePost, 
  getUserPostAction,
  createPost
} from './posts/index';

// comments 모듈에서 내보내는 함수들 내보내기
export * from './comments/index';

// matches 관련 함수들 내보내기
export * from './matches';

// 이 파일에 직접 정의된 함수들은 더 이상 필요 없음
// 이 주석을 제외하고 이 파일 안에 더 이상의 코드는 없어야 함

// 참고: 서버 액션은 각 파일에서 직접 내보내는 것이 더 안전합니다.
// 필요한 경우 개별 함수를 직접 import하는 것을 고려하세요. 