// default.tsx는 특별한 파일로, Parallel Routes 구조에서
// 특정 슬롯이 요청되지 않았을 때 기본적으로 표시될 내용을 정의합니다.
// 이 파일은 @overview, @squad 등의 슬롯이 명시적으로 요청되지 않은 경우에 사용됩니다.

export default function DefaultContent() {
  // 이 컴포넌트는 실제로 사용되지 않지만, Next.js 라우팅 시스템에서 필요합니다.
  return null;
} 