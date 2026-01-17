/**
 * 핫딜 데이터 감지 유틸리티
 */

import { HOTDEAL_BOARD_SLUGS } from '../../types/hotdeal';

/**
 * URL에서 쇼핑몰 자동 감지
 * @param url 상품 URL
 * @returns 감지된 쇼핑몰 이름
 * @example
 * detectStoreFromUrl('https://www.coupang.com/vp/products/123') // '쿠팡'
 */
export function detectStoreFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('coupang.com')) return '쿠팡';
    if (hostname.includes('gmarket.co.kr')) return 'G마켓';
    if (hostname.includes('11st.co.kr')) return '11번가';
    if (hostname.includes('auction.co.kr')) return '옥션';
    if (hostname.includes('naver.com')) return '네이버';
    if (hostname.includes('wemakeprice.com')) return '위메프';
    if (hostname.includes('tmon.co.kr')) return '티몬';
    if (hostname.includes('ssg.com')) return 'SSG';
    if (hostname.includes('lotteon.com')) return '롯데온';
    if (hostname.includes('kakao.com')) return '카카오';
    if (hostname.includes('aliexpress.com')) return '알리익스프레스';
    if (hostname.includes('amazon.com')) return '아마존';

    return '기타';
  } catch {
    return '기타';
  }
}

/**
 * 제목에 쇼핑몰 태그 추가
 * @param title 원본 제목
 * @param store 쇼핑몰 이름
 * @returns 태그가 추가된 제목
 * @example
 * addStoreTag('LG 통돌이 세탁기', '쿠팡') // '[쿠팡] LG 통돌이 세탁기'
 */
export function addStoreTag(title: string, store: string): string {
  // 이미 태그가 있으면 그대로 반환
  if (title.trim().startsWith('[')) return title;

  return `[${store}] ${title}`;
}

/**
 * 제목에서 쇼핑몰 태그 제거
 * @param title 태그가 포함된 제목
 * @returns 태그가 제거된 제목
 * @example
 * removeStoreTag('[쿠팡] LG 통돌이 세탁기') // 'LG 통돌이 세탁기'
 */
export function removeStoreTag(title: string): string {
  return title.replace(/^\[.*?\]\s*/, '').trim();
}

/**
 * 핫딜 게시판인지 확인
 * @param boardSlug 게시판 slug
 * @returns 핫딜 게시판 여부
 * @example
 * isHotdealBoard('hotdeal-food') // true
 * isHotdealBoard('free') // false
 */
export function isHotdealBoard(boardSlug: string): boolean {
  return HOTDEAL_BOARD_SLUGS.includes(boardSlug as any);
}
