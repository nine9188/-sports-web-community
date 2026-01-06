// src/domains/settings/actions/index.ts
// 설정 도메인의 모든 서버 액션을 한 곳에서 내보냅니다.

// 주석: 이 파일은 설정 도메인의 서버 액션을 한 곳에서 내보냅니다.

// 인증 관련 액션
export { checkUserAuth } from './auth';

// 게시글 관련 액션
export { getMyPosts } from './my-posts';

// 댓글 관련 액션
export { getMyComments } from './my-comments';

// 프로필 관련 액션
export { updateProfile, updateProfileIcon, getUserProfile } from './profile';

// 아이콘 관련 액션
export { getUserIcons, getCurrentUserIcon, updateUserIcon } from './icons';

// 경험치 관련 액션
export { getUserExpHistory, getUserExpLevel } from './exp';

// 포인트 관련 액션
export { getUserPointInfo, getUserPointHistory } from './points';

// 전화번호 인증 관련 액션
export { sendPhoneVerificationCode, verifyPhoneCode, getPhoneVerificationStatus } from './phone';
