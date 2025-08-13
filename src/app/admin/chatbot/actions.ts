'use server'

import { createServerActionClient } from '@/shared/api/supabaseServer'

export type ChipIntentRow = {
  id: string
  intent: string
  title: string
  response_text: string
  response_mode: 'text' | 'form' | string
  is_active: boolean | null
  display_order: number | null
  updated_at: string | null
  created_at: string | null
}

export type ChipPatternRow = {
  id: string
  intent_id: string
  pattern_regex: string
  is_active: boolean | null
  created_at: string | null
}

export type ChipFormRow = {
  id: string
  intent_id: string
  form_json: unknown
  is_active: boolean | null
  updated_at: string | null
}

export async function listChipIntents(): Promise<ChipIntentRow[]> {
  const client = await createServerActionClient()
  const { data } = await (client as any)
    .from('chat_chip_intents')
    .select('*')
    .order('display_order', { ascending: true })
  return (data ?? []) as ChipIntentRow[]
}

export async function upsertChipIntent(row: Partial<ChipIntentRow>): Promise<string> {
  const client = await createServerActionClient()
  const payload = {
    id: row.id,
    intent: row.intent,
    title: row.title,
    response_text: row.response_text,
    response_mode: (row as any).response_mode ?? 'text',
    is_active: row.is_active ?? true,
    display_order: row.display_order ?? 0,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await (client as any)
    .from('chat_chip_intents')
    .upsert(payload)
    .select('id')
    .single()
  if (error) throw error
  return String((data as { id?: unknown } | null)?.id ?? '')
}

export async function deleteChipIntent(id: string) {
  const client = await createServerActionClient()
  await (client as any).from('chat_chip_patterns').delete().eq('intent_id', id)
  await (client as any).from('chat_chip_intents').delete().eq('id', id)
}

export async function listChipPatterns(intentId: string): Promise<ChipPatternRow[]> {
  const client = await createServerActionClient()
  const { data } = await (client as any)
    .from('chat_chip_patterns')
    .select('*')
    .eq('intent_id', intentId)
  return (data ?? []) as ChipPatternRow[]
}

export async function upsertChipPattern(row: Partial<ChipPatternRow>): Promise<string> {
  const client = await createServerActionClient()
  if (row.pattern_regex) {
    try {
       
      new RegExp(row.pattern_regex)
    } catch {
      throw new Error('유효하지 않은 정규식 패턴입니다')
    }
  }
  const { data, error } = await (client as any)
    .from('chat_chip_patterns')
    .upsert({
      id: row.id,
      intent_id: row.intent_id,
      pattern_regex: row.pattern_regex,
      is_active: row.is_active ?? true,
    })
    .select('id')
    .single()
  if (error) throw error
  return String((data as { id?: unknown } | null)?.id ?? '')
}

export async function deleteChipPattern(id: string) {
  const client = await createServerActionClient()
  await (client as any).from('chat_chip_patterns').delete().eq('id', id)
}

export async function getChipForm(intentId: string): Promise<ChipFormRow | null> {
  const client = await createServerActionClient()
  const { data } = await (client as any)
    .from('chat_chip_forms')
    .select('*')
    .eq('intent_id', intentId)
    .single()
  return (data as ChipFormRow) ?? null
}

export async function upsertChipForm(row: Partial<ChipFormRow>): Promise<string> {
  const client = await createServerActionClient()
  const { data, error } = await (client as any)
    .from('chat_chip_forms')
    .upsert({
      id: row.id,
      intent_id: row.intent_id,
      form_json: row.form_json ?? { type: 'usage_inquiry' },
      is_active: row.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error) throw error
  return String((data as { id?: unknown } | null)?.id ?? '')
}


