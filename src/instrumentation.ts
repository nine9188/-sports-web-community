// Next.js instrumentation file
// 앱 시작 시 한 번 실행됩니다

export async function register() {
  // Node.js 환경에서만 실행
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 원본 console.error 저장
    const originalError = console.error

    // console.error 오버라이드
    console.error = (...args: any[]) => {
      // 첫 번째 인자를 문자열로 변환
      const firstArg = args[0]
      const message =
        typeof firstArg === 'string'
          ? firstArg
          : firstArg?.message || JSON.stringify(firstArg)

      // Refresh token 관련 에러는 무시
      if (
        message.includes('refresh_token_already_used') ||
        message.includes('Invalid Refresh Token: Already Used') ||
        (firstArg?.code === 'refresh_token_already_used')
      ) {
        // 무시 (클라이언트가 토큰 갱신을 담당하므로 서버 측 에러는 정상)
        return
      }

      // 다른 에러는 정상적으로 출력
      originalError.apply(console, args)
    }
  }
}
