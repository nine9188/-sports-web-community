'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 클라이언트에서만 렌더링 (hydration 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#1D1D1D] animate-pulse" />
    );
  }

  const themes = [
    { name: 'light', icon: Sun, label: '라이트' },
    { name: 'dark', icon: Moon, label: '다크' },
    { name: 'system', icon: Monitor, label: '시스템' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#1D1D1D] rounded-lg">
      {themes.map(({ name, icon: Icon, label }) => (
        <button
          key={name}
          onClick={() => setTheme(name)}
          className={`
            p-2 rounded-md transition-colors
            ${theme === name
              ? 'bg-[#EAEAEA] dark:bg-[#333333] text-blue-600 dark:text-blue-400'
              : 'bg-white dark:bg-[#1D1D1D] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
            }
          `}
          aria-label={`${label} 모드`}
          title={`${label} 모드`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
