/**
 * 설정 도메인 진입점
 * 모든 public API를 한 곳에서 내보냅니다.
 */

// 타입 내보내기
export * from './types';

// 액션 내보내기 - auth 액션
export { checkUserAuth, changePassword } from './actions/auth';

// 프로필 관련 액션
export { getUserProfile, updateProfile, updateProfileIcon } from './actions/profile';

// 게시글 관련 액션
export { getMyPosts } from './actions/my-posts';

// 댓글 관련 액션
export { getMyComments } from './actions/my-comments';

// 아이콘 관련 액션
export { getUserIcons, getCurrentUserIcon, updateUserIcon } from './actions/icons';

// 경험치 관련 액션
export { getUserExpHistory, getUserExpLevel } from './actions/exp';

// 포인트 관련 액션
export { getUserPointInfo, getUserPointHistory } from './actions/points';

// 계정 관련 액션
export { deleteAccount } from './actions/account';

// 컴포넌트 내보내기
export * from './components'; 