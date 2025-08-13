'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import ChatWindow from '@/domains/chatbot/components/ChatWindow'
import ChatSessionList from '@/domains/chatbot/components/ChatSessionList'
import { getChatSessionCreatedAt, getChatSessionsOverview as fetchChatSessionsOverview } from '@/domains/chatbot/actions'

type ChatSessionsOverview = Awaited<ReturnType<typeof fetchChatSessionsOverview>>

export default function SupportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeSessionId = searchParams?.get('sid') ?? null
  const forceNew = searchParams?.get('new') === '1'
  
  const [isListing, setIsListing] = useState(false)
  const [createdAtIso, setCreatedAtIso] = useState<string | null>(null)
  const [totalUnread, setTotalUnread] = useState(0)
  const [initialDbSessions, setInitialDbSessions] = useState<ChatSessionsOverview>()
  const [isMobile, setIsMobile] = useState(false)

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 페이지 진입 시 세션 목록 로드
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const sessions = await fetchChatSessionsOverview()
        setInitialDbSessions(sessions)
      } catch (error) {
        console.error('세션 목록 로드 실패:', error)
      }
    }
    loadSessions()
  }, [])

  // 세션 변경 시 생성시각 조회
  useEffect(() => {
    if (!activeSessionId) return
    ;(async () => {
      try {
        const iso = await getChatSessionCreatedAt(activeSessionId)
        setCreatedAtIso(iso)
      } catch {
        setCreatedAtIso(null)
      }
    })()
  }, [activeSessionId])

  // 전체 미확인 건수 로드 함수
  const refreshUnreadCount = useCallback(async () => {
    try {
      const overview = await fetchChatSessionsOverview()
      const count = overview.reduce<number>((sum, s) => sum + (s.unreadAssistantCount ?? 0), 0)
      setTotalUnread(count)
    } catch {
      // ignore
    }
  }, [])

  // 초기 로드 시 읽지 않은 메시지 수 로드
  useEffect(() => {
    void refreshUnreadCount()
  }, [refreshUnreadCount])

  const formatKoreanDateTime = (iso?: string | null) => {
    const d = iso ? new Date(iso) : new Date()
    if (Number.isNaN(d.getTime())) return formatKoreanDateTime(new Date().toISOString())
    const month = d.getMonth() + 1
    const day = d.getDate()
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const isAm = d.getHours() < 12
    const period = isAm ? '오전' : '오후'
    let hour12 = d.getHours() % 12
    if (hour12 === 0) hour12 = 12
    return `${month}월 ${day}일 ${period} ${hour12}:${minutes}`
  }

  const activeSessionMeta = (() => {
    if (!activeSessionId) return null
    const found = initialDbSessions?.find((s) => s.id === activeSessionId)
    return found ?? null
  })()

  const conversationTitle = formatKoreanDateTime(createdAtIso ?? activeSessionMeta?.createdAt ?? undefined)

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* 모바일 헤더 */}
        <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full -ml-2"
              aria-label="뒤로가기"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle size={18} className="text-blue-600" />
              </div>
              <div>
                <h1 className="font-semibold text-lg">
                  {isListing ? '고객지원 챗봇' : conversationTitle}
                </h1>
                {!isListing && (
                  <p className="text-xs text-gray-500">온라인</p>
                )}
              </div>
            </div>
          </div>

          {!isListing && (
            <button
              onClick={() => setIsListing(true)}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
              aria-label="대화 목록"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}
        </header>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-hidden">
          {isListing ? (
            <ChatSessionList
              initialDbSessions={initialDbSessions}
              onSelect={(id) => {
                router.push(`/support?sid=${id}`)
                setIsListing(false)
              }}
              onNew={() => {
                router.push('/support?new=1')
                setIsListing(false)
              }}
            />
          ) : (
            <div className="h-full overflow-auto">
              <ChatWindow 
                activeSessionId={activeSessionId} 
                forceNew={forceNew} 
                onReadStatusChanged={refreshUnreadCount} 
              />
            </div>
          )}
        </main>
      </div>
    )
  }

  // 데스크톱 버전 (기존)
  return (
    <main className="container mx-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => router.back()}
          className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-neutral-100"
          aria-label="뒤로가기"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1 className="text-xl font-bold">고객지원 챗봇</h1>
      </div>
      <ChatWindow activeSessionId={activeSessionId} forceNew={forceNew} onReadStatusChanged={refreshUnreadCount} />
    </main>
  )
}


