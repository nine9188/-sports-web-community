import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Container } from '@/shared/components/ui';

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
    <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
      <div className="px-4 py-2.5 overflow-x-auto">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-max">
          {breadcrumbs.map((bc, index) => (
            <React.Fragment key={bc.id}>
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 mx-1.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />}
              {index === breadcrumbs.length - 1 ? (
                <span className="px-2 py-1 font-medium text-gray-900 dark:text-[#F0F0F0] sm:max-w-none truncate">
                  {bc.name}
                </span>
              ) : (
                <Link
                  href={bc.slug?.startsWith('/') ? bc.slug : `/boards/${bc.slug || bc.id}`}
                  className="px-2 py-1 hover:text-gray-600 dark:hover:text-gray-300 hover:underline sm:max-w-none truncate flex-shrink-0 transition-colors"
                  title={bc.name}
                >
                  {bc.name}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </Container>
  );
} 