"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Settings } from 'lucide-react';
import Image from 'next/image';
import type { PickerPackage } from '@/domains/boards/actions/emoticons';

interface PackageTabsProps {
  packages: PickerPackage[];
  activePackageId: string;
  onPackageChange: (id: string) => void;
  tabContainerRef: React.RefObject<HTMLDivElement | null>;
  onScrollTabs: (direction: 'left' | 'right') => void;
  onShopClick: () => void;
  onSettingsClick: () => void;
}

export default function PackageTabs({
  packages,
  activePackageId,
  onPackageChange,
  tabContainerRef,
  onScrollTabs,
  onShopClick,
  onSettingsClick,
}: PackageTabsProps) {
  return (
    <div className="flex items-center border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] h-11 flex-shrink-0">
      <button
        type="button"
        onClick={() => onScrollTabs('left')}
        className="flex items-center justify-center w-8 h-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div ref={tabContainerRef} className="flex-1 flex overflow-x-auto scrollbar-hide h-full">
        {packages.map((pkg) => (
          <button
            key={pkg.pack_id}
            type="button"
            onClick={() => onPackageChange(pkg.pack_id)}
            className={`flex-shrink-0 flex items-center justify-center w-12 h-full border-r border-[#EAEAEA] dark:border-[#333333] transition-colors ${
              activePackageId === pkg.pack_id
                ? 'bg-white dark:bg-[#1D1D1D] border-t-2 border-t-[#262626] dark:border-t-[#F0F0F0]'
                : 'bg-transparent hover:bg-[#EAEAEA] dark:hover:bg-[#333333] border-t-2 border-t-transparent'
            }`}
            title={pkg.pack_name}
          >
            <Image
              src={pkg.pack_thumbnail}
              alt={pkg.pack_name}
              width={24}
              height={24}
              className={`w-6 h-6 object-contain ${activePackageId !== pkg.pack_id && 'opacity-60'} transition-opacity`}
            />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onScrollTabs('right')}
        className="flex items-center justify-center w-8 h-full border-l border-r border-black/5 dark:border-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* 상점 / 설정 */}
      <div className="flex h-full bg-[#EAEAEA] dark:bg-[#333333]">
        <button
          type="button"
          onClick={onShopClick}
          className="flex items-center justify-center w-10 h-full text-gray-500 hover:text-gray-800 dark:hover:text-[#F0F0F0] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="이모티콘 상점"
        >
          <ShoppingBag className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onSettingsClick}
          className="flex items-center justify-center w-10 h-full text-gray-500 border-l border-black/5 dark:border-white/10 hover:text-gray-800 dark:hover:text-[#F0F0F0] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="설정"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
