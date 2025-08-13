'use client'

import Link from 'next/link'
import { useFloatingButton } from '@/domains/chatbot/contexts/FloatingButtonContext'

export default function Footer() {
  const { openPanel } = useFloatingButton()
  return (
    <footer className="bg-background border-t py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2024 SPORTS Community. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground">이용약관</Link>
            <Link href="/privacy" className="hover:text-foreground">개인정보처리방침</Link>
            <button 
              onClick={openPanel}
              className="hover:text-foreground"
            >
              문의하기
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
} 