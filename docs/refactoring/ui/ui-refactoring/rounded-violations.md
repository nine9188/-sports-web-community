# 라운드 크기 위반 목록

> 생성일: 2026-01-19
> 가이드라인: `rounded-xl`, `rounded-2xl`, `rounded-3xl` 사용 금지
> 허용값: `rounded`, `rounded-md`, `rounded-lg`, `rounded-full`

---

## 요약

| 구분 | 파일 수 | 위반 개수 |
|------|---------|----------|
| 사용자 페이지 | 8 | 10 |
| Admin/설정 | 2 | 4 |
| **총계** | **10** | **14** |

---

## 사용자 페이지 위반 (8개 파일)

### 1. signin/page.client.tsx
- **경로**: `src/app/(auth)/signin/page.client.tsx:192`
- **사용 페이지**: `/signin` (로그인)
- **위반 코드**:
```tsx
md:rounded-2xl
```
- **수정**: `md:rounded-lg`

---

### 2. signup/page.client.tsx
- **경로**: `src/app/(auth)/signup/page.client.tsx:651`
- **사용 페이지**: `/signup` (회원가입)
- **위반 코드**:
```tsx
md:rounded-2xl
```
- **수정**: `md:rounded-lg`

---

### 3. ChatModal.tsx
- **경로**: `src/domains/chatbot/components/ChatModal.tsx:36`
- **사용 페이지**: 전역 (챗봇 모달)
- **위반 코드**:
```tsx
rounded-t-2xl md:rounded-2xl
```
- **수정**: `rounded-t-lg md:rounded-lg`

---

### 4. ChatTypingBubble.tsx
- **경로**: `src/domains/chatbot/components/ChatTypingBubble.tsx:14`
- **사용 페이지**: 챗봇 대화창 (타이핑 인디케이터)
- **위반 코드**:
```tsx
rounded-2xl rounded-bl-md
```
- **수정**: `rounded-lg rounded-bl-md`

---

### 5. ChatMessageBubble.tsx
- **경로**: `src/domains/chatbot/components/ChatMessageBubble.tsx:155`
- **사용 페이지**: 챗봇 대화창 (메시지 버블)
- **위반 코드**:
```tsx
rounded-2xl
```
- **수정**: `rounded-lg`

---

### 6. ChatInput.tsx
- **경로**: `src/domains/chatbot/components/ChatInput.tsx:78`
- **사용 페이지**: 챗봇 대화창 (입력창)
- **위반 코드**:
```tsx
rounded-2xl
```
- **수정**: `rounded-lg`

---

### 7. SuspensionPopup.tsx
- **경로**: `src/shared/components/SuspensionPopup.tsx:109`
- **사용 페이지**: 전역 (계정 정지 팝업)
- **위반 코드**:
```tsx
rounded-xl
```
- **수정**: `rounded-lg`

---

### 8. PlayerStatsModal.tsx
- **경로**: `src/domains/livescore/components/football/match/tabs/lineups/components/PlayerStatsModal.tsx:78`
- **사용 페이지**: `/livescore/football/match/[id]` (선수 스탯 모달)
- **위반 코드**:
```tsx
rounded-xl
```
- **수정**: `rounded-lg`

---

## Admin/설정 파일 (무시 가능)

### UIThemeSettingsPage.tsx (Admin)
- **경로**: `src/app/admin/site-management/ui-theme/UIThemeSettingsPage.tsx:12-13`
- **사용 페이지**: `/admin/site-management/ui-theme`
- **용도**: 테마 설정 옵션 (기능용)
- **위반 코드**:
```tsx
{ value: 'rounded-xl', label: '더 둥글게 (12px)', preview: '0.75rem' },
{ value: 'rounded-2xl', label: '매우 둥글게 (16px)', preview: '1rem' },
```
- **수정**: 옵션 자체 제거 또는 유지 (Admin 설정용)

---

### layout.tsx (CSS 변수)
- **경로**: `src/app/layout.tsx:96-98`
- **용도**: CSS 변수 정의 (실제 UI 사용 아님)
- **위반 코드**:
```tsx
'rounded-xl': '0.75rem',
'rounded-2xl': '1rem',
'rounded-3xl': '1.5rem',
```
- **수정**: 변수 제거 또는 유지 (테마 시스템용)

---

## 제외된 파일

| 파일 | 이유 |
|------|------|
| PostContent.tsx | 위반 없음 (이미 수정됨 또는 오탐) |
| PlayerStatsModal.tsx.bak | 백업 파일 |
| CHATBOT_COMPREHENSIVE_REVIEW.md | 문서 파일 |

---

## 수정 가이드

```tsx
// 변환 규칙
rounded-xl   → rounded-lg
rounded-2xl  → rounded-lg
rounded-3xl  → rounded-lg

// 예외: 모달 상단 라운드
rounded-t-2xl → rounded-t-lg
rounded-t-3xl → rounded-t-lg
```

---

## 수정 체크리스트

- [x] #1 signin/page.client.tsx ✅
- [x] #2 signup/page.client.tsx ✅
- [x] #3 ChatModal.tsx ✅
- [x] #4 ChatTypingBubble.tsx ✅
- [x] #5 ChatMessageBubble.tsx ✅
- [x] #6 ChatInput.tsx ✅
- [x] #7 SuspensionPopup.tsx ✅
- [x] #8 PlayerStatsModal.tsx ✅

**모든 사용자 페이지 라운드 위반 수정 완료!**

---

*마지막 업데이트: 2026-01-19*
