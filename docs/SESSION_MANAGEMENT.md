# 세션 관리 설정 가이드

## 개요
이 프로젝트는 사용자 선택에 따른 유연한 세션 관리를 제공합니다.
- **일반 로그인**: 24시간 세션 유지
- **로그인 유지**: 30일 장기 세션 유지

## 1. Supabase JWT 설정

### Dashboard 설정 경로
1. Supabase Dashboard 접속
2. 프로젝트 선택
3. `Settings` → `Auth` → `JWT Settings`

### 권장 설정값

```yaml
JWT Expiry: 3600 (1시간)
  - 기본값 유지
  - Access Token 만료 시간

Refresh Token Expiry: 2592000 (30일)
  - 기존: 604800 (7일)
  - 변경: 2592000 (30일)
  - "로그인 유지" 옵션에서 사용
```

### SQL 설정 (대안)
```sql
-- Refresh Token 만료 시간 설정 (초 단위)
ALTER DATABASE postgres SET app.settings.refresh_token_expiry = '2592000';

-- 또는 환경변수로 설정
-- GOTRUE_JWT_EXP=3600
-- GOTRUE_REFRESH_TOKEN_EXPIRY=2592000
```

## 2. 클라이언트 측 구현

### AuthContext 설정
```typescript
// src/shared/context/AuthContext.tsx

const SESSION_TYPES = {
  NORMAL: {
    AUTO_LOGOUT_TIME: 24 * 60 * 60 * 1000, // 24시간
    SESSION_WARNING_TIME: 30 * 60 * 1000,  // 30분 전 경고
  },
  EXTENDED: {
    AUTO_LOGOUT_TIME: 30 * 24 * 60 * 60 * 1000, // 30일
    SESSION_WARNING_TIME: 24 * 60 * 60 * 1000,   // 1일 전 경고
  }
};
```

### 로그인 폼
```typescript
// src/app/(auth)/signin/page.tsx

// 체크박스 상태
const [keepLogin, setKeepLogin] = useState(false);

// 로그인 시 세션 타입 설정
localStorage.setItem('keep_login', keepLogin ? 'true' : 'false');
setSessionType(keepLogin);
```

## 3. 세션 관리 동작 방식

### 일반 로그인 (keepLogin = false)
1. **세션 유지 시간**: 24시간
2. **경고 시점**: 23시간 30분 후
3. **자동 로그아웃**: 24시간 후

### 로그인 유지 (keepLogin = true)
1. **세션 유지 시간**: 30일
2. **경고 시점**: 29일 후
3. **자동 로그아웃**: 30일 후

### 세션 갱신
- 15분마다 자동 refresh token 갱신
- Supabase의 JWT expiry에 맞춰 자동 처리

## 4. 보안 고려사항

### 장기 세션의 보안 강화
```typescript
// 1. 민감한 작업 시 재인증 요구
if (isSensitiveAction) {
  await reauthenticate();
}

// 2. 의심스러운 활동 감지
if (suspiciousActivity) {
  await forceLogout();
}

// 3. 비밀번호 변경 시 모든 세션 무효화
await supabase.auth.admin.signOut(userId);
```

### IP/기기 추적 (선택사항)
```typescript
// 로그인 시 IP 및 User-Agent 저장
const loginMetadata = {
  ip: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent'),
  lastLogin: new Date().toISOString()
};

// 다른 IP/기기에서 접속 시 알림
if (currentIP !== savedIP) {
  sendSecurityAlert(user.email);
}
```

## 5. 테스트 체크리스트

### 일반 로그인
- [ ] 24시간 후 자동 로그아웃 확인
- [ ] 23시간 30분 후 경고 토스트 표시
- [ ] 세션 연장 버튼 동작 확인

### 로그인 유지
- [ ] 30일 동안 로그인 상태 유지
- [ ] 29일 후 경고 토스트 표시
- [ ] 브라우저 재시작 후에도 로그인 유지

### 세션 갱신
- [ ] 15분마다 자동 갱신 확인
- [ ] 네트워크 오류 시 재시도 로직
- [ ] 갱신 실패 시 로그아웃 처리

### 보안
- [ ] 로그아웃 시 localStorage 정리
- [ ] 비밀번호 변경 시 전체 세션 무효화
- [ ] 다중 탭에서 동기화 확인

## 6. 트러블슈팅

### 문제: 세션이 예상보다 빨리 만료됨
**원인**: Supabase의 Refresh Token Expiry 설정이 짧음
**해결**: Dashboard에서 `2592000` (30일)로 변경

### 문제: 로그인 유지가 작동하지 않음
**원인**: localStorage의 `keep_login` 값이 저장되지 않음
**해결**:
```typescript
// 로그인 전에 설정 확인
console.log('Keep Login:', localStorage.getItem('keep_login'));
```

### 문제: 경고 토스트가 표시되지 않음
**원인**: 타이머 중복 실행 또는 조기 정리
**해결**:
```typescript
// AuthContext의 타이머 ref 로그 확인
console.log('Warning Timer:', warningTimerRef.current);
console.log('Auto Logout Timer:', autoLogoutTimerRef.current);
```

## 7. 참고 자료

### 네이버 카페 / 디시인사이드 방식 분석
- **공통점**: Idle Timeout 없음, 장기 세션 유지
- **차이점**:
  - 네이버: 2주 refresh token
  - 디시: 30일 세션
  - 4590: 선택적 24시간/30일

### Supabase 공식 문서
- [Auth Configuration](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [JWT Settings](https://supabase.com/docs/guides/auth/sessions)
- [Refresh Token Rotation](https://supabase.com/docs/guides/auth/sessions/refresh-tokens)

## 8. 향후 개선 방향

1. **기기별 세션 관리**
   - 여러 기기에서 동시 로그인
   - 기기별 로그아웃 기능

2. **세션 활동 로그**
   - 로그인 이력 저장
   - 의심스러운 활동 감지

3. **유연한 설정**
   - 관리자 페이지에서 세션 시간 조정
   - 사용자별 커스텀 세션 정책
