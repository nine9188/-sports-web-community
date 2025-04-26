'use client';

import React from 'react';

export default function PlayerHeaderSkeleton() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm animate-pulse mb-4">
      <div className="flex items-center gap-2 justify-between mb-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
        <div className="w-16 h-5 bg-gray-200 rounded"></div>
      </div>
      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
        <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  );
} 