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
      className={`mb-4 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:underline ${className}`}
    >
      {label}
    </button>
  )
}


