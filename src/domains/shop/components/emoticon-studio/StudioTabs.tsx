'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Button, Container, ContainerContent } from '@/shared/components/ui'

export type StudioTab = 'submit' | 'my' | 'reports' | 'guide'

const TABS: { key: StudioTab; label: string }[] = [
  { key: 'submit', label: '등록 신청' },
  { key: 'my', label: '내 이모티콘' },
  { key: 'reports', label: '신고·중지' },
  { key: 'guide', label: '가이드' },
]

export default function StudioTabs() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const currentTab = (searchParams.get('tab') as StudioTab) || 'submit'

  const handleTabChange = (tab: StudioTab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'submit') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
      <ContainerContent className="px-4 py-2.5">
        <nav className="flex items-center gap-1">
          {TABS.map(tab => (
            <Button
              key={tab.key}
              type="button"
              variant="ghost"
              onClick={() => handleTabChange(tab.key)}
              className={`px-2 py-1 h-auto text-xs sm:text-[13px] whitespace-nowrap flex items-center gap-1 text-gray-700 dark:text-gray-300 ${
                currentTab === tab.key ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </nav>
      </ContainerContent>
    </Container>
  )
}
