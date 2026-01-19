'use client';

import { ChipButton, ChipType } from '../types';
import { CHIP_BUTTONS } from '../utils';
import { Button } from '@/shared/components/ui';
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
        <Button
          key={chip.id}
          variant="secondary"
          onClick={() => onChipClick(chip)}
          disabled={disabled}
          className={cn(
            'px-4 py-2 h-auto rounded-full transition-all duration-200',
            'border border-black/7 dark:border-white/10',
            'hover:shadow-sm',
            'active:scale-95',
            'transform hover:scale-105'
          )}
          aria-label={`${chip.label} 선택`}
        >
          <span className="flex items-center space-x-1">
            <span>{chip.label}</span>
          </span>
        </Button>
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
    <Button
      variant={variant === 'primary' ? 'primary' : 'secondary'}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-2 h-auto rounded-full transition-all duration-200',
        'active:scale-95 transform hover:scale-105',
        variant === 'primary'
          ? 'border border-[#262626] dark:border-[#3F3F3F]'
          : 'border border-black/7 dark:border-white/10'
      )}
      aria-label={label}
    >
      {label}
    </Button>
  );
}