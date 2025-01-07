'use client';

import Link from 'next/link';
import { X, User, Trophy, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { ThemeToggle } from './ThemeToggle';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const categories = [
  {
    icon: '⚽️',
    name: '축구',
    subcategories: [
      { name: '프리미어리그', count: 25 },
      { name: '라리가', count: 18 },
      { name: '분데스리가', count: 15 },
      { name: 'K리그', count: 22 },
    ],
  },
  {
    icon: '⚾️',
    name: '야구',
    subcategories: [
      { name: 'KBO', count: 30 },
      { name: 'MLB', count: 28 },
      { name: 'NPB', count: 12 },
    ],
  },
  {
    icon: '🏀',
    name: '농구',
    subcategories: [
      { name: 'NBA', count: 35 },
      { name: 'KBL', count: 20 },
      { name: 'WKBL', count: 8 },
    ],
  },
  {
    icon: '🎮',
    name: 'E-Sports',
    subcategories: [
      { name: 'LOL', count: 42 },
      { name: 'VALORANT', count: 15 },
      { name: 'PUBG', count: 10 },
    ],
  },
];

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { isLoggedIn, logout, user } = useAuth();
  const router = useRouter();

  const handleLoginRedirect = () => {
    console.log('로그인 버튼 클릭됨');
    router.push('/login');
  };

  const handleSignupRedirect = () => {
    console.log('회원가입 버튼 클릭됨');
    router.push('/signup');
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-72 bg-background border-r lg:pl-4 fixed top-[64px] bottom-0 left-0 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:static lg:translate-x-0`}
      >
        <ScrollArea className="h-full lg:h-[calc(100vh-64px)] overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* User Profile Section */}
            <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-medium">{isLoggedIn ? (user?.nickname || '사용자') : '게스트'}</div>
                  {isLoggedIn ? (
                    <Button variant="link" className="p-0 h-auto text-sm" onClick={logout}>
                      로그아웃
                    </Button>
                  ) : (
                    <>
                      <Button variant="link" className="p-0 h-auto text-sm" onClick={handleLoginRedirect}>
                        로그인하기
                      </Button>
                      <br />
                      <Button variant="link" className="p-0 h-auto text-sm" onClick={handleSignupRedirect}>
                        회원가입
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center justify-center h-16 py-1 whitespace-nowrap"
                >
                  <Trophy className="h-4 w-4 mb-1" />
                  <span>포인트</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center justify-center h-16 py-1 whitespace-nowrap"
                >
                  <Calendar className="h-4 w-4 mb-1" />
                  <span>일정</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center justify-center h-16 py-1 whitespace-nowrap"
                >
                  <MessageSquare className="h-4 w-4 mb-1" />
                  <span>채팅</span>
                </Button>
              </div>
              <ThemeToggle />
            </div>

            {/* Categories */}
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center space-x-2 px-2">
                    <span className="text-xl">{category.icon}</span>
                    <h3 className="font-medium text-foreground dark:text-gray-300">
                      {category.name}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {category.subcategories.map((sub) => (
                      <Link
                        key={sub.name}
                        href="#"
                        className="flex items-center justify-between px-4 py-1.5 text-sm text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-gray-200 hover:bg-accent dark:hover:bg-gray-700 rounded-md"
                      >
                        <span>{sub.name}</span>
                        <span className="text-xs text-muted-foreground dark:text-gray-500">
                          {sub.count}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 lg:hidden"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </aside>
    </>
  );
}
