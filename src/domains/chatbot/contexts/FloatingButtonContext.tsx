'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface FloatingButtonContextType {
  isVisible: boolean
  showButton: () => void
  hideButton: () => void
  openPanel: () => void
  shouldOpenPanel: boolean
}

const FloatingButtonContext = createContext<FloatingButtonContextType | undefined>(undefined)

export function FloatingButtonProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false) // 기본적으로 숨김
  const [shouldOpenPanel, setShouldOpenPanel] = useState(false)

  const showButton = () => setIsVisible(true)
  const hideButton = () => setIsVisible(false)
  
  const openPanel = () => {
    setIsVisible(true)
    setShouldOpenPanel(true)
    // 패널이 열린 후 플래그 리셋
    setTimeout(() => setShouldOpenPanel(false), 100)
  }

  return (
    <FloatingButtonContext.Provider value={{ isVisible, showButton, hideButton, openPanel, shouldOpenPanel }}>
      {children}
    </FloatingButtonContext.Provider>
  )
}

export function useFloatingButton() {
  const context = useContext(FloatingButtonContext)
  if (context === undefined) {
    throw new Error('useFloatingButton must be used within a FloatingButtonProvider')
  }
  return context
}