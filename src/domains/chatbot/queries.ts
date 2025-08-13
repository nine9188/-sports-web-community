/* Server-side data queries for chatbot (RSC-safe). */
import { createServerActionClient } from '@/shared/api/supabaseServer'
import type { Json, Tables } from '@/shared/types/supabase'

export async function getChatSessionsOverviewQuery(): Promise<Array<{
  id: string
  createdAt: string | null
  lastMessageAt: string | null
  lastMessageText: string | null
  unreadAssistantCount: number
}>> {
  const client = await createServerActionClient()
  try {
    const { data: sessions } = await client
      .from('chat_sessions')
      .select('id, created_at, last_seen_assistant_count')

    if (!sessions || sessions.length === 0) return []
    type ChatSessionProjected = Pick<Tables<'chat_sessions'>, 'id' | 'created_at' | 'last_seen_assistant_count'>
    const sessionRows = sessions as ChatSessionProjected[]
    const sessionIds = sessionRows.map((s) => s.id)

    const { data: allMsgs } = await client
      .from('chat_messages')
      .select('session_id, role, content_json, created_at')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: false })

    type ChatMessageProjected = Pick<
      Tables<'chat_messages'>,
      'session_id' | 'role' | 'content_json' | 'created_at'
    >
    const bySession = new Map<string, { last?: ChatMessageProjected; assistantCount: number; oldest?: ChatMessageProjected }>()
    for (const sId of sessionIds) bySession.set(sId, { assistantCount: 0 })

    for (const m of (allMsgs ?? []) as ChatMessageProjected[]) {
      const sid = String(m.session_id ?? '')
      const bucket = bySession.get(sid)
      if (!bucket) continue
      if (!bucket.last) bucket.last = m
      bucket.oldest = m
      if (m.role === 'assistant') bucket.assistantCount += 1
    }

    const getMessageText = (content: Json | null | undefined): string | null => {
      if (!content || typeof content !== 'object' || Array.isArray(content)) return null
      const textValue = (content as Record<string, unknown>).text
      return typeof textValue === 'string' ? textValue : null
    }

    const results: Array<{ id: string; createdAt: string | null; lastMessageAt: string | null; lastMessageText: string | null; unreadAssistantCount: number }> = []
    for (const s of sessionRows) {
      const buckets = bySession.get(s.id)
      const last = buckets?.last
      const oldest = buckets?.oldest
      const unread = Math.max(0, (buckets?.assistantCount ?? 0) - (s.last_seen_assistant_count ?? 0))
      results.push({
        id: s.id,
        createdAt: oldest?.created_at ?? s.created_at ?? null,
        lastMessageAt: last?.created_at ?? s.created_at ?? null,
        lastMessageText: getMessageText(last?.content_json),
        unreadAssistantCount: unread,
      })
    }

    return results.sort((a, b) => (new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime()))
  } catch {
    return []
  }
}


