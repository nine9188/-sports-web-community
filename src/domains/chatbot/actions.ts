'use server'

import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { ChatbotDatabase } from './utils/database'
import { handleChatbotError, retryOperation } from './utils/errors'
import { 
  validateFaqSearch, 
  validateSupportTicket
} from './utils/validation'

export type OrderStatus = {
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled'
  carrier?: string
  eta?: string
}

export type FAQItem = { title: string; answer: string; score?: number }

// Note: For tables not present in generated Database types, we cast to any at call sites.

export async function getOrderStatus(_params: { orderId: string }): Promise<OrderStatus> {
  void _params
  // 주문/배송 연동 시 전달된 orderId 사용
  // 실제 구현 시: 주문/배송 시스템 연동
  // 데모 반환
  const statuses: OrderStatus['status'][] = ['processing', 'shipped', 'delivered']
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  return {
    status,
    carrier: status !== 'processing' ? 'UPS' : undefined,
    eta: status === 'shipped' ? new Date(Date.now() + 3 * 86400000).toISOString() : undefined,
  }
}

export async function searchFAQ(params: { query: string }): Promise<FAQItem[]> {
  const validatedParams = validateFaqSearch(params)
  
  return retryOperation(async () => {
    const db = await ChatbotDatabase.create()
    const results = await db.searchFaq(validatedParams.query)
    
    return results.map(row => ({
      title: row.title,
      answer: row.answer,
      score: 1, // TODO: Implement actual scoring
    }))
  }, { maxRetries: 2 })
}

export async function createSupportTicket(params: {
  reason: string
  contact: string
  meta?: Record<string, unknown>
}): Promise<{ ticketId: string }> {
  const validatedParams = validateSupportTicket(params)
  
  return retryOperation(async () => {
    const db = await ChatbotDatabase.create()
    return await db.createSupportTicket(validatedParams)
  }, { maxRetries: 2 })
}

// --- Persistence helpers ----------------------------------------------------

export async function ensureChatSession(sessionId: string | null | undefined) {
  const id = sessionId ?? `S-${Math.random().toString(36).slice(2, 10)}`
  
  return handleChatbotError(async () => {
    const db = await ChatbotDatabase.create()
    
    await db.upsertChatSession({ 
      id, 
      created_at: new Date().toISOString(),
    })
    
    return id
  }, id)
}

export async function logIncomingMessages(params: {
  sessionId: string
  messages: import('ai').UIMessage[]
}) {
  return handleChatbotError(async () => {
    const db = await ChatbotDatabase.create()
    
    const messageRows = params.messages.map((m) => ({
      session_id: params.sessionId,
      role: m.role as 'assistant' | 'user',
      content_json: m as unknown,
      created_at: new Date().toISOString(),
    }))
    
    await db.insertChatMessages(messageRows)
  })
}

// 클라이언트 기반(폼/퀵버튼) 대화 저장용
export async function saveClientMessage(params: {
  sessionId: string
  role: 'assistant' | 'user'
  text: string
  createdAt: number
}) {
  return handleChatbotError(async () => {
    const db = await ChatbotDatabase.create()
    
    await db.insertChatMessage({
      session_id: params.sessionId,
      role: params.role,
      content_json: { 
        role: params.role, 
        type: 'text', 
        text: params.text, 
        createdAt: params.createdAt 
      },
      created_at: new Date(params.createdAt).toISOString(),
    })
  })
}

export async function markAssistantSeen(params: { sessionId: string; seenCount: number }) {
  return handleChatbotError(async () => {
    const db = await ChatbotDatabase.create()
    
    await db.updateChatSession(params.sessionId, {
      last_seen_assistant_count: params.seenCount
    })
  })
}

// 활성 세션의 생성 시각을 반환 (헤더 타이틀용)
export async function getChatSessionCreatedAt(sessionId: string): Promise<string | null> {
  return handleChatbotError(async () => {
    const db = await ChatbotDatabase.create()
    const session = await db.getChatSession(sessionId)
    return session?.created_at || null
  }, null)
}

// 세션 목록 요약: 마지막 메시지 시간/텍스트, 미확인 어시스턴트 수
export async function getChatSessionsOverview(): Promise<Array<{
  id: string
  createdAt: string | null
  lastMessageAt: string | null
  lastMessageText: string | null
  unreadAssistantCount: number
}>> {
  return handleChatbotError(async () => {
    const db = await ChatbotDatabase.create()
    return await db.getChatSessionsOverview()
  }, [])
}

