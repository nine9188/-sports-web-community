"use client";

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';


export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center">
        {theme === 'light' ? (
          <Sun className="h-4 w-4 text-yellow-500 mr-2" />
        ) : (
          <Moon className="h-4 w-4 text-blue-500 mr-2" />
        )}
        <span className="mr-3">{theme === 'light' ? '라이트모드' : '다크모드'}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={theme === 'light'}
          onChange={(e) => setTheme(e.target.checked ? 'light' : 'dark')}
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 peer-checked:after:border-white dark:border-gray-600"></div>
      </label>
    </div>
  );
}

