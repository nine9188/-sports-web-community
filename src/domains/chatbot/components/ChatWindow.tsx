"use client"

import SuggestionForm from './forms/SuggestionForm'
import ReportForm from './forms/ReportForm'
import DeleteRequestForm from './forms/DeleteRequestForm'
import BugReportForm from './forms/BugReportForm'
import AgentConnectForm from './forms/AgentConnectForm'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, memo } from 'react'
import { saveClientMessage, addAssistantBundle, markAssistantSeen, getOrInitMessages, markAllAssistantAsRead, replyWithRouting, isLiveChatActive, listMessages } from '@/domains/chatbot/actions'

type Intent = 'suggestion' | 'report_member' | 'usage_inquiry' | 'delete_request' | 'bug_report' | 'community_guidelines' | 'agent_connect'
type FollowUpAction = 'more_help' | 'end'
type ThreadItem =
  | { id: string; role: 'assistant' | 'user'; type: 'text'; text: string; createdAt: number }
  | { id: string; role: 'assistant'; type: 'form'; intent: Exclude<Intent, 'community_guidelines'>; submitted: boolean }
  | { id: string; role: 'assistant'; type: 'agent_connect'; status: 'connecting' | 'connected' | 'failed' }
  | { id: string; role: 'assistant'; type: 'typing' }

const GREETING = '안녕하세요, 스포츠 고객지원팀입니다. 도와드릴 일이 있나요?'

function generateId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return (crypto as { randomUUID: () => string }).randomUUID()
  return `id-${Math.random().toString(36).slice(2, 10)}`
}

// Memoized typing indicator component
const TypingIndicator = memo(() => (
  <div className="flex justify-start">
    <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow bg-neutral-100 text-neutral-900">
      <div className="flex items-center gap-1">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:0ms]" />
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:150ms]" />
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  </div>
))
TypingIndicator.displayName = 'TypingIndicator'

// Memoized message bubble component
const MessageBubble = memo<{
  message: Extract<ThreadItem, { type: 'text' }>
  isLastAssistant?: boolean
  showTime?: boolean
}>(({ message, isLastAssistant, showTime }: {
  message: Extract<ThreadItem, { type: 'text' }>
  isLastAssistant?: boolean
  showTime?: boolean
}) => {
  const isUser = message.role === 'user'
  const formatTime = useCallback((ts?: number) => {
    if (!ts) return ''
    const d = new Date(ts)
    const meridiem = d.getHours() < 12 ? '오전' : '오후'
    const h12 = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${meridiem} ${h12}:${m}`
  }, [])

  return (
    <Fragment>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm shadow transition-all duration-300 ease-out animate-in slide-in-from-bottom-2 fade-in ${
          isUser ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-900'
        }`}>
          {message.text}
        </div>
      </div>
      {!isUser && isLastAssistant && showTime && (
        <div className="mt-1 flex justify-start">
          <span className="text-[11px] text-neutral-400">
            {formatTime(message.createdAt)}
          </span>
        </div>
      )}
    </Fragment>
  )
})
MessageBubble.displayName = 'MessageBubble'

