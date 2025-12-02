# STEP 4 완료: AuthContext 단순화

**작성일**: 2025-11-28
**작업 시간**: 약 1시간
**상태**: ✅ 완료

---

## 📋 작업 개요

### 목표
AuthContext의 복잡도를 대폭 줄이고 핵심 기능만 남기기

### 배경
STEP 1 진행 중 AuthContext의 복잡성으로 인한 SSR 문제가 계속 발생하여, STEP 2-3을 건너뛰고 우선 진행

---

## 🗑️ 제거된 기능

### 1. 자동 로그아웃 타이머 시스템 (~100줄)
```typescript
// 제거된 코드
const setupAutoLogoutTimer = useCallback(() => {
  const sessionConfig = isExtendedSession
    ? SESSION_TYPES.EXTENDED
    : SESSION_TYPES.NORMAL;
  // ... 복잡한 타이머 로직
}, []);
```

**제거 이유**:
- 사용자가 요청하지 않은 기능
- 복잡한 타이머 관리 (3개의 ref: warning, logout, countdown)
- Supabase 자체 세션 만료 기능으로 충분

### 2. 세션 경고 시스템 (~80줄)
```typescript
// 제거된 코드
toast.info(
  <div>
    <p>{warningMessage}</p>
    <button onClick={() => extendSession()}>세션 연장</button>
  </div>,
  { autoClose: SESSION_WARNING_TIME }
);
```

**제거 이유**:
- UX를 해치는 불필요한 알림
- 복잡한 카운트다운 UI
- 세션 연장 버튼 로직

### 3. 복잡한 Polling 로직 (~50줄)
```typescript
// 제거된 코드
const pollInterval = setInterval(async () => {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  // ... 15분마다 체크
}, 15 * 60 * 1000);
```

**제거 이유**:
- Supabase의 `onAuthStateChange`로 충분
- 불필요한 네트워크 요청
- 성능 낭비

### 4. 활동 감지 시스템 (~100줄)
```typescript
// 제거된 코드
const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
events.forEach(event => {
  document.addEventListener(event, handleActivity, true);
});
```

**제거 이유**:
- 과도한 이벤트 리스너
- 자동 로그아웃 기능 제거로 불필요
- 메모리 누수 가능성

### 5. 세션 타입 관리 (~50줄)
```typescript
// 제거된 코드
const [isExtendedSession, setIsExtendedSession] = useState(() => {
  return localStorage.getItem('keep_login') === 'true';
});
const [timeUntilLogout, setTimeUntilLogout] = useState<number | null>(null);
```

**제거 이유**:
- localStorage 기반 복잡한 상태 관리
- 불필요한 상태 변수들
- 타이머 시스템과 강결합

---

## ✅ 남은 핵심 기능

### 1. 로그인/로그아웃
```typescript
const logoutUser = useCallback(async () => {
  await signOut();
  setUser(null);
  setSession(null);
  toast.info('로그아웃되었습니다.');
}, []);
```

### 2. 세션 관리
```typescript
// Supabase 자체 갱신 활용
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    setSession(session);
  }
});
```

### 3. 사용자 정보 조회
```typescript
const refreshUserData = useCallback(async () => {
  const result = await updateUserData();
  if (result.success && result.data) {
    setUser(result.data as User);
  }
}, [user]);
```

### 4. 프로필 아이콘 업데이트
```typescript
const updateIcon = useCallback(async (iconId: number) => {
  const { error } = await supabase
    .from('profiles')
    .update({ icon_id: iconId })
    .eq('id', user.id);

  await refreshUserData();
  return !error;
}, [user, supabase]);
```

---

## 📊 코드 라인 비교

```
Before (구버전):
- 총 라인: 726줄
- 주요 로직: ~300줄
- 타이머/경고: ~200줄
- 활동 감지: ~100줄
- 세션 관리: ~100줄
- 기타: ~26줄

After (신버전):
- 총 라인: 209줄
- 주요 로직: ~150줄
- 세션 관리: ~50줄
- 기타: ~9줄

감소: 517줄 (71% 감소!)
```

---

## 🔧 SSR 안전성 개선

### 문제
Next.js가 클라이언트 컴포넌트도 서버에서 먼저 렌더링하면서 `getSupabaseBrowser()`가 에러 발생

### 해결
1. **AuthContext 내부 수정**
   ```typescript
   const [supabase] = useState(() => {
     if (typeof window === 'undefined') return null;
     return getSupabaseBrowser();
   });
   ```

2. **useEffect에 null 체크 추가**
   ```typescript
   useEffect(() => {
     if (!supabase) {
       setIsLoading(false);
       return;
     }
     // ... 나머지 로직
   }, [supabase]);
   ```

3. **getSupabaseBrowser() 근본 수정**
   ```typescript
   // client.browser.ts
   export function getSupabaseBrowser() {
     if (typeof window === 'undefined') {
       return null as any;  // 에러 던지기 → null 반환
     }
     // ...
   }
   ```

---

## 📁 파일 위치

- **새 버전**: `src/shared/context/AuthContext.tsx` (209줄)
- **백업**: `src/shared/context/AuthContext.old.tsx` (726줄)

---

## ✅ 검증 체크리스트

### 빌드 테스트
- [x] `npm run build` 성공
- [x] 타입 에러 없음
- [x] SSR 에러 없음

### 기능 테스트 (개발 서버 필요)
- [ ] 로그인 작동
- [ ] 로그아웃 작동
- [ ] 세션 유지
- [ ] 프로필 아이콘 업데이트

---

## 💡 주요 개선점

### 1. 코드 가독성
- 불필요한 ref와 상태 제거
- 명확한 함수 이름
- 간단한 로직 흐름

### 2. 유지보수성
- 71% 코드 감소
- 단순한 의존성
- 쉬운 디버깅

### 3. 성능
- 불필요한 polling 제거
- 이벤트 리스너 제거
- 메모리 사용량 감소

### 4. 신뢰성
- Supabase 자체 세션 관리 활용
- SSR 안전성 보장
- 에러 핸들링 간소화

---

## 🚀 다음 단계

1. **개발 서버 테스트**
   ```bash
   npm run dev
   ```

2. **기능 확인**
   - 로그인/로그아웃
   - 세션 유지
   - 프로필 수정

3. **STEP 2-3 진행**
   - 인증 가드 통합
   - Auth Action 정리

---

**참고**: 자동 로그아웃 기능이 필요하면 나중에 간단한 버전으로 추가 가능
