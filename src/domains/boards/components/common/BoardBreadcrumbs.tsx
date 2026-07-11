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
  plain?: boolean;
  small?: boolean;
}

export default function BoardBreadcrumbs({ breadcrumbs, plain = false, small = false }: BoardBreadcrumbsProps) {
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  const content = (
    <div className={`${plain ? 'h-full flex items-center' : 'px-4 py-2.5'} overflow-x-auto no-scrollbar`}>
      <div className={`flex items-center ${small ? 'text-[10px] text-gray-400 dark:text-gray-500' : 'text-[13px] text-gray-500 dark:text-gray-400'} whitespace-nowrap min-w-max`}>
        {breadcrumbs.map((bc, index) => (
          <React.Fragment key={bc.id}>
            {index > 0 && (
              small ? (
                <span className="mx-1 text-gray-300 dark:text-gray-700">/</span>
              ) : (
                <ChevronRight className="h-3.5 w-3.5 mx-1.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              )
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className={`px-1 py-0.5 font-medium ${small ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-[#F0F0F0]'} sm:max-w-none truncate`}>
                {bc.name}
              </span>
            ) : (
              <Link
                href={bc.slug?.startsWith('/') ? bc.slug : `/boards/${bc.slug || bc.id}`}
                className="px-1 py-0.5 hover:text-gray-600 dark:hover:text-gray-300 hover:underline sm:max-w-none truncate flex-shrink-0 transition-colors"
                title={bc.name}
                prefetch={false}
              >
                {bc.name}
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  if (plain) {
    return content;
  }

  return (
    <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
      {content}
    </Container>
  );
} 