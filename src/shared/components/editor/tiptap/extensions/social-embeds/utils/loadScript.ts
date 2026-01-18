/**
 * 외부 스크립트를 동적으로 로드하는 유틸리티
 */
export const loadScript = (src: string, id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 로드된 스크립트인지 확인
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.body.appendChild(script);
  });
};
