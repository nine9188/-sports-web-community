'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import StudioTabs, { type StudioTab } from '@/domains/shop/components/emoticon-studio/StudioTabs'
import SubmitForm from '@/domains/shop/components/emoticon-studio/SubmitForm'
import MyEmoticonList from '@/domains/shop/components/emoticon-studio/MyEmoticonList'
import SuspendedList from '@/domains/shop/components/emoticon-studio/SuspendedList'
import GuideSection from '@/domains/shop/components/emoticon-studio/GuideSection'

export default function EmoticonStudioClient() {
  const searchParams = useSearchParams()
  const currentTab = (searchParams.get('tab') as StudioTab) || 'submit'

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 md:rounded-lg overflow-hidden">
        <div className="bg-[#F5F5F5] dark:bg-[#262626] h-12 px-4 flex items-center justify-between md:rounded-t-lg">
          <div className="flex items-center gap-2">
            <Link href="/shop?cat=25" aria-label="상점으로 돌아가기" className="flex items-center gap-1 text-[13px] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h3 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">이모티콘 스튜디오</h3>
          </div>
        </div>
      </div>

      <StudioTabs />

      {currentTab === 'submit' && <SubmitForm />}
      {currentTab === 'my' && <MyEmoticonList />}
      {currentTab === 'reports' && <SuspendedList />}
      {currentTab === 'guide' && <GuideSection />}
    </div>
  )
}
