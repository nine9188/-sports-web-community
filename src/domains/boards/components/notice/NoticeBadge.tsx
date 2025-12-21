import type { NoticeType } from '@/domains/boards/types/post';

interface NoticeBadgeProps {
  type: NoticeType;
  isMustRead?: boolean;
  className?: string;
}

export function NoticeBadge({ type, isMustRead = false, className = '' }: NoticeBadgeProps) {
  // 필독: 진한 빨간색 배경 + 흰 글씨
  // 전체공지: 연한 빨간색 배경 + 진한 글씨
  // 게시판공지: 진한 빨간색 글씨 + 연한 배경 (전체공지 색 반전)

  const badgeStyle = isMustRead
    ? {
        bg: 'bg-red-600 dark:bg-red-700',
        text: 'text-white dark:text-white',
        label: '필독'
      }
    : type === 'global'
    ? {
        bg: 'bg-red-100 dark:bg-red-900',
        text: 'text-red-700 dark:text-red-200',
        label: '공지'
      }
    : {
        bg: 'bg-red-700 dark:bg-red-200',
        text: 'text-red-100 dark:text-red-900',
        label: '공지'
      };

  return (
    <span
      className={`
        inline-flex items-center h-5 px-2 py-0 rounded text-xs font-semibold leading-none
        ${badgeStyle.bg} ${badgeStyle.text}
        ${className}
      `}
    >
      {badgeStyle.label}
    </span>
  );
}
