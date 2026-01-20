import { getBoardsForNavigation } from '@/domains/layout/actions';
import ClientBoardNavigation from './ClientBoardNavigation';

// 서버 컴포넌트 (기본 내보내기) - Suspense 제거하고 바로 렌더링
export default async function BoardNavigation() {
  try {
    // 서버 측에서 데이터 가져오기 (캐싱 적용) - 헤더와 동일한 액션 사용
    const { boardData, totalPostCount } = await getBoardsForNavigation({ includeTotalPostCount: true });

    return <ClientBoardNavigation initialData={{ rootBoards: boardData, totalPostCount }} />;
  } catch (error) {
    console.error('게시판 데이터 가져오기 오류:', error);
    // 에러 발생 시 에러 메시지 표시
    return (
      <div className="rounded-md py-2">
        <p className="text-xs text-red-500">게시판 데이터를 불러오는데 실패했습니다.</p>
        <p className="text-xs text-gray-500 mt-1">잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }
} 