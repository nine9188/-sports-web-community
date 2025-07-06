// 배너 위치 타입 정의 (와플보드 참고)
export type BannerPosition = 
  | 'header'           // 헤더
  | 'main_top'         // 메인 상단
  | 'main_bottom'      // 메인 하단
  | 'content_top'      // 본문 상단
  | 'content_bottom'   // 본문 하단
  | 'sidebar_top'      // 사이드바 상단
  | 'sidebar_bottom'   // 사이드바 하단
  | 'left_margin'      // 좌측 여백
  | 'right_margin'     // 우측 여백
  | 'popup'            // 팝업
  | 'post_list'        // 게시글 목록
  | 'widget_post_list' // 메인 위젯 게시글 목록

// 배너 타입 정의
export type BannerType = 
  | 'image'    // 이미지
  | 'html'     // HTML 코드 (애드센스 등)
  | 'vote'     // 투표
  | 'empty'    // 빈 배너 (플레이스홀더)

// 노출 타입 정의
export type DisplayType = 
  | 'basic'    // 기본 (한장씩)
  | 'slide'    // 슬라이드

// 정렬 타입 정의
export type SortType = 
  | 'created'  // 생성순
  | 'random'   // 랜덤

// 배너 데이터 인터페이스
export interface Banner {
  id: string
  position: BannerPosition
  type: BannerType
  title: string
  subtitle?: string
  image_url?: string
  link_url?: string
  html_content?: string
  background_color?: string
  text_color?: string
  is_active: boolean
  display_order: number
  display_type: DisplayType
  sort_type: SortType
  desktop_per_row: number
  mobile_per_row: number
  auto_slide_interval?: number
  created_at: string
  updated_at: string
}

// 배너 생성/수정용 폼 데이터
export interface BannerFormData {
  position: BannerPosition
  type: BannerType
  title: string
  subtitle?: string
  image_url?: string
  link_url?: string
  html_content?: string
  background_color?: string
  text_color?: string
  is_active: boolean
  display_order: number
  display_type: DisplayType
  sort_type: SortType
  desktop_per_row: number
  mobile_per_row: number
  auto_slide_interval?: number
}

// 배너 위치별 설정
export interface BannerPositionConfig {
  position: BannerPosition
  name: string
  description: string
  defaultDesktopPerRow: number
  defaultMobilePerRow: number
  supportedTypes: BannerType[]
}

// 배너 위치 설정 정보
export const BANNER_POSITION_CONFIGS: BannerPositionConfig[] = [
  {
    position: 'header',
    name: '헤더',
    description: '사이트 헤더 영역',
    defaultDesktopPerRow: 1,
    defaultMobilePerRow: 1,
    supportedTypes: ['image', 'html', 'empty']
  },
  {
    position: 'main_top',
    name: '메인 상단',
    description: '메인페이지 상단 영역',
    defaultDesktopPerRow: 2,
    defaultMobilePerRow: 1,
    supportedTypes: ['image', 'html', 'vote', 'empty']
  },
  {
    position: 'main_bottom',
    name: '메인 하단',
    description: '메인페이지 하단 영역',
    defaultDesktopPerRow: 2,
    defaultMobilePerRow: 1,
    supportedTypes: ['image', 'html', 'vote', 'empty']
  },
  {
    position: 'content_top',
    name: '본문 상단',
    description: '게시글 본문페이지 상단',
    defaultDesktopPerRow: 1,
    defaultMobilePerRow: 1,
    supportedTypes: ['image', 'html', 'empty']
  },
  {
    position: 'content_bottom',
    name: '본문 하단',
    description: '게시글 본문페이지 하단',
    defaultDesktopPerRow: 1,
    defaultMobilePerRow: 1,
    supportedTypes: ['image', 'html', 'empty']
  },
  {
    position: 'sidebar_top',
    name: '사이드바 상단',
    description: '사이드바 상단 영역',
    defaultDesktopPerRow: 1,
    defaultMobilePerRow: 1,
    supportedTypes: ['image', 'html', 'empty']
  },
  {
    position: 'sidebar_bottom',
    name: '사이드바 하단',
    description: '사이드바 하단 영역',
    defaultDesktopPerRow: 1,
    defaultMobilePerRow: 1,
    supportedTypes: ['image', 'html', 'empty']
  },
  {
    position: 'left_margin',
    name: '좌측 여백',
    description: '페이지 좌측 여백 영역',
    defaultDesktopPerRow: 1,
    defaultMobilePerRow: 1,
    supportedTypes: ['image', 'html', 'empty']
  },
  {
    position: 'right_margin',
    name: '우측 여백',
    description: '페이지 우측 여백 영역',
    defaultDesktopPerRow: 1,
    defaultMobilePerRow: 1,
    supportedTypes: ['image', 'html', 'empty']
  },
  {
    position: 'popup',
    name: '팝업',
    description: '팝업형 배너',
    defaultDesktopPerRow: 1,
    defaultMobilePerRow: 1,
    supportedTypes: ['image', 'html', 'empty']
  },
  {
    position: 'post_list',
    name: '게시글 목록',
    description: '게시판 게시글 목록 5번째마다 광고',
    defaultDesktopPerRow: 1,
    defaultMobilePerRow: 1,
    supportedTypes: ['image', 'html', 'empty']
  },
  {
    position: 'widget_post_list',
    name: '메인 위젯 게시글 목록',
    description: '메인페이지 게시글 목록 위젯 5번째마다 광고',
    defaultDesktopPerRow: 1,
    defaultMobilePerRow: 1,
    supportedTypes: ['image', 'html', 'empty']
  }
]

// 배너 타입별 아이콘 및 설명
export const BANNER_TYPE_INFO = {
  image: {
    icon: '🖼️',
    name: '이미지',
    description: '이미지를 올리고 링크를 연결시킬 수 있어요'
  },
  html: {
    icon: '💻',
    name: 'HTML 코드',
    description: '구글 애드센스 코드를 넣어서 광고를 노출시킬 수 있어요'
  },
  vote: {
    icon: '🗳️',
    name: '투표',
    description: '투표를 만들어서 투표를 할 수 있어요'
  },
  empty: {
    icon: '📋',
    name: '빈 배너',
    description: '플레이스홀더 배너입니다'
  }
} as const

// 기본 배너 설정
export const DEFAULT_BANNER_CONFIG = {
  background_color: '#ffffff',
  text_color: '#000000',
  display_type: 'slide' as DisplayType,
  sort_type: 'created' as SortType,
  desktop_per_row: 2,
  mobile_per_row: 1,
  auto_slide_interval: 10000,
  is_active: true
} as const 