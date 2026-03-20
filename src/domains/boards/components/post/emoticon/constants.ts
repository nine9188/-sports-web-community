// 데스크톱 피커 그리드 영역 높이 계산:
//   4행 × 100px + 3갭 × 10px + py-4(32px) = 462px
// → 모든 뷰의 콘텐츠 영역이 이 높이를 사용
export const DESKTOP_CONTENT_HEIGHT = 'h-[462px]';

// 피커 그리드 규격
export const COLS = 6;
export const ROWS = 4;
export const ITEMS_PER_PAGE = COLS * ROWS; // 24
