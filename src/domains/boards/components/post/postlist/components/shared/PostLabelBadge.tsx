'use client';

type PostLabelSource = {
  is_must_read?: boolean;
  is_notice?: boolean;
  is_event?: boolean;
};

type PostLabel = 'must-read' | 'notice' | 'event';

export function getPostLabel(post: PostLabelSource): PostLabel | null {
  if (post.is_must_read) return 'must-read';
  if (post.is_notice) return 'notice';
  if (post.is_event) return 'event';
  return null;
}

export function hasPostLabel(post: PostLabelSource): boolean {
  return getPostLabel(post) !== null;
}

export function PostLabelBadge({
  post,
  size = 'md',
}: {
  post: PostLabelSource;
  size?: 'sm' | 'md';
}) {
  const label = getPostLabel(post);
  if (!label) return null;

  const sizeClass =
    size === 'sm'
      ? 'h-4 px-1.5 text-[10px]'
      : 'h-5 px-2 text-xs';

  const colorClass =
    label === 'must-read'
      ? 'bg-red-600 dark:bg-red-700 text-white'
      : label === 'notice'
        ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
        : 'bg-amber-100 dark:bg-amber-900/70 text-amber-700 dark:text-amber-200';

  const text =
    label === 'must-read'
      ? '필독'
      : label === 'notice'
        ? '공지'
        : '이벤트';

  return (
    <span className={`inline-flex items-center ${sizeClass} py-0 rounded font-semibold leading-none flex-shrink-0 whitespace-nowrap ${colorClass}`}>
      {text}
    </span>
  );
}
