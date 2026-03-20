'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Container, ContainerContent } from '@/shared/components/ui'
import { SUBMISSION_LIMITS } from '@/domains/shop/types/emoticon-submission'

interface AccordionItemProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-black/5 dark:border-white/10 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors"
      >
        <span className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">{title}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-4 pb-3 text-xs leading-relaxed text-gray-600 dark:text-gray-300 space-y-1.5">
          {children}
        </div>
      )}
    </div>
  )
}

export default function GuideSection() {
  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerContent className="p-0">
        <AccordionItem title="이모티콘 등록 방법" defaultOpen>
          <p>1. &quot;등록 신청&quot; 탭에서 팩 이름, 설명, 이미지를 입력합니다.</p>
          <p>2. 대표 이미지 1개와 이모티콘 이미지 {SUBMISSION_LIMITS.EMOTICON_MIN}~{SUBMISSION_LIMITS.EMOTICON_MAX}개를 업로드합니다.</p>
          <p>3. 희망 가격을 선택하고 &quot;신청하기&quot; 버튼을 누릅니다.</p>
          <p>4. 관리자 검수 후 승인되면 상점에 등록됩니다.</p>
        </AccordionItem>

        <AccordionItem title="이미지 규격 안내">
          <p>· 파일 형식: PNG 또는 JPG</p>
          <p>· 권장 크기: 200 x 200 픽셀</p>
          <p>· 파일 크기: 500KB 이하</p>
          <p>· 배경: 투명(PNG) 권장</p>
          <p>· 대표 이미지와 이모티콘 이미지 규격은 동일합니다.</p>
        </AccordionItem>

        <AccordionItem title="검수 기준">
          <p>· 음란물, 폭력물은 즉시 거절 및 계정 정지 처리됩니다.</p>
          <p>· 타인의 저작물을 무단으로 사용한 경우 거절됩니다.</p>
          <p>· 해상도가 너무 낮거나 품질이 떨어지는 경우 거절될 수 있습니다.</p>
          <p>· 기존 팩과 지나치게 유사한 경우 거절될 수 있습니다.</p>
          <p>· 검수는 평일 기준으로 진행되며, 1~3일 정도 소요됩니다.</p>
        </AccordionItem>

        <AccordionItem title="판매 및 수익">
          <p>· 무료 팩: 모든 유저가 즉시 사용 가능합니다.</p>
          <p>· 유료 팩: 설정한 포인트 가격으로 상점에 등록됩니다.</p>
          <p>· 최종 가격은 관리자가 조정할 수 있습니다.</p>
        </AccordionItem>

        <AccordionItem title="주의사항">
          <p>· 하루 최대 {SUBMISSION_LIMITS.DAILY_MAX}건까지 신청할 수 있습니다.</p>
          <p>· 검토 중인 신청은 취소할 수 있습니다.</p>
          <p>· 승인 후 판매 중인 이모티콘이 신고를 받으면 판매중지될 수 있습니다.</p>
          <p>· 판매중지된 이모티콘은 &quot;신고·중지&quot; 탭에서 확인할 수 있습니다.</p>
          <p>· 등록한 이미지가 저작권에 위배되는 게시물이 아닌지 다시 한번 확인해 주시기 바랍니다.</p>
        </AccordionItem>
      </ContainerContent>
    </Container>
  )
}
