/**
 * 핫딜 정보 인터페이스
 */
export interface DealInfo {
  /** 쇼핑몰/판매처 */
  store: string;

  /** 상품명 */
  product_name: string;

  /** 판매가 (원) */
  price: number;

  /** 정가 (원) - 할인율 표시용 */
  original_price?: number;

  /** 배송비 */
  shipping: string;

  /** 구매 링크 */
  deal_url: string;

  /** 종료 여부 */
  is_ended: boolean;

  /** 종료 시간 */
  ended_at?: string;

  /** 종료 사유 */
  ended_reason?: '품절' | '마감' | '가격변동' | '링크오류' | '기타';
}

/**
 * 핫딜 게시글 타입 (Post 확장)
 */
export interface HotdealPost {
  id: string;
  title: string;
  content: string;
  deal_info: DealInfo;
  // ... 기타 Post 필드들
}
