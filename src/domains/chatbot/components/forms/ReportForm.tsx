'use client'

import { useState } from 'react'
import { validateReportForm } from '../../utils/validation'

export default function ReportForm({ onSubmit }: { onSubmit: (data: { link: string; reason: string }) => void }) {
  const [link, setLink] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<{ link?: string; reason?: string }>({})
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const validatedData = validateReportForm({ link, reason })
      setErrors({})
      onSubmit(validatedData)
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message
        if (errorMessage.includes('link')) {
          setErrors(prev => ({ ...prev, link: 'Valid URL is required' }))
        }
        if (errorMessage.includes('reason')) {
          setErrors(prev => ({ ...prev, reason: 'Reason must be at least 10 characters' }))
        }
      }
    }
  }
  
  return (
    <div className="flex justify-start">
      <form 
        className="max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow bg-neutral-100 text-neutral-900 space-y-2" 
        onSubmit={handleSubmit}
        role="form"
        aria-labelledby="report-form-title"
      >
        <div id="report-form-title" className="font-medium">회원 신고</div>
        
        <div>
          <label htmlFor="report-link" className="sr-only">게시글/프로필 링크</label>
          <input 
            id="report-link"
            className={`w-full border rounded px-2 py-1 ${
              errors.link ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="게시글/프로필 링크" 
            value={link} 
            onChange={(e) => setLink(e.target.value)}
            type="url"
            required
            aria-invalid={!!errors.link}
            aria-describedby={errors.link ? 'report-link-error' : undefined}
          />
          {errors.link && (
            <div id="report-link-error" className="text-red-500 text-xs mt-1" role="alert">
              {errors.link}
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="report-reason" className="sr-only">신고 사유</label>
          <textarea 
            id="report-reason"
            className={`w-full border rounded px-2 py-1 ${
              errors.reason ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="신고 사유" 
            value={reason} 
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={10}
            aria-invalid={!!errors.reason}
            aria-describedby={errors.reason ? 'report-reason-error' : undefined}
          />
          {errors.reason && (
            <div id="report-reason-error" className="text-red-500 text-xs mt-1" role="alert">
              {errors.reason}
            </div>
          )}
        </div>
        
        <button 
          type="submit" 
          className="px-3 py-1.5 rounded bg-black text-white text-sm hover:bg-neutral-800 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          disabled={!link.trim() || !reason.trim()}
        >
          제출
        </button>
      </form>
    </div>
  )
}


