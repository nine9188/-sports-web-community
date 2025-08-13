// src/libs/openai.ts
import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// 비용 절약을 위한 최신 nano 모델 사용
export const DEFAULT_MODEL = 'gpt-5-nano'
