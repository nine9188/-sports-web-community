# 챗봇 시스템 문서

SSR을 이용한 최적화 대화형 챗봇 구현 가이드

## 목차

1. [개요](#1-개요)
2. [아키텍처](#2-아키텍처)
3. [디렉토리 구조](#3-디렉토리-구조)
4. [데이터베이스](#4-데이터베이스)
5. [타입 정의](#5-타입-정의)
6. [대화 흐름](#6-대화-흐름)
7. [컴포넌트](#7-컴포넌트)
8. [훅](#8-훅)
9. [서버 액션](#9-서버-액션)
10. [주요 기능](#10-주요-기능)
11. [아키텍처 개선 계획](#11-아키텍처-개선-계획)

---

## 1. 개요

### 1.1 특징

- **플로팅 버튼**: 우측 하단에 위치, 클릭 시 모달/패널형 챗봇 열림
- **이중 뷰**: 대화창과 대화목록창을 `<` 아이콘으로 전환
- **이중 저장소**: 로그인 사용자(Supabase DB) / 비로그인 사용자(localStorage)
- **키워드 매칭**: OpenAI 미사용, 키워드 기반 응답 시스템
- **읽음 표시**: 카카오톡 스타일 읽음 상태 관리
- **타이핑 버블**: 모든 봇 응답 전 "..." 애니메이션 표시 (1초)

### 1.2 지원 카테고리 (칩버튼 6종)

| 타입 | 라벨 | 설명 |
|------|------|------|
| `community_inquiry` | 커뮤니티 이용문의 | 계정, 이용방법, 기능 문의 |
| `community_terms` | 커뮤니티 약관 및 정보처리방침 | 약관, 개인정보, 가이드라인 |
| `member_report` | 회원신고 | 스팸, 욕설, 부적절 행위 신고 |
| `opinion_submit` | 의견제출 | 기능개선, UI/UX, 콘텐츠 제안 |
| `post_delete_request` | 게시글/댓글 삭제요청 | 게시글/댓글 삭제 요청 |
| `bug_report` | 버그신고 | UI, 기능, 성능 버그 신고 |

---

## 2. 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    UniversalChatbot                         │
│                    (진입점 라우터)                            │
├────────────────────────┬────────────────────────────────────┤
│  로그인 사용자           │     비로그인 사용자                  │
│  AuthChatbot           │     LocalChatbot                   │
│  useChatbot 훅         │     useLocalChatbot 훅              │
│  (React Query +        │     (localStorage only)            │
│   Supabase)            │                                    │
├────────────────────────┴────────────────────────────────────┤
│                   ChatbotInner (공통 UI)                     │
│  ┌──────────┬──────────┬──────────┬──────────┬───────────┐  │
│  │Floating  │ Modal    │ Header   │ Message  │ Input     │  │
│  │Button    │          │          │ List     │           │  │
│  └──────────┴──────────┴──────────┴──────────┴───────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 인증 분기 로직

```typescript
// UniversalChatbot.tsx
export function UniversalChatbot() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <AuthChatbot userId={user.id} />;  // DB 사용
  }
  return <LocalChatbot />;  // localStorage 사용
}
```

---

## 3. 디렉토리 구조

```
src/domains/chatbot/
├── actions/                    # 서버 액션 (데이터 처리)
│   ├── conversationActions.ts  # 대화 CRUD
│   ├── messageActions.ts       # 메시지 전송/조회/폼제출
│   ├── chatFlowActions.ts      # 챗봇 응답 로직 (키워드 매칭)
│   ├── localStorageActions.ts  # 비로그인 사용자용 로컬스토리지
│   └── index.ts
│
├── components/                 # UI 컴포넌트
│   ├── UniversalChatbot.tsx    # 메인 진입점 (라우팅)
│   ├── ChatFloatingButton.tsx  # 우측 하단 플로팅 버튼
│   ├── ChatModal.tsx           # 모달 컨테이너
│   ├── ChatHeader.tsx          # 헤더 (뒤로가기, 새대화)
│   ├── ChatConversationList.tsx# 대화 목록 뷰
│   ├── ChatMessageList.tsx     # 메시지 목록
│   ├── ChatMessageBubble.tsx   # 개별 메시지 버블
│   ├── ChatChipButtons.tsx     # 칩 버튼 UI
│   ├── ChatFormRenderer.tsx    # 동적 폼 렌더링
│   ├── ChatInput.tsx           # 메시지 입력창
│   ├── ChatTypingBubble.tsx    # 타이핑 인디케이터 (...)
│   └── index.ts
│
├── hooks/                      # 커스텀 훅
│   ├── useChatbot.tsx          # 인증 사용자 (React Query + Supabase)
│   └── useLocalChatbot.tsx     # 비인증 사용자 (localStorage)
│
├── types/index.ts              # 타입 정의
├── utils/index.ts              # 유틸리티 + CHIP_BUTTONS 설정
├── constants/messages.ts       # UI 메시지 상수
└── index.ts
```

---

## 4. 데이터베이스

### 4.1 테이블 구조

#### chat_conversations - 대화 메타데이터

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| user_id | uuid | 사용자 FK |
| title | text | 대화 제목 |
| status | text | `active` / `completed` / `closed` |
| last_message_at | timestamptz | 마지막 메시지 시간 |
| created_at | timestamptz | 생성 시간 |
| updated_at | timestamptz | 수정 시간 |

#### chat_messages - 메시지

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| conversation_id | uuid | 대화 FK |
| type | text | `user` / `bot` / `system` / `form` / `chips` |
| content | text | 메시지 내용 |
| chip_type | text | 선택된 칩 타입 (ChipType) |
| form_data | jsonb | 폼 설정 또는 제출 데이터 |
| is_submitted | boolean | 폼 제출 완료 여부 |
| is_read | boolean | 읽음 여부 |
| created_at | timestamptz | 생성 시간 |
| updated_at | timestamptz | 수정 시간 |

#### chat_form_submissions - 폼 제출 기록

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| conversation_id | uuid | 대화 FK |
| message_id | uuid | 메시지 FK |
| user_id | uuid | 사용자 FK |
| form_type | text | 폼 종류 (ChipType) |
| form_data | jsonb | 제출된 폼 데이터 |
| status | text | 처리 상태 |
| created_at | timestamptz | 생성 시간 |
| updated_at | timestamptz | 수정 시간 |

### 4.2 RLS 정책

```sql
-- chat_conversations: 본인 대화만 접근
CREATE POLICY "Users can view own conversations" ON chat_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON chat_conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- chat_messages: 본인 대화의 메시지만 접근
CREATE POLICY "Users can view messages in own conversations" ON chat_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE user_id = auth.uid()
    )
  );

-- chat_form_submissions: 본인 제출만 접근
CREATE POLICY "Users can view own submissions" ON chat_form_submissions
  FOR SELECT USING (auth.uid() = user_id);
```

---

## 5. 타입 정의

```typescript
// types/index.ts

// 메시지 타입 (5종)
export type ChatMessageType = 'user' | 'bot' | 'system' | 'form' | 'chips';

// 칩 타입 (6종)
export type ChipType =
  | 'community_inquiry'
  | 'community_terms'
  | 'member_report'
  | 'opinion_submit'
  | 'post_delete_request'
  | 'bug_report';

// 메시지
export interface ChatMessage {
  id: string;
  conversation_id: string;
  type: ChatMessageType;
  content: string;
  chip_type?: ChipType;
  form_data?: Record<string, unknown>;
  is_submitted?: boolean;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

// 대화
export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  status: 'active' | 'completed' | 'closed';
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

// 칩 버튼
export interface ChipButton {
  id: string;
  type: ChipType;
  label: string;
  description: string;
  form_config?: FormConfig;
}

// 폼 설정
export interface FormConfig {
  fields: FormField[];
  submit_label: string;
  success_message: string;
}

// 폼 필드
export interface FormField {
  name: string;
  type: 'text' | 'textarea' | 'select' | 'email' | 'tel';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[];
}

// 로컬 세션 (비로그인 사용자용, 30일 만료)
export interface LocalSession {
  id: string;
  created_at: string;
  expires_at: string;
}
```

---

## 6. 대화 흐름

### 6.1 전체 흐름도

```
[새 대화 시작]
      │
      ▼
  ... 버블 (1초)
      │
      ▼
  "안녕하세요! 무엇을 도와드릴까요?"
      │
      ▼
  ... 버블 (1초)
      │
      ▼
  [6개 칩버튼 표시]
      │
      ├─────────────────────────────┐
      │                             │
 칩버튼 클릭                     직접 입력
      │                             │
      ▼                             ▼
 내 말풍선 에코              getChatFlowResponse()
 "회원신고"                   키워드 매칭 → 관련 칩 추천
      │
      ▼
  ... 버블 (1초)
      │
      ▼
  "회원신고가 필요하시군요? ..."
      │
      ▼
  ... 버블 (1초)
      │
      ▼
  [폼 UI 표시]
      │
 폼 작성 후 제출
      │
      ▼
  [폼 흐려짐 (제출됨 상태)]
      │
      ▼
  ... 버블 (1초)
      │
      ▼
  "신고가 접수되었습니다. 검토 후 조치하겠습니다."
      │
      ▼
  ... 버블 (1초)
      │
      ▼
  "더 도와드릴게 있을까요?"
      │
      ▼
  ... 버블 (1초)
      │
      ▼
  [괜찮아요] [네 다른문의 할게요]
      │
      ├─────────────────┐
      │                 │
 "괜찮아요"        "네 다른문의"
      │                 │
      ▼                 ▼
 내 말풍선 에코    내 말풍선 에코
      │                 │
      ▼                 ▼
  ... 버블           ... 버블
      │                 │
      ▼                 ▼
 "다른 문의사항     "더 도와드릴
  있으면 새대화      내용이 있나요?"
  이용해주세요"         │
      │                 ▼
      ▼              ... 버블
 [대화 종료]            │
 status:               ▼
 'completed'       [6개 칩버튼]
                   (처음으로 루프)
```

### 6.2 키워드 매칭 로직

```typescript
// chatFlowActions.ts
const keywordMap: Record<string, string[]> = {
  'community_inquiry': ['문의', '질문', '이용', '사용', '방법', '어떻게', '계정', '가입', '로그인'],
  'community_terms': ['약관', '정책', '개인정보', '처리방침', '가이드라인', '규정'],
  'member_report': ['신고', '욕설', '비방', '스팸', '도배', '사칭', '사기', '부적절'],
  'opinion_submit': ['의견', '제안', '건의', '개선', '추가', '기능', '불편'],
  'post_delete_request': ['삭제', '지우기', '제거', '게시글', '댓글', '실수'],
  'bug_report': ['버그', '오류', '에러', '오작동', '안됨', '안돼', '느림', '작동']
};

// 사용자 입력에서 키워드 찾아 관련 칩 추천
function findRelevantButtons(userInput: string): ChipButton[] {
  const input = userInput.toLowerCase();
  return CHIP_BUTTONS.filter(button => {
    const keywords = keywordMap[button.type] || [];
    return keywords.some(keyword => input.includes(keyword));
  });
}
```

---

## 7. 컴포넌트

| 컴포넌트 | 파일 | 역할 |
|----------|------|------|
| `UniversalChatbot` | UniversalChatbot.tsx | 진입점, 인증 분기 라우팅 |
| `ChatFloatingButton` | ChatFloatingButton.tsx | 우측 하단 플로팅 버튼, 안읽은 메시지 배지 |
| `ChatModal` | ChatModal.tsx | 모달 컨테이너 (모바일: 하단, 데스크톱: 우측) |
| `ChatHeader` | ChatHeader.tsx | 뒤로가기(`<`), 새 대화 버튼, 제목 표시 |
| `ChatConversationList` | ChatConversationList.tsx | 대화 목록 (active/completed 구분) |
| `ChatMessageList` | ChatMessageList.tsx | 메시지 스크롤 영역, 자동 스크롤 |
| `ChatMessageBubble` | ChatMessageBubble.tsx | 개별 버블 (user: 우측, bot: 좌측) |
| `ChatChipButtons` | ChatChipButtons.tsx | 클릭 가능한 칩 버튼들 |
| `ChatFormRenderer` | ChatFormRenderer.tsx | 동적 폼 (입력 + 제출 버튼) |
| `ChatInput` | ChatInput.tsx | 텍스트 입력 (Enter: 전송, Shift+Enter: 줄바꿈) |
| `ChatTypingBubble` | ChatTypingBubble.tsx | 봇 응답 중 "..." 애니메이션 |

---

## 8. 훅

### 8.1 useChatbot (인증 사용자용)

```typescript
// hooks/useChatbot.tsx
export function useChatbot(userId: string): UseChatbotReturn {
  // React Query로 대화 목록 조회 (5분 캐싱)
  const { data: conversations } = useQuery({
    queryKey: ['chatConversations', userId],
    queryFn: () => getConversations(userId),
    staleTime: 1000 * 60 * 5,
  });

  // React Query로 메시지 조회
  const { data: currentMessages } = useQuery({
    queryKey: ['chatMessages', activeConversation],
    queryFn: () => getMessages(activeConversation),
  });

  // Mutation으로 메시지 전송
  const sendMessageMutation = useMutation({
    mutationFn: (params) => sendMessage(...),
  });

  return {
    isOpen, currentView, activeConversation,
    conversations, messages, isTyping,
    toggleChat, switchView, selectConversation,
    startNewConversation, sendUserMessage,
    handleChipClick, handleFormSubmit,
    isLoading, error, totalUnreadCount,
  };
}
```

### 8.2 useLocalChatbot (비인증 사용자용)

```typescript
// hooks/useLocalChatbot.tsx
export function useLocalChatbot(): UseLocalChatbotReturn {
  // localStorage에서 데이터 로드 (debounced)
  const loadData = useCallback(() => {
    const conversations = localChatStorage.getConversations();
    const messages = {};
    conversations.forEach(conv => {
      messages[conv.id] = localChatStorage.getMessages(conv.id);
    });
    setChatState(prev => ({ ...prev, conversations, messages }));
  }, []);

  // 1초 딜레이로 타이핑 효과
  const addBotMessage = useCallback(async (conversationId, content) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        localChatStorage.addMessage(conversationId, content, 'bot');
        loadData();
        resolve();
      }, 1000);
    });
  }, [loadData]);

  // ... 동일한 인터페이스 반환
}
```

---

## 9. 서버 액션

### 9.1 conversationActions.ts

| 함수 | 설명 |
|------|------|
| `createConversation(userId, title)` | 새 대화 생성 |
| `getConversations(userId)` | 사용자의 대화 목록 조회 (24시간 초과 대화 자동 만료) |
| `updateConversation(id, data)` | 대화 상태/제목 업데이트 |

### 9.2 messageActions.ts

| 함수 | 설명 |
|------|------|
| `sendMessage(...)` | 단일 메시지 전송 |
| `sendMessages(conversationId, messages[])` | 배치 메시지 전송 (최적화) |
| `getMessages(conversationId)` | 대화의 메시지 목록 조회 |
| `submitChatForm(...)` | 폼 제출 및 DB 저장 |
| `markMessageAsRead(messageId)` | 읽음 상태 업데이트 |

### 9.3 chatFlowActions.ts

| 함수 | 설명 |
|------|------|
| `getChatFlowResponse(conversationId, userInput, chipType?)` | 키워드 매칭 응답 생성 |
| `processChatFlow(conversationId, steps[])` | 배치로 봇 응답 저장 |
| `handleFormSubmission(conversationId, chipType, formData)` | 폼 제출 후 완료 메시지 처리 |

---

## 10. 주요 기능

### 10.1 타이핑 버블 ("..." 애니메이션)

모든 봇 응답 전에 1초간 타이핑 인디케이터 표시:

```typescript
// isTyping 상태로 제어
setChatState(prev => ({ ...prev, isTyping: true }));
await addBotMessage(conversationId, content);  // 1초 딜레이 포함
setChatState(prev => ({ ...prev, isTyping: false }));
```

### 10.2 읽음 표시

```typescript
// 메시지 읽음 처리
const handleMessageRead = (messageId: string) => {
  localChatStorage.markMessageAsRead(messageId);
};

// 안읽은 메시지 수 계산
const totalUnreadCount = messages.filter(m => m.type === 'bot' && !m.is_read).length;
```

### 10.3 대화 자동 만료

- 24시간 초과 대화: 자동 `closed` 처리
- 비로그인 세션: 30일 후 만료

### 10.4 배치 최적화

```typescript
// 여러 메시지를 한 번에 저장 (API 호출 최소화)
await sendMessages(conversationId, [
  { content: '인사말', type: 'bot' },
  { content: '', type: 'chips', formData: { chips: [...] } },
]);
```

### 10.5 동적 폼 렌더링

각 칩버튼별로 다른 폼 필드 자동 생성:

```typescript
// utils/index.ts의 CHIP_BUTTONS에 form_config 정의
{
  id: 'bug_report',
  type: 'bug_report',
  label: '버그신고',
  form_config: {
    fields: [
      { name: 'bug_type', type: 'select', label: '버그 유형', required: true, options: [...] },
      { name: 'page_url', type: 'text', label: '발생 페이지', required: true },
      { name: 'description', type: 'textarea', label: '상세 설명', required: true },
    ],
    submit_label: '버그 신고하기',
    success_message: '버그 신고가 접수되었습니다.',
  }
}
```

### 10.6 칩 클릭시 에코

모든 칩 버튼 클릭시 해당 내용을 사용자 말풍선으로 표시:

```typescript
// handleChipClick 내부
localChatStorage.addMessage(conversationId, chip.label, 'user', chip.type);
```

---

## 11. 아키텍처 개선 계획

> 상세 내용: [architecture-improvements.md](./architecture-improvements.md)

### 11.1 현재 구조의 문제점

| 문제 | 현재 상태 | 위험도 |
|------|----------|--------|
| 메시지 타입 혼합 | `type`에 role과 kind 혼재 | 중간 |
| 읽음 구조 | 메시지별 `is_read` 컬럼 | 중간 |
| 책임 분리 부재 | useChatbot이 모든 것 담당 | 낮음 |
| 타이머 취소 없음 | 대화 전환 시 유령 메시지 가능 | 높음 |
| 중복 방지 없음 | 네트워크 재시도 시 중복 발생 | 높음 |

### 11.2 개선 우선순위

| 순위 | 항목 | 난이도 | 상태 |
|------|------|--------|------|
| 1 | typing 타이머 취소 로직 | 낮음 | 대기 |
| 2 | client_message_id 중복 방지 | 중간 | 대기 |
| 3 | 읽음 테이블 분리 | 중간 | 대기 |
| 4 | role/kind 분리 | 높음 | 대기 |
| 5 | Engine/Store 분리 | 높음 | 대기 |

---

## 관련 문서

- [아키텍처 개선 계획](./architecture-improvements.md)
- [HOT 시스템 문서](../hot-system/README.md)
- [알림 시스템 문서](../notifications/README.md)
