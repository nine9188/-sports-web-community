import ClientPostList from '@/app/components/post/ClientPostList';

interface ServerPostListProps {
  boardId?: string;
  boardIds?: string[];
  currentPostId?: string;
  emptyMessage?: string;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  className?: string;
  maxHeight?: string;
  currentBoardId: string;
  boardNameMaxWidth?: string;
  showBoard?: boolean;
  fromParam?: string;
}

export default function ServerPostList({
  boardId,
  boardIds,
  currentPostId,
  emptyMessage,
  headerContent,
  footerContent,
  className,
  maxHeight,
  currentBoardId,
  boardNameMaxWidth,
  showBoard,
  fromParam,
}: ServerPostListProps) {
  return (
    <ClientPostList 
      boardId={boardId}
      boardIds={boardIds}
      currentPostId={currentPostId}
      emptyMessage={emptyMessage}
      headerContent={headerContent}
      footerContent={footerContent}
      className={className}
      maxHeight={maxHeight}
      currentBoardId={currentBoardId}
      boardNameMaxWidth={boardNameMaxWidth}
      showBoard={showBoard}
      fromParam={fromParam}
    />
  );
} 