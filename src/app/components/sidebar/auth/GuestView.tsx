'use client';

import { Button } from '@/app/ui/button';
import { LogIn } from 'lucide-react';
import Link from 'next/link';

export default function GuestView() {
  return (
    <div className="grid grid-cols-1 gap-2">
      <Button 
        asChild
        variant="outline" 
        size="sm"
        className="justify-start hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Link href="/signin">
          <LogIn className="h-4 w-4 mr-2" />
          로그인
        </Link>
      </Button>
    </div>
  );
} 