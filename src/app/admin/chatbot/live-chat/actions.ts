'use server'

import { createServerActionClient } from '@/shared/api/supabaseServer'
import { ChatbotDatabase } from '@/domains/chatbot/utils/database'

// 대기 중인 라이브 채팅 세션 조회
export async function getWaitingLiveChatSessions() {
  const db = await ChatbotDatabase.create()
  return await db.getWaitingLiveChatSessions()
}

// 상담원이 라이브 채팅에 연결
export async function connectToLiveChat(liveChatId: string, agentId: string) {
  const db = await ChatbotDatabase.create()
  await db.updateLiveChatStatus(liveChatId, 'connected', agentId)
  
  // 고객에게 연결 알림 메시지 전송
  const client = await createServerActionClient()
  const { data: liveChat } = await (client as any)
    .from('live_chat_sessions')
    .select('chat_session_id')
    .eq('id', liveChatId)
    .single()
  
  if (liveChat) {
    await (client as any)
      .from('chat_messages')
      .insert({
        session_id: liveChat.chat_session_id,
        role: 'assistant',
        content_json: {
          role: 'assistant',
          type: 'text',
          text: '안녕하세요! 상담원이 연결되었습니다. 무엇을 도와드릴까요? 😊',
          agent_id: agentId
        },
        created_at: new Date().toISOString()
      })
  }
}

// 라이브 채팅 종료
export async function endLiveChat(liveChatId: string) {
  const db = await ChatbotDatabase.create()
  await db.updateLiveChatStatus(liveChatId, 'ended')
  
  // 고객에게 종료 알림 메시지 전송
  const client = await createServerActionClient()
  const { data: liveChat } = await (client as any)
    .from('live_chat_sessions')
    .select('chat_session_id')
    .eq('id', liveChatId)
    .single()
  
  if (liveChat) {
    await (client as any)
      .from('chat_messages')
      .insert({
        session_id: liveChat.chat_session_id,
        role: 'assistant',
        content_json: {
          role: 'assistant',
          type: 'text',
          text: '상담이 종료되었습니다. 이용해 주셔서 감사합니다. 추가 문의가 있으시면 언제든 연락해 주세요! 🙏'
        },
        created_at: new Date().toISOString()
      })
  }
}

// 라이브 채팅 메시지 조회
export async function getLiveChatMessages(chatSessionId: string) {
  const client = await createServerActionClient()
  const { data, error } = await (client as any)
    .from('chat_messages')
    .select('id, role, content_json, created_at')
    .eq('session_id', chatSessionId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to get live chat messages:', error)
    return []
  }

  return (data || []).map((message: any) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant',
    text: extractTextFromContentJson(message.content_json),
    createdAt: message.created_at,
  }))
}

// 라이브 채팅 메시지 전송
export async function sendLiveChatMessage(params: {
  sessionId: string
  role: 'user' | 'assistant'
  text: string
  agentId?: string
}) {
  const client = await createServerActionClient()
  
  const contentJson = {
    role: params.role,
    type: 'text',
    text: params.text,
    ...(params.agentId && { agent_id: params.agentId })
  }

  const { error } = await (client as any)
    .from('chat_messages')
    .insert({
      session_id: params.sessionId,
      role: params.role,
      content_json: contentJson,
      created_at: new Date().toISOString()
    })

  if (error) {
    throw new Error('Failed to send message: ' + error.message)
  }
}

// content_json에서 텍스트 추출 헬퍼 함수
function extractTextFromContentJson(contentJson: any): string {
  if (!contentJson || typeof contentJson !== 'object') return ''
  
  if (typeof contentJson.text === 'string') {
    return contentJson.text
  }
  
  // 다른 형태의 메시지 타입 처리
  if (contentJson.type === 'form') {
    return '[폼 메시지]'
  }
  
  return '[알 수 없는 메시지]'
}