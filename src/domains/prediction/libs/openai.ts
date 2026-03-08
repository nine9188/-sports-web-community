// src/libs/openai.ts
import OpenAI from 'openai'

// lazy 초기화: 모듈 로드 시점이 아닌 실제 사용 시점에 생성
let _openai: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY 환경변수가 설정되지 않았습니다.')
    }
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return _openai
}

// 하위호환: 기존 import { openai } 코드 지원
export const openai = new Proxy({} as OpenAI, {
  get(_, prop) {
    return (getOpenAI() as any)[prop]
  },
})

// 비용 절약을 위한 최신 nano 모델 사용
export const DEFAULT_MODEL = 'gpt-5-nano'
