'use client';

import React from 'react';

interface LinkedInEmbedProps {
  url: string;
}

export const LinkedInEmbed: React.FC<LinkedInEmbedProps> = ({ url }) => {
  // LinkedIn은 iframe embed를 제공하지 않으므로 링크 카드로 표시
  return (
    <div className="linkedin-embed my-4 max-w-full overflow-hidden">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded-lg hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
      >
        {/* 텍스트 영역 */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="font-semibold text-gray-900 dark:text-[#F0F0F0]">
            LinkedIn 게시물 보기
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {url}
          </div>
        </div>
        {/* LinkedIn 로고 */}
        <svg
          className="w-10 h-10 text-[#0A66C2] flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </a>
    </div>
  );
};
