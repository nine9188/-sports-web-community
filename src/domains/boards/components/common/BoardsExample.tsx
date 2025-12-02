// 서버 컴포넌트 - 페이지나 레이아웃에서 사용
import ServerBoardsProvider from './ServerBoardsProvider';
import ClientBoardsList from './ClientBoardsList';

export default function BoardsExample() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">게시판 예시 (SSR + 서버 액션)</h2>
      
      {/* 서버에서 데이터를 가져와서 클라이언트에 전달 */}
      <ServerBoardsProvider>
        {(boardsData) => (
          <ClientBoardsList initialBoardsData={boardsData} />
        )}
      </ServerBoardsProvider>
    </div>
  );
} 