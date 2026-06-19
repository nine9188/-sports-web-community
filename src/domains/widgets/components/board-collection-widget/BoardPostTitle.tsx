'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';

interface BoardPostTitleProps {
  title: string;
  commentCount: number;
}

function normalizeTitle(title: string) {
  return title.replace(/\s+/g, ' ').trim();
}

function getCanvasContext() {
  const canvas = document.createElement('canvas');
  return canvas.getContext('2d');
}

function measureText(context: CanvasRenderingContext2D, text: string, font: string) {
  context.font = font;
  return context.measureText(text).width;
}

function fitTitle({
  title,
  commentText,
  availableWidth,
  titleFont,
  commentFont,
}: {
  title: string;
  commentText: string;
  availableWidth: number;
  titleFont: string;
  commentFont: string;
}) {
  const context = getCanvasContext();
  if (!context || availableWidth <= 0) return title;

  const ellipsis = '...';
  const commentWidth = commentText ? measureText(context, commentText, commentFont) + 3 : 0;
  const fullWidth = measureText(context, title, titleFont) + commentWidth;
  if (fullWidth <= availableWidth) return title;

  const chars = Array.from(title);
  let low = 0;
  let high = chars.length;
  let best = '';

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = `${chars.slice(0, mid).join('').trimEnd()}${ellipsis}`;
    const width = measureText(context, candidate, titleFont) + commentWidth;

    if (width <= availableWidth) {
      best = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best || ellipsis;
}

export default function BoardPostTitle({ title, commentCount }: BoardPostTitleProps) {
  const normalizedTitle = useMemo(() => normalizeTitle(title), [title]);
  const commentText = commentCount > 0 ? `[${commentCount}]` : '';
  const containerRef = useRef<HTMLSpanElement>(null);
  const [displayTitle, setDisplayTitle] = useState(normalizedTitle);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateTitle = () => {
      const style = window.getComputedStyle(element);
      const fitted = fitTitle({
        title: normalizedTitle,
        commentText,
        availableWidth: element.clientWidth,
        titleFont: `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
        commentFont: `500 12px ${style.fontFamily}`,
      });
      setDisplayTitle(fitted);
    };

    updateTitle();

    const observer = new ResizeObserver(updateTitle);
    observer.observe(element);

    return () => observer.disconnect();
  }, [commentText, normalizedTitle]);

  return (
    <span
      ref={containerRef}
      className="block max-w-full overflow-hidden whitespace-nowrap text-[13px] font-normal text-gray-900 dark:text-[#F0F0F0]"
      title={commentCount > 0 ? `${normalizedTitle} 댓글 ${commentCount}개` : normalizedTitle}
    >
      {displayTitle}
      {commentCount > 0 && (
        <span className="ml-0.5 text-xs font-medium text-orange-600 dark:text-orange-400">
          {commentText}
        </span>
      )}
    </span>
  );
}
