'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-[#1D1D1D] border-t border-black/7 dark:border-white/10 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            © 2025 4590. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-gray-700 dark:text-gray-300 items-center">
            <Link href="/terms" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] transition-colors">이용약관</Link>
            <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] transition-colors">개인정보처리방침</Link>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-chatbot', { detail: { mode: 'auto' } }))
                }
              }}
              className="hover:text-gray-900 dark:hover:text-[#F0F0F0] transition-colors"
              aria-label="문의하기"
            >
              문의하기
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
} 