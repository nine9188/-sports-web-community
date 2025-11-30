/**
 * Auth Actions - 새로운 구조
 *
 * 이 파일은 새로운 auth actions의 진입점입니다.
 * 기존 actions.ts와 actions-custom.ts를 기능별로 재구성했습니다.
 */

// 로그인/로그아웃 (auth.ts)
export {
  signIn,
  signInAndRedirect,
  signOut,
  signOutAndRedirect,
  getCurrentUser,
  refreshSession
} from './auth'

// 회원가입 (signup.ts)
export {
  signUp,
  checkUsernameAvailability,
  checkNicknameAvailability,
  resendConfirmation
} from './signup'

// 비밀번호 관리 (password.ts)
export {
  resetPassword,
  updatePassword,
  sendPasswordResetLink,
  validateResetToken,
  resetPasswordWithToken
} from './password'

// 프로필 관리 (profile.ts)
export {
  updateUserData,
  updateSocialUserProfile
} from './profile'

// 소셜 로그인 (social.ts)
export {
  signInWithKakao
} from './social'

// 계정 복구 (recovery.ts)
export {
  findUsername,
  sendIdRecoveryCode,
  findUsernameWithCode
} from './recovery'

// Types
export type { SignInResponse, SignUpResponse, UserProfile, PasswordResetResponse, UsernameRecoveryResponse, AvailabilityCheckResponse } from '../types'
export type { AuthResponse } from './utils/response'
