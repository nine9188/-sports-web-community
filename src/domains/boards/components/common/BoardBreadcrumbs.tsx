import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  id: string;
  name: string;
  slug?: string;
}

interface BoardBreadcrumbsProps {
  breadcrumbs: Breadcrumb[];
}

export default function BoardBreadcrumbs({ breadcrumbs }: BoardBreadcrumbsProps) {
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border rounded-md shadow-sm mb-4">
      <div className="p-3 sm:p-4 overflow-x-auto">
        <div className="flex items-center text-sm text-gray-500 whitespace-nowrap min-w-max">
          {breadcrumbs.map((bc, index) => (
            <React.Fragment key={bc.id}>
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 mx-1.5 text-gray-400 flex-shrink-0" />}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-medium text-gray-800 max-w-[120px] sm:max-w-none truncate">
                  {bc.name}
                </span>
              ) : (
                <Link 
                  href={`/boards/${bc.slug || bc.id}`} 
                  className="hover:text-blue-600 hover:underline max-w-[100px] sm:max-w-none truncate flex-shrink-0"
                  title={bc.name}
                >
                  {bc.name}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
} 