// helper removed (not needed)

export async function logToolEvent(params: {
  sessionId: string
  toolName: string
  input?: unknown
  output?: unknown
  errorText?: string | null
}) {
  return handleChatbotError(async () => {
    const db = await ChatbotDatabase.create()
    await db.logToolEvent(params)
  })
}

// --- Server Action entry for Chat (API Route 제거용) -------------------------

export async function handleChatViaServerAction(payload: { messages: UIMessage[]; sessionId?: string }) {
  const sessionId = await ensureChatSession(payload.sessionId)
  await logIncomingMessages({ sessionId, messages: payload.messages })

  const canned: Record<string, string> = {
    community_guidelines: '커뮤니티 규정은 공지사항에서 확인하실 수 있어요. 특정 사례가 있다면 링크와 함께 알려주세요.',
    suggestion: '좋은 의견 감사합니다! 제안하실 내용을 구체적으로 남겨주시면 제품팀에 전달하겠습니다.',
    report_member: '신고하고자 하는 회원/게시글 링크를 알려주세요. 확인 후 조치하겠습니다.',
    usage_inquiry: '이용 중 불편하신 점이나 궁금한 점을 자세히 적어주세요. 도와드릴게요.',
    delete_request: '삭제 요청 대상(게시글/댓글) 링크와 사유를 남겨주세요. 정책 검토 후 처리됩니다.',
    bug_report: '버그 제보 감사합니다. 재현 경로/화면/브라우저 정보를 주시면 빠르게 확인하겠습니다.',
  }

  // 칩 기반 라우팅 규칙 (키워드 → 특정 칩 의도)
  const chipRoutingRules: Array<{ intent: keyof typeof canned; patterns: RegExp[] }> = [
    { intent: 'community_guidelines', patterns: [/규정|가이드|가이드라인|커뮤니티\s*규정/] },
    { intent: 'suggestion', patterns: [/제안|건의|개선|피드백|의견/] },
    { intent: 'report_member', patterns: [/신고|허위|스팸|욕설|비방|규정\s*위반|부적절/] },
    { intent: 'usage_inquiry', patterns: [/문의|사용법|이용|어떻게|방법|안내/] },
    { intent: 'delete_request', patterns: [/삭제\s*요청|삭제해줘|내\s*글\s*삭제|댓글\s*삭제/] },
    { intent: 'bug_report', patterns: [/버그|오류|에러|깨짐|안됨|문제/] },
  ]

  const result = streamText({
    model: openai('gpt-5-nano'),
    messages: [
      {
        role: 'system',
        content:
          '모든 응답은 한국어로 제공하세요. 먼저 routeChip 도구를 호출하여 사용자의 입력이 사전 정의된 칩 의도에 매칭되는지 판단하세요. 매칭되면 칩의 고정 답변만 간결하게 반환합니다. 매칭이 없을 때만 다른 도구(searchFAQ, getOrderStatus, createSupportTicket)를 사용하거나 간단히 재질문하세요. 개인정보(연락처/주문번호 등)는 클라이언트가 아닌 서버 도구로만 처리하세요.',
      },
      ...convertToModelMessages(payload.messages),
    ],
    tools: {
      // 먼저 routeChip을 호출하도록 시스템에 지시했으므로, 모델이 이 도구를 선택하면 해당 응답으로 종료합니다.
      routeChip: {
        description: '사용자 입력을 미리 정의된 칩 의도 중 하나로 라우팅합니다. 매칭 실패 시 intent는 빈 문자열을 반환합니다.',
        inputSchema: z.object({ text: z.string() }),
        async execute({ text }: { text: string }) {
          const normalized = text.replace(/\s+/g, ' ').trim()
          for (const rule of chipRoutingRules) {
            if (rule.patterns.some((re) => re.test(normalized))) {
              return { intent: rule.intent, reply: canned[rule.intent] ?? '' }
            }
          }
          return { intent: '', reply: '' }
        },
      },
      getCannedReply: {
        description: '사전 정의된 intent에 대한 고정 응답을 반환',
        inputSchema: z.object({ intent: z.string() }),
        async execute({ intent }: { intent: string }) {
          return canned[intent] ?? ''
        },
      },
      searchFAQ: {
        description: 'Search FAQs related to the user question',
        inputSchema: z.object({ query: z.string() }),
        async execute({ query }: { query: string }) {
          const output = await searchFAQ({ query })
          await logToolEvent({ sessionId, toolName: 'searchFAQ', input: { query }, output })
          return output
        },
      },
      getOrderStatus: {
        description: 'Get order/delivery status by order id',
        inputSchema: z.object({ orderId: z.string() }),
        async execute({ orderId }: { orderId: string }) {
          const output = await getOrderStatus({ orderId })
          await logToolEvent({ sessionId, toolName: 'getOrderStatus', input: { orderId }, output })
          return output
        },
      },
      createSupportTicket: {
        description: 'Create a support ticket for human handoff',
        inputSchema: z.object({ reason: z.string(), contact: z.string(), meta: z.record(z.any()).optional() }),
        async execute({ reason, contact, meta }: { reason: string; contact: string; meta?: Record<string, unknown> }) {
          const output = await createSupportTicket({ reason, contact, meta })
          await logToolEvent({ sessionId, toolName: 'createSupportTicket', input: { reason, contact, meta }, output })
          return output
        },
      },
      getClientContext: {
        description: 'Get lightweight client context (e.g., locale, path).',
        inputSchema: z.object({}),
      },
    },
    // 모델이 도구 대기 없이 먼저 간단 응답을 작성하도록 유도 (v5에서는 step 제어 기본값 충분)
  })

  // UIMessage Stream으로 응답 (useChat의 DefaultChatTransport 기대 형식)
  return result.toUIMessageStreamResponse()
}



