'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/shared/utils/cn';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function Select({ 
  value, 
  onChange, 
  options, 
  disabled = false, 
  placeholder = '선택하세요',
  className 
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className={cn('relative', className)}>
      {/* Select 버튼 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full border rounded-lg px-3 py-2 text-sm text-left',
          'outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
          'transition-colors flex items-center justify-between',
          disabled
            ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-500 dark:text-gray-400 border-black/7 dark:border-white/10 cursor-not-allowed'
            : 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] border-black/7 dark:border-white/10 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer'
        )}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <svg
          className={cn(
            'w-4 h-4 transition-transform',
            isOpen && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={cn(
                'w-full text-left px-3 py-2 text-sm transition-colors',
                'hover:bg-[#EAEAEA] dark:hover:bg-[#333333]',
                option.value === value
                  ? 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] font-medium'
                  : 'text-gray-900 dark:text-[#F0F0F0]'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


