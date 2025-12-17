'use client';

import { ChipButton, ChipType } from '../types';
import { CHIP_BUTTONS } from '../utils';
import { cn } from '@/shared/utils/cn';

interface ChatChipButtonsProps {
  onChipClick: (chip: ChipButton) => void;
  disabled?: boolean;
  className?: string;
  filterLabels?: string[]; // Optional: filter to show only specific chips
}

export function ChatChipButtons({ onChipClick, disabled = false, className, filterLabels }: ChatChipButtonsProps) {
  // Filter buttons if filterLabels is provided
  const buttonsToShow = filterLabels
    ? CHIP_BUTTONS.filter(chip => filterLabels.includes(chip.label))
    : CHIP_BUTTONS;

  return (
    <div className={cn(
      'flex flex-wrap gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500',
      className
    )}>
      {buttonsToShow.map((chip) => (
        <button
          key={chip.id}
          onClick={() => onChipClick(chip)}
          disabled={disabled}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-full transition-all duration-200',
            'border border-gray-300 dark:border-gray-600 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0]',
            'hover:bg-[#EAEAEA] dark:hover:bg-[#333333] hover:shadow-sm',
            'outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0',
            'active:scale-95',
            disabled && 'opacity-50 cursor-not-allowed hover:bg-[#F5F5F5] dark:hover:bg-[#262626]',
            'transform hover:scale-105'
          )}
          aria-label={`${chip.label} 선택`}
        >
          <span className="flex items-center space-x-1">
            <span>{chip.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

interface SingleChipButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function SingleChipButton({ 
  label, 
  onClick, 
  disabled = false,
  variant = 'secondary' 
}: SingleChipButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-full transition-all duration-200',
        'outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0',
        'active:scale-95 transform hover:scale-105',
        variant === 'primary'
          ? 'bg-slate-800 dark:bg-[#3F3F3F] text-white border border-slate-800 dark:border-[#3F3F3F] hover:bg-slate-700 dark:hover:bg-[#4A4A4A]'
          : 'border border-gray-300 dark:border-gray-600 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={label}
    >
      {label}
    </button>
  );
}