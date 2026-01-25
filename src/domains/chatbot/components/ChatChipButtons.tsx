'use client';

import { ChipButton, ChipType } from '../types';
import { CHIP_BUTTONS } from '../utils';
import { Button } from '@/shared/components/ui';
import { cn } from '@/shared/utils/cn';

interface ChatChipButtonsProps {
  onChipClick: (chip: ChipButton) => void;
  disabled?: boolean;
  className?: string;
  filterLabels?: string[];
  selectedLabel?: string; // 선택된 칩 라벨
}

export function ChatChipButtons({ onChipClick, disabled = false, className, filterLabels, selectedLabel }: ChatChipButtonsProps) {
  const buttonsToShow = filterLabels
    ? CHIP_BUTTONS.filter(chip => filterLabels.includes(chip.label))
    : CHIP_BUTTONS;

  return (
    <div className={cn(
      'flex flex-wrap gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500',
      className
    )}>
      {buttonsToShow.map((chip) => {
        const isSelected = chip.label === selectedLabel;
        return (
          <Button
            key={chip.id}
            variant="secondary"
            onClick={() => onChipClick(chip)}
            disabled={disabled}
            className={cn(
              'px-4 py-2 h-auto rounded-none transition-all duration-200',
              'border border-black/7 dark:border-white/10',
              disabled
                ? isSelected
                  ? 'bg-[#262626] dark:bg-[#3F3F3F] text-white opacity-100'
                  : 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-sm active:scale-95 transform hover:scale-105'
            )}
            aria-label={`${chip.label} 선택`}
          >
            <span className="flex items-center space-x-1">
              <span>{chip.label}</span>
            </span>
          </Button>
        );
      })}
    </div>
  );
}

interface SingleChipButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isSelected?: boolean;
}

export function SingleChipButton({
  label,
  onClick,
  disabled = false,
  isSelected = false
}: SingleChipButtonProps) {
  return (
    <Button
      variant="secondary"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-2 h-auto rounded-none transition-all duration-200',
        'border border-black/7 dark:border-white/10',
        disabled
          ? isSelected
            ? 'bg-[#262626] dark:bg-[#3F3F3F] text-white opacity-100'
            : 'opacity-50 cursor-not-allowed'
          : 'hover:shadow-sm active:scale-95 transform hover:scale-105'
      )}
      aria-label={label}
    >
      {label}
    </Button>
  );
}