'use client';

import Link from 'next/link';

export default function ProfileActions() {
  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <Link
        href="/profile"
        className="bg-slate-100 hover:bg-slate-200 transition-colors rounded-md py-2 text-center"
      >
        프로필 관리
      </Link>
      <Link
        href="/signout"
        className="bg-slate-100 hover:bg-slate-200 transition-colors rounded-md py-2 text-center"
      >
        로그아웃
      </Link>
    </div>
  );
} 