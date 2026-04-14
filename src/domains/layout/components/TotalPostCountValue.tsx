import { getTotalPostCount } from '@/domains/layout/actions/getTotalPostCount';

// 숫자 포맷팅 (1000 이상이면 K 단위로) — ClientBoardNavigation.formatCount와 동일 규칙
function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toLocaleString();
}

/**
 * 전체 게시글 개수 표시 서버 컴포넌트
 *
 * 레이아웃 await 경로에서 벗어나 Suspense 스트리밍으로 렌더됨.
 * - 상위에서 반드시 <Suspense fallback={...}> 로 감싸야 함
 * - fallback에서 바로 fallback 텍스트가 나오고, 실제 카운트는 스트리밍으로 교체됨
 */
export default async function TotalPostCountValue() {
  const count = await getTotalPostCount();
  return <>{formatCount(count)}</>;
}
