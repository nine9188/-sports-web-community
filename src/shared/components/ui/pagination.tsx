"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

/**
 * Pagination 컴포넌트 Props
 *
 * 두 가지 모드 지원:
 * 1. URL 기반 (mode="url"): Link로 페이지 이동, URL 쿼리 파라미터 변경
 * 2. 콜백 기반 (mode="button"): button으로 onPageChange 콜백 호출
 */
interface PaginationProps {
  /** 현재 페이지 (1부터 시작) */
  currentPage: number;
  /** 총 페이지 수 */
  totalPages: number;
  /** 페이지 변경 콜백 (mode="button"일 때 필수) */
  onPageChange?: (page: number) => void;
  /** 모드: "url" (Link 사용) 또는 "button" (버튼 사용) */
  mode?: "url" | "button";
  /** 표시할 최대 버튼 수 */
  maxButtons?: number;
  /** 상단 마진 적용 여부 */
  withMargin?: boolean;
  /** 추가 className */
  className?: string;
  /** 상단 border 표시 여부 */
  withBorder?: boolean;
}

/**
 * 공통 Pagination 컴포넌트
 *
 * @example URL 기반 (게시판 목록 등)
 * ```tsx
 * <Pagination currentPage={1} totalPages={10} mode="url" />
 * ```
 *
 * @example 콜백 기반 (모달, 탭 내부 등)
 * ```tsx
 * <Pagination
 *   currentPage={page}
 *   totalPages={total}
 *   onPageChange={setPage}
 *   mode="button"
 * />
 * ```
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  mode = "button",
  maxButtons = 7,
  withMargin = false,
  className = "",
  withBorder = false,
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 페이지 번호 계산
  const pages = useMemo(() => {
    const result: number[] = [];
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    for (let i = start; i <= end; i++) result.push(i);
    return result;
  }, [currentPage, totalPages, maxButtons]);

  // URL 빌드 (mode="url"일 때)
  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (targetPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(targetPage));
    }
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  if (totalPages <= 1) return null;

  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  // 스타일 클래스
  const buttonBase =
    "p-2 rounded border border-black/7 dark:border-0 text-sm transition-colors";
  const buttonDefault =
    "bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]";
  const buttonDisabled = "opacity-40 pointer-events-none";
  const buttonActive = "bg-[#262626] dark:bg-[#3F3F3F] text-white";

  // 버튼/링크 렌더링 헬퍼
  const renderNavButton = (
    targetPage: number,
    disabled: boolean,
    ariaLabel: string,
    icon: React.ReactNode,
  ) => {
    const className = `${buttonBase} ${disabled ? `${buttonDefault} ${buttonDisabled}` : buttonDefault}`;

    if (mode === "url") {
      return (
        <Link
          href={buildHref(targetPage)}
          aria-label={ariaLabel}
          className={className}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : undefined}
        >
          {icon}
        </Link>
      );
    }

    return (
      <button
        onClick={() => onPageChange?.(targetPage)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`${className} disabled:hover:bg-[#F5F5F5] dark:disabled:hover:bg-[#262626]`}
      >
        {icon}
      </button>
    );
  };

  const renderPageButton = (page: number, index: number) => {
    const isActive = page === currentPage;
    const hideOnMobile = pages.length === 7 && (index === 0 || index === 6);
    const className = `${buttonBase} px-3 ${isActive ? buttonActive : buttonDefault} ${hideOnMobile ? "hidden md:flex" : "flex"}`;

    if (mode === "url") {
      return (
        <Link
          key={page}
          href={buildHref(page)}
          aria-current={isActive ? "page" : undefined}
          className={className}
        >
          {page}
        </Link>
      );
    }

    return (
      <button
        key={page}
        onClick={() => onPageChange?.(page)}
        aria-current={isActive ? "page" : undefined}
        className={className}
      >
        {page}
      </button>
    );
  };

  const borderClass = withBorder
    ? "border-t border-black/5 dark:border-white/10"
    : "";
  const marginClass = withMargin ? "mt-4" : "";

  return (
    <nav
      className={`flex items-center justify-center gap-1 px-4 ${borderClass} ${marginClass} ${className}`}
      aria-label="페이지네이션"
    >
      {/* 첫 페이지 */}
      {renderNavButton(
        1,
        currentPage === 1,
        "첫 페이지",
        <ChevronsLeft className="w-4 h-4" />,
      )}

      {/* 이전 페이지 */}
      {renderNavButton(
        prevPage,
        currentPage === 1,
        "이전 페이지",
        <ChevronLeft className="w-4 h-4" />,
      )}

      {/* 페이지 번호들 */}
      {pages.map((p, index) => renderPageButton(p, index))}

      {/* 다음 페이지 */}
      {renderNavButton(
        nextPage,
        currentPage === totalPages,
        "다음 페이지",
        <ChevronRight className="w-4 h-4" />,
      )}

      {/* 마지막 페이지 */}
      {renderNavButton(
        totalPages,
        currentPage === totalPages,
        "마지막 페이지",
        <ChevronsRight className="w-4 h-4" />,
      )}
    </nav>
  );
}

export default Pagination;
