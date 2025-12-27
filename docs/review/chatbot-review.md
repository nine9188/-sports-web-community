# 챗봇 기능 리뷰 및 수정 내역

**작성일:** 2025-12-24
**대상:** `src/domains/chatbot/`

---

## 1. 폴더 구조

```
src/domains/chatbot/
├── actions/                    # 서버 액션 & 로컬 저장소
│   ├── chatFlowActions.ts      # 챗봇 플로우 로직
│   ├── conversationActions.ts  # 대화 CRUD
│   ├── messageActions.ts       # 메시지 CRUD
│   ├── localStorageActions.ts  # 비인증 사용자용 로컬 저장
│   └── index.ts
├── components/                 # UI 컴포넌트
│   ├── Chatbot.tsx            # 인증 사용자용
│   ├── UniversalChatbot.tsx   # 인증/비인증 모두 지원
│   ├── ChatFloatingButton.tsx # 플로팅 버튼
│   ├── ChatModal.tsx          # 모달 컨테이너
│   ├── ChatHeader.tsx         # 헤더
│   ├── ChatConversationList.tsx
│   ├── ChatMessageList.tsx
│   ├── ChatMessageBubble.tsx
│   ├── ChatChipButtons.tsx    # 선택 버튼들
│   ├── ChatFormRenderer.tsx   # 폼 렌더링
│   ├── ChatInput.tsx
│   ├── ChatTypingBubble.tsx
│   └── index.ts
├── hooks/                      # 커스텀 훅
│   ├── useChatbot.tsx         # 인증 사용자용
│   ├── useLocalChatbot.tsx    # 비인증 사용자용
│   ├── useChatConversations.tsx
│   ├── useChatMessages.tsx
│   ├── useChatUser.tsx
│   ├── useReadStatus.tsx
│   └── index.ts
├── types/                      # TypeScript 타입
│   └── index.ts
├── utils/                      # 유틸리티 함수
│   └── index.ts
├── constants/                  # 상수
│   └── messages.ts
└── index.ts
```

---

## 2. 수정 완료 항목 (P0 - 긴급)

### 2.1 `markMessageAsRead` 함수 서명 불일치

**파일:** `hooks/useChatMessages.tsx`

**문제:**
- `markMessageAsRead(messageId)`만 받는데 `(messageId, userId)` 전달
- 런타임 에러 가능성

**수정:**
```typescript
// Before
markAsRead: (messageId: string, userId: string) => Promise<void>;
const result = await markMessageAsRead(messageId, userId);

// After
markAsRead: (messageId: string) => Promise<void>;
const result = await markMessageAsRead(messageId);
```

---

### 2.2 `handleFormSubmission` formData 매개변수 누락

**파일:** `actions/chatFlowActions.ts`

**문제:**
- 함수가 `(conversationId, chipType)`만 받지만 호출 시 `formData`도 전달

**수정:**
```typescript
// Before
export async function handleFormSubmission(
  conversationId: string,
  chipType: ChipType
)

// After
export async function handleFormSubmission(
  conversationId: string,
  chipType: ChipType,
  formData?: Record<string, unknown>
)
```

---

### 2.3 `ChatModal` 미사용 prop 제거

**파일:** `components/ChatModal.tsx`

**문제:**
- `chatState` prop이 정의되었지만 사용되지 않음
- 호출 시에도 전달하지 않음

**수정:**
```typescript
// Before
interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatState: ChatState;  // 미사용
  children: React.ReactNode;
}

// After
interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}
```

---

### 2.4 폼 제출 완료 메시지 하드코딩

**파일:** `components/ChatFormRenderer.tsx`

**문제:**
- 모든 폼에서 "신고가 접수되었습니다" 메시지 표시
- `formConfig.success_message` 무시

**수정:**
```typescript
// Before
<p className="text-sm text-green-700 dark:text-green-300">
  신고가 접수되었습니다. 검토 후 적절한 조치를 취하겠습니다.
</p>

// After
<p className="text-sm text-green-700 dark:text-green-300">
  {formConfig.success_message || '요청이 접수되었습니다. 확인 후 처리해 드리겠습니다.'}
</p>
```

---

## 3. 확인된 정상 항목

### 3.1 Supabase 클라이언트 호출

**파일:** `hooks/useReadStatus.tsx`

**상태:** ✅ 정상

`getSupabaseBrowser()`는 `@/shared/lib/supabase/client.browser.ts`에 정의되어 있으며 정상 동작함.

---

## 4. 향후 개선 권장 사항 (P1-P3)

### P1 - 높음 (이번 주 내)

| 항목 | 설명 | 파일 |
|------|------|------|
| LocalStorage 보안 | 암호화 없이 대화 저장 | `localStorageActions.ts` |
| 과도한 localStorage 접근 | 50ms마다 모든 대화 재로드 | `useLocalChatbot.tsx` |

### P2 - 중간 (이번 달 내)

| 항목 | 설명 |
|------|------|
| 타입 안전성 | `any` 타입 제거 필요 |
| 에러 처리 일관성 | 표준화된 에러 응답 필요 |
| JSDoc 문서화 | 복잡한 로직에 주석 추가 |

### P3 - 낮음 (다음 분기)

| 항목 | 설명 |
|------|------|
| 색상 일관성 | 커스텀 색상 → Tailwind 표준화 |
| 하드코딩 값 | 상수로 분리 (세션 만료 시간 등) |
| 테스트 추가 | 유닛 테스트 커버리지 |
| 접근성 | ARIA 레이블 개선 |

---

## 5. 아키텍처 평가

### 잘 된 부분 ✅

- **도메인 기반 구조:** 명확한 관심사 분리
- **인증/비인증 분리:** Supabase vs LocalStorage 잘 분리
- **다크모드:** 모든 컴포넌트에 완벽 적용
- **React Query 사용:** 캐싱 및 상태 관리 우수

### 개선 필요 ⚠️

- **타입 안전성:** 일부 `any` 타입 사용
- **에러 처리:** 사용자 피드백 개선 필요
- **문서화:** 복잡한 로직에 주석 부족

---

## 6. 데이터베이스 스키마

### 사용 테이블

- `chat_messages`: 메시지 저장
- `chat_message_status`: 읽음 상태 관리
- `chat_conversations`: 대화 세션 (추정)

### 필드 매핑

| 앱 필드 | DB 필드 |
|---------|---------|
| `conversation_id` | `session_id` |
| `type` | `role` |
| `content` | `content_json.content` |

---

## 7. 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2025-12-24 | P0 긴급 이슈 4건 수정 완료 |

