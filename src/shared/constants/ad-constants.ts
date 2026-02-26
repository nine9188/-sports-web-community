/**
 * 광고 슬롯/유닛 ID 상수
 *
 * 모든 광고 ID를 한 곳에서 관리
 */

// Google AdSense
export const ADSENSE = {
  CLIENT_ID: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,

  // 페이지 배너 (메인, 이적시장, 라이브스코어 등)
  PC_BANNER: '8132343983',        // 728x90
  MOBILE_BANNER: '5245092664',    // 320x100

  // 오른쪽 사이드바
  RIGHT_SIDEBAR: '7382476894',    // 300x250

  // 게시글 상세
  POST_PC_INFEED: '2093016410',   // fluid
  POST_MOBILE_BANNER: '1917321828', // 320x100
} as const;

// Kakao AdFit
export const KAKAO = {
  // 왼쪽 사이드바
  LEFT_SIDEBAR: 'DAN-ZD3sGdw5Tg2wQXp6',   // 300x250

  // 게시글 PC 배너
  POST_PC_BANNER: 'DAN-1pcdg9VkUBDfzAby',  // 728x90

  // 모바일 모달 (햄버거, 라이브스코어, 프로필)
  MOBILE_MODAL: 'DAN-QHHDOL6PisGQW7b6',    // 320x100
} as const;
