'use client'

import { useState, useEffect } from 'react'
import { EMOTICON_MAP, EMOTICON_REGEX } from '@/domains/boards/constants/emoticons'
import { getAllEmoticonCodes } from '@/domains/boards/actions/emoticons'

interface EmoticonEntry {
  code: string
  url: string
  name: string
}

// 모듈 레벨 캐시 (한 번 로드 후 재사용)
let cachedMap: Map<string, EmoticonEntry> | null = null
let cachedRegex: RegExp | null = null
let loadPromise: Promise<void> | null = null

function buildRegex(entries: EmoticonEntry[]): RegExp {
  // 코드 길이 내림차순 정렬 (~emo10이 ~emo1보다 먼저 매칭)
  const sorted = [...entries].sort((a, b) => b.code.length - a.code.length)
  const escaped = sorted.map(e => e.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp(`(${escaped.join('|')})`, 'g')
}

async function loadFromDB() {
  if (cachedMap) return
  if (loadPromise) {
    await loadPromise
    return
  }

  loadPromise = (async () => {
    try {
      const codes = await getAllEmoticonCodes()
      if (codes.length > 0) {
        cachedMap = new Map(codes.map(c => [c.code, c]))
        cachedRegex = buildRegex(codes)
      }
    } catch {
      // DB 실패 시 정적 fallback 유지
    }
  })()

  await loadPromise
}

/**
 * 동적 이모티콘 맵/정규식을 반환하는 훅
 * DB에서 모든 활성 이모티콘을 로드하여 캐시
 * 로드 전에는 정적 상수(기본 3팩)를 fallback으로 사용
 */
export function useEmoticonMap() {
  const [map, setMap] = useState<Map<string, EmoticonEntry>>(
    // 정적 맵을 EmoticonEntry 형태로 변환
    () => {
      if (cachedMap) return cachedMap
      const staticMap = new Map<string, EmoticonEntry>()
      EMOTICON_MAP.forEach((v, k) => {
        staticMap.set(k, { code: v.code, url: v.url, name: v.name })
      })
      return staticMap
    }
  )
  const [regex, setRegex] = useState<RegExp>(() => cachedRegex ?? EMOTICON_REGEX)

  useEffect(() => {
    if (cachedMap) {
      setMap(cachedMap)
      if (cachedRegex) setRegex(cachedRegex)
      return
    }

    loadFromDB().then(() => {
      if (cachedMap) setMap(cachedMap)
      if (cachedRegex) setRegex(cachedRegex)
    })
  }, [])

  return { emoticonMap: map, emoticonRegex: regex }
}
