# Phase 2: 인증 & 보안 리뷰

> 리뷰 일시: 2025-12-24
> 리뷰어: Claude Code

## 개요

인증 시스템과 보안 관련 사항을 점검합니다.

---

## 1. 인증 페이지 검토

### 1.1 로그인 페이지 (`/signin`)

| 항목 | 상태 | 비고 |
|------|------|------|
| 서버 액션 사용 | ✅ | `signIn` 액션 사용 |
| 클라이언트 유효성 검사 | ✅ | 아이디/비밀번호 검증 |
| 아이디 기억하기 | ✅ | localStorage 사용 |
| 소셜 로그인 | ✅ | 카카오 지원 |
| 리다이렉트 처리 | ✅ | `redirect` 파라미터 지원 |

### 1.2 회원가입 페이지 (`/signup`)

| 항목 | 상태 | 비고 |
|------|------|------|
| Turnstile CAPTCHA | ✅ | 봇 방지 |
| 이메일 검증 | ✅ | 정규식 검증 |
| 비밀번호 강도 | ✅ | 10자+, 특수문자 필수 |
| 아이디 중복 확인 | ✅ | 실시간 검증 |
| 닉네임 중복 확인 | ✅ | 실시간 검증 |
| 금지어 필터 | ✅ | admin, root 등 차단 |

### 1.3 소셜 회원가입 (`/social-signup`)

| 항목 | 상태 | 비고 |
|------|------|------|
| 카카오 연동 | ✅ | OAuth 2.0 |
| 닉네임 설정 | ✅ | 중복 확인 포함 |
| 자동 username 생성 | ✅ | `kakao_` 접두어 |

---

## 2. 완료된 개선 사항

### 2.1 console.log 제거 ✅

| 파일 | 제거 내용 |
|------|----------|
| `social-signup/page.tsx` | 세션 발견 로그 1개 |
| `account-recovery/page.tsx` | 결과/URL 파라미터 로그 2개 |

---

## 3. 보안 점검 결과

### 3.1 Supabase Security Advisors

#### ✅ MCP로 수정 완료

| 이슈 | 위치 | 상태 | 마이그레이션 |
|------|------|------|-------------|
| Security Definer View | `public.match_support_stats` | ✅ 수정됨 | `fix_view_security_invoker` |
| Function Search Path | `update_conversation_last_message` | ✅ 수정됨 | `fix_function_search_paths` |
| Function Search Path | `update_football_players_search_vector` | ✅ 수정됨 | `fix_function_search_paths` |
| Function Search Path | `delete_old_notifications` | ✅ 수정됨 | `fix_function_search_paths` |
| Function Search Path | `auto_set_notice_for_notice_board` | ✅ 수정됨 | `fix_function_search_paths` |
| Function Search Path | `upsert_chat_session_read_at` | ✅ 수정됨 | `fix_function_search_paths` |
| Function Search Path | `is_admin_for_notice_board` | ✅ 수정됨 | `fix_function_search_paths` |
| Function Search Path | `update_updated_at_column` | ✅ 수정됨 | `fix_function_search_paths` |
| Function Search Path | `custom_access_token_hook` | ✅ 수정됨 | `fix_function_search_paths` |
| Extension in Public | `pg_trgm` | ✅ 수정됨 | `move_pg_trgm_to_extensions_v2` |

#### 🟠 대시보드에서 수동 설정 필요

| 이슈 | 위치 | 조치 방법 |
|------|------|----------|
| Leaked Password Protection | Auth | Supabase 대시보드 > Auth > Password Protection 활성화 |
| Vulnerable Postgres Version | Database | Supabase 대시보드 > Settings > Infrastructure에서 업그레이드 |

### 3.2 XSS 취약점 분석

#### `dangerouslySetInnerHTML` 사용 위치

| 파일 | 용도 | 위험도 | 권장 조치 |
|------|------|--------|----------|
| `PostContent.tsx` | 사용자 게시글 렌더링 | 🔴 높음 | DOMPurify 적용 필요 |
| `BannerWrapper.tsx` | 관리자 배너 HTML | 🟡 중간 | 관리자만 작성 가능하므로 낮음 |
| `layout.tsx` | Google Analytics | 🟢 낮음 | 정적 스크립트 |

