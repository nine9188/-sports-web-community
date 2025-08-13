'use client'

import { useState } from 'react'

export default function DeleteRequestForm({ onSubmit }: { onSubmit: (data: { link: string; reason: string; accountState: 'active'|'deactivated' }) => void }) {
  const [link, setLink] = useState('')
  const [reason, setReason] = useState('')
  const [accountState, setAccountState] = useState<'active'|'deactivated'>('active')
  return (
    <div className="flex justify-start">
      <form className="max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow bg-neutral-100 text-neutral-900 space-y-2" onSubmit={(e)=>{e.preventDefault(); onSubmit({ link, reason, accountState })}}>
        <div className="font-medium">게시글/댓글 삭제 요청</div>
        <input className="w-full border rounded px-2 py-1" placeholder="대상 링크" value={link} onChange={(e)=>setLink(e.target.value)} />
        <textarea className="w-full border rounded px-2 py-1" placeholder="사유" value={reason} onChange={(e)=>setReason(e.target.value)} />
        <div className="flex items-center gap-2">
          <label className="text-xs">계정 상태</label>
          <select className="border rounded px-2 py-1 text-sm" value={accountState} onChange={(e)=>setAccountState(e.target.value as 'active'|'deactivated')}>
            <option value="active">활성 계정</option>
            <option value="deactivated">탈퇴 계정</option>
          </select>
        </div>
        <button type="submit" className="px-3 py-1.5 rounded bg-black text-white text-sm hover:bg-neutral-800 active:scale-[0.99]">제출</button>
      </form>
    </div>
  )
}


