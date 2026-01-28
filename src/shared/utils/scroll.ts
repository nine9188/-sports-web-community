type ScrollTarget = Element | Window;

function scrollElement(
  target: ScrollTarget,
  top: number,
  left: number,
  behavior: ScrollBehavior
) {
  if (target === window) {
    window.scrollTo({ top, left, behavior });
    return;
  }

  const el = target as Element & {
    scrollTo?: (options: ScrollToOptions) => void;
    scrollTop?: number;
    scrollLeft?: number;
  };

  if (typeof el.scrollTo === 'function') {
    el.scrollTo({ top, left, behavior });
  } else {
    if (typeof el.scrollTop === 'number') el.scrollTop = top;
    if (typeof el.scrollLeft === 'number') el.scrollLeft = left;
  }
}

/**
 * 페이지를 최상단으로 스크롤
 */
export function scrollToTop(behavior: ScrollBehavior = 'auto') {
  const candidates: ScrollTarget[] = [
    document.scrollingElement ?? document.documentElement,
    document.body,
    window,
  ];

  for (const target of candidates) {
    try {
      scrollElement(target, 0, 0, behavior);
    } catch {
      // 조용히 무시
    }
  }
}
