'use client'

import { useState } from 'react'

export default function BugReportForm({ onSubmit }: { onSubmit: (data: { description: string; screenshotUrl?: string }) => void }) {
  const [desc, setDesc] = useState('')
  const [screenshotUrl, setScreenshotUrl] = useState('')
  return (
    <div className="flex justify-start">
      <form className="max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow bg-neutral-100 text-neutral-900 space-y-2" onSubmit={(e)=>{e.preventDefault(); onSubmit({ description: desc, screenshotUrl })}}>
        <div className="font-medium">버그 제보</div>
        <textarea className="w-full border rounded px-2 py-1" placeholder="문제 현상을 설명해주세요" value={desc} onChange={(e)=>setDesc(e.target.value)} />
        <input className="w-full border rounded px-2 py-1" placeholder="스크린샷 URL (선택)" value={screenshotUrl} onChange={(e)=>setScreenshotUrl(e.target.value)} />
        <div className="text-xs text-neutral-600">브라우저: {typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'}</div>
        <button type="submit" className="px-3 py-1.5 rounded bg-black text-white text-sm hover:bg-neutral-800 active:scale-[0.99]">제출</button>
      </form>
    </div>
  )
}


