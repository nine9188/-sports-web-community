'use client';

import { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { NativeSelect } from '@/shared/components/ui';

export type SearchType = 'title_content' | 'title' | 'content' | 'comment' | 'nickname';

const SEARCH_TYPE_OPTIONS: { value: SearchType; label: string }[] = [
  { value: 'title_content', label: '제목+내용' },
  { value: 'title', label: '제목' },
  { value: 'content', label: '내용' },
  { value: 'comment', label: '댓글' },
  { value: 'nickname', label: '닉네임' },
];

interface BoardSearchBarProps {
  slug: string;
  placeholder?: string;
}

function BoardSearchBarInner({
  slug,
  placeholder = '검색어 입력',
}: BoardSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get('search') || '';
  const currentType = (searchParams.get('searchType') as SearchType) || 'title_content';

  const [query, setQuery] = useState(currentSearch);
  const [searchType, setSearchType] = useState<SearchType>(currentType);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedQuery = query.trim();

      if (trimmedQuery) {
        router.push(`/boards/${slug}?search=${encodeURIComponent(trimmedQuery)}&searchType=${searchType}`);
      } else {
        router.push(`/boards/${slug}`);
      }
    },
    [query, slug, router, searchType]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    router.push(`/boards/${slug}`);
  }, [slug, router]);

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      {/* 검색 타입 선택 */}
      <NativeSelect
        value={searchType}
        onValueChange={(value) => setSearchType(value as SearchType)}
        options={SEARCH_TYPE_OPTIONS}
        triggerClassName="w-[110px] h-9 px-2"
        itemClassName="py-1.5 pl-6 pr-2"
      />

      {/* 검색 입력 */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 text-sm border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-lg placeholder-gray-500 outline-none focus:outline-none hover:bg-[#F5F5F5] dark:hover:bg-[#262626] focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 검색 버튼 */}
      <button
        type="submit"
        className="px-3 py-2 text-sm border border-black/7 dark:border-0 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-lg transition-colors whitespace-nowrap"
      >
        검색
      </button>
    </form>
  );
}

export default function BoardSearchBar(props: BoardSearchBarProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center gap-2">
        <div className="flex-1 h-10 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg animate-pulse" />
        <div className="w-14 h-10 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg animate-pulse" />
      </div>
    }>
      <BoardSearchBarInner {...props} />
    </Suspense>
  );
}
