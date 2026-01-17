/**
 * 인기 쇼핑몰 목록 (자동완성용)
 */
export const POPULAR_STORES = [
  '네이버',
  '쿠팡',
  'G마켓',
  '11번가',
  '옥션',
  '위메프',
  '티몬',
  'SSG',
  '롯데온',
  '카카오',
  '알리익스프레스',
  '아마존',
  '기타',
] as const;

export type PopularStore = (typeof POPULAR_STORES)[number];

/**
 * 배송비 옵션
 */
export const SHIPPING_OPTIONS = [
  '무료',
  '무배',
  '조건부 무료',
  '2,500원',
  '3,000원',
  '별도',
] as const;

export type ShippingOption = (typeof SHIPPING_OPTIONS)[number];

/**
 * 핫딜 게시판 slug 목록
 */
export const HOTDEAL_BOARD_SLUGS = [
  'hotdeal',
  'hotdeal-food',
  'hotdeal-game',
  'hotdeal-pc',
  'hotdeal-appliance',
  'hotdeal-living',
  'hotdeal-fashion',
  'hotdeal-sale',
  'hotdeal-beauty',
  'hotdeal-mobile',
  'hotdeal-package',
  'hotdeal-coupon',
  'hotdeal-apptech',
  'hotdeal-sports',
  'hotdeal-overseas',
  'hotdeal-etc',
] as const;

export type HotdealBoardSlug = (typeof HOTDEAL_BOARD_SLUGS)[number];

/**
 * 종료 사유
 */
export const END_REASONS = ['품절', '마감', '가격변동', '링크오류', '기타'] as const;

export type EndReason = (typeof END_REASONS)[number];