// ---- DB-first helpers for client chatbot -----------------------------------

export async function listMessages(params: { sessionId: string }): Promise<Array<{ id: string; role: 'assistant' | 'user'; text: string; createdAt: string; readAt: string | null }>> {
  return handleChatbotError(async () => {
    const db = await ChatbotDatabase.create()
    const messages = await db.getChatMessages(params.sessionId)
    
    return messages.map((message) => ({
      id: message.id,
      role: (message.role as 'assistant' | 'user') || 'assistant',
      text: extractMessageText(message.content_json) || '',
      createdAt: message.created_at || '',
      readAt: (message as unknown as { read_at?: string | null }).read_at || null, // Use the actual read_at field from database
    }))
  }, [])
}

// 라우팅 우선 답변: 칩 규칙 매칭 → 고정 답변, 없으면 간단 AI 답변
export async function replyWithRouting(params: { sessionId: string; userText: string }): Promise<{ intent: string | null; reply: string; responseMode: 'text' | 'form' }> {
  return handleChatbotError(async () => {
    const db = await ChatbotDatabase.create()
    
    // Load intents and patterns from database
    const [intents, patterns] = await Promise.all([
      db.getChatChipIntents(),
      db.getChatChipPatterns()
    ])
    
    const intentMap = new Map(intents.map(intent => [intent.id, intent]))
    
    // Build regex rules
    const rules: Array<{ intent: string; regex: RegExp }> = []
    for (const pattern of patterns) {
      const intent = intentMap.get(pattern.intent_id)
      if (!intent) continue
      
      try {
        rules.push({
          intent: intent.intent,
          regex: new RegExp(pattern.pattern_regex)
        })
      } catch {
        // Skip invalid regex patterns
        console.warn(`Invalid regex pattern: ${pattern.pattern_regex}`)
      }
    }
    
    // Match user input against patterns
    const normalized = params.userText.replace(/\s+/g, ' ').trim()
    let matchedIntent: string | null = null
    
    for (const rule of rules) {
      if (rule.regex.test(normalized)) {
        matchedIntent = rule.intent
        break
      }
    }
    
    // Determine response mode and text
    const matched = matchedIntent ? intents.find(x => x.intent === matchedIntent) : null
    const mode: 'form' | 'text' = matchedIntent ? 'form' : 'text'
    const replyText = matchedIntent
      ? (matched?.response_text || '')
      : '지원 범위를 벗어난 질문이에요. 아래 빠른메뉴에서 항목을 선택해 주세요.'
    
    // Save assistant response to database
    await db.insertChatMessage({
      session_id: params.sessionId,
      role: 'assistant',
      content_json: mode === 'form'
        ? { role: 'assistant', type: 'form', intent: matchedIntent }
        : { role: 'assistant', type: 'text', text: replyText },
      created_at: new Date().toISOString(),
    })
    
    return {
      intent: matchedIntent,
      reply: replyText,
      responseMode: mode
    }
  })
}

