/**
 * 핫딜 데이터 유효성 검사 유틸리티
 */

import type { DealInfo } from '../../types/hotdeal';

/**
 * DealInfo 유효성 검사 에러
 */
export class DealInfoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DealInfoValidationError';
  }
}

/**
 * DealInfo 객체 유효성 검사
 * @param dealInfo 검증할 DealInfo 객체
 * @throws {DealInfoValidationError} 유효하지 않은 경우
 * @example
 * validateDealInfo({ store: '쿠팡', price: 10000, ... })
 */
export function validateDealInfo(dealInfo: Partial<DealInfo>): void {
  // 필수 필드 체크
  if (!dealInfo.store || dealInfo.store.trim() === '') {
    throw new DealInfoValidationError('쇼핑몰을 입력해주세요.');
  }

  if (!dealInfo.product_name || dealInfo.product_name.trim() === '') {
    throw new DealInfoValidationError('상품명을 입력해주세요.');
  }

  if (dealInfo.price === undefined || dealInfo.price === null) {
    throw new DealInfoValidationError('가격을 입력해주세요.');
  }

  if (dealInfo.price < 0) {
    throw new DealInfoValidationError('가격은 0원 이상이어야 합니다.');
  }

  if (!dealInfo.shipping || dealInfo.shipping.trim() === '') {
    throw new DealInfoValidationError('배송비를 입력해주세요.');
  }

  if (!dealInfo.deal_url || dealInfo.deal_url.trim() === '') {
    throw new DealInfoValidationError('상품 링크를 입력해주세요.');
  }

  // URL 형식 검증
  try {
    new URL(dealInfo.deal_url);
  } catch {
    throw new DealInfoValidationError('올바른 URL 형식이 아닙니다.');
  }

  // 정가가 있는 경우, 판매가보다 높아야 함
  if (
    dealInfo.original_price !== undefined &&
    dealInfo.original_price !== null &&
    dealInfo.original_price < dealInfo.price
  ) {
    throw new DealInfoValidationError('정가는 판매가보다 높아야 합니다.');
  }
}

/**
 * DealInfo 생성 헬퍼
 * @param data Partial DealInfo 데이터
 * @returns 완전한 DealInfo 객체
 * @throws {DealInfoValidationError} 유효하지 않은 경우
 */
export function createDealInfo(data: Partial<DealInfo>): DealInfo {
  validateDealInfo(data);

  return {
    store: data.store!,
    product_name: data.product_name!,
    price: data.price!,
    original_price: data.original_price,
    shipping: data.shipping!,
    deal_url: data.deal_url!,
    is_ended: data.is_ended ?? false,
    ended_at: data.ended_at,
    ended_reason: data.ended_reason,
  };
}

/**
 * URL 유효성 검사
 * @param url 검증할 URL
 * @returns 유효한 URL 여부
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 가격 파싱 (문자열 → 숫자)
 * @param priceStr 가격 문자열 (예: "11,160원", "11160")
 * @returns 파싱된 가격 (숫자) 또는 null
 * @example
 * parsePrice('11,160원') // 11160
 * parsePrice('11160') // 11160
 */
export function parsePrice(priceStr: string): number | null {
  const cleaned = priceStr.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? null : parsed;
}
