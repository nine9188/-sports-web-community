/**
 * 공통 Skeleton 컴포넌트
 * 사용법: import { TextSkeleton, CardSkeleton, ListSkeleton } from '@/shared/components/skeletons';
 */

import { skeletonBase, skeletonText, skeletonAvatar, skeletonCard, skeletonHeader, skeletonDivider } from '@/shared/styles';

// ============================================
// 텍스트 스켈레톤
// ============================================

interface TextSkeletonProps {
  width?: string;
  className?: string;
}

export function TextSkeleton({ width = 'w-full', className = '' }: TextSkeletonProps) {
  return <div className={`${skeletonText} ${width} ${className}`} />;
}

interface TextBlockSkeletonProps {
  lines?: number;
  className?: string;
}

export function TextBlockSkeleton({ lines = 3, className = '' }: TextBlockSkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array(lines).fill(0).map((_, i) => (
        <TextSkeleton key={i} width={i === lines - 1 ? 'w-2/3' : 'w-full'} />
      ))}
    </div>
  );
}

// ============================================
// 아바타 스켈레톤
// ============================================

interface AvatarSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarSkeleton({ size = 'md', className = '' }: AvatarSkeletonProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  return <div className={`${skeletonAvatar} ${sizeClasses[size]} ${className}`} />;
}

// ============================================
// 카드 스켈레톤
// ============================================

interface CardSkeletonProps {
  hasHeader?: boolean;
  lines?: number;
  className?: string;
}

export function CardSkeleton({ hasHeader = true, lines = 3, className = '' }: CardSkeletonProps) {
  return (
    <div className={`${skeletonCard} ${className}`}>
      {hasHeader && <div className={skeletonHeader} />}
      <div className="p-4">
        <TextBlockSkeleton lines={lines} />
      </div>
    </div>
  );
}

// ============================================
// 리스트 스켈레톤
// ============================================

interface ListItemSkeletonProps {
  hasAvatar?: boolean;
  className?: string;
}

export function ListItemSkeleton({ hasAvatar = false, className = '' }: ListItemSkeletonProps) {
  return (
    <div className={`px-4 py-3 flex items-center gap-3 ${className}`}>
      {hasAvatar && <AvatarSkeleton size="sm" />}
      <TextSkeleton width="w-16" />
      <TextSkeleton width="flex-1" />
      <TextSkeleton width="w-20" />
    </div>
  );
}

interface ListSkeletonProps {
  count?: number;
  hasAvatar?: boolean;
  hasHeader?: boolean;
  className?: string;
}

export function ListSkeleton({ count = 5, hasAvatar = false, hasHeader = true, className = '' }: ListSkeletonProps) {
  return (
    <div className={`${skeletonCard} ${className}`}>
      {hasHeader && <div className={skeletonHeader} />}
      <div className={skeletonDivider}>
        {Array(count).fill(0).map((_, i) => (
          <ListItemSkeleton key={i} hasAvatar={hasAvatar} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// 그리드 스켈레톤
// ============================================

interface GridItemSkeletonProps {
  className?: string;
}

export function GridItemSkeleton({ className = '' }: GridItemSkeletonProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className={`${skeletonBase} w-16 h-16 rounded-lg`} />
      <TextSkeleton width="w-12" />
    </div>
  );
}

interface GridSkeletonProps {
  count?: number;
  cols?: 3 | 4 | 6;
  hasHeader?: boolean;
  className?: string;
}

export function GridSkeleton({ count = 12, cols = 4, hasHeader = true, className = '' }: GridSkeletonProps) {
  const colsClass = {
    3: 'grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    6: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6'
  };

  return (
    <div className={`${skeletonCard} ${className}`}>
      {hasHeader && <div className={skeletonHeader} />}
      <div className={`p-4 grid ${colsClass[cols]} gap-4`}>
        {Array(count).fill(0).map((_, i) => (
          <GridItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// 테이블 스켈레톤
// ============================================

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  hasHeader?: boolean;
  className?: string;
}

export function TableSkeleton({ rows = 5, cols = 4, hasHeader = true, className = '' }: TableSkeletonProps) {
  return (
    <div className={`${skeletonCard} ${className}`}>
      {hasHeader && (
        <div className="bg-[#F5F5F5] dark:bg-[#262626] px-4 py-3 flex gap-4">
          {Array(cols).fill(0).map((_, i) => (
            <TextSkeleton key={i} width={i === 1 ? 'flex-1' : 'w-20'} />
          ))}
        </div>
      )}
      <div className={skeletonDivider}>
        {Array(rows).fill(0).map((_, rowIdx) => (
          <div key={rowIdx} className="px-4 py-3 flex gap-4">
            {Array(cols).fill(0).map((_, colIdx) => (
              <TextSkeleton key={colIdx} width={colIdx === 1 ? 'flex-1' : 'w-20'} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 프로필 스켈레톤
// ============================================

interface ProfileSkeletonProps {
  className?: string;
}

export function ProfileSkeleton({ className = '' }: ProfileSkeletonProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <AvatarSkeleton size="lg" />
      <div className="flex-1 space-y-2">
        <TextSkeleton width="w-24" />
        <TextSkeleton width="w-32" className="opacity-60" />
      </div>
    </div>
  );
}

// ============================================
// 버튼 스켈레톤
// ============================================

interface ButtonSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
  width?: string;
  className?: string;
}

export function ButtonSkeleton({ size = 'md', width = 'w-24', className = '' }: ButtonSkeletonProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12'
  };
  return <div className={`${skeletonBase} rounded-md ${sizeClasses[size]} ${width} ${className}`} />;
}
