'use client'

import { useState } from 'react'
import { createLiveChatSession } from '@/domains/chatbot/actions'

interface AgentConnectFormProps {
  sessionId: string
  onSubmit: (liveChatId: string) => void
}

export default function AgentConnectForm({ sessionId, onSubmit }: AgentConnectFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    inquiryType: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.contact || !formData.inquiryType || !formData.description) {
      setError('모든 필드를 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { liveChatId } = await createLiveChatSession({
        chatSessionId: sessionId,
        customerName: formData.name,
        customerContact: formData.contact,
        inquiryType: formData.inquiryType,
        description: formData.description
      })
      onSubmit(liveChatId)
    } catch (err) {
      setError('상담원 연결 요청에 실패했습니다. 다시 시도해주세요.')
      console.error('Agent connect error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-start">
      <form 
        className="max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow bg-neutral-100 text-neutral-900 space-y-3 transition-all duration-300 ease-out" 
        onSubmit={handleSubmit}
      >
        <div className="font-medium">🧑‍💼 상담원 연결 요청</div>
        
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-neutral-600 mb-1">이름 *</label>
            <input
              type="text"
              className="w-full border rounded px-2 py-1 transition-all duration-200 ease-out focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              placeholder="홍길동"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-600 mb-1">연락처 *</label>
            <input
              type="text"
              className="w-full border rounded px-2 py-1 transition-all duration-200 ease-out focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              placeholder="010-1234-5678 또는 이메일"
              value={formData.contact}
              onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-600 mb-1">문의 유형 *</label>
            <select
              className="w-full border rounded px-2 py-1 transition-all duration-200 ease-out focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              value={formData.inquiryType}
              onChange={(e) => setFormData(prev => ({ ...prev, inquiryType: e.target.value }))}
              disabled={loading}
            >
              <option value="">선택해주세요</option>
              <option value="일반 문의">일반 문의</option>
              <option value="기술 지원">기술 지원</option>
              <option value="불편사항">불편사항</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-neutral-600 mb-1">문의 내용 *</label>
            <textarea
              className="w-full border rounded px-2 py-1 h-20 resize-none transition-all duration-200 ease-out focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              placeholder="상담받고 싶은 내용을 자세히 적어주세요"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={loading}
            />
          </div>

          {error && <div className="text-xs text-red-600">{error}</div>}

          <button 
            type="submit" 
            className="w-full px-3 py-1.5 rounded bg-black text-white text-sm disabled:bg-neutral-400 disabled:cursor-not-allowed transition-all duration-200 ease-out hover:bg-neutral-800 active:scale-95"
            disabled={loading}
          >
            {loading ? '연결 중...' : '상담원 연결 요청'}
          </button>
        </div>
      </form>
    </div>
  )
}