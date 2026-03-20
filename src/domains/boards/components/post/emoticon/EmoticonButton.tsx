"use client";

import Image from 'next/image';

interface EmoticonButtonProps {
  emoticon: { id: number | string; code: string; name: string; url: string };
  onSelect: (code: string) => void;
  size: 'mobile' | 'desktop';
}

export default function EmoticonButton({ emoticon, onSelect, size }: EmoticonButtonProps) {
  const sizeClass = size === 'desktop'
    ? 'w-[100px] h-[100px]'
    : 'w-full aspect-square';

  return (
    <button
      type="button"
      onClick={() => onSelect(emoticon.code)}
      className={`${sizeClass} flex items-center justify-center p-1 hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors rounded group border border-transparent hover:border-black/5 dark:hover:border-white/10`}
      title={emoticon.name}
    >
      <Image
        src={emoticon.url}
        alt={emoticon.name}
        width={60}
        height={60}
        className="w-[60px] h-[60px] object-contain pointer-events-none group-hover:scale-105 transition-transform"
      />
    </button>
  );
}
