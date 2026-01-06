/**
 * 설정 도메인의 모든 컴포넌트를 내보냅니다.
 */

// 내 댓글 관련 컴포넌트
export { default as MyCommentList } from './my-comments/MyCommentList';
export { default as MyCommentsContent } from './my-comments/MyCommentsContent';
export { default as PostsPagination } from './my-comments/PostsPagination';

// 비밀번호 관리 컴포넌트
export { default as PasswordForm } from '@/domains/settings/components/password/PasswordForm';

// 공통 컴포넌트 내보내기
export * from './common';

// 비밀번호 관련 컴포넌트
export * from './password';

// 포인트 관련 컴포넌트
export * from './points';

// 프로필 컴포넌트
export { default as ProfileForm } from './profile/ProfileForm';

// 계정 삭제 컴포넌트
export { default as AccountDeleteForm } from './account-delete/AccountDeleteForm';

// 전화번호 인증 컴포넌트
export { default as PhoneVerificationForm } from './phone/PhoneVerificationForm'; 