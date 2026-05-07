'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import MatchCard from './MatchCardServer';
import type { WidgetMatch } from './types';

interface LeagueToggleClientProps {
  header: ReactNode;
  children?: ReactNode;
  defaultExpanded?: boolean;
  matchCount: number;
  matches?: WidgetMatch[];
}

export default function LeagueToggleClient({
  header,
  children,
  defaultExpanded = false,
  matchCount,
  matches,
}: LeagueToggleClientProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setExpanded(!expanded)}
        className="w-full h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] md:hover:bg-[#EAEAEA] md:dark:hover:bg-[#333333] rounded-none"
      >
        {header}

        <div className="flex items-center gap-3">
          <span className="bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-[#F0F0F0] text-xs font-medium px-2.5 py-1 rounded-full min-w-[28px] text-center">
            {matchCount}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          )}
        </div>
      </Button>

      <div className={`bg-white dark:bg-[#1D1D1D] ${expanded ? '' : 'hidden'}`}>
        {children}
        {matches?.map((match, idx) => (
          <MatchCard
            key={match.id}
            match={match}
            isLast={idx === matches.length - 1}
          />
        ))}
      </div>
    </>
  );
}
