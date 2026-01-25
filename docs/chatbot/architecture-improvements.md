# 챗봇 아키텍처 개선 계획

## 목차

1. [메시지 타입 구조 개선](#1-메시지-타입-구조-개선)
2. [읽음 구조 분리](#2-읽음-구조-분리)
3. [ChatEngine 책임 분리](#3-chatengine-책임-분리)
4. [typing 타이머 취소](#4-typing-타이머-취소)
5. [중복 방지 메커니즘](#5-중복-방지-메커니즘)
6. [공통 규칙](#6-공통-규칙)
7. [현재 버그 및 개선 필요 사항](#7-현재-버그-및-개선-필요-사항)

---

## 1. 메시지 타입 구조 개선

### 현재 문제

```typescript
type ChatMessageType = 'user' | 'bot' | 'system' | 'form' | 'chips';
// 문제: type: 'form'이면 발신자가 누군지 알 수 없음
```

### 제안

```typescript
type ChatRole = 'user' | 'bot' | 'system';  // 발신 주체
type ChatKind = 'text' | 'chips' | 'form' | 'notice';  // 렌더링 방식

interface ChatMessage {
  id: string;
  conversation_id: string;
  role: ChatRole;
  kind: ChatKind;
  content?: string;     // text/notice 전용
  payload?: Record<string, unknown>; // chips/form 전용 (content도 선택적 허용 - 요약용)
  created_at: string;
}
```

**규칙:** `user`→text only, `bot`→all, `system`→text/notice only

### 마이그레이션 SQL

```sql
ALTER TABLE chat_messages ADD COLUMN role text;
ALTER TABLE chat_messages ADD COLUMN kind text;
ALTER TABLE chat_messages ADD COLUMN payload jsonb;
ALTER TABLE chat_messages ALTER COLUMN content DROP NOT NULL;

UPDATE chat_messages SET
  role = CASE WHEN type IN ('form','chips') THEN 'bot' ELSE type END,
  kind = CASE WHEN type IN ('user','bot','system') THEN 'text' ELSE type END;

ALTER TABLE chat_messages ALTER COLUMN role SET NOT NULL;
ALTER TABLE chat_messages ALTER COLUMN kind SET NOT NULL;

-- 선택: 정합성 체크
ALTER TABLE chat_messages ADD CONSTRAINT chk_message_content_payload
CHECK (
  (kind IN ('text','notice') AND content IS NOT NULL)
  OR (kind IN ('chips','form') AND payload IS NOT NULL)
);
```

---

## 2. 읽음 구조 분리

### 현재 문제

`chat_messages.is_read` → 멀티 디바이스/다자 대화 확장 불가

### 제안

```sql
CREATE TABLE chat_conversation_reads (
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE chat_conversation_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON chat_conversation_reads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON chat_conversation_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON chat_conversation_reads
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

**unread 계산:**
```sql
SELECT COUNT(*) FROM chat_messages m
JOIN chat_conversation_reads r ON r.conversation_id = m.conversation_id
WHERE m.role = 'bot' AND m.created_at > r.last_read_at AND r.user_id = auth.uid();
```

---

## 3. ChatEngine 책임 분리

### 현재 문제

`useChatbot.tsx`에서 UI 상태 + React Query + 서버 액션 + 캐시 무효화 모두 섞임

### 제안 (4계층 분리)

```
UI → Engine(순수 로직) → Store(API 호출) → Actions(DB 접근)
                              ↓
                        CacheAdapter(캐시 무효화)
```

**핵심 원칙:**
- Engine: DB/Query 모름 (순수 로직)
- Store: 서버 액션 호출만 (DB 직접 접근 금지)
- Actions: DB 직접 접근 (RLS/service role 처리)
- CacheAdapter: UI에서 Store 결과 기반 캐시 무효화

```typescript
// Command 타입 (Discriminated Union)
type ChatCommand =
  | { type: 'SAVE_MESSAGE'; payload: SaveMessagePayload }
  | { type: 'UPDATE_CONVERSATION'; payload: { id: string; status: string } }
  | { type: 'SET_TYPING'; payload: { isTyping: boolean } };

// Store는 서버 액션 호출
class AuthChatStore {
  async execute(commands: ChatCommand[]) {
    for (const cmd of commands) {
      if (cmd.type === 'SAVE_MESSAGE') {
        await sendMessage(cmd.payload.conversation_id, cmd.payload.content!, uuid());
      }
    }
  }
}
```

---

## 4. typing 타이머 취소

### 현재 문제

전역 1개 타이머 → 대화 전환 시 꼬임

### 제안

```typescript
const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

function cancelTyping() {
  if (typingTimerRef.current) {
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = null;
  }
}

// 필수 cancel 시점
useEffect(() => { cancelTyping(); setIsTyping(false); }, [activeConversation]);
useEffect(() => () => cancelTyping(), []);
```

---

## 5. 중복 방지 메커니즘

### 용어

| ID | 용도 |
|----|------|
| `client_message_id` | 메시지 단위 dedupe (UNIQUE) |
| `request_id` | 배치 트레이싱용 (UNIQUE 아님) |

**규칙:** `client_message_id`는 content와 함께 고정, 동일 id로 다른 내용 재전송 금지

### 스키마

```sql
ALTER TABLE chat_messages ADD COLUMN client_message_id uuid;
ALTER TABLE chat_messages ADD COLUMN request_id uuid;
ALTER TABLE chat_messages ADD CONSTRAINT uq_messages_client_id
  UNIQUE (conversation_id, client_message_id);
```

### 서버 액션

```typescript
'use server';
export async function sendMessage(conversationId: string, content: string, clientMessageId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .upsert({ conversation_id: conversationId, content, role: 'user', kind: 'text', client_message_id: clientMessageId },
      { onConflict: 'conversation_id,client_message_id' })
    .select().single();
  if (error) throw new Error(error.message);
  return data;
}
```

---

## 6. 공통 규칙

### RLS 정책

```sql
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid())
);
CREATE POLICY "insert_own" ON chat_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
);
```

### 메시지 저장 주체

| role | 저장 방식 |
|------|----------|
| `user` | RLS (`createClient`) |
| `bot`/`system` | Service Role |

### snake_case ↔ camelCase

- DB: snake_case (`conversation_id`)
- 클라이언트: camelCase (`conversationId`)
- 변환은 단일 Mapper에서 처리

---

## 마이그레이션 체크리스트

### Phase 1: 긴급
- [x] typing 타이머 취소 로직
- [x] client_message_id + UNIQUE + upsert
- [x] chat_messages RLS 정책 (이미 적용됨)

### Phase 2: 중기
- [x] chat_conversation_reads 테이블 + RLS
- [x] 읽음 로직 마이그레이션

### Phase 3: 장기
- [x] role/kind/payload 컬럼 마이그레이션
- [x] ChatEngine/Store/Actions 분리
- [x] Mapper 적용

---

## 관련 문서

- [챗봇 시스템 개요](./README.md)

---

## 7. 현재 버그 및 개선 필요 사항

### 7.1 비회원 (useLocalChatbot) 문제

#### 문제 1: 새 대화 시작 시 초기 메시지 안보임

**현상:**
- 처음 문의하기 클릭 시 / 새대화 클릭 시 → "새 대화를 시작해보세요" 메시지만 보임
- 인사말 + 칩 버튼이 즉시 표시되지 않음
- 메시지 입력창에 아무 대화나 입력 시 → 정상 작동 시작

**원인:**
```typescript
// useLocalChatbot.tsx:121-134
const addBotMessage = useCallback(async (conversationId: string, content: string) => {
  return new Promise<void>((resolve) => {
    typingTimerRef.current = setTimeout(() => {
      localChatStorage.addMessage(...);
      loadData();
    }, 1000); // ← 1초 딜레이로 인해 초기 메시지 지연
  });
}, []);
```

- `addBotMessage`에 1초 타이핑 효과 딜레이 있음
- `loadData()`도 50ms debounce 있음 (`useLocalChatbot.tsx:60-84`)
- 결과: conversation은 생성되었지만 메시지가 없는 상태로 화면 렌더링

**정상 동작 확인:**
- ✅ 메시지 입력 후 → 정상 작동
- ✅ 괜찮아요 → "다른 문의사항이 있으면 새 대화를 이용해주세요." 후 종료
- ✅ 네 다른문의 할게요 → "더 도와드릴 내용이 있나요?" 후 새로 시작
- ✅ POST 배치 처리 잘 적용됨 (대량 호출 없음)

---

### 7.2 회원 (useChatbot) 문제

#### 문제 1: POST 과다 호출

**현상:**
| 액션 | POST 호출 횟수 | 예상 횟수 |
|------|---------------|----------|
| 새 대화 시작 | 4번 | 2번 |
| 칩 클릭 | 4번 | 2번 |
| 문의 제출 | 4번 | 2번 |
| 괜찮아요 클릭 | 4번 | 2번 |
| 네 다른문의 할게요 | 5번 | 2번 |

**원인 분석 (칩 클릭 시):**
```
1. sendMessageMutation (user 메시지)     → POST /chat_messages
2. getChatFlowResponse                    → (server action 호출)
3. processChatFlow → sendMessages         → POST /chat_messages (배치)
4. sendMessageMutation (form 메시지)      → POST /chat_messages
5. invalidateAllQueries → getMessages     → GET /chat_messages (refetch)
```

**위치:** `useChatbot.tsx:282-318`
```typescript
// 개별 호출이 분산되어 있음
await sendMessageMutation.mutateAsync({...}); // POST 1
await processChatFlow(...);                    // POST 2
await sendMessageMutation.mutateAsync({...}); // POST 3
invalidateAllQueries();                        // GET refetch
```

**해결 방안:** 모든 메시지를 하나의 `sendMessages` 배치로 묶어서 전송

---

#### 문제 2: 칩 클릭 시 칩 버튼 안사라짐

**현상:**
- 비회원: 칩 클릭 시 칩 버튼 사라짐 ✅
- 회원: 칩 클릭 시 칩 버튼 그대로 남아있음 ❌

**비회원 코드 (정상):**
```typescript
// useLocalChatbot.tsx:287-294
const messages = localChatStorage.getMessages(chatState.activeConversation);
for (let i = messages.length - 1; i >= 0; i--) {
  if (messages[i].type === 'chips') {
    localChatStorage.removeMessage(..., messages[i].id); // ← 칩 메시지 삭제
    break;
  }
}
```

**회원 코드 (문제):**
```typescript
// useChatbot.tsx:282-318
// 칩 삭제 로직 없음!
// markChipsAsClicked 함수는 존재하지만 호출되지 않음
```

**해결 방안:**
- `deleteMessage` 또는 `markChipsAsClicked` 호출 추가
- 또는 칩 메시지의 `is_clicked: true`로 업데이트 후 UI에서 숨김 처리

---

#### 문제 3: "괜찮아요" 클릭 시 대화 종료 안됨

**현상:**
- 괜찮아요 클릭 → "다른 문의사항이 있으면 새 대화를 이용해주세요." 메시지 표시
- 하지만 대화 상태가 `completed`로 변경되지 않음
- 메시지 입력창이 닫히지 않음

**비회원 코드 (정상):**
```typescript
// useLocalChatbot.tsx:244-248
if (message === CHATBOT_MESSAGES.COMPLETION_OKAY) {
  localChatStorage.updateConversationStatus(chatState.activeConversation, 'completed');
  loadData();
}
```

**회원 handleChipClick 코드 (문제):**
```typescript
// useChatbot.tsx:264-280
if (!('type' in chip)) {
  // completion 칩 처리 (괜찮아요 / 네 다른문의 할게요)
  await sendMessageMutation.mutateAsync({...});
  await processChatFlow(...);
  invalidateAllQueries();
  return; // ← updateConversation 호출 없음!
}
```

**회원 sendUserMessage 코드 (있지만 호출 안됨):**
```typescript
// useChatbot.tsx:247-249
if (message === CHATBOT_MESSAGES.COMPLETION_OKAY) {
  await updateConversation(activeConversation, { status: 'completed' });
}
```

**해결 방안:**
```typescript
// handleChipClick에서 completion 칩 처리 시 추가
if (chip.label === CHATBOT_MESSAGES.COMPLETION_OKAY) {
  await updateConversation(activeConversation, { status: 'completed' });
}
```

---

### 7.3 비회원 vs 회원 비교표

| 기능 | 비회원 (useLocalChatbot) | 회원 (useChatbot) |
|------|-------------------------|-------------------|
| 새 대화 초기 메시지 | ❌ 1초 딜레이 | ✅ 정상 |
| POST 배치 처리 | ✅ localStorage (호출 없음) | ❌ 4-5번 개별 호출 |
| 칩 클릭 시 칩 제거 | ✅ removeMessage | ❌ 삭제 로직 없음 |
| 괜찮아요 → 종료 | ✅ updateConversationStatus | ❌ updateConversation 미호출 |
| 네 다른문의 할게요 | ✅ 정상 | ✅ 정상 (POST 과다) |

---

### 7.4 수정 우선순위

#### 긴급 (P0)
- [x] 회원: handleChipClick에서 `updateConversation(status: 'completed')` 추가
- [x] 회원: 칩 클릭 시 칩 메시지 마킹 로직 추가 (`markChipsAsClicked`)

#### 높음 (P1)
- [x] 회원: POST 호출 배치 최적화 (sendMessages 활용)
- [x] 비회원: startNewConversation 초기 메시지 즉시 표시

#### 보통 (P2)
- [x] 공통: 에러 핸들링 통일
- [x] 공통: 타이핑 효과 일관성 (둘 다 즉시 표시로 통일)
