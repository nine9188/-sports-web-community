"use client"
import { useEffect, useMemo, useState } from 'react'
import { getChatSessionsOverview } from '@/domains/chatbot/actions'

type ThreadItem =
  | { id: string; role: 'assistant' | 'user'; type: 'text'; text: string; createdAt?: number }
  | { id: string; role: 'assistant'; type: 'form'; intent: string; submitted: boolean }

type ChatSessionState = {
  thread: ThreadItem[]
  showQuickMenu: boolean
  showFollowUp: boolean
  isClosed: boolean
}

type ChatSession = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  state: ChatSessionState
  lastSeenAssistantCount?: number
  previewText?: string
  unreadAssistantCount?: number
}

export default function ChatSessionList(props: {
  onSelect: (id: string) => void
  onNew: () => void
  initialDbSessions?: Array<{ id: string; createdAt: string | null; lastMessageAt: string | null; lastMessageText: string | null; unreadAssistantCount: number }>
}) {
  const [sessions, setSessions] = useState<ChatSession[]>([])

  useEffect(() => {
    ;(async () => {
      // 서버에서 초기 세션이 주어지면 그대로 사용하여 첫 페인트 가속
      if (props.initialDbSessions && props.initialDbSessions.length > 0) {
        const mapped: ChatSession[] = props.initialDbSessions.map((s) => ({
          id: s.id,
          title: '대화',
          createdAt: s.createdAt ? Date.parse(s.createdAt) : Date.now(),
          updatedAt: s.lastMessageAt ? Date.parse(s.lastMessageAt) : Date.now(),
          state: { thread: [], showQuickMenu: false, showFollowUp: false, isClosed: false },
          lastSeenAssistantCount: 0,
          previewText: s.lastMessageText ?? '',
          unreadAssistantCount: Math.max(0, s.unreadAssistantCount ?? 0),
        }))
        setSessions(mapped)
        return
      }
      const dbSessions = await getChatSessionsOverview()
      const mapped: ChatSession[] = dbSessions.map((s) => ({
        id: s.id,
        title: '대화',
        createdAt: s.createdAt ? Date.parse(s.createdAt) : Date.now(),
        updatedAt: s.lastMessageAt ? Date.parse(s.lastMessageAt) : Date.now(),
        state: { thread: [], showQuickMenu: false, showFollowUp: false, isClosed: false },
        lastSeenAssistantCount: 0,
        previewText: s.lastMessageText ?? '',
        unreadAssistantCount: Math.max(0, s.unreadAssistantCount ?? 0),
      }))
      setSessions(mapped)
    })()
  }, [props.initialDbSessions])

  const ordered = useMemo(() => {
    const getLastTextTime = (s: ChatSession): number => {
      const lastText = [...s.state.thread]
        .reverse()
        .find((t): t is Extract<ThreadItem, { type: 'text' }> => t.type === 'text')
      return (lastText?.createdAt ?? s.updatedAt ?? s.createdAt)
    }
    return sessions.slice().sort((a, b) => getLastTextTime(b) - getLastTextTime(a))
  }, [sessions])

  const formatDateTime = (ts: number | undefined) => {
    if (!ts) return ''
    const d = new Date(ts)
    const month = d.getMonth() + 1
    const day = d.getDate()
    const hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const meridiem = hours < 12 ? '오전' : '오후'
    const hour12 = hours % 12 === 0 ? 12 : hours % 12
    return `${month}월 ${day}일 ${meridiem} ${hour12}:${minutes}`
  }

  const formatRecentOrDate = (ts: number | undefined) => {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    const isSameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    if (isSameDay) {
      const hours = d.getHours()
      const minutes = String(d.getMinutes()).padStart(2, '0')
      const meridiem = hours < 12 ? '오전' : '오후'
      const hour12 = hours % 12 === 0 ? 12 : hours % 12
      return `${meridiem} ${hour12}:${minutes}`
    }
    const month = d.getMonth() + 1
    const day = d.getDate()
    return `${month}월 ${day}일`
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-1">
        <ul className="divide-y">
          {ordered.map((s) => {
            const createdLabel = formatDateTime(s.createdAt)
            const updatedLabel = formatRecentOrDate(s.updatedAt ?? s.createdAt)
            const preview = (s.previewText && s.previewText.trim().length > 0) ? s.previewText : '메시지 없음'
            const unread = Math.max(0, s.unreadAssistantCount ?? 0)
            // 마지막 어시스턴트 답변 시간 (정렬/우측 최신시간 표시에 사용)
            return (
              <li key={s.id} className="p-3">
                <button type="button" onClick={() => props.onSelect(s.id)} className="w-full text-left">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{createdLabel}</div>
                    <div className="text-xs text-neutral-500 whitespace-nowrap">{updatedLabel}</div>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="text-xs text-neutral-500 truncate">{preview}</div>
                    {unread > 0 && (
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 text-white text-[11px] px-1">{unread}</span>
                    )}
                  </div>
                </button>
              </li>
            )
          })}
          {ordered.length === 0 && (
            <li className="p-4 text-sm text-neutral-500">저장된 대화가 없습니다. 하단 버튼으로 새 대화를 시작하세요.</li>
          )}
        </ul>
      </div>
      <div className="p-2 border-t bg-white">
        <button type="button" onClick={props.onNew} className="w-full px-4 py-2 rounded bg-black text-white text-sm">새 대화</button>
      </div>
    </div>
  )
}


