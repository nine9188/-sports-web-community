'use client'

import { useState } from 'react'
import { Inter } from 'next/font/google'
import '../globals.css'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import { ThemeProvider } from './components/ThemeProvider'
import Footer from './components/Footer'
import { AuthProvider } from './context/AuthContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { PostProvider } from './context/PostContext'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <PostProvider>
              <div className="flex flex-col min-h-screen max-w-screen-2xl mx-auto">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <div className="flex flex-1">
                  <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                  <main className="flex-1 p-4 lg:p-6 lg:pl-0">
                    <div className="max-w-5xl mx-auto">
                      {children}
                    </div>
                  </main>
                </div>
                <Footer />
              </div>
              <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            </PostProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

