/**
 * 핫딜 데이터 포맷팅 유틸리티
 */

/**
 * 가격 포맷팅 (숫자 → "11,160원")
 * @param price 가격 (숫자)
 * @returns 포맷된 가격 문자열
 * @example
 * formatPrice(11160) // "11,160원"
 */
export function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}

/**
 * 할인율 계산
 * @param price 현재 가격
 * @param originalPrice 정가
 * @returns 할인율 (퍼센트) 또는 null
 * @example
 * getDiscountRate(11160, 15000) // 26
 */
export function getDiscountRate(
  price: number,
  originalPrice?: number
): number | null {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/**
 * 배송비 포맷팅 (무료배송 체크)
 * @param shipping 배송비 문자열
 * @returns 포맷된 배송비
 * @example
 * formatShipping('무료') // '무료배송'
 * formatShipping('3000') // '배송비 3,000원'
 */
export function formatShipping(shipping: string): string {
  if (shipping === '무료' || shipping === '무배') {
    return '무료배송';
  }
  if (shipping === '조건부 무료') {
    return '조건부 무료배송';
  }
  if (shipping === '별도') {
    return '배송비 별도';
  }
  // 숫자인 경우
  const price = parseInt(shipping.replace(/[^0-9]/g, ''));
  if (!isNaN(price)) {
    return `배송비 ${price.toLocaleString('ko-KR')}원`;
  }
  return shipping;
}
