'use client';

import { ChipButton, ChipType } from '../types';
import { CHIP_BUTTONS } from '../utils';
import { cn } from '@/shared/utils/cn';

interface ChatChipButtonsProps {
  onChipClick: (chip: ChipButton) => void;
  disabled?: boolean;
  className?: string;
}

export function ChatChipButtons({ onChipClick, disabled = false, className }: ChatChipButtonsProps) {
  return (
    <div className={cn(
      'flex flex-wrap gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500',
      className
    )}>
      {CHIP_BUTTONS.map((chip) => (
        <button
          key={chip.id}
          onClick={() => onChipClick(chip)}
          disabled={disabled}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-full transition-all duration-200',
            'border border-blue-200 bg-blue-50 text-blue-700',
            'hover:bg-blue-100 hover:border-blue-300 hover:shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'active:scale-95',
            disabled && 'opacity-50 cursor-not-allowed hover:bg-blue-50 hover:border-blue-200',
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
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'active:scale-95 transform hover:scale-105',
        variant === 'primary' 
          ? 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          : 'border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-400 focus:ring-gray-500',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={label}
    >
      {label}
    </button>
  );
}