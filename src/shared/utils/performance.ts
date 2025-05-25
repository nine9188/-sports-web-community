/**
 * 성능 최적화 유틸리티 함수
 */

/**
 * 디바운스 함수 - 여러 번 호출되는 함수를 지정된 시간 내에 한 번만 실행되도록 제한
 * @param func 실행할 함수
 * @param wait 대기 시간 (밀리초)
 * @returns 디바운스된 함수
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * 스로틀 함수 - 함수가 호출되는 빈도를 제한
 * @param func 실행할 함수
 * @param limit 제한 시간 (밀리초)
 * @returns 스로틀된 함수
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 비동기 작업을 지연시키는 함수
 * @param ms 지연 시간 (밀리초)
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * DOM 작업을 다음 프레임으로 지연시키는 함수
 * @param callback 실행할 콜백함수
 */
export function nextFrame(callback: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback);
  });
}

/**
 * Object.keys에 타입 지원을 추가한 유틸리티 함수
 * @param obj 객체
 * @returns 객체의 키 배열
 */
export function typedKeys<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
} 