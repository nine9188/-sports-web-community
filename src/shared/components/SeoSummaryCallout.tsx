import React from 'react';

interface SeoSummaryCalloutProps {
  summary?: string | null;
  plain?: boolean;
}

export default function SeoSummaryCallout({ summary, plain = false }: SeoSummaryCalloutProps) {
  if (!summary) return null;

  const content = (
    <>
      <div className="mt-0.5 text-blue-500 dark:text-blue-400 flex-shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 111.085 1.085l-.04.04m-2.137.082a.75.75 0 111.085-1.085l.04.04m-2.137.082a.75.75 0 111.085-1.085l.04.04M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p className="flex-1 select-text font-normal text-gray-700 dark:text-[#E0E0E0]">
        {summary}
      </p>
    </>
  );

  if (plain) {
    return (
      <div className="flex items-start gap-3 text-[13px] leading-relaxed">
        {content}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-none md:rounded-lg border border-black/7 dark:border-0 p-4 flex items-start gap-3 text-[13px] leading-relaxed">
      {content}
    </div>
  );
}
