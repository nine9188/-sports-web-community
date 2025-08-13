import { createServerActionClient } from '@/shared/api/supabaseServer'
import type { Tables, TablesUpdate } from '@/shared/types/supabase'
import { ChatbotErrors, handleChatbotError } from './errors'

// Type-safe database client wrapper
export class ChatbotDatabase {
  private client: Awaited<ReturnType<typeof createServerActionClient>>

  constructor(client: Awaited<ReturnType<typeof createServerActionClient>>) {
    this.client = client
  }

  static async create() {
    const client = await createServerActionClient()
    return new ChatbotDatabase(client)
  }

  // Chat sessions operations
  async getChatSession(sessionId: string): Promise<Tables<'chat_sessions'> | null> {
    return handleChatbotError(async () => {
      const { data, error } = await this.client
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null
        }
        throw ChatbotErrors.databaseConnection(error)
      }

      return data
    }, null)
  }

  async upsertChatSession(data: { id: string; created_at?: string; user_id?: string | null }): Promise<Tables<'chat_sessions'>> {
    return handleChatbotError(async () => {
      // Use fields that exist in the actual schema
      const sessionData: any = {
        id: data.id,
        created_at: data.created_at,
        last_seen_assistant_count: 0
      }
      
      if (data.user_id !== undefined) {
        sessionData.user_id = data.user_id
      }

      const { data: result, error } = await this.client
        .from('chat_sessions')
        .upsert(sessionData)
        .select('*')
        .single()

      if (error) {
        throw ChatbotErrors.databaseConnection(error)
      }

      return result
    })
  }

  async updateChatSession(sessionId: string, updates: TablesUpdate<'chat_sessions'>): Promise<void> {
    return handleChatbotError(async () => {
      const { error } = await this.client
        .from('chat_sessions')
        .update(updates)
        .eq('id', sessionId)

      if (error) {
        throw ChatbotErrors.databaseConnection(error)
      }
    })
  }

  // Chat messages operations
  async getChatMessages(sessionId: string): Promise<Tables<'chat_messages'>[]> {
    return handleChatbotError(async () => {
      const { data, error } = await this.client
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) {
        throw ChatbotErrors.databaseConnection(error)
      }

      return data || []
    }, [])
  }

  async insertChatMessage(data: { session_id: string; role: string; content_json: unknown; created_at?: string; parts_json?: unknown }): Promise<Tables<'chat_messages'>> {
    return handleChatbotError(async () => {
      const messageData: any = {
        session_id: data.session_id,
        role: data.role,
        content_json: data.content_json,
        created_at: data.created_at
      }
      
      if (data.parts_json !== undefined) {
        messageData.parts_json = data.parts_json
      }

      const { data: result, error } = await this.client
        .from('chat_messages')
        .insert(messageData)
        .select('*')
        .single()

      if (error) {
        throw ChatbotErrors.messageSaveFailed(data.session_id || 'unknown', error)
      }

      return result
    })
  }

  async insertChatMessages(data: Array<{ session_id: string; role: string; content_json: unknown; created_at?: string; parts_json?: unknown }>): Promise<Tables<'chat_messages'>[]> {
    return handleChatbotError(async () => {
      const messageData: any[] = data.map(item => {
        const msg: any = {
          session_id: item.session_id,
          role: item.role,
          content_json: item.content_json,
          created_at: item.created_at
        }
        if (item.parts_json !== undefined) {
          msg.parts_json = item.parts_json
        }
        return msg
      })

      const { data: result, error } = await this.client
        .from('chat_messages')
        .insert(messageData)
        .select('*')

      if (error) {
        throw ChatbotErrors.messageSaveFailed('batch', error)
      }

      return result || []
    }, [])
  }

  async updateChatMessagesReadStatus(sessionId: string): Promise<void> {
    return handleChatbotError(async () => {
      const { error } = await this.client
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('role', 'assistant')
        .is('read_at', null)

      if (error) {
        throw ChatbotErrors.databaseConnection(error)
      }
    })
  }

  // Chat chip intents operations
  async getChatChipIntents(): Promise<Tables<'chat_chip_intents'>[]> {
    return handleChatbotError(async () => {
      const { data, error } = await this.client
        .from('chat_chip_intents')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) {
        throw ChatbotErrors.databaseConnection(error)
      }

      return data || []
    }, [])
  }

  async getChatChipPatterns(): Promise<Tables<'chat_chip_patterns'>[]> {
    return handleChatbotError(async () => {
      const { data, error } = await this.client
        .from('chat_chip_patterns')
        .select('*')
        .eq('is_active', true)

      if (error) {
        throw ChatbotErrors.databaseConnection(error)
      }

      return data || []
    }, [])
  }

  // FAQ operations
  async searchFaq(query: string, limit: number = 5): Promise<Array<{ title: string; answer: string }>> {
    return handleChatbotError(async () => {
      const { data, error } = await this.client
        .from('faq')
        .select('title, answer')
        .or(`title.ilike.%${query}%,answer.ilike.%${query}%`)
        .limit(limit)

      if (error) {
        throw ChatbotErrors.toolExecutionFailed('searchFaq', error)
      }

      return (data || []).map(row => ({
        title: String(row.title || ''),
        answer: String(row.answer || ''),
      }))
    }, [])
  }

  // Support tickets operations
  async createSupportTicket(data: {
    reason: string
    contact: string
    meta?: Record<string, unknown>
  }): Promise<{ ticketId: string }> {
    return handleChatbotError(async () => {
      const { data: result, error } = await this.client
        .from('support_tickets')
        .insert({
          reason: data.reason,
          contact: data.contact,
          meta: data.meta || null,
        })
        .select('id')
        .single()

      if (error) {
        throw ChatbotErrors.toolExecutionFailed('createSupportTicket', error)
      }

      return { ticketId: String(result?.id || '') }
    }, { ticketId: `T-${Math.random().toString(36).slice(2, 8)}` })
  }

  // Chat tool logs operations
  async logToolEvent(data: {
    sessionId: string
    toolName: string
    input?: unknown
    output?: unknown
    errorText?: string | null
  }): Promise<void> {
    return handleChatbotError(async () => {
      const { error } = await this.client
        .from('chat_tool_logs')
        .insert({
          session_id: data.sessionId,
          tool_name: data.toolName,
          input_json: data.input || null,
          output_json: data.output || null,
          error_text: data.errorText || null,
        })

      if (error) {
        // Tool logging failures shouldn't break the main flow
        console.warn('Failed to log tool event:', error)
      }
    })
  }

  // Session overview operations - 최적화된 버전
  async getChatSessionsOverview(): Promise<Array<{
    id: string
    createdAt: string | null
    lastMessageAt: string | null
    lastMessageText: string | null
    unreadAssistantCount: number
  }>> {
    return handleChatbotError(async () => {
      // 단순화된 쿼리 - 최근 10개 세션만 가져오기
      const { data: sessions, error: sessionsError } = await this.client
        .from('chat_sessions')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      if (sessionsError) {
        throw ChatbotErrors.databaseConnection(sessionsError)
      }

      if (!sessions || sessions.length === 0) return []

      const results = await Promise.all(sessions.map(async session => {
        // 각 세션의 마지막 메시지와 읽지 않은 메시지 수를 병렬로 조회
        const [lastMessageResult, unreadCountResult] = await Promise.all([
          // 마지막 메시지 조회
          this.client
            .from('chat_messages')
            .select('content_json, created_at')
            .eq('session_id', session.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
          // 읽지 않은 어시스턴트 메시지 수 조회
          this.client
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)
            .eq('role', 'assistant')
            .is('read_at', null)
        ])

        const lastMessage = lastMessageResult.data
        const unreadCount = unreadCountResult.count || 0

        return {
          id: session.id,
          createdAt: session.created_at,
          lastMessageAt: lastMessage?.created_at || session.created_at,
          lastMessageText: lastMessage ? this.extractMessageText(lastMessage.content_json) : null,
          unreadAssistantCount: unreadCount,
        }
      }))

      return results.sort((a, b) => 
        new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
      )
    }, [])
  }

  private extractMessageText(contentJson: any): string | null {
    if (!contentJson || typeof contentJson !== 'object') return null
    if (Array.isArray(contentJson)) return null
    
    const textValue = contentJson.text
    return typeof textValue === 'string' ? textValue : null
  }

  // Utility method to get current user
  async getCurrentUser() {
    return handleChatbotError(async () => {
      const { data, error } = await this.client.auth.getUser()
      
      if (error) {
        throw ChatbotErrors.databaseConnection(error)
      }

      return data.user
    }, null)
  }

  // Live chat session operations
  async createLiveChatSession(data: {
    chatSessionId: string
    customerName: string
    customerContact: string
    inquiryType: string
    description: string
  }): Promise<{ liveChatId: string }> {
    return handleChatbotError(async () => {
      const { data: result, error } = await this.client
        .from('live_chat_sessions')
        .insert({
          chat_session_id: data.chatSessionId,
          customer_name: data.customerName,
          customer_contact: data.customerContact,
          status: 'waiting',
        })
        .select('id')
        .single()

      if (error) {
        throw ChatbotErrors.toolExecutionFailed('createLiveChatSession', error)
      }

      return { liveChatId: String(result?.id || '') }
    }, { liveChatId: `LC-${Math.random().toString(36).slice(2, 8)}` })
  }

  async getLiveChatSession(chatSessionId: string): Promise<Tables<'live_chat_sessions'> | null> {
    return handleChatbotError(async () => {
      const { data, error } = await this.client
        .from('live_chat_sessions')
        .select('*')
        .eq('chat_session_id', chatSessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null
        }
        throw ChatbotErrors.databaseConnection(error)
      }

      return data
    }, null)
  }

  async updateLiveChatStatus(liveChatId: string, status: 'waiting' | 'connected' | 'ended', agentId?: string): Promise<void> {
    return handleChatbotError(async () => {
      const updateData: any = { status }
      
      if (status === 'connected' && agentId) {
        updateData.agent_id = agentId
        updateData.connected_at = new Date().toISOString()
      } else if (status === 'ended') {
        updateData.ended_at = new Date().toISOString()
      }

      const { error } = await this.client
        .from('live_chat_sessions')
        .update(updateData)
        .eq('id', liveChatId)

      if (error) {
        throw ChatbotErrors.databaseConnection(error)
      }
    })
  }

  async getWaitingLiveChatSessions(): Promise<Array<Tables<'live_chat_sessions'> & { session_created_at: string }>> {
    return handleChatbotError(async () => {
      const { data, error } = await this.client
        .from('live_chat_sessions')
        .select(`
          *,
          chat_sessions!inner(created_at)
        `)
        .eq('status', 'waiting')
        .order('created_at', { ascending: true })

      if (error) {
        throw ChatbotErrors.databaseConnection(error)
      }

      return (data || []).map(item => ({
        ...item,
        session_created_at: (item as any).chat_sessions?.created_at || ''
      }))
    }, [])
  }
}