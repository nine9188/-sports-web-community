'use client';

import Link from 'next/link';
import { Menu, Search } from 'lucide-react'
import { Button } from '@/app/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/app/ui/dropdown-menu'
import { useRouter } from 'next/navigation';
import { getAuthToken, removeAuthToken } from '@/app/lib/utils';
import { useEffect, useState } from 'react';

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getAuthToken());
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-dark/95 dark:supports-[backdrop-filter]:bg-dark/60">
      <div className="container mx-auto">
        <div className="flex h-16 items-center px-4">
          <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-primary">SPORTS</span>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <div className="hidden md:flex items-center">
              <input
                className="w-[300px] p-2 bg-background border rounded dark:bg-dark dark:border-gray-700"
                placeholder="검색..."
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Search className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[300px]">
                <input
                  className="w-full p-2 bg-background border rounded dark:bg-dark dark:border-gray-700"
                  placeholder="검색..."
                />
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center space-x-2">
              {isLoggedIn ? (
                <>
                  <Button variant="ghost" onClick={() => router.push('/posts/create')}>
                    글쓰기
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    로그아웃
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => router.push('/login')}>
                  로그인
                </Button>
              )}
            </div>
          </div>
        </div>
        <nav className="flex items-center h-12 px-4 overflow-x-auto border-t">
          {['전체', '축구', '야구', '농구', '배구', '골프', 'UFC', 'E-SPORTS'].map((item) => (
            <Link
              key={item}
              href="#"
              className="flex-none px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {item}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

