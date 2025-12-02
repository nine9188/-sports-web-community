'use client'

import { useRouter } from 'next/navigation'

interface BackButtonProps {
  label?: string
  className?: string
}

export default function BackButton({ label = '← 돌아가기', className = '' }: BackButtonProps) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={`mb-4 text-sm text-slate-600 hover:text-slate-800 hover:underline ${className}`}
    >
      {label}
    </button>
  )
}


