'use client';

import { useEffect, RefObject } from 'react';

/**
 * 외부 클릭 감지 훅
 *
 * 지정된 요소의 외부 클릭을 감지하여 콜백을 실행합니다.
 * 드롭다운, 모달, 팝오버 등에서 외부 클릭 시 닫기 동작에 사용됩니다.
 *
 * @param ref - 감지할 요소의 ref
 * @param handler - 외부 클릭 시 실행될 콜백
 * @param enabled - 감지 활성화 여부 (기본: true)
 *
 * @example
 * // 기본 사용
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * const [isOpen, setIsOpen] = useState(false);
 *
 * useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);
 *
 * return (
 *   <div ref={dropdownRef}>
 *     {isOpen && <DropdownContent />}
 *   </div>
 * );
 *
 * @example
 * // 여러 ref 지원 (드롭다운 + 트리거)
 * const refs = [dropdownRef, buttonRef];
 * useClickOutside(refs, () => setIsOpen(false), isOpen);
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null> | RefObject<T | null>[],
  handler: (event: MouseEvent) => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      const refs = Array.isArray(ref) ? ref : [ref];
      const target = event.target as Node;

      // 모든 ref 요소의 외부인지 확인
      const isOutside = refs.every((r) => {
        return r.current && !r.current.contains(target);
      });

      if (isOutside) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler, enabled]);
}

/**
 * Escape 키 감지 훅
 *
 * Escape 키 입력을 감지하여 콜백을 실행합니다.
 * 외부 클릭과 함께 모달/드롭다운 닫기에 자주 사용됩니다.
 *
 * @param handler - Escape 키 입력 시 실행될 콜백
 * @param enabled - 감지 활성화 여부 (기본: true)
 *
 * @example
 * useEscapeKey(() => setIsOpen(false), isOpen);
 */
export function useEscapeKey(
  handler: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handler();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handler, enabled]);
}

/**
 * 외부 클릭 + Escape 키 조합 훅
 *
 * 드롭다운, 모달 등에서 자주 사용되는 패턴을 하나로 결합합니다.
 *
 * @example
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * const [isOpen, setIsOpen] = useState(false);
 *
 * useClickOutsideOrEscape(dropdownRef, () => setIsOpen(false), isOpen);
 */
export function useClickOutsideOrEscape<T extends HTMLElement>(
  ref: RefObject<T | null> | RefObject<T | null>[],
  handler: () => void,
  enabled: boolean = true
): void {
  useClickOutside(ref, handler, enabled);
  useEscapeKey(handler, enabled);
}

export default useClickOutside;
