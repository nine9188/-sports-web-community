# 포커스 스타일 위반 목록

> 생성일: 2026-01-19
> 현재 패턴: `focus:bg-[#EAEAEA] dark:focus:bg-[#333333]` (배경색 변경)
> UI_GUIDELINES.md 권장: `focus:ring-2 focus:ring-slate-800 dark:focus:ring-white/30` (링 스타일)

---

## 요약

| 구분 | 파일 수 | 위치 수 |
|------|---------|---------|
| 공유 UI 컴포넌트 | 2 | 3 |
| 레이아웃/네비게이션 | 4 | 4 |
| 설정 페이지 | 3 | 6 |
| 챗봇 | 2 | 2 |
| 라이브스코어 | 2 | 2 |
| **총계** | **13** | **17** |

---

## 현재 사용 패턴 (2가지)

### 패턴 A: 배경색 변경 (현재 대부분 사용)
```tsx
focus:bg-[#EAEAEA] dark:focus:bg-[#333333]
focus-visible:ring-0  // 링 비활성화
```

### 패턴 B: 링 스타일 (UI_GUIDELINES.md 권장)
```tsx
focus:ring-2 focus:ring-slate-800 dark:focus:ring-white/30
```

---

## 공유 UI 컴포넌트 (2개 파일)

### 1. textarea.tsx
- **경로**: `src/shared/components/ui/textarea.tsx:12`
- **현재 스타일**:
```tsx
focus:bg-[#EAEAEA] dark:focus:bg-[#333333]
focus-visible:ring-0 focus-visible:ring-offset-0
```

### 2. select-radix.tsx (2곳)
- **경로**: `src/shared/components/ui/select-radix.tsx:22, 115`
- **현재 스타일**:
```tsx
// Trigger (22번 줄)
focus:bg-[#EAEAEA] dark:focus:bg-[#333333]
focus-visible:ring-0 focus-visible:ring-offset-0

// Item (115번 줄)
focus:bg-[#EAEAEA] dark:focus:bg-[#333333]
```

---

## 레이아웃/네비게이션 (4개 파일)

### 3. HeaderClient.tsx
- **경로**: `src/domains/layout/components/HeaderClient.tsx:107`
- **사용 위치**: 헤더 검색창
- **현재 스타일**:
```tsx
focus:bg-[#EAEAEA] dark:focus:bg-[#333333]
focus-visible:ring-0 focus-visible:ring-offset-0
```

### 4. SearchBar.tsx
- **경로**: `src/domains/layout/components/navigation/SearchBar.tsx:48`
- **사용 위치**: 네비게이션 검색바
- **현재 스타일**:
```tsx
focus:bg-[#EAEAEA] dark:focus:bg-[#333333]
```

### 5. MobileBoardModal.tsx
- **경로**: `src/domains/layout/components/navigation/MobileBoardModal.tsx:118`
- **사용 위치**: 모바일 게시판 모달 검색창
- **현재 스타일**:
```tsx
focus:bg-[#EAEAEA] dark:focus:bg-[#333333]
focus-visible:ring-0 focus-visible:ring-offset-0
```

### 6. MobileHamburgerModal.tsx
- **경로**: `src/domains/layout/components/MobileHamburgerModal.tsx:118`
- **사용 위치**: 모바일 햄버거 메뉴 검색창
- **현재 스타일**:
```tsx
focus:bg-[#EAEAEA] dark:focus:bg-[#333333]
focus-visible:ring-0 focus-visible:ring-offset-0
```

---

## 설정 페이지 (3개 파일, 6곳)

### 7. PasswordForm.tsx (3곳)
- **경로**: `src/domains/settings/components/password/PasswordForm.tsx:154, 182, 212`
- **사용 위치**: 비밀번호 변경 폼 (현재, 새 비밀번호, 확인)
- **현재 스타일**:
```tsx
focus:bg-[#EAEAEA] dark:focus:bg-[#333333]
focus-visible:ring-0 focus-visible:ring-offset-0
```

