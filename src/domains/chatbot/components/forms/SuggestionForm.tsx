'use client'

import { useState } from 'react'
import { validateSuggestionForm } from '../../utils/validation'

export default function SuggestionForm({ onSubmit }: { onSubmit: (data: { title: string; detail: string }) => void }) {
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [errors, setErrors] = useState<{ title?: string; detail?: string }>({})
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const validatedData = validateSuggestionForm({ title, detail })
      setErrors({})
      onSubmit(validatedData)
    } catch (error) {
      if (error instanceof Error) {
        // Parse validation errors
        const errorMessage = error.message
        if (errorMessage.includes('title')) {
          setErrors(prev => ({ ...prev, title: 'Title is required' }))
        }
        if (errorMessage.includes('detail')) {
          setErrors(prev => ({ ...prev, detail: 'Detail must be at least 10 characters' }))
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
        aria-labelledby="suggestion-form-title"
      >
        <div id="suggestion-form-title" className="font-medium">의견 제안</div>
        
        <div>
          <label htmlFor="suggestion-title" className="sr-only">제목</label>
          <input 
            id="suggestion-title"
            className={`w-full border rounded px-2 py-1 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="제목" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            required
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'suggestion-title-error' : undefined}
          />
          {errors.title && (
            <div id="suggestion-title-error" className="text-red-500 text-xs mt-1" role="alert">
              {errors.title}
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="suggestion-detail" className="sr-only">자세한 내용</label>
          <textarea 
            id="suggestion-detail"
            className={`w-full border rounded px-2 py-1 ${
              errors.detail ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="자세한 내용" 
            value={detail} 
            onChange={(e) => setDetail(e.target.value)}
            required
            minLength={10}
            aria-invalid={!!errors.detail}
            aria-describedby={errors.detail ? 'suggestion-detail-error' : undefined}
          />
          {errors.detail && (
            <div id="suggestion-detail-error" className="text-red-500 text-xs mt-1" role="alert">
              {errors.detail}
            </div>
          )}
        </div>
        
        <button 
          type="submit" 
          className="px-3 py-1.5 rounded bg-black text-white text-sm hover:bg-neutral-800 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          disabled={!title.trim() || !detail.trim()}
        >
          제출
        </button>
      </form>
    </div>
  )
}


