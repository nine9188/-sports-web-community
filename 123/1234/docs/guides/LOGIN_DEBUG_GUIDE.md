# 로그인 디버깅 가이드

## 🔍 로그인 후 즉시 확인할 사항

### 1. 브라우저 개발자 도구 열기 (F12)

### 2. Application 탭 → Cookies 확인
다음 쿠키들이 있어야 합니다:
```
이름 패턴: sb-<project-ref>-auth-token
또는: sb-<project-ref>-auth-token-code-verifier
```

**쿠키가 있는 경우:**
- ✅ 쿠키 저장 성공
- 쿠키의 `Expires` 값 확인 (미래 시간이어야 함)
- `Value` 길이 확인 (매우 긴 문자열이어야 함)

**쿠키가 없는 경우:**
- ❌ 쿠키 저장 실패 → 아래 "쿠키 저장 실패 해결" 참고

### 3. Console 탭 확인

**로그인 성공 시 나와야 할 로그:**
```
✅ 로그인 성공 - 세션 생성됨: {
  userId: "...",
  username: "...",
  sessionExpiry: <숫자>,
  hasAccessToken: true,
  hasRefreshToken: true
}
```

**문제가 있는 경우:**
```
⚠️ 로그인 성공했지만 세션이 없음!
```
또는
```
서버 액션에서 쿠키 설정 실패: <에러 메시지>
```

### 4. Network 탭 → Headers 확인

로그인 요청(`/rest/v1/rpc/...` 또는 `/auth/v1/token`) 후:
- **Response Headers** 에서 `Set-Cookie` 헤더 확인
- `Set-Cookie`가 있어야 쿠키가 설정됨

## ❌ 쿠키 저장 실패 해결

### 원인 1: SameSite 설정 문제
**증상**: localhost에서만 쿠키 안 저장됨

**해결**:
1. `.env.local` 파일 확인
2. `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (https 아님!)
3. 또는 쿠키 설정에 `sameSite: 'lax', secure: false` 추가

### 원인 2: persistSession이 실제로 false
**증상**: 서버 액션에서 세션이 생성되지만 쿠키 없음

**해결**:
파일 확인: `src/shared/api/supabaseServer.ts:63`
```typescript
persistSession: true, // ✅ 이게 true인지 확인
```

### 원인 3: Supabase 프로젝트 설정
**증상**: 로그인은 되는데 바로 로그아웃됨

**확인**:
1. Supabase Dashboard → Authentication → Settings
2. "Time-box user sessions" = 비활성화 또는 충분히 긴 시간
3. "Inactivity timeout" = 비활성화 또는 충분히 긴 시간
4. "Single session per user" = 비활성화 (테스트용)

## 🧪 테스트 절차

### 1단계: 로그인
1. 아이디/비밀번호 입력
2. "로그인 유지" **체크 안 함**
3. 로그인 버튼 클릭

### 2단계: Console 로그 확인
```
✅ 로그인 성공 - 세션 생성됨
```
이 로그가 나오는지 확인

### 3단계: Application → Cookies 확인
Supabase 쿠키가 있는지 확인

### 4단계: 페이지 새로고침 (F5)
여전히 로그인 상태인지 확인

### 5단계: Console에서 세션 확인
Console에 입력:
```javascript
window.localStorage.getItem('sb-' + '<your-project-ref>' + '-auth-token')
```

## 📊 예상 결과

### ✅ 정상 작동
1. 로그인 후 Console에 "✅ 로그인 성공" 로그
2. Cookies에 `sb-xxx-auth-token` 존재
3. 새로고침 후에도 로그인 유지
4. 로그인 유지 체크 안 해도 24시간은 유지

### ❌ 문제 있음
1. 로그인 후 바로 로그아웃 페이지로 이동
2. Cookies에 Supabase 쿠키 없음
3. Console에 "⚠️ 로그인 성공했지만 세션이 없음!" 또는 "쿠키 설정 실패"
4. Network 탭에 `Set-Cookie` 헤더 없음

## 💡 즉각 확인 방법

개발자 도구 Console에서 즉시 실행:
```javascript
// 현재 세션 확인
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 세션 정보 출력
supabase.auth.getSession().then(({ data: { session } }) => {
  console.log('현재 세션:', session);
  if (session) {
    console.log('✅ 세션 존재');
    console.log('만료 시간:', new Date(session.expires_at * 1000));
  } else {
    console.log('❌ 세션 없음');
  }
});
```

## 🚨 긴급 임시 해결책

세션이 자꾸 사라진다면:
1. `window.location.href = redirectUrl` 로 강제 새로고침 유지 (Line 142-150)
2. AuthContext에서 `getSession()` 우선 호출 유지 (이미 적용됨)
3. Supabase Dashboard에서 모든 세션 타임아웃 비활성화
