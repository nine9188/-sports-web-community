// 신청 상태
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

// 이모티콘 카테고리
export type EmoticonCategory = 'general' | 'sports' | 'meme' | 'animal' | 'food' | 'emotion' | 'etc'

export const EMOTICON_CATEGORIES: { value: EmoticonCategory; label: string }[] = [
  { value: 'general', label: '일반' },
  { value: 'emotion', label: '감정' },
  { value: 'animal', label: '동물' },
  { value: 'food', label: '음식' },
  { value: 'sports', label: '스포츠' },
  { value: 'meme', label: '밈' },
  { value: 'etc', label: '기타' },
]

// 희망 가격 옵션
export const PRICE_OPTIONS = [
  { value: 0, label: '무료' },
  { value: 100, label: '100 P' },
  { value: 200, label: '200 P' },
  { value: 300, label: '300 P' },
  { value: 500, label: '500 P' },
] as const

// 제한사항
export const SUBMISSION_LIMITS = {
  DAILY_MAX: 3,
  EMOTICON_MIN: 8,
  EMOTICON_MAX: 30,
  PACK_NAME_MIN: 2,
  PACK_NAME_MAX: 20,
  DESCRIPTION_MIN: 5,
  DESCRIPTION_MAX: 100,
  TAGS_MAX: 5,
  TAG_LENGTH_MIN: 1,
  TAG_LENGTH_MAX: 5,
  IMAGE_MAX_SIZE: 500 * 1024, // 500KB
  IMAGE_MAX_WIDTH: 200,
  IMAGE_MAX_HEIGHT: 200,
} as const

// 신청서 타입
export interface EmoticonSubmission {
  id: number
  user_id: string
  pack_name: string
  description: string
  category: EmoticonCategory
  tags: string[]
  thumbnail_path: string
  emoticon_paths: string[]
  emoticon_count: number
  requested_price: number
  status: SubmissionStatus
  reject_reason: string | null
  suspend_reason: string | null
  approved_pack_id: string | null
  approved_shop_item_id: number | null
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

// 관리자 목록에서 유저 정보 포함
export interface EmoticonSubmissionWithUser extends EmoticonSubmission {
  profiles: {
    nickname: string | null
    avatar_url: string | null
  } | null
}

// 신청 폼 데이터
export interface SubmitEmoticonFormData {
  packName: string
  description: string
  category: EmoticonCategory
  tags: string[]
  thumbnailPath: string
  emoticonPaths: string[]
  requestedPrice: number
}

// 상태 라벨 & 색상
export const STATUS_CONFIG: Record<SubmissionStatus, { label: string; className: string }> = {
  pending: {
    label: '검토중',
    className: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
  },
  approved: {
    label: '승인',
    className: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  },
  rejected: {
    label: '거절',
    className: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  },
  suspended: {
    label: '판매중지',
    className: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50',
  },
}
