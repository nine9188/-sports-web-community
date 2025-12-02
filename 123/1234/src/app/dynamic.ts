// 모든 페이지가 동적으로 렌더링되도록 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0; // 항상 새로운 데이터를 가져오도록 설정

// 이 파일은 모든 라우트에 적용되는 설정을 포함합니다.
// Next.js 15에서 cookies() 함수 사용으로 인한 정적 렌더링 오류를 해결합니다. 