export default function ChatWindow(props: { activeSessionId?: string | null; forceNew?: boolean; onReadStatusChanged?: () => void }) {
  const { activeSessionId, forceNew, onReadStatusChanged } = props
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const quickSuggestions = useMemo(
    () => [
      { label: '커뮤니티 규정 문의', intent: 'community_guidelines' },
      { label: '의견 제안하기', intent: 'suggestion' },
      { label: '회원 신고하기', intent: 'report_member' },
      { label: '커뮤니티 이용 문의', intent: 'usage_inquiry' },
      { label: '게시글/댓글 삭제 요청', intent: 'delete_request' },
      { label: '버그 제보', intent: 'bug_report' },
      { label: '🧑‍💼 상담원과 대화', intent: 'agent_connect' },
    ],
    []
  )

  const [activeId, setActiveId] = useState<string | null>(null)
  const [thread, setThread] = useState<ThreadItem[]>([])
  const [showQuickMenu, setShowQuickMenu] = useState(false)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const [isAgentConnected, setIsAgentConnected] = useState(false)
  const AI_ENABLED = true
  const initialLoadDoneRef = useRef(false)
  const timeoutsRef = useRef<number[]>([])
  const syncingRef = useRef(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const enqueueTimeout = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    timeoutsRef.current.push(id)
  }, [])

  const runTypingSequence = useCallback((params: { mainText: string; followUpText?: string; onMainDone?: () => void; onFollowUpDone?: () => void }) => {
    const typingMainId = generateId()
    setThread((prev) => [...prev, { id: typingMainId, role: 'assistant', type: 'typing' }])
    enqueueTimeout(() => {
      setThread((prev) =>
        prev.map((m) => (m.id === typingMainId && m.type === 'typing' ? { id: typingMainId, role: 'assistant', type: 'text', text: params.mainText, createdAt: Date.now() } : m))
      )
      if (params.onMainDone) params.onMainDone()
      if (params.followUpText) {
        const typingFollowId = generateId()
        setThread((prev) => [...prev, { id: typingFollowId, role: 'assistant', type: 'typing' }])
        enqueueTimeout(() => {
          setThread((prev) =>
            prev.map((m) => (m.id === typingFollowId && m.type === 'typing' ? { id: typingFollowId, role: 'assistant', type: 'text', text: params.followUpText!, createdAt: Date.now() } : m))
          )
          if (params.onFollowUpDone) params.onFollowUpDone()
        }, 600)
      }
    }, 700)
  }, [enqueueTimeout])

  const syncSeen = useCallback(async () => {
    if (!activeId) return
    if (syncingRef.current) return
    syncingRef.current = true
    try {
      await markAllAssistantAsRead({ sessionId: activeId })
      // 읽음 처리 완료 후 SupportWidget에 알림
      if (onReadStatusChanged) {
        onReadStatusChanged()
      }
    } finally {
      syncingRef.current = false
    }
  }, [activeId, onReadStatusChanged])

  // 실시간 메시지 업데이트 함수
  const updateMessagesFromDB = useCallback(async () => {
    if (!activeId) return
    try {
      const messages = await listMessages({ sessionId: activeId })
      const mapped = messages.map((m) => ({ 
        id: m.id, 
        role: m.role, 
        type: 'text' as const, 
        text: m.text, 
        createdAt: Date.parse(m.createdAt) || Date.now() 
      }))
      
      // 기존 메시지와 비교해서 새로운 메시지만 추가
      setThread((prevThread) => {
        const existingIds = new Set(prevThread.filter(t => t.type === 'text').map(t => t.id))
        const newMessages = mapped.filter(m => !existingIds.has(m.id))
        
        if (newMessages.length > 0) {
          // 새 메시지가 있으면 전체 메시지로 교체 (순서 보장)
          const nonTextItems = prevThread.filter(t => t.type !== 'text')
          return [...mapped, ...nonTextItems]
        }
        return prevThread
      })
    } catch (error) {
      console.error('Failed to update messages:', error)
    }
  }, [activeId])

  // 상담원 연결 시 폴링 시작
  useEffect(() => {
    if (isAgentConnected && activeId) {
      // 3초마다 메시지 업데이트
      pollingIntervalRef.current = setInterval(updateMessagesFromDB, 3000)
    } else {
      // 폴링 중지
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [isAgentConnected, activeId, updateMessagesFromDB])

  // 초기 로드: SupportWidget에서 생성/선택한 세션 id가 주어졌을 때만 로드
  useEffect(() => {
    const load = async () => {
      const id = activeSessionId ?? null
      if (!id) return
      
      setActiveId(id)
      
      try {
        const { messages, assistantCount } = await getOrInitMessages({ sessionId: id, greeting: GREETING })
        await markAssistantSeen({ sessionId: id, seenCount: assistantCount })
        
        if (messages.length === 0) {
          // 메시지가 없으면 greeting 생성
          setThread([])
          setShowQuickMenu(false)
          setShowFollowUp(false)
          setIsClosed(false)
          runTypingSequence({ mainText: GREETING, onMainDone: () => { setShowQuickMenu(true); void syncSeen() } })
        } else if (messages.length === 1 && messages[0].role === 'assistant' && !messages[0].readAt) {
          // 첫 방문: 타이핑은 보여주되 즉시 읽음 처리하여 재방문 시 재타이핑 방지
          setThread([])
          setShowQuickMenu(false)
          setShowFollowUp(false)
          setIsClosed(false)
          runTypingSequence({ mainText: messages[0].text, onMainDone: () => { setShowQuickMenu(true); void syncSeen() } })
        } else {
          // 기존 대화 있음
          const mapped = messages.map((m) => ({ id: m.id, role: m.role, type: 'text' as const, text: m.text, createdAt: Date.parse(m.createdAt) || Date.now() }))
          setThread(mapped)
          
          // 상담원 연결 상태 확인
          const isConnected = await isLiveChatActive(id)
          setIsAgentConnected(isConnected)
          
          const lastAssistant = [...mapped].reverse().find((x) => x.type === 'text' && x.role === 'assistant') as Extract<ThreadItem, { type: 'text' }> | undefined
          const endedWithHelp = lastAssistant?.text === '도움이 되셨나요?'
          const closedByText = lastAssistant?.text === '상담을 종료했습니다. 언제든지 다시 문의해 주세요.'
          const agentConnectedMessage = lastAssistant?.text?.includes('상담원이 연결되었습니다') || lastAssistant?.text?.includes('상담원과 연결해드리겠습니다')
          
          // 상담원 연결 상태에 따라 UI 조정
          if (isConnected || agentConnectedMessage) {
            setShowFollowUp(false)
            setShowQuickMenu(false)
            setIsClosed(false)
          } else {
            setShowFollowUp(Boolean(endedWithHelp))
            setShowQuickMenu(!endedWithHelp && !closedByText)
            setIsClosed(Boolean(closedByText))
          }
          
          void syncSeen()
        }
      } catch (error) {
        console.error('Failed to load messages:', error)
        // 에러 시 기본 greeting 표시
        setThread([])
        setShowQuickMenu(false)
        setShowFollowUp(false)
        setIsClosed(false)
        runTypingSequence({ mainText: GREETING, onMainDone: () => { setShowQuickMenu(true); void syncSeen() } })
      }
    }
    
    // activeSessionId나 forceNew가 변경될 때마다 로드
    if (activeSessionId) {
      initialLoadDoneRef.current = false
      if (!initialLoadDoneRef.current) {
        initialLoadDoneRef.current = true
        void load()
      }
    }
  }, [activeSessionId, forceNew, runTypingSequence, syncSeen])

  // 스크롤 하단 고정
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [thread])

  // cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id))
      timeoutsRef.current = []
    }
  }, [])

  

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    if (!activeId) return
    
    const ts = Date.now()
    setThread((prev) => [...prev, { id: generateId(), role: 'user', type: 'text', text: input, createdAt: ts }])
    await saveClientMessage({ sessionId: activeId, role: 'user', text: input, createdAt: ts })
    
    // 상담원 연결 상태 확인
    const isConnected = await isLiveChatActive(activeId)
    setIsAgentConnected(isConnected)
    
    if (isConnected) {
      // 상담원이 연결된 경우 AI 응답 없이 메시지만 저장
      setInput('')
      return
    }
    
    // AI 칩 라우팅 답변 (상담원 연결되지 않은 경우만)
    setShowQuickMenu(false)
    setShowFollowUp(false)
    setIsClosed(false)
    const typingId = generateId()
    setThread((prev) => [...prev, { id: typingId, role: 'assistant', type: 'typing' }])
    try {
      const { reply, intent, responseMode } = await replyWithRouting({ sessionId: activeId, userText: input })
      if (responseMode === 'form' && intent && intent !== 'community_guidelines') {
        // 폼의 경우: 타이핑 → 텍스트 메시지 → 폼 순서로 표시
        setThread((prev) => prev.map((m) => (m.id === typingId ? { id: typingId, role: 'assistant', type: 'text', text: reply, createdAt: Date.now() } : m)))
        
        // 700ms 후 폼 추가 (자연스러운 딜레이)
        enqueueTimeout(() => {
          const formId = generateId()
          setThread((prev) => [...prev, { id: formId, role: 'assistant', type: 'form', intent: intent as Exclude<Intent, 'community_guidelines'>, submitted: false }])
        }, 700)
      } else {
        setThread((prev) => prev.map((m) => (m.id === typingId ? { id: typingId, role: 'assistant', type: 'text', text: reply, createdAt: Date.now() } : m)))
      }
      setShowFollowUp(true)
      void syncSeen()
    } catch {
      setThread((prev) => prev.filter((m) => m.id !== typingId))
    }
    setInput('')
  }, [input, activeId, syncSeen, enqueueTimeout])

  // NOTE: kept for future use if we switch back to DB reload after actions
  // const reloadMessages = useCallback(async (sessionId: string) => {
  //   const msgs = await listMessages({ sessionId })
  //   setThread(msgs.map((m) => ({ id: m.id, role: m.role, type: 'text' as const, text: m.text, createdAt: Date.parse(m.createdAt) || Date.now() })))
  // }, [])

  const handleQuickSend = useCallback((label: string, intent?: Intent) => {
    if (!activeId) return
    const now = Date.now()
    setThread((prev) => [...prev, { id: generateId(), role: 'user', type: 'text', text: label, createdAt: now }])
    void saveClientMessage({ sessionId: activeId, role: 'user', text: label, createdAt: now })
    if (intent === 'community_guidelines') {
      ;(async () => {
        // 서버 저장은 비동기로 수행하고, UI는 타이핑 → 텍스트로 순차 노출
        void addAssistantBundle({
          sessionId: activeId,
          mainText: '커뮤니티 규정은 공지사항에서 확인하실 수 있어요. 특정 사례가 있다면 링크와 함께 알려주세요.',
          includeFollowUp: true,
        })
        setShowQuickMenu(false)
        setShowFollowUp(false)
        runTypingSequence({
          mainText: '커뮤니티 규정은 공지사항에서 확인하실 수 있어요. 특정 사례가 있다면 링크와 함께 알려주세요.',
          followUpText: '도움이 되셨나요?',
          onFollowUpDone: () => { setShowFollowUp(true); void syncSeen() },
        })
      })()
      setShowQuickMenu(false)
      setIsClosed(false)
      return
    }
    if (intent === 'agent_connect') {
      // 상담원 연결: 타이핑 → 응답 → 폼
      setShowQuickMenu(false)
      setIsClosed(false)
      runTypingSequence({
        mainText: '상담원 연결을 위한 정보를 입력해주세요.',
        onMainDone: () => {
          enqueueTimeout(() => {
            setThread((prev) => [...prev, { id: generateId(), role: 'assistant', type: 'form', intent: 'agent_connect', submitted: false }])
          }, 700)
        }
      })
      return
    }
    // 다른 폼들도 자연스럽게 표시
    const formIntent = (intent ?? 'usage_inquiry') as Exclude<Intent, 'community_guidelines' | 'agent_connect'>
    const responseMessages: Record<string, string> = {
      'suggestion': '제안사항을 작성해주세요.',
      'report_member': '신고 내용을 작성해주세요.',
      'usage_inquiry': '이용 문의 내용을 작성해주세요.',
      'delete_request': '삭제 요청 내용을 작성해주세요.',
      'bug_report': '버그 내용을 자세히 알려주세요.'
    }
    
    setShowQuickMenu(false)
    setIsClosed(false)
    runTypingSequence({
      mainText: responseMessages[formIntent] || '필요한 정보를 입력해주세요.',
      onMainDone: () => {
        enqueueTimeout(() => {
          setThread((prev) => [...prev, { id: generateId(), role: 'assistant', type: 'form', intent: formIntent, submitted: false }])
        }, 700)
      }
    })
  }, [activeId, runTypingSequence, syncSeen, enqueueTimeout])

  const handleFollowUp = useCallback((action: FollowUpAction) => {
    if (!activeId) return
    if (action === 'more_help') {
      ;(async () => {
        void addAssistantBundle({ sessionId: activeId, mainText: '어떤 도움이 필요하신가요?', includeFollowUp: false })
      setShowFollowUp(false)
        runTypingSequence({ mainText: '어떤 도움이 필요하신가요?', onMainDone: () => { setShowQuickMenu(true); void syncSeen() } })
      })()
      return
    }
    ;(async () => {
      void addAssistantBundle({ sessionId: activeId, mainText: '상담을 종료했습니다. 언제든지 다시 문의해 주세요.', includeFollowUp: false })
    setShowFollowUp(false)
      runTypingSequence({ mainText: '상담을 종료했습니다. 언제든지 다시 문의해 주세요.', onMainDone: () => { setShowQuickMenu(false); void syncSeen() } })
    setIsClosed(true)
    })()
  }, [activeId, runTypingSequence, syncSeen])

  const renderForm = useCallback((item: Extract<ThreadItem, { type: 'form' }>) => {
    const onSubmitted = () => {
      if (!activeId) return
      setThread((prev) => prev.map((x) => (x.id === item.id ? { ...item, submitted: true } : x)))
      ;(async () => {
        void addAssistantBundle({ sessionId: activeId, mainText: '접수되었습니다. 빠르게 확인 후 도와드릴게요.', includeFollowUp: true })
        setShowQuickMenu(false)
        setShowFollowUp(false)
        runTypingSequence({
          mainText: '접수되었습니다. 빠르게 확인 후 도와드릴게요.',
          followUpText: '도움이 되셨나요?',
          onFollowUpDone: () => { setShowFollowUp(true); void syncSeen() },
        })
      })()
    }

    const onAgentConnectSubmitted = () => {
      if (!activeId) return
      setThread((prev) => prev.map((x) => (x.id === item.id ? { ...item, submitted: true } : x)))
      
      // 먼저 접수 메시지를 즉시 표시
      setShowQuickMenu(false)
      setShowFollowUp(false)
      runTypingSequence({
        mainText: '상담원 연결 요청이 접수되었습니다. 관리자가 확인 후 연결해드리겠습니다. 잠시만 기다려주세요...',
        onMainDone: () => {
          // 타이핑 완료 후 상담원 연결 상태 표시
          const connectId = generateId()
          setThread((prev) => [...prev, { id: connectId, role: 'assistant', type: 'agent_connect', status: 'connecting' }])
          
          ;(async () => {
            void addAssistantBundle({ 
              sessionId: activeId, 
              mainText: '상담원 연결 요청이 접수되었습니다. 관리자가 확인 후 연결해드리겠습니다. 잠시만 기다려주세요...', 
              includeFollowUp: false 
            })
            
            // 폴링 시작 - 관리자가 수락할 때까지 대기 상태 유지
            const checkConnectionStatus = async () => {
              try {
                const isConnected = await isLiveChatActive(activeId)
                if (isConnected) {
                  setThread((prev) => prev.map((x) => 
                    x.id === connectId ? { ...x, status: 'connected' } : x
                  ))
                  setIsAgentConnected(true)
                  void addAssistantBundle({ 
                    sessionId: activeId, 
                    mainText: '상담원이 연결되었습니다! 안녕하세요, 무엇을 도와드릴까요? 😊', 
                    includeFollowUp: false 
                  })
                  clearInterval(statusCheckInterval)
                }
              } catch (error) {
                console.error('Failed to check connection status:', error)
              }
            }
            
            // 5초마다 연결 상태 확인
            const statusCheckInterval = setInterval(checkConnectionStatus, 5000)
            
            // 5분 후 타임아웃
            setTimeout(() => {
              clearInterval(statusCheckInterval)
              setThread((prev) => prev.map((x) => 
                x.id === connectId ? { ...x, status: 'failed' } : x
              ))
              void addAssistantBundle({ 
                sessionId: activeId, 
                mainText: '죄송합니다. 현재 상담원이 모두 바쁜 상태입니다. 나중에 다시 시도해주세요.', 
                includeFollowUp: true 
              })
            }, 300000) // 5분
          })()
        }
      })
    }
    
    if (item.submitted) return null
    switch (item.intent) {
      case 'suggestion':
        return <SuggestionForm onSubmit={onSubmitted} />
      case 'report_member':
        return <ReportForm onSubmit={onSubmitted} />
      case 'usage_inquiry':
        return (
          <div className="flex justify-start">
            <form className="max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow bg-neutral-100 text-neutral-900 space-y-2" onSubmit={(e)=>{e.preventDefault(); onSubmitted()}}>
              <div className="font-medium">이용 문의</div>
              <textarea className="w-full border rounded px-2 py-1" placeholder="문의 내용을 적어주세요" />
              <button type="submit" className="px-3 py-1.5 rounded bg-black text-white text-sm">제출</button>
            </form>
          </div>
        )
      case 'delete_request':
        return <DeleteRequestForm onSubmit={onSubmitted} />
      case 'bug_report':
        return <BugReportForm onSubmit={onSubmitted} />
      case 'agent_connect':
        return activeId ? <AgentConnectForm sessionId={activeId} onSubmit={onAgentConnectSubmitted} /> : null
      default:
        return null
    }
  }, [activeId, runTypingSequence, syncSeen])

  const rendered = useMemo(
    () => (
      <div className="space-y-3">
        {(() => {
          const lastAssistantIndex = (() => {
            for (let i = thread.length - 1; i >= 0; i -= 1) {
              const it = thread[i]
              if (it.type === 'text' && it.role === 'assistant') return i
            }
            return -1
          })()
          const formatTime = (ts?: number) => {
            if (!ts) return ''
            const d = new Date(ts)
            const meridiem = d.getHours() < 12 ? '오전' : '오후'
            const h12 = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12
            const m = String(d.getMinutes()).padStart(2, '0')
            return `${meridiem} ${h12}:${m}`
          }
          return thread.map((item, idx) => {
          if (item.type === 'text') {
            const isUser = item.role === 'user'
            return (
                <Fragment key={item.id}>
                  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm shadow transition-all duration-300 ease-out animate-in slide-in-from-bottom-2 fade-in ${isUser ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-900'}`}>
                  {item.text}
                </div>
              </div>
                  {!isUser && idx === lastAssistantIndex && (
                    <div className="mt-1 flex justify-start">
                      <span className="text-[11px] text-neutral-400">{formatTime(item.createdAt)}</span>
                    </div>
                  )}
                </Fragment>
              )
            }
            // form only
            if (item.type === 'form') return <div key={item.id} className="animate-in slide-in-from-bottom-3 fade-in duration-500 ease-out">{renderForm(item)}</div>
            // agent connect status
            if (item.type === 'agent_connect') {
              return (
                <div key={item.id} className="flex justify-start animate-in slide-in-from-bottom-2 fade-in duration-300 ease-out">
                  <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow bg-blue-50 text-blue-900 border border-blue-200 transition-all duration-300">
                    <div className="flex items-center gap-2">
                      {item.status === 'connecting' && (
                        <>
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span>상담원 연결 중...</span>
                        </>
                      )}
                      {item.status === 'connected' && (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span>상담원이 연결되었습니다</span>
                        </>
                      )}
                      {item.status === 'failed' && (
                        <>
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>연결에 실패했습니다</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            }
            return null
            
            
          })
        })()}

        {(() => {
          // typing bubbles
          return thread.map((item) => {
            if (item.type === 'typing') {
          return (
                <div key={item.id} className="flex justify-start animate-in slide-in-from-bottom-1 fade-in duration-200 ease-out">
                  <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow bg-neutral-100 text-neutral-900 transition-all duration-200">
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:0ms]" />
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:150ms]" />
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )
            }
            return null
          })
        })()}

        {showQuickMenu && (
          <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300 ease-out">
            {quickSuggestions.map((q, index) => (
              <button
                key={q.intent}
                type="button"
                onClick={() => handleQuickSend(q.label, q.intent as Intent)}
                className="px-3 py-1 rounded-full border bg-white hover:bg-neutral-50 active:scale-95 text-sm transition-all duration-200 ease-out hover:shadow-md"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {q.label}
              </button>
            ))}
          </div>
        )}

        {showFollowUp && !isClosed && (
          <div className="mt-2 flex flex-wrap gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300 ease-out">
            <button className="px-3 py-1 rounded-full border bg-white hover:bg-neutral-50 active:scale-95 text-sm transition-all duration-200 ease-out hover:shadow-md" onClick={() => handleFollowUp('more_help' as const)}>더 필요해요</button>
            <button className="px-3 py-1 rounded-full border bg-white hover:bg-neutral-50 active:scale-95 text-sm transition-all duration-200 ease-out hover:shadow-md" onClick={() => handleFollowUp('end' as const)}>충분해요</button>
          </div>
        )}
      </div>
    ),
    [thread, handleQuickSend, quickSuggestions, renderForm, showQuickMenu, handleFollowUp, isClosed, showFollowUp]
  )

  return (
    <div className="flex h-full gap-3">
      <div className="flex flex-1 flex-col gap-3">
      <div ref={scrollRef} className="flex-1 min-h-[240px] overflow-y-auto border rounded p-3 bg-white">
        {rendered}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={AI_ENABLED ? '메시지를 입력하세요' : '현재는 버튼/폼으로만 상담이 진행됩니다'}
          className="flex-1 border rounded px-3 py-2"
          disabled={!AI_ENABLED}
          readOnly={!AI_ENABLED}
        />
        <button type="submit" className="px-4 py-2 rounded bg-black text-white" disabled={!AI_ENABLED} aria-disabled={!AI_ENABLED}>전송</button>
      </form>
      </div>
    </div>
  )
}

