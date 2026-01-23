'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/shared/components/ui';

export function ThemeToggle() {
  const { setTheme } = useTheme();

  const handleToggle = () => {
    const isDark =
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <div className="flex items-center">
      <div className="hidden md:block">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          className="rounded-md"
          aria-label="테마 전환"
          title="테마 전환"
        >
          <Sun className="h-5 w-5 dark:hidden" aria-hidden="true" />
          <Moon className="h-5 w-5 hidden dark:block" aria-hidden="true" />
        </Button>
      </div>
      <div className="flex md:hidden gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme('light')}
          className="rounded-md bg-[#EAEAEA] text-blue-600 hover:bg-[#EAEAEA] dark:bg-transparent dark:text-gray-300 dark:hover:bg-[#333333]"
          aria-label="라이트 모드"
          title="라이트 모드"
        >
          <Sun className="h-5 w-5" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme('dark')}
          className="rounded-md bg-transparent text-gray-700 dark:bg-[#333333] dark:text-blue-400"
          aria-label="다크 모드"
          title="다크 모드"
        >
          <Moon className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
