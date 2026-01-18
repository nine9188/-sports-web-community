'use client';

import React from 'react';

interface LinkedInEmbedProps {
  url: string;
}

export const LinkedInEmbed: React.FC<LinkedInEmbedProps> = ({ url }) => {
  // LinkedIn은 iframe embed를 제공하지 않으므로 링크 카드로 표시
  return (
    <div className="linkedin-embed my-4">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-12 h-12 text-blue-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              LinkedIn 게시물 보기
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {url}
            </div>
          </div>
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </a>
    </div>
  );
};