### 8. PhoneVerificationForm.tsx (2곳)
- **경로**: `src/domains/settings/components/phone/PhoneVerificationForm.tsx:178, 211`
- **사용 위치**: 전화번호 인증 폼
- **현재 스타일**:
```tsx
focus:bg-[#EAEAEA] dark:focus:bg-[#333333]
focus-visible:ring-0 focus-visible:ring-offset-0
```

### 9. AccountDeleteForm.tsx
- **경로**: `src/domains/settings/components/account-delete/AccountDeleteForm.tsx:89`
- **사용 위치**: 계정 삭제 폼
- **현재 스타일**:
```tsx
focus:bg-[#EAEAEA] dark:focus:bg-[#333333]
focus-visible:ring-0 focus-visible:ring-offset-0
```

---

## 챗봇 (2개 파일)

### 10. ChatConversationList.tsx
- **경로**: `src/domains/chatbot/components/ChatConversationList.tsx:90`
- **사용 위치**: 대화 목록 버튼
- **현재 스타일**:
```tsx
focus:bg-[#EAEAEA] dark:focus:bg-[#333333]
focus-visible:ring-0
```

### 11. ChatFormRenderer.tsx
- **경로**: `src/domains/chatbot/components/ChatFormRenderer.tsx:103`
- **사용 위치**: 챗봇 폼 입력
- **현재 스타일**:
```tsx
focus:bg-[#EAEAEA] dark:focus:bg-[#333333]
```

### ✅ ChatInput.tsx (수정 완료)
- **경로**: `src/domains/chatbot/components/ChatInput.tsx:80`
- **수정 전**: `focus:bg-[#EAEAEA] dark:focus:bg-[#333333] focus:border-gray-400 dark:focus:border-gray-600`
- **수정 후**: `focus:ring-2 focus:ring-slate-800 dark:focus:ring-white/30`

---

## 라이브스코어 (2개 파일)

### 12. NavigationBar/index.tsx
- **경로**: `src/domains/livescore/components/football/MainView/NavigationBar/index.tsx:169`
- **사용 위치**: 라이브스코어 날짜 선택
- **현재 스타일**:
```tsx
focus:bg-[#EAEAEA] dark:focus:bg-[#333333]
focus-visible:ring-0 focus-visible:ring-offset-0
```

### 13. SupportCommentsSection.tsx
- **경로**: `src/domains/livescore/components/football/match/sidebar/SupportCommentsSection.tsx:469`
- **사용 위치**: 응원 댓글 입력창
- **현재 스타일**:
```tsx
focus:bg-[#EAEAEA] dark:focus:bg-[#333333]
focus-visible:ring-0 focus-visible:ring-offset-0
```

---

## 결정 필요 사항

### 옵션 1: 배경색 변경 패턴 유지
- 현재 13개 파일에서 사용 중
- 포커스 시 배경색이 미묘하게 변경되어 눈에 띄지 않음
- ChatInput.tsx를 원래대로 롤백 필요

### 옵션 2: 링 스타일로 통일
- UI_GUIDELINES.md 권장 패턴
- 포커스 시 테두리 링이 표시되어 접근성 향상
- 13개 파일 전체 수정 필요

### 옵션 3: 하이브리드
- 입력 필드 (input, textarea): 링 스타일
- 버튼/리스트 아이템: 배경색 변경

---

## 용어 정리

| 영어 | 한글 | 설명 |
|------|------|------|
| Input | 입력 필드 | 한 줄 텍스트 입력 |
| Textarea | 텍스트 영역 | 여러 줄 텍스트 입력 (메시지 입력창) |
| Select | 선택 박스 | 드롭다운 선택 |
| Focus Ring | 포커스 링 | 포커스 시 테두리 표시 |
| Focus State | 포커스 상태 | 입력 필드가 활성화된 상태 |

---

*마지막 업데이트: 2026-01-19*
