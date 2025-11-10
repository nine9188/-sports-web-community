'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

const SearchBar = React.memo(function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      inputRef.current?.blur();
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-64">
      <div className={`relative transition-all duration-200 ${
        isFocused ? 'scale-105' : 'scale-100'
      }`}>
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors ${
          isFocused ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'
        }`} />
        <input
          ref={inputRef}
          type="text"
          placeholder="게시글, 뉴스, 팀 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          className={`w-full pl-10 pr-4 py-2 text-sm bg-[#F5F5F5] dark:bg-[#262626] border border-black/5 dark:border-white/10 rounded-full
            outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0
            focus:bg-[#EAEAEA] dark:focus:bg-[#333333] transition-colors duration-200 placeholder-gray-500 dark:placeholder-gray-400
            text-gray-900 dark:text-[#F0F0F0]
            hover:bg-[#EAEAEA] dark:hover:bg-[#333333]`}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-full transition-colors"
          >
            <X className="h-3 w-3 text-gray-400" />
          </button>
        )}
      </div>
    </form>
  );
});

export default SearchBar; 