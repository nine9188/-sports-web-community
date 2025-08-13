"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type ThreadItem = { id: string; role: 'assistant' | 'user'; type: 'text'; text: string } | { id: string; role: 'assistant'; type: 'form'; intent: string; submitted: boolean }

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
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('support_chat_sessions_v1')
      const list: ChatSession[] = raw ? JSON.parse(raw) : []
      setSessions(list)
    } catch {
      setSessions([])
    }
  }, [])

  const ordered = useMemo(() => sessions.slice().sort((a, b) => b.updatedAt - a.updatedAt), [sessions])

  return (
    <main className="container mx-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/support" className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-neutral-100" aria-label="뒤로">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </Link>
        <h1 className="text-xl font-bold">대화 목록</h1>
      </div>

      <div className="mb-3">
        <Link href="/support?new=1" className="inline-flex items-center gap-2 px-3 py-2 rounded bg-black text-white text-sm">새 대화</Link>
      </div>

      <ul className="divide-y rounded border bg-white">
        {ordered.map((s) => {
          const last = s.state.thread.filter((t) => t.type === 'text').slice(-1)[0] as Extract<ThreadItem, { type: 'text' }> | undefined
          return (
            <li key={s.id} className="p-3">
              <Link href={`/support?sid=${s.id}`} className="block">
                <div className="font-medium truncate">{s.title || '대화'}</div>
                <div className="text-xs text-neutral-500 truncate">{last ? last.text : '시작됨'}</div>
              </Link>
            </li>
          )
        })}
        {ordered.length === 0 && (
          <li className="p-4 text-sm text-neutral-500">저장된 대화가 없습니다. 우측 상단에서 새 대화를 시작하세요.</li>
        )}
      </ul>
    </main>
  )
}


