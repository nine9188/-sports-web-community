import ChatWindow from '@/domains/chatbot/components/ChatWindow'
import Link from 'next/link'

export default async function SupportPage(props: { searchParams: Promise<{ sid?: string; new?: string }> }) {
  const searchParams = await props.searchParams
  const activeSessionId = searchParams?.sid ?? null
  const forceNew = searchParams?.new === '1'
  return (
    <main className="container mx-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/support/sessions" className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-neutral-100" aria-label="대화목록으로">
          {/* left arrow */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </Link>
        <h1 className="text-xl font-bold">고객지원 챗봇</h1>
      </div>
      <ChatWindow activeSessionId={activeSessionId} forceNew={forceNew} />
    </main>
  )
}


