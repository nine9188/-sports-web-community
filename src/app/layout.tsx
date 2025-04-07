'use client'

import { useState } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import RightSidebar from './components/RightSidebar'
import { ThemeProvider } from './components/ThemeProvider'
import Footer from './components/Footer'
import { AuthProvider } from './context/AuthContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Inter 폰트 정의를 전역 CSS 클래스로 사용
const inter = Inter({ subsets: ['latin'] })

// QueryClient 인스턴스 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      gcTime: 1000 * 60 * 30,   // 30분 (이전 버전의 cacheTime)
      retry: 1, // 실패시 1번 재시도
      refetchOnWindowFocus: false, // 윈도우 포커스시 재요청 비활성화
    },
  },
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <QueryClientProvider client={queryClient}>
      <html lang="ko" className={`w-full h-full ${inter.className}`} suppressHydrationWarning>
        <head />
        <body className="w-full h-full overflow-x-hidden">
          <ThemeProvider 
            attribute="class" 
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <AuthProvider>
                <div className="flex flex-col min-h-screen w-full">
                  <Header onMenuClick={() => setIsSidebarOpen(true)} isSidebarOpen={isSidebarOpen} />
                  <div className="flex flex-1 w-full md:max-w-screen-2xl md:mx-auto">
                    <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                    <main className="flex-1 md:p-4 w-full overflow-y-auto box-border">
                      {children}
                    </main>
                    <RightSidebar />
                  </div>
                  <Footer />
                </div>
                <ToastContainer 
                  position="top-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                />
            </AuthProvider>
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} /> {/* 개발 환경에서 디버깅 도구 제공 */}
        </body>
      </html>
    </QueryClientProvider>
  )
}