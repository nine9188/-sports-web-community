'use client'

import { useEffect, useMemo, useState } from 'react'
import { listChipIntents, upsertChipIntent, deleteChipIntent, listChipPatterns, upsertChipPattern, deleteChipPattern, getChipForm, upsertChipForm } from './actions'

type Intent = Awaited<ReturnType<typeof listChipIntents>>[number]
type Pattern = Awaited<ReturnType<typeof listChipPatterns>>[number]

export default function AdminChatbotPage() {
  const [intents, setIntents] = useState<Intent[]>([])
  const [selected, setSelected] = useState<Intent | null>(null)
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [loading, setLoading] = useState(false)
  const [testInput, setTestInput] = useState('')
  const [bulkInput, setBulkInput] = useState('')
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [formJson, setFormJson] = useState('{"type":"usage_inquiry"}')
  const [formError, setFormError] = useState<string | null>(null)
  const compiled = useMemo(() => {
    try {
      return patterns.filter((p) => p.is_active).map((p) => new RegExp(p.pattern_regex))
    } catch {
      return []
    }
  }, [patterns])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const rows = await listChipIntents()
        setIntents(rows)
        const first = rows[0] ?? null
        setSelected(first)
        if (first) setPatterns(await listChipPatterns(first.id))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const onSelect = async (it: Intent) => {
    setSelected(it)
    setPatterns(await listChipPatterns(it.id))
    const f = await getChipForm(it.id)
    setFormJson(JSON.stringify(f?.form_json ?? { type: 'usage_inquiry' }, null, 2))
  }

  const onSaveIntent = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const id = await upsertChipIntent(selected)
      const rows = await listChipIntents()
      setIntents(rows)
      const updated = rows.find((x) => x.id === id) ?? null
      setSelected(updated)
      const f = await getChipForm(id)
      setFormJson(JSON.stringify(f?.form_json ?? { type: 'usage_inquiry' }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const onAddIntent = () => {
    setSelected({ id: '', intent: '', title: '', response_text: '', response_mode: 'text', is_active: true, display_order: 0, created_at: null, updated_at: null })
    setPatterns([])
  }

  const onDeleteIntent = async () => {
    if (!selected?.id) return
    setLoading(true)
    try {
      await deleteChipIntent(selected.id)
      const rows = await listChipIntents()
      setIntents(rows)
      const first = rows[0] ?? null
      setSelected(first)
      setPatterns(first ? await listChipPatterns(first.id) : [])
      setFormJson(first ? JSON.stringify((await getChipForm(first.id))?.form_json ?? { type: 'usage_inquiry' }, null, 2) : '{"type":"usage_inquiry"}')
    } finally {
      setLoading(false)
    }
  }

  const onSavePattern = async (p: Pattern) => {
    setLoading(true)
    try {
      await upsertChipPattern(p)
      setPatterns(await listChipPatterns(p.intent_id))
    } finally {
      setLoading(false)
    }
  }

  const onDeletePattern = async (p: Pattern) => {
    if (!p.id) return
    setLoading(true)
    try {
      await deleteChipPattern(p.id)
      setPatterns(await listChipPatterns(p.intent_id))
    } finally {
      setLoading(false)
    }
  }

  const testMatch = () => {
    const text = testInput.replace(/\s+/g, ' ').trim()
    const hit = compiled.some((re) => re.test(text))
    alert(hit ? '매칭됨' : '미매칭')
  }

  const onBulkAdd = async () => {
    setBulkError(null)
    if (!selected) return
    const intentId = selected.id
    const lines = bulkInput
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    if (lines.length === 0) return
    // 중복 제거 (기존 + 입력)
    const existing = new Set(patterns.map((p) => p.pattern_regex))
    const uniques = lines.filter((s) => !existing.has(s))
    // 유효성 검사
    try {
      for (const rx of uniques) {
         
        new RegExp(rx)
      }
    } catch {
      setBulkError('유효하지 않은 정규식이 포함되어 있습니다.')
      return
    }
    setLoading(true)
    try {
      for (const rx of uniques) {
         
        await upsertChipPattern({ intent_id: intentId, pattern_regex: rx, is_active: true })
      }
      setBulkInput('')
      setPatterns(await listChipPatterns(intentId))
    } finally {
      setLoading(false)
    }
  }

  const onSaveForm = async () => {
    setFormError(null)
    if (!selected) return
    let parsed: unknown
    try {
      parsed = JSON.parse(formJson)
    } catch {
      setFormError('유효한 JSON 형식이 아닙니다')
      return
    }
    setLoading(true)
    try {
      await upsertChipForm({ intent_id: selected.id, form_json: parsed, is_active: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">챗봇 칩 관리</h1>
      {loading && <div className="text-sm text-neutral-500">로딩 중…</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Intent 목록 */}
        <div className="border rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">의도 목록</div>
            <button className="px-2 py-1 text-sm rounded bg-black text-white" onClick={onAddIntent}>추가</button>
          </div>
          <div className="space-y-1 max-h-[60vh] overflow-auto">
            {intents.map((it) => (
              <button key={it.id} className={`w-full text-left px-2 py-1 rounded ${selected?.id===it.id?'bg-neutral-100':''}`} onClick={() => onSelect(it)}>
                <div className="text-sm font-medium">{it.title || it.intent}</div>
                <div className="text-xs text-neutral-500">{it.intent}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Intent 상세 */}
        <div className="border rounded p-3 space-y-2">
          <div className="font-medium">의도 편집</div>
          {selected ? (
            <div className="space-y-2">
              <input className="w-full border rounded px-2 py-1" placeholder="intent (영문 키)" value={selected.intent} onChange={(e)=>setSelected({...selected, intent:e.target.value})} />
              <input className="w-full border rounded px-2 py-1" placeholder="제목" value={selected.title} onChange={(e)=>setSelected({...selected, title:e.target.value})} />
              <div className="space-y-2">
                <div className="text-sm text-neutral-600">폼 정의(JSON)</div>
                <textarea className="w-full border rounded px-2 py-1 h-40 font-mono text-sm" value={formJson} onChange={(e)=>setFormJson(e.target.value)} />
                {formError && <div className="text-sm text-red-600">{formError}</div>}
                <button className="px-3 py-1.5 rounded bg-black text-white text-sm" onClick={onSaveForm}>폼 저장</button>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(selected.is_active)} onChange={(e)=>setSelected({...selected, is_active:e.target.checked})}/> 활성</label>
                <input type="number" className="w-24 border rounded px-2 py-1" placeholder="순서" value={selected.display_order ?? 0} onChange={(e)=>setSelected({...selected, display_order:Number(e.target.value)})} />
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded bg-black text-white text-sm" onClick={onSaveIntent}>저장</button>
                {selected.id && <button className="px-3 py-1.5 rounded border text-sm" onClick={onDeleteIntent}>삭제</button>}
              </div>
            </div>
          ) : (
            <div className="text-sm text-neutral-500">좌측에서 의도를 선택하거나 추가하세요.</div>
          )}
        </div>

        {/* 패턴 */}
        <div className="border rounded p-3 space-y-3">
          <div className="font-medium">패턴 ({selected?.title || selected?.intent || '-'})</div>

          {/* 대량 추가 */}
          <div className="space-y-2">
            <div className="text-sm text-neutral-600">한 줄에 하나의 정규식을 입력하세요.</div>
            <textarea
              className="w-full h-32 border rounded px-2 py-1 font-mono text-sm"
              placeholder={`예:\n신고|스팸|욕설\n규정\\s*위반\n버그|오류`}
              value={bulkInput}
              onChange={(e)=>setBulkInput(e.target.value)}
              disabled={!selected}
            />
            {bulkError && <div className="text-sm text-red-600">{bulkError}</div>}
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded bg-black text-white text-sm" onClick={onBulkAdd} disabled={!selected}>일괄 추가</button>
            </div>
          </div>

          {/* 기존 패턴 리스트 */}
          <div className="space-y-2 max-h-[38vh] overflow-auto border-t pt-2">
            {patterns.map((p, idx) => (
              <div key={`${p.id}-${idx}`} className="flex items-center gap-2">
                <input className="flex-1 border rounded px-2 py-1" placeholder="정규식" value={p.pattern_regex} onChange={(e)=>setPatterns(prev=>prev.map((x,i)=>i===idx?{...x, pattern_regex:e.target.value}:x))} />
                <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={Boolean(p.is_active)} onChange={(e)=>setPatterns(prev=>prev.map((x,i)=>i===idx?{...x, is_active:e.target.checked}:x))}/>활성</label>
                <button className="px-2 py-1 text-sm rounded border" onClick={()=>onSavePattern(patterns[idx])}>저장</button>
                {p.id && <button className="px-2 py-1 text-sm rounded border" onClick={()=>onDeletePattern(p)}>삭제</button>}
              </div>
            ))}
          </div>

          {/* 테스트 */}
          <div className="pt-2 border-t">
            <div className="font-medium mb-1">테스트</div>
            <div className="flex gap-2">
              <input className="flex-1 border rounded px-2 py-1" placeholder="예: 신고하고 싶어요" value={testInput} onChange={(e)=>setTestInput(e.target.value)} />
              <button className="px-2 py-1 text-sm rounded bg-black text-white" onClick={testMatch}>매칭 확인</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


