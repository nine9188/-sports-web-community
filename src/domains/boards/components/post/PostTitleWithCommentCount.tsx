import type { ReactNode } from 'react';

interface PostTitleWithCommentCountProps {
  title: string;
  commentCount?: number;
  className?: string;
  titleClassName?: string;
  childrenBeforeComment?: ReactNode;
  compactComment?: boolean;
  inlineComment?: boolean;
  clampClassName?: string;
  tightComment?: boolean;
}

export default function PostTitleWithCommentCount({
  title,
  commentCount = 0,
  className = '',
  titleClassName = '',
  childrenBeforeComment,
  compactComment = false,
  inlineComment = false,
  clampClassName = '',
  tightComment = false,
}: PostTitleWithCommentCountProps) {
  if (inlineComment) {
    return (
      <span className={`flex w-full min-w-0 items-center ${tightComment ? 'gap-0' : 'gap-1'} align-middle ${className}`}>
        <span
          className={`${titleClassName} min-w-0 ${commentCount > 0 ? 'max-w-[calc(100%-1.75rem)]' : 'max-w-full'} ${clampClassName}`.trim()}
          title={commentCount > 0 ? `${title} 댓글 ${commentCount}개` : title}
        >
          {title}
        </span>
        {commentCount > 0 && (
          <span
            className="text-xs text-orange-600 dark:text-orange-400 font-medium flex-shrink-0 whitespace-nowrap"
            title={`댓글 ${commentCount}개`}
          >
            [{commentCount}]
          </span>
        )}
        {childrenBeforeComment}
      </span>
    );
  }

  return (
    <span className={`inline-flex max-w-full items-center gap-1 align-middle ${className}`}>
      <span className={`${titleClassName} min-w-0 truncate ${compactComment ? 'max-w-[calc(100%-2rem)]' : ''}`}>
        {title}
      </span>
      {childrenBeforeComment}
      {commentCount > 0 && (
        <span
          className="text-xs text-orange-600 dark:text-orange-400 font-medium flex-shrink-0 whitespace-nowrap"
          title={`댓글 ${commentCount}개`}
        >
          [{commentCount}]
        </span>
      )}
    </span>
  );
}
