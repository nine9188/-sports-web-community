"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/shared/utils/cn"
import { inputGrayBgStyles } from '@/shared/styles'

interface SelectOption {
  value: string
  label: string
}

interface NativeSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  triggerClassName?: string
  contentClassName?: string
  itemClassName?: string
  disabled?: boolean
}

export function NativeSelect({
  value,
  onValueChange,
  options,
  placeholder = "선택",
  className,
  triggerClassName,
  contentClassName,
  itemClassName,
  disabled = false,
}: NativeSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  // 외부 클릭 감지
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // ESC 키로 닫기
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md px-3 py-2 text-sm",
          inputGrayBgStyles,
          "focus:outline-none",
          disabled && "opacity-50 cursor-not-allowed",
          triggerClassName
        )}
      >
        <span className="truncate">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown Content */}
      {isOpen && !disabled && (
        <div
          className={cn(
            "absolute z-[10000] mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
            contentClassName
          )}
        >
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center py-2 pl-8 pr-2 text-sm outline-none",
                  "hover:bg-[#F5F5F5] dark:hover:bg-[#262626]",
                  "transition-colors",
                  value === option.value && "bg-[#F5F5F5] dark:bg-[#262626]",
                  itemClassName
                )}
              >
                {value === option.value && (
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className="h-4 w-4" />
                  </span>
                )}
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