export async function addAssistantBundle(params: { sessionId: string; mainText: string; includeFollowUp?: boolean }) {
  return handleChatbotError(async () => {
    const db = await ChatbotDatabase.create()
    const now = new Date()
    
    const messages = [
      {
        session_id: params.sessionId,
        role: 'assistant' as const,
        content_json: { role: 'assistant', type: 'text', text: params.mainText },
        created_at: now.toISOString(),
      },
    ]
    
    if (params.includeFollowUp) {
      messages.push({
        session_id: params.sessionId,
        role: 'assistant' as const,
        content_json: { role: 'assistant', type: 'text', text: '도움이 되셨나요?' },
        created_at: new Date(now.getTime() + 500).toISOString(),
      })
    }
    
    await db.insertChatMessages(messages)
  })
}
// Remove duplicated/garbled blocks below






export async function getOrInitMessages(params: { sessionId: string; greeting?: string }): Promise<{
  messages: Array<{ id: string; role: 'assistant' | 'user'; text: string; createdAt: string; readAt: string | null }>
  assistantCount: number
}> {
  return handleChatbotError(async () => {
    const db = await ChatbotDatabase.create()
    const greetingText = params.greeting ?? '안녕하세요, 스포츠 고객지원팀입니다. 도와드릴 일이 있나요?'
    
    // Check for existing messages
    const existingMessages = await db.getChatMessages(params.sessionId)
    
    if (existingMessages.length === 0) {
      // No messages exist, create greeting
      const nowIso = new Date().toISOString()
      const greetingMessage = await db.insertChatMessage({
        session_id: params.sessionId,
        role: 'assistant',
        content_json: { role: 'assistant', type: 'text', text: greetingText },
        created_at: nowIso,
      })
      
      return {
        messages: [{
          id: greetingMessage.id,
          role: 'assistant',
          text: greetingText,
          createdAt: nowIso,
          readAt: null,
        }],
        assistantCount: 1,
      }
    }
    
    // Return existing messages
    const assistantCount = existingMessages.filter(m => m.role === 'assistant').length
    const messages = existingMessages.map(message => ({
      id: message.id,
      role: (message.role as 'assistant' | 'user') || 'assistant',
      text: extractMessageText(message.content_json) || '',
      createdAt: message.created_at || '',
      readAt: (message as unknown as { read_at?: string | null }).read_at || null, // Use the actual read_at field from database
    }))
    
    return { messages, assistantCount }
  })
}

// Helper function to extract message text from content_json
function extractMessageText(contentJson: unknown): string | null {
  if (!contentJson || typeof contentJson !== 'object') return null
  if (Array.isArray(contentJson)) return null
  
  const obj = contentJson as Record<string, unknown>
  const textValue = obj.text
  return typeof textValue === 'string' ? textValue : null
}

export async function markAllAssistantAsRead(params: { sessionId: string }) {
  return handleChatbotError(async () => {
    const db = await ChatbotDatabase.create()
    
    // Update read status
    await db.updateChatMessagesReadStatus(params.sessionId)
    
    // Count total assistant messages and update session
    const messages = await db.getChatMessages(params.sessionId)
    const assistantCount = messages.filter(m => m.role === 'assistant').length
    
    await db.updateChatSession(params.sessionId, {
      last_seen_assistant_count: assistantCount
    })
  })
}

// 상담원 연결 관련 함수들
export async function createLiveChatSession(params: {
  chatSessionId: string
  customerName: string
  customerContact: string
  inquiryType: string
  description: string
}): Promise<{ liveChatId: string }> {
  return handleChatbotError(async () => {
    const db = await ChatbotDatabase.create()
    return await db.createLiveChatSession(params)
  })
}

export async function getLiveChatSession(chatSessionId: string) {
  return handleChatbotError(async () => {
    const db = await ChatbotDatabase.create()
    return await db.getLiveChatSession(chatSessionId)
  })
}

export async function updateLiveChatStatus(liveChatId: string, status: 'waiting' | 'connected' | 'ended', agentId?: string) {
  return handleChatbotError(async () => {
    const db = await ChatbotDatabase.create()
    return await db.updateLiveChatStatus(liveChatId, status, agentId)
  })
}

export async function isLiveChatActive(chatSessionId: string): Promise<boolean> {
  return handleChatbotError(async () => {
    const db = await ChatbotDatabase.create()
    // Generated Supabase types may not include this table; use a local fallback type.
    type LiveChatSessionFallback = { status?: 'waiting' | 'connected' | 'ended' | null }
    const session = (await db.getLiveChatSession(chatSessionId)) as unknown as LiveChatSessionFallback | null
    return (session?.status ?? null) === 'connected'
  }, false)
}
