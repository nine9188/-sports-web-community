'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { MessageCircle, ChevronDown, ArrowLeft } from 'lucide-react'
import ChatWindow from '@/domains/chatbot/components/ChatWindow'
import ChatSessionList from '@/domains/chatbot/components/ChatSessionList'
import { ensureChatSession, getChatSessionCreatedAt, getChatSessionsOverview as fetchChatSessionsOverview } from '@/domains/chatbot/actions'

type ChatSessionsOverview = Awaited<ReturnType<typeof fetchChatSessionsOverview>>

export default function SupportWidget({ initialDbSessions }: { initialDbSessions?: ChatSessionsOverview }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [isListing, setIsListing] = useState(false)
  const [forcedNew, setForcedNew] = useState(false)
  const [activeSid, setActiveSid] = useState<string | null>(null)
  const creatingRef = useRef(false)
  const [createdAtIso, setCreatedAtIso] = useState<string | null>(null)
  const [totalUnread, setTotalUnread] = useState(0)

  const toggle = useCallback(() => {
    if (!isOpen && isMobile) {
      // 모바일에서 열기
      setIsOpening(true)
      setIsOpen(true)
      setTimeout(() => {
        setIsOpening(false)
      }, 50) // 애니메이션 시작을 위한 짧은 딜레이
    } else {
      setIsOpen((v) => !v)
    }
  }, [isOpen, isMobile])
  
  const close = useCallback(() => {
    if (isMobile && isOpen) {
      setIsClosing(true)
      setTimeout(() => {
        setIsOpen(false)
        setIsClosing(false)
      }, 300) // 애니메이션 시간과 동일
    } else {
      setIsOpen(false)
    }
  }, [isMobile, isOpen])
  
  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 라우트 변경 시 자동 닫기
  const prevPath = useRef<string | null>(null)
  useEffect(() => {
    if (prevPath.current !== pathname) {
      setIsOpen(false)
      prevPath.current = pathname
    }
  }, [pathname])

  // ESC 닫기
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  // 대화 뷰 진입 시 세션 미존재면 생성 (한 번만)
  useEffect(() => {
    if (!isOpen) return
    if (isListing) return
    if (forcedNew) return
    if (activeSid) return
    if (creatingRef.current) return
    creatingRef.current = true
    ;(async () => {
      try {
        const id = await ensureChatSession(null)
        setActiveSid(id)
        setForcedNew(false)
        try {
          const iso = await getChatSessionCreatedAt(id)
          setCreatedAtIso(iso)
        } catch {}
      } finally {
        creatingRef.current = false
      }
    })()
  }, [isOpen, isListing, activeSid, forcedNew])

  // 새 대화 트리거 시 세션 생성
  useEffect(() => {
    if (!isOpen) return
    if (isListing) return
    if (!forcedNew) return
    if (creatingRef.current) return
    creatingRef.current = true
    ;(async () => {
      try {
        const id = await ensureChatSession(null)
        setActiveSid(id)
        setForcedNew(false)
        try {
          const iso = await getChatSessionCreatedAt(id)
          setCreatedAtIso(iso)
        } catch {}
      } finally {
        creatingRef.current = false
      }
    })()
  }, [isOpen, isListing, forcedNew])

  // 세션 변경 시 생성시각 조회
  useEffect(() => {
    if (!activeSid) return
    ;(async () => {
      try {
        const iso = await getChatSessionCreatedAt(activeSid)
        setCreatedAtIso(iso)
      } catch {
        setCreatedAtIso(null)
      }
    })()
  }, [activeSid])

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

  // 초기 로드 시와 챗봇 열림 시에만 읽지 않은 메시지 수 로드
  useEffect(() => {
    void refreshUnreadCount()
  }, [refreshUnreadCount])

  // 챗봇 열릴 때만 다시 로드
  useEffect(() => {
    if (isOpen) {
      void refreshUnreadCount()
    }
  }, [isOpen, refreshUnreadCount])

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
    if (!activeSid) return null
    const found = initialDbSessions?.find((s) => s.id === activeSid)
    return found ?? null
  })()

  const conversationTitle = formatKoreanDateTime(createdAtIso ?? activeSessionMeta?.createdAt ?? undefined)

  return (
    <>
      {/* 플로팅 버튼 */}
      <div className="fixed bottom-6 right-4 z-[60]">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={isOpen}
          aria-label={isOpen ? '고객지원 닫기' : '고객지원 열기'}
          aria-describedby={totalUnread > 0 ? 'unread-count' : undefined}
          className="relative h-16 w-16 rounded-full shadow-lg border bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-800 transition-all duration-300 ease-out"
        >
          <div className="relative w-8 h-8 overflow-hidden">
            <div 
              className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-in-out ${
                isOpen ? '-translate-y-full' : 'translate-y-0'
              }`}
            >
              <MessageCircle size={26} aria-hidden="true" />
            </div>
            <div 
              className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-in-out ${
                isOpen ? 'translate-y-0' : 'translate-y-full'
              }`}
            >
              <ChevronDown size={26} aria-hidden="true" />
            </div>
          </div>
          {totalUnread > 0 && (
            <span
              id="unread-count"
              aria-label={`읽지 않은 메시지 ${totalUnread}건`}
              className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs font-semibold flex items-center justify-center shadow"
              role="status"
            >
              <span className="sr-only">읽지 않은 메시지 </span>
              {totalUnread > 99 ? '99+' : totalUnread}
              <span className="sr-only">건</span>
            </span>
          )}
        </button>
      </div>

      {/* 모바일 전체화면 */}
      {isMobile && isOpen && (
        <div className={`fixed inset-0 bg-white z-[60] flex flex-col transition-transform duration-300 ease-in-out ${
          isClosing ? 'translate-y-full' : isOpening ? 'translate-y-full' : 'translate-y-0'
        }`}>
          {/* 모바일 헤더 */}
          <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
            <div className="relative flex-1 min-w-0 h-8 flex items-center">
              {/* 목록 타이틀 */}
              <div
                className={`absolute inset-0 flex items-center gap-3 transition-all duration-300 ${
                  isListing ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 pointer-events-none'
                }`}
                aria-hidden={!isListing}
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center ml-2">
                  <MessageCircle size={18} className="text-blue-600" />
                </div>
                <h1 className="font-semibold text-lg">고객지원 챗봇</h1>
              </div>

              {/* 대화 타이틀 + 뒤로가기 */}
              <div
                className={`absolute inset-0 flex items-center gap-3 transition-all duration-300 ${
                  !isListing ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0 pointer-events-none'
                }`}
                aria-hidden={isListing}
              >
                <button
                  onClick={() => setIsListing(true)}
                  className="p-2 hover:bg-gray-100 rounded-full -ml-2"
                  aria-label="대화 목록으로 돌아가기"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageCircle size={18} className="text-blue-600" />
                </div>
                <div>
                  <h1 className="font-semibold text-lg truncate" title={conversationTitle}>
                    {conversationTitle}
                  </h1>
                  <p className="text-xs text-gray-500">온라인</p>
                </div>
              </div>
            </div>

            <button
              onClick={close}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
              aria-label="챗봇 닫기"
            >
              <ChevronDown size={20} />
            </button>
          </header>

          {/* 메인 콘텐츠 */}
          <main className="flex-1 overflow-hidden">
            <div 
              id="chat-dialog-description" 
              className="sr-only"
            >
              {isListing 
                ? '이전 대화 목록을 보거나 새 대화를 시작할 수 있습니다.'
                : '고객지원 대화 창입니다. 메시지를 입력하거나 빠른 메뉴를 사용할 수 있습니다.'
              }
            </div>
            <div className="h-full overflow-hidden">
              {isListing ? (
                <ChatSessionList
                  initialDbSessions={initialDbSessions}
                  onSelect={(id) => {
                    setActiveSid(id)
                    setForcedNew(false)
                    setIsListing(false)
                  }}
                  onNew={() => {
                    setForcedNew(true)
                    setActiveSid(null)
                    setIsListing(false)
                  }}
                />
              ) : (
                <div className="h-full overflow-auto" role="log" aria-live="polite" aria-label="대화 내용">
                  <ChatWindow activeSessionId={activeSid} forceNew={forcedNew} onReadStatusChanged={refreshUnreadCount} />
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* 데스크톱 패널 */}
      {!isMobile && (
        <div 
          className={`fixed bottom-24 right-4 z-[59] w-[min(420px,90vw)] h-[min(70vh,500px)] bg-white border rounded-lg shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen 
              ? 'translate-y-0 opacity-100 pointer-events-auto' 
              : 'translate-y-4 opacity-0 pointer-events-none'
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-dialog-title"
          aria-describedby="chat-dialog-description"
        >
          <header className="flex items-center justify-between px-2 py-2 border-b bg-neutral-50">
            <div className="relative flex-1 min-w-0 h-8">
              {/* 목록 타이틀 */}
              <div
                className={`absolute inset-0 flex items-center gap-1 transition-all duration-300 ${
                  isListing ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 pointer-events-none'
                }`}
                aria-hidden={!isListing}
              >
                <h1 id="chat-dialog-title" className="pl-2 text-lg font-semibold">고객지원 챗봇</h1>
              </div>

              {/* 대화 타이틀 + 뒤로가기 */}
              <div
                className={`absolute inset-0 flex items-center gap-1 transition-all duration-300 ${
                  !isListing ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0 pointer-events-none'
                }`}
                aria-hidden={isListing}
              >
                <button
                  onClick={() => setIsListing(true)}
                  className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 transition-colors"
                  aria-label="대화 목록으로 돌아가기"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <h1 id="chat-dialog-title" className="truncate text-lg font-semibold" title={conversationTitle}>
                  {conversationTitle}
                </h1>
              </div>
            </div>
          </header>
          <main className="flex-1 p-2 overflow-hidden">
            <div 
              id="chat-dialog-description" 
              className="sr-only"
            >
              {isListing 
                ? '이전 대화 목록을 보거나 새 대화를 시작할 수 있습니다.'
                : '고객지원 대화 창입니다. 메시지를 입력하거나 빠른 메뉴를 사용할 수 있습니다.'
              }
            </div>
            <div className="h-full overflow-hidden">
              {isListing ? (
                <ChatSessionList
                  initialDbSessions={initialDbSessions}
                  onSelect={(id) => {
                    setActiveSid(id)
                    setForcedNew(false)
                    setIsListing(false)
                  }}
                  onNew={() => {
                    setForcedNew(true)
                    setActiveSid(null)
                    setIsListing(false)
                  }}
                />
              ) : (
                <div className="h-full overflow-auto" role="log" aria-live="polite" aria-label="대화 내용">
                  <ChatWindow activeSessionId={activeSid} forceNew={forcedNew} onReadStatusChanged={refreshUnreadCount} />
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </>
  )
}