**권장 조치**: `PostContent.tsx`에 DOMPurify 라이브러리 적용

```bash
npm install dompurify @types/dompurify
```

```typescript
import DOMPurify from 'dompurify';

// 사용 예시
const sanitizedContent = DOMPurify.sanitize(processedContent);
```

### 3.3 환경변수 검토

| 변수 | 노출 위치 | 상태 |
|------|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트 | ✅ 공개 가능 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 | ✅ 공개 가능 (RLS로 보호) |
| `NEXT_PUBLIC_SITE_URL` | 클라이언트 | ✅ 공개 가능 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | 클라이언트 | ✅ 공개 가능 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버만 | ✅ 노출 안됨 |
| `FOOTBALL_API_KEY` | 서버만 | ✅ 노출 안됨 |

---

## 4. 인증 흐름 보안 체크

### 4.1 로그인 보안

| 항목 | 상태 | 비고 |
|------|------|------|
| 로그인 시도 제한 | ✅ | `login-attempts.ts`에서 관리 |
| 세션 관리 | ✅ | Supabase Auth 사용 |
| CSRF 보호 | ✅ | Next.js Server Actions 내장 |
| 비밀번호 해싱 | ✅ | Supabase Auth 처리 |

### 4.2 회원가입 보안

| 항목 | 상태 | 비고 |
|------|------|------|
| 이메일 인증 | ✅ | Supabase 이메일 확인 |
| CAPTCHA | ✅ | Cloudflare Turnstile |
| 비밀번호 정책 | ✅ | 10자+, 특수문자 |
| 금지어 필터 | ✅ | admin, root 등 |

---

## 5. 권장 조치 사항

### ✅ MCP로 수정 완료

1. **Security Definer View 수정** ✅
   - `match_support_stats` 뷰에 `security_invoker = true` 설정

2. **Function search_path 설정** ✅
   - 8개 함수에 `SET search_path = public` 추가

3. **pg_trgm 확장 이동** ✅
   - public → extensions 스키마

### ✅ 코드 수정 완료

1. **XSS 방지** ✅
   - `PostContent.tsx`에 DOMPurify 적용 완료
   - 허용 태그/속성 화이트리스트 설정
   - script, object, embed 등 위험 태그 차단

### 🟠 대시보드에서 수동 설정

1. **Leaked Password Protection 활성화**
   - Supabase 대시보드 > Auth > Password Protection

2. **Postgres 업그레이드**
   - 보안 패치 적용

---

## 6. Phase 2 완료 요약

### 변경 사항

| 항목 | 내용 |
|------|------|
| console.log 제거 | 3개 (auth 페이지) |
| 보안 이슈 발견 | 12개 (1 ERROR, 11 WARN) |
| MCP로 수정 완료 | 10개 (1 ERROR, 9 WARN) |
| 대시보드 설정 필요 | 2개 (WARN) |
| XSS 취약점 | 1개 발견 (PostContent.tsx) |

### 적용된 마이그레이션

| 마이그레이션 | 내용 |
|-------------|------|
| `fix_security_definer_view` | 뷰 초기 수정 시도 |
| `fix_function_search_paths` | 8개 함수 search_path 설정 |
| `fix_view_security_invoker` | 뷰에 security_invoker 옵션 적용 |
| `move_pg_trgm_to_extensions_v2` | pg_trgm 확장 이동 |

### 문서화

- Phase 2 보안 리뷰 문서 생성
- 권장 조치 사항 정리

---

## 7. 다음 단계

- [x] Security Definer View 수정 ✅
- [x] Function search_path 설정 ✅
- [x] pg_trgm 확장 이동 ✅
- [x] DOMPurify 적용 ✅
- [ ] Leaked Password Protection 활성화 (대시보드)
- [ ] Postgres 업그레이드 (대시보드)

---

[← Phase 1.5 기타 도메인 리뷰](./phase1-5-other-domains-review.md) | [메인 체크리스트 →](../launch-review-checklist.md)
