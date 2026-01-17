/**
 * 핫딜 유틸리티 모듈
 * @module domains/boards/utils/hotdeal
 */

// 포맷팅
export { formatPrice, getDiscountRate, formatShipping } from './format';

// 감지
export {
  detectStoreFromUrl,
  addStoreTag,
  removeStoreTag,
  isHotdealBoard,
} from './detect';

// 유효성 검사
export {
  validateDealInfo,
  createDealInfo,
  isValidUrl,
  parsePrice,
  DealInfoValidationError,
} from './validation';
