'use client'

import { useEffect, useState, useCallback } from 'react'
import { getWaitingLiveChatSessions, connectToLiveChat, endLiveChat, getLiveChatMessages, sendLiveChatMessage } from './actions'

type LiveChatSession = {
  id: string
  chat_session_id: string
  customer_name: string
  customer_contact: string
  status: string
  created_at: string
  session_created_at: string
}
type ChatMessage = Awaited<ReturnType<typeof getLiveChatMessages>>[number]

export default function LiveChatAdminPage() {
  const [waitingSessions, setWaitingSessions] = useState<LiveChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<LiveChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const loadWaitingSessions = useCallback(async () => {
    try {
      const sessions = await getWaitingLiveChatSessions()
      setWaitingSessions(sessions)
    } catch (error) {
      console.error('Failed to load waiting sessions:', error)
    }
  }, [])

  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const chatMessages = await getLiveChatMessages(sessionId)
      setMessages(chatMessages)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }, [])

  useEffect(() => {
    void loadWaitingSessions()
    
    // 5초마다 대기 세션 목록 새로고침
    const interval = setInterval(() => {
      void loadWaitingSessions()
    }, 5000)
    setRefreshInterval(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [loadWaitingSessions])

  useEffect(() => {
    if (selectedSession) {
      void loadMessages(selectedSession.chat_session_id)
      
      // 선택된 세션의 메시지 2초마다 새로고침
      const interval = setInterval(() => {
        void loadMessages(selectedSession.chat_session_id)
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [selectedSession, loadMessages])

  const handleConnect = async (session: LiveChatSession) => {
    setLoading(true)
    try {
      await connectToLiveChat(session.id, 'admin-agent') // 임시 에이전트 ID
      setSelectedSession(session)
      await loadWaitingSessions() // 목록에서 제거
      await loadMessages(session.chat_session_id)
    } catch (error) {
      console.error('Failed to connect to session:', error)
      alert('연결에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedSession) return

    setLoading(true)
    try {
      await sendLiveChatMessage({
        sessionId: selectedSession.chat_session_id,
        role: 'assistant',
        text: newMessage,
        agentId: 'admin-agent'
      })
      setNewMessage('')
      await loadMessages(selectedSession.chat_session_id)
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('메시지 전송에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleEndChat = async () => {
    if (!selectedSession) return
    
    setLoading(true)
    try {
      await endLiveChat(selectedSession.id)
      setSelectedSession(null)
      setMessages([])
      await loadWaitingSessions()
    } catch (error) {
      console.error('Failed to end chat:', error)
      alert('채팅 종료에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">실시간 상담 관리</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[80vh]">
        {/* 대기 중인 상담 목록 */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">대기 중인 상담 ({waitingSessions.length})</h2>
            <button 
              onClick={loadWaitingSessions}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              새로고침
            </button>
          </div>
          
          <div className="space-y-2 max-h-[calc(100%-3rem)] overflow-y-auto">
            {waitingSessions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                대기 중인 상담이 없습니다.
              </div>
            ) : (
              waitingSessions.map((session) => (
                <div key={session.id} className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{session.customer_name}</div>
                    <div className="text-xs text-gray-500">
                      {formatTime(session.created_at)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    연락처: {session.customer_contact}
                  </div>
                  <div className="text-sm">
                    상태: <span className="text-orange-600">대기 중</span>
                  </div>
                  <button
                    onClick={() => handleConnect(session)}
                    disabled={loading}
                    className="w-full px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    상담 시작
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 활성 상담 창 */}
        <div className="border rounded-lg p-4 flex flex-col">
          {selectedSession ? (
            <>
              <div className="flex items-center justify-between mb-4 pb-2 border-b">
                <div>
                  <div className="font-medium">{selectedSession.customer_name}</div>
                  <div className="text-sm text-gray-500">{selectedSession.customer_contact}</div>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">연결됨</span>
                  </div>
                  <button
                    onClick={handleEndChat}
                    className="px-3 py-1 text-sm border border-red-500 text-red-500 rounded hover:bg-red-50"
                  >
                    상담 종료
                  </button>
                </div>
              </div>

              {/* 메시지 목록 */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 p-2 bg-gray-50 rounded">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      message.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-gray-900 border'
                    }`}>
                      <div>{message.text}</div>
                      <div className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {formatTime(message.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 메시지 입력 */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 border rounded px-3 py-2"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                  전송
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              상담을 선택해주